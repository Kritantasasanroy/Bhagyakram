from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
import bcrypt
import httpx
from jose import JWTError, jwt
import os
from dotenv import load_dotenv

load_dotenv()

from db.neon import get_db
from db.models import User

# Configuration for JWT
SECRET_KEY = os.environ.get("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is not set")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Neon Managed Better Auth — used only as an OTP-verification oracle for
# signup. Sign-in stays entirely on our own users table (bcrypt + JWT).
NEON_AUTH_URL = os.environ.get("NEON_AUTH_URL", "").rstrip("/")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

router = APIRouter(prefix="/api/auth", tags=["Auth"])

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    email: str

class OtpRequest(BaseModel):
    email: EmailStr

class OtpVerify(BaseModel):
    email: EmailStr
    otp: str
    password: str

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Ensure strings are converted to bytes
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )

def get_password_hash(password: str) -> str:
    # Hash password and return as string
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/signup/request-otp")
async def request_signup_otp(req: OtpRequest, db: Session = Depends(get_db)):
    """Send a one-time email code via Neon Auth. First step of signup."""
    db_user = db.query(User).filter(User.email == req.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    if not NEON_AUTH_URL:
        raise HTTPException(status_code=500, detail="Email verification is not configured")

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.post(
                f"{NEON_AUTH_URL}/email-otp/send-verification-otp",
                json={"email": req.email, "type": "sign-in"},
            )
        except httpx.HTTPError:
            raise HTTPException(status_code=502, detail="Could not reach the email verification service")

    if resp.status_code >= 400:
        raise HTTPException(status_code=502, detail="Could not send the verification code")

    return {"sent": True}


@router.post("/signup/verify-otp", response_model=Token)
async def verify_signup_otp(req: OtpVerify, db: Session = Depends(get_db)):
    """Verify the emailed code via Neon Auth, then create the local account."""
    db_user = db.query(User).filter(User.email == req.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    if not NEON_AUTH_URL:
        raise HTTPException(status_code=500, detail="Email verification is not configured")

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.post(
                f"{NEON_AUTH_URL}/sign-in/email-otp",
                json={"email": req.email, "otp": req.otp},
            )
        except httpx.HTTPError:
            raise HTTPException(status_code=502, detail="Could not reach the email verification service")

    if resp.status_code >= 400:
        code = ""
        try:
            code = resp.json().get("code", "")
        except Exception:
            pass
        if code == "INVALID_OTP":
            raise HTTPException(status_code=400, detail="Invalid or expired code. Please try again.")
        raise HTTPException(status_code=400, detail="Could not verify the code. Please try again.")

    hashed_password = get_password_hash(req.password)
    new_user = User(email=req.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "email": new_user.email}

@router.post("/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "email": user.email}

@router.get("/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {"email": current_user.email}
