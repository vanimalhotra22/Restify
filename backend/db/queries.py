# backend/db/queries.py
import os
import pandas as pd
from backend.db.connection import SessionLocal, engine
from backend.db import models
from sqlalchemy import func
from datetime import datetime, timedelta

# Ensure tables exist
def init_db_tables():
    from backend.db.connection import Base
    Base.metadata.create_all(bind=engine)

# Vectorized CSV loader (optional)
def load_csvs_to_db(normal_csv_path, mitbih_csv_path):
    init_db_tables()
    dfn = pd.read_csv(normal_csv_path, header=None, nrows=1000)
    dfm = pd.read_csv(mitbih_csv_path, header=None, nrows=1000)

    def to_simple(df):
        data_dict = {}
        if df.shape[1] > 0:
            data_dict["ecg"] = df.iloc[:, 0].astype(float)
        if df.shape[1] > 1:
            data_dict["spo2"] = df.iloc[:, 1].astype(float)
        if df.shape[1] > 2:
            data_dict["eeg"] = df.iloc[:, 2].astype(float)
        return pd.DataFrame(data_dict)

    df_all = pd.concat([to_simple(dfn), to_simple(dfm)], ignore_index=True)
    df_all.to_sql("sensor_data", con=engine, if_exists="append", index=False)

def get_table_data(table="sensor_data", limit=50):
    session = SessionLocal()
    try:
        from sqlalchemy import text
        q = f"SELECT * FROM {table} ORDER BY id DESC LIMIT {limit}"
        df = pd.read_sql(q, con=session.bind)
        return df.to_dict(orient="records")
    except Exception:
        return []
    finally:
        session.close()

def get_summary_data():
    session = SessionLocal()
    try:
        avg_ecg = session.query(func.avg(models.SensorData.ecg)).scalar() or 0
        avg_spo2 = session.query(func.avg(models.SensorData.spo2)).scalar() or 0
        total = session.query(models.SensorData).count()
        return {"avg_hr": round(float(avg_ecg), 2), "avg_spo2": round(float(avg_spo2), 2), "total_records": total}
    except Exception:
        return {"avg_hr": 0, "avg_spo2": 0, "total_records": 0}
    finally:
        session.close()

# ---------------- USER AUTHENTICATION QUERIES ----------------
def create_user(username, password_hash, age=30):
    session = SessionLocal()
    try:
        # Check if username exists
        existing = session.query(models.User).filter_by(username=username).first()
        if existing:
            return None
        
        user = models.User(username=username, password_hash=password_hash, age=age)
        session.add(user)
        session.commit()
        session.refresh(user)
        session.expunge(user)
        return user
    finally:
        session.close()

def get_user_by_username(username):
    session = SessionLocal()
    try:
        user = session.query(models.User).filter_by(username=username).first()
        if user:
            session.refresh(user)
            session.expunge(user)
        return user
    finally:
        session.close()

# ---------------- SLEEP DIARY LOGGING QUERIES ----------------
def log_sleep_data(user_id, date, bedtime, wake_time, sleep_quality, mood, energy, stress, temp=20.0, noise="Quiet", light="Pitch Dark"):
    session = SessionLocal()
    try:
        # Calculate duration in decimal hours
        fmt = "%H:%M"
        t1 = datetime.strptime(bedtime, fmt)
        t2 = datetime.strptime(wake_time, fmt)
        
        # Handle overnight sleep
        if t2 < t1:
            t2 += timedelta(days=1)
        
        duration = round((t2 - t1).seconds / 3600.0, 2)
        
        # Check if log already exists for this user + date
        log = session.query(models.SleepLog).filter_by(user_id=user_id, date=date).first()
        if log:
            log.bedtime = bedtime
            log.wake_time = wake_time
            log.sleep_duration = duration
            log.sleep_quality = sleep_quality
            log.mood = mood
            log.energy = energy
            log.stress = stress
            log.temp = temp
            log.noise = noise
            log.light = light
        else:
            log = models.SleepLog(
                user_id=user_id,
                date=date,
                bedtime=bedtime,
                wake_time=wake_time,
                sleep_duration=duration,
                sleep_quality=sleep_quality,
                mood=mood,
                energy=energy,
                stress=stress,
                temp=temp,
                noise=noise,
                light=light
            )
            session.add(log)
            
        session.commit()
        session.refresh(log)
        session.expunge(log)
        
        # Update Challenge Streak
        update_challenge_streak(user_id, date)
        
        return log
    finally:
        session.close()

