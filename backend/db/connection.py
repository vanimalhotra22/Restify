# backend/db/connection.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Use SQLite by default (local file)
DB_FILE = os.environ.get("RESTIFY_DB", "restify.db")
DATABASE_URL = f"sqlite:///{DB_FILE}"

# For other DBs, set DATABASE_URL via env or change above
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
