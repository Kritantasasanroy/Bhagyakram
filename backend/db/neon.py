import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

# The Neon DB connection string. 
# In a real production app, this should be an environment variable.
NEON_DATABASE_URL = os.environ.get("NEON_DATABASE_URL")
if not NEON_DATABASE_URL:
    raise ValueError("NEON_DATABASE_URL environment variable is not set")

engine = create_engine(NEON_DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
