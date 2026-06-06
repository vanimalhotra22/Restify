# backend/db/models.py
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from backend.db.connection import Base
from datetime import datetime

class SensorData(Base):
    __tablename__ = "sensor_data"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    ecg = Column(Float, nullable=True)
    spo2 = Column(Float, nullable=True)
    eeg = Column(Float, nullable=True)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    age = Column(Integer, default=30)
    created_at = Column(DateTime, default=datetime.utcnow)

class SleepLog(Base):
    __tablename__ = "sleep_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(String, nullable=False) # Store YYYY-MM-DD
    bedtime = Column(String, nullable=False) # e.g. "23:00"
    wake_time = Column(String, nullable=False) # e.g. "07:00"
    sleep_duration = Column(Float, nullable=False) # in hours
    sleep_quality = Column(Integer, default=3) # 1 to 5
    mood = Column(Integer, default=3) # 1 to 5
    energy = Column(Integer, default=3) # 1 to 5
    stress = Column(Integer, default=3) # 1 to 5
    temp = Column(Float, nullable=True) # room temperature
    noise = Column(String, nullable=True) # e.g. "Quiet", "Moderate", "Loud"
    light = Column(String, nullable=True) # e.g. "Pitch Dark", "Dim", "Bright"
    timestamp = Column(DateTime, default=datetime.utcnow)

class UserChallenge(Base):
    __tablename__ = "user_challenges"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    streak = Column(Integer, default=0)
    max_streak = Column(Integer, default=0)
    last_log_date = Column(String, nullable=True)
    unlocked_badges = Column(String, default="") # Comma-separated list of badges, e.g. "EarlyBird,CircadianHero"
