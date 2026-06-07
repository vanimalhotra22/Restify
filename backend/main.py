# main.py
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from datetime import datetime, timedelta
from fastapi.middleware.cors import CORSMiddleware
import os
import json
import hashlib
import numpy as np
import pandas as pd
import asyncio
import random
from dotenv import load_dotenv

# Load local environment variables
load_dotenv()

# CONFIGURATION
app = FastAPI(title="Restify Prevention API", version="3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper to hash passwords securely
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

# REQUEST SHAPES
class UserAuthRequest(BaseModel):
    username: str
    password: str
    age: int = 30

class SleepLogRequest(BaseModel):
    user_id: int
    date: str
    bedtime: str
    wake_time: str
    sleep_quality: int
    mood: int
    energy: int
    stress: int
    temp: float = 20.0
    noise: str = "Quiet"
    light: str = "Pitch Dark"

class CalculateBedtimeRequest(BaseModel):
    wake_time: str

class RiskPredictionRequest(BaseModel):
    sleep_hours: float
    stress: int
    age: int
    exercise_min: int
    screen_time_min: int
    snoring_freq: str # "Never", "Occasionally", "Frequently"
    awakenings: int

class ChatRequest(BaseModel):
    message: str

# ---------------- USER AUTHENTICATION ENDPOINTS ----------------
@app.post("/auth/register")
def register(req: UserAuthRequest):
    from backend.db import queries
    
    hashed = hash_password(req.password)
    user = queries.create_user(username=req.username, password_hash=hashed, age=req.age)
    
    if user is None:
        raise HTTPException(status_code=400, detail="Username already exists.")
        
    return {
        "status": "success",
        "message": "User registered successfully.",
        "user": {"id": user.id, "username": user.username, "age": user.age}
    }

@app.post("/auth/login")
def login(req: UserAuthRequest):
    from backend.db import queries
    
    user = queries.get_user_by_username(req.username)
    if not user or user.password_hash != hash_password(req.password):
        raise HTTPException(status_code=401, detail="Invalid username or password.")
        
    return {
        "status": "success",
        "message": "Login successful.",
        "user": {"id": user.id, "username": user.username, "age": user.age}
    }

# ---------------- SLEEP LOGS & DIARY ENDPOINTS ----------------
@app.post("/sleep/log")
def log_sleep(req: SleepLogRequest):
    from backend.db import queries
    
    log = queries.log_sleep_data(
        user_id=req.user_id,
        date=req.date,
        bedtime=req.bedtime,
        wake_time=req.wake_time,
        sleep_quality=req.sleep_quality,
        mood=req.mood,
        energy=req.energy,
        stress=req.stress,
        temp=req.temp,
        noise=req.noise,
        light=req.light
    )
    
    if not log:
        raise HTTPException(status_code=500, detail="Failed to write sleep log to database.")
        
    return {
        "status": "success",
        "message": "Sleep log submitted successfully.",
        "duration": log.sleep_duration
    }

@app.get("/sleep/history")
def get_sleep_history(user_id: int, limit: int = 30):
    from backend.db import queries
    
    history = queries.get_sleep_history(user_id=user_id, limit=limit)
    return {"status": "success", "history": history}

@app.get("/sleep/analytics")
def get_sleep_analytics(user_id: int):
    from backend.db import queries
    
    analytics = queries.get_user_analytics(user_id=user_id)
    return {"status": "success", "analytics": analytics}

@app.get("/sleep/challenge")
def get_challenge(user_id: int):
    from backend.db import queries
    
    challenge = queries.get_challenge_status(user_id=user_id)
    return {"status": "success", "challenge": challenge}

# ---------------- AI SLEEP COACH + GEMINI CHATBOT ----------------
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
gemini_model = None

if GEMINI_API_KEY:
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel("gemini-pro")
        print("[OK] Gemini AI Coach Fallback active.")
    except Exception as e:
        print(f"[WARN] Failed to configure Gemini: {e}")

@app.post("/chatbot")
def chatbot(req: ChatRequest):
    msg = req.message.lower().strip()
    
    # Predefined clinical guidelines for sleep hygiene
    sleep_hygiene_kb = {
        "caffeine": "Avoid caffeine after 2:00 PM. Caffeine blocks adenosine receptors (which make you feel tired), delaying sleep onset and reducing deep sleep quality.",
        "coffee": "It takes about 6-8 hours for caffeine to clear from your system. Keep coffee, tea, energy drinks, and chocolates strictly in the morning.",
        "screen": "Reduce blue light screen exposure at least 1 hour before bed. Blue light suppresses melatonin, the hormone needed to signal sleep to your brain. Use orange filters or red light modes.",
        "phone": "Try reading a physical book, journaling, or stretching instead of scrolling your phone. Keep your phone far from your bed.",
        "insomnia": "For insomnia, try Stimulus Control: if you can't fall asleep in 20 minutes, get out of bed and do a quiet task in dim light until sleepy. Only return to bed when tired.",
        "apnea": "Sleep apnea can cause loud snoring and gasping for air. Try sleeping on your side instead of your back, and consult a doctor for a sleep study if snoring is severe.",
        "restless": "Restless Leg Syndrome (RLS) is an urge to move legs in the evening. Try gentle stretching, warm baths, and checking iron levels.",
        "temperature": "A cool room temperature (around 16-19°C or 60-67°F) is optimal for sleep. Your core body temperature must drop to initiate sleep.",
        "alcohol": "Avoid alcohol close to bed. While it helps you fall asleep faster, it destroys REM sleep cycles and causes frequent awakenings in the second half of the night.",
        "exercise": "Regular exercise improves sleep quality, but avoid intense workouts within 2 hours of bedtime as it increases core temperature and adrenaline."
    }
    
    # Check for direct keyword matches
    matched_key = None
    reply = ""
    for k, v in sleep_hygiene_kb.items():
        if k in msg:
            matched_key = k
            reply = v
            break
            
    if reply:
        return {
            "question_matched": matched_key,
            "reply": reply,
            "confidence": 1.0,
            "fallback": False
        }
        
    # Gemini AI Fallback
    if gemini_model is not None:
        try:
            prompt = (
                "You are Restify Coach, a friendly, professional AI sleep coach. "
                "Provide advice focused strictly on sleep hygiene, circadian rhythm, "
                "or preventing sleep disorders. Keep it under 3 sentences: "
            )
            response = gemini_model.generate_content(prompt + req.message)
            return {
                "question_matched": None,
                "reply": response.text.strip(),
                "confidence": 0.5,
                "fallback": True
            }
        except Exception as e:
            print(f"[WARN] Gemini error: {e}")
            
    return {
        "question_matched": None,
        "reply": "Ensure your environment has a cool temperature, dark lighting, and low noise levels. Keep screens off 1 hour before sleep!",
        "confidence": 0.0,
        "fallback": False
    }

# ---------------- SMART BEDTIME CALCULATOR ----------------
@app.post("/sleep/calculate-bedtime")
def calculate_bedtime(req: CalculateBedtimeRequest):
    try:
        # Expected format: "07:00" or "7:00 AM"
        wake_str = req.wake_time.strip().upper()
        
        # Parse time
        if "AM" in wake_str or "PM" in wake_str:
            time_obj = datetime.strptime(wake_str, "%I:%M %p")
        else:
            time_obj = datetime.strptime(wake_str, "%H:%M")
            
        # Calculate optimal bedtime options based on 90-minute sleep cycles
        # Average person takes 15 minutes to fall asleep
        options = []
        for cycles in [6, 5, 4]:
            minutes = (cycles * 90) + 15
            bed_time = time_obj - timedelta(minutes=minutes)
            options.append({
                "cycles": cycles,
                "hours": cycles * 1.5,
                "time": bed_time.strftime("%I:%M %p")
            })
            
        return {"status": "success", "wake_time": wake_str, "options": options}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid time format: {str(e)}")

# ---------------- AI SLEEP RISK PREDICTION ----------------
@app.post("/ai/predict-risk")
def predict_risk(req: RiskPredictionRequest):
    # Rule-based clinical heuristic predictor (excellent mock model simulating advanced AI prediction)
    # Calculates scores for Insomnia, Apnea, and RLS
    
    score_insomnia = 0.0
    score_apnea = 0.0
    score_rls = 0.0
    
    # 1. Insomnia Risk factors: low sleep hours, high stress, excessive screen, awakenings
    if req.sleep_hours < 6.0:
        score_insomnia += 30
    elif req.sleep_hours < 7.0:
        score_insomnia += 15
        
    score_insomnia += req.stress * 7 # Stress (1-5) adds up to 35%
    score_insomnia += min(req.screen_time_min / 60.0 * 5, 15) # Screen time adds up to 15%
    score_insomnia += min(req.awakenings * 6, 20) # Night awakenings add up to 20%
    
    # 2. Sleep Apnea Risk factors: Snoring, age, weight/lifestyle, pauses
    if req.snoring_freq == "Frequently":
        score_apnea += 50
    elif req.snoring_freq == "Occasionally":
        score_apnea += 20
        
    if req.age > 50:
        score_apnea += 25
    elif req.age > 40:
        score_apnea += 15
        
    score_apnea += min(req.awakenings * 5, 25) # Apnea causes frequent micro-arousals
    
    # 3. Restless Leg Syndrome: Leg discomfort (modeled via screening indicator)
    # For simulation, if stress is high and exercise is low, RLS risk elevates slightly
    score_rls += req.stress * 4
    if req.exercise_min < 20:
        score_rls += 30
    score_rls += min(req.awakenings * 4, 20)
    
    # Clip scores between 0 and 99
    score_insomnia = max(10, min(99, int(score_insomnia)))
    score_apnea = max(5, min(99, int(score_apnea)))
    score_rls = max(5, min(99, int(score_rls)))
    
    # Find dominant risk
    dominant = "Low Risk"
    max_score = max(score_insomnia, score_apnea, score_rls)
    
    if max_score > 70:
        risk_level = "High"
    elif max_score > 40:
        risk_level = "Moderate"
    else:
        risk_level = "Low"
        
    findings = []
    if score_insomnia > 50:
        findings.append("Difficulty maintaining sleep / Possible Insomnia signs.")
    if score_apnea > 50:
        findings.append("Upper airway breathing obstruction / Possible Sleep Apnea signs.")
    if score_rls > 50:
        findings.append("Nighttime leg motor discomfort / Possible Restless Leg Syndrome signs.")
        
    if not findings:
        findings.append("Clean sleep wellness signature. No primary clinical risk detected.")
        
    return {
        "status": "success",
        "risk_score": max_score,
        "risk_level": risk_level,
        "breakdown": {
            "insomnia": score_insomnia,
            "sleep_apnea": score_apnea,
            "restless_leg": score_rls
        },
        "findings": findings
    }

# ---------------- ADMIN ANALYTICS ENDPOINT ----------------
@app.get("/admin/analytics")
def admin_analytics():
    session = models.SessionLocal() if hasattr(models, "SessionLocal") else None
    if not session:
        from backend.db.connection import SessionLocal
        session = SessionLocal()
    try:
        users_count = session.query(models.User).count()
        logs_count = session.query(models.SleepLog).count()
        
        # Calculate general aggregates
        avg_dur = session.query(func.avg(models.SleepLog.sleep_duration)).scalar() or 0.0
        avg_qual = session.query(func.avg(models.SleepLog.sleep_quality)).scalar() or 0.0
        
        return {
            "status": "success",
            "total_users": users_count,
            "total_sleep_logs": logs_count,
            "avg_sleep_duration": round(float(avg_dur), 2),
            "avg_sleep_quality": round(float(avg_qual), 2),
            "system_status": "Operational",
            "db_size": os.path.exists("restify.db")
        }
    finally:
        session.close()

# ---------------- REAL-TIME NOTIFICATIONS WEBSOCKET ----------------
@app.websocket("/ws/reminders")
async def websocket_reminders(websocket: WebSocket):
    await websocket.accept()
    print("[INFO] Reminder WebSocket client connected.")
    try:
        reminder_messages = [
            {"type": "melatonin", "msg": "🌙 Melatonin alert: Time to start dimming lights and put screens away."},
            {"type": "hydration", "msg": "💧 Hydration warning: Drink a glass of water, then taper fluids before bed."},
            {"type": "hygiene", "msg": "🌡️ Optimal sleep tip: Set your room temperature to a cool 18°C."},
            {"type": "meditation", "msg": "🧘 Wind-down notice: Take 5 minutes to practice guided breathing."}
        ]
        
        while True:
            # Emit a random bedtime wellness prompt every 30 seconds
            await asyncio.sleep(30)
            alert = random.choice(reminder_messages)
            await websocket.send_json(alert)
    except WebSocketDisconnect:
        print("[INFO] Reminder WebSocket client disconnected.")
    except Exception as e:
        print(f"[WARN] WebSocket error: {e}")

@app.delete("/sleep/clear")
def clear_logs(user_id: int):
    try:
        from backend.db.queries import clear_user_logs
        clear_user_logs(user_id=user_id)
        return {"status": "success", "message": "All sleep logs and streaks have been cleared."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reset data: {str(e)}")

# Startup Initializer
@app.on_event("startup")
def startup_event():
    try:
        from backend.db.queries import init_db_tables
        init_db_tables()
        print("[OK] SQLite databases migrations loaded.")
    except Exception as e:
        print(f"[WARN] Database boot failed: {e}")

# RUN SERVER
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
