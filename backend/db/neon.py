import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# The Neon DB connection string. 
# In a real production app, this should be an environment variable.
NEON_DATABASE_URL = "postgresql://neondb_owner:npg_U4lX1zkcvZyH@ep-shy-cell-a76hyehw-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

engine = create_engine(NEON_DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