def get_sleep_history(user_id, limit=30):
    session = SessionLocal()
    try:
        logs = session.query(models.SleepLog).filter_by(user_id=user_id).order_by(models.SleepLog.date.desc()).limit(limit).all()
        # Convert objects to dicts
        res = []
        for l in logs:
            res.append({
                "id": l.id,
                "date": l.date,
                "bedtime": l.bedtime,
                "wake_time": l.wake_time,
                "sleep_duration": l.sleep_duration,
                "sleep_quality": l.sleep_quality,
                "mood": l.mood,
                "energy": l.energy,
                "stress": l.stress,
                "temp": l.temp,
                "noise": l.noise,
                "light": l.light
            })
        return res
    finally:
        session.close()

def get_user_analytics(user_id):
    session = SessionLocal()
    try:
        logs = session.query(models.SleepLog).filter_by(user_id=user_id).all()
        if not logs:
            return {"avg_duration": 0, "avg_quality": 0, "avg_mood": 0, "total_logs": 0, "weekly_trends": []}
            
        df = pd.DataFrame([{
            "duration": l.sleep_duration,
            "quality": l.sleep_quality,
            "mood": l.mood,
            "energy": l.energy,
            "stress": l.stress
        } for l in logs])
        
        avg_dur = round(float(df["duration"].mean()), 2)
        avg_qual = round(float(df["quality"].mean()), 2)
        avg_mood = round(float(df["mood"].mean()), 2)
        
        # Convert df to trends
        return {
            "avg_duration": avg_dur,
            "avg_quality": avg_qual,
            "avg_mood": avg_mood,
            "total_logs": len(logs),
            "weekly_trends": df.tail(7).to_dict(orient="records")
        }
    finally:
        session.close()

# ---------------- SLEEP CHALLENGE STREAKS & BADGES ----------------
def get_challenge_status(user_id):
    session = SessionLocal()
    try:
        challenge = session.query(models.UserChallenge).filter_by(user_id=user_id).first()
        if not challenge:
            challenge = models.UserChallenge(user_id=user_id, streak=0, max_streak=0, unlocked_badges="")
            session.add(challenge)
            session.commit()
            session.refresh(challenge)
        
        badges_list = [b for b in challenge.unlocked_badges.split(",") if b]
        return {
            "streak": challenge.streak,
            "max_streak": challenge.max_streak,
            "last_log_date": challenge.last_log_date,
            "badges": badges_list
        }
    finally:
        session.close()

def update_challenge_streak(user_id, log_date):
    session = SessionLocal()
    try:
        challenge = session.query(models.UserChallenge).filter_by(user_id=user_id).first()
        if not challenge:
            challenge = models.UserChallenge(user_id=user_id, streak=0, max_streak=0, unlocked_badges="")
            session.add(challenge)
            session.commit()
            session.refresh(challenge)
            
        last_date_str = challenge.last_log_date
        
        if not last_date_str:
            challenge.streak = 1
        else:
            try:
                last_date = datetime.strptime(last_date_str, "%Y-%m-%d")
                curr_date = datetime.strptime(log_date, "%Y-%m-%d")
                diff = (curr_date - last_date).days
                
                if diff == 1:
                    challenge.streak += 1
                elif diff > 1:
                    challenge.streak = 1
                # diff == 0 means log submitted on same day, ignore streak change
            except Exception:
                challenge.streak = 1
                
        if challenge.streak > challenge.max_streak:
            challenge.max_streak = challenge.streak
            
        challenge.last_log_date = log_date
        
        # Unlocked Badges Heuristics
        badges = [b for b in challenge.unlocked_badges.split(",") if b]
        
        if challenge.streak >= 3 and "3DayStreak" not in badges:
            badges.append("3DayStreak")
        if challenge.streak >= 7 and "CircadianHero" not in badges:
            badges.append("CircadianHero")
        if challenge.streak >= 15 and "SleepMaster" not in badges:
            badges.append("SleepMaster")
            
        challenge.unlocked_badges = ",".join(badges)
        session.commit()
    finally:
        session.close()

def clear_user_logs(user_id):
    session = SessionLocal()
    try:
        session.query(models.SleepLog).filter_by(user_id=user_id).delete()
        challenge = session.query(models.UserChallenge).filter_by(user_id=user_id).first()
        if challenge:
            challenge.streak = 0
            challenge.max_streak = 0
            challenge.last_log_date = None
            challenge.unlocked_badges = ""
        session.commit()
    finally:
        session.close()
