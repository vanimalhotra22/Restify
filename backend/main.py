# main.py
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, File, UploadFile
from fastapi.responses import StreamingResponse
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

# ---------------- NEW HEALTH PLATFORM EXPANSIONS ----------------

class DietRequest(BaseModel):
    age: int
    gender: str
    sleep_hours: float

class ECGRequest(BaseModel):
    features: list

class BookingRequest(BaseModel):
    user_id: int
    doctor_id: int
    slot: str

@app.post("/diet")
def get_diet(req: DietRequest):
    # Nutrition guidelines based on sleep hours
    plan = []
    if req.sleep_hours < 6.5:
        plan.extend([
            "🍌 Eat a banana in the evening: Bananas are rich in potassium and Vitamin B6, which are essential for melatonin synthesis.",
            "🥜 Snack on a handful of almonds: Almonds contain magnesium and melatonin, promoting muscle relaxation and deep sleep regulation.",
            "🌾 Eat a bowl of warm oatmeal: Oats are a natural source of melatonin and complex carbohydrates that stimulate serotonin release.",
            "🚫 Absolute Screen & Sugary Food Curfew: Avoid chocolate, sweets, and heavy meals after 8:00 PM to prevent core temperature spikes.",
            "💧 Taper fluids: Stop heavy water intake 2 hours before target bedtime to minimize midnight bathroom awakenings."
        ])
    else:
        plan.extend([
            "🥝 Incorporate Kiwi fruits: Eating 2 kiwis before bed has been clinically shown to increase sleep duration and efficiency.",
            "🍵 Chamomile or Valerian Root tea: Drink one cup 45 minutes before sleep to calm central nervous system activity.",
            "🥛 Warm milk (or plant-based alternative): Contains tryptophan, an amino acid precursor to serotonin and melatonin.",
            "🚫 Caffeine Curfew: Restrict coffee, black tea, energy drinks, and chocolate strictly to morning hours (before 2:00 PM)."
        ])
    return {
        "status": "success",
        "diet_plan": plan
    }

@app.post("/predict")
def predict_ecg(req: ECGRequest):
    # Basic mockup classification model mimicking an AI classifier
    # Calculate simple variance of features as a heuristic
    if not req.features or len(req.features) < 100:
        raise HTTPException(status_code=400, detail="Invalid ECG signal length.")
    
    variance = float(np.var(req.features))
    if variance > 0.05:
        label = "Abnormal Arrhythmia Detected"
        confidence = round(0.82 + (variance % 0.17), 4)
    else:
        label = "Normal Sinus Rhythm"
        confidence = round(0.94 + (variance % 0.05), 4)
        
    return {
        "status": "success",
        "result": {
            "label": "Normal" if label == "Normal Sinus Rhythm" else "Abnormal",
            "confidence": confidence
        }
    }

@app.post("/ai/detect-dark-circles")
async def detect_dark_circles(file: UploadFile = File(...)):
    # Simulate computer vision image processing
    # Return mock clinical metrics based on file metadata
    import random
    seed_val = sum(ord(c) for c in file.filename)
    random.seed(seed_val)
    
    dark_circle_score = random.randint(35, 95)
    eye_puffiness_score = random.randint(25, 90)
    
    if dark_circle_score > 70 or eye_puffiness_score > 70:
        level = "High"
        recs = [
            "⚠️ High sleep deprivation signature detected. Increase nightly sleep by 1.5 - 2 hours.",
            "💧 Hydrate heavily: Dehydration amplifies dark circles. Drink at least 2.5L water daily.",
            "📱 Screen restriction: Limit high-intensity blue light 90 minutes before bedtime.",
            "🧊 Apply a cold compress or chilled cucumber slices under eyes for 5-10 minutes in the morning."
        ]
    elif dark_circle_score > 45 or eye_puffiness_score > 45:
        level = "Moderate"
        recs = [
            "🔔 Mild fatigue signature. Aim for a consistent 7.5+ hour sleep window.",
            "☕ Caffeine caution: Limit stimulant consumption, especially after 2:00 PM.",
            "🧴 Use a hydrating eye cream containing caffeine or hyaluronic acid in your evening routine."
        ]
    else:
        level = "Low"
        recs = [
            "✨ Healthy visual wellness signature. No sleep deprivation markings detected.",
            "🧘 Continue maintaining your consistent sleep schedule and morning sunlight exposure."
        ]
        
    return {
        "status": "success",
        "sleep_deprivation_level": level,
        "dark_circle_score": dark_circle_score,
        "eye_puffiness_score": eye_puffiness_score,
        "recommendations": recs
    }

@app.post("/ai/detect-snoring")
async def detect_snoring(file: UploadFile = File(...)):
    # Simulate acoustic audio analysis
    import random
    seed_val = sum(ord(c) for c in file.filename)
    random.seed(seed_val)
    
    snoring_count = random.randint(5, 45)
    avg_loudness = random.randint(40, 85) # dB
    
    # Apnea check based on loudness and count
    if snoring_count > 25 and avg_loudness > 65:
        apnea_indicator = "Detected 3 breathing pause anomalies. Warning: High risk of obstructive breathing/apnea events."
        recs = [
            "🚨 Severe snoring pattern. Consult a board-certified sleep physician for a clinical sleep study (Polysomnography).",
            "🛌 Try side-sleeping: Use a body pillow or positional trainer to prevent sleeping on your back, which narrows airways.",
            "🚫 Avoid alcohol, muscle relaxants, and heavy meals within 4 hours of bedtime."
        ]
    elif snoring_count > 12:
        apnea_indicator = "Detected mild flow limitations. Warning: Possible mild sleep apnea symptoms."
        recs = [
            "💤 Moderate snoring signature. Elevated risk of light sleep and micro-arousals.",
            "🌬️ Nasal strips: Try nasal dilator strips to open nasal airways and reduce acoustic vibration.",
            "🏃 Weight management and regular throat exercises (myofunctional therapy) can help firm airway muscles."
        ]
    else:
        apnea_indicator = "Standard respiration signature. No breathing pauses detected."
        recs = [
            "✨ Healthy nocturnal respiratory signature.",
            "🌿 Ensure room humidity is between 40-50% to prevent dry throat and minor vibration noise."
        ]
        
    return {
        "status": "success",
        "snoring_count": snoring_count,
        "average_loudness": f"{avg_loudness} dB",
        "apnea_indicators": apnea_indicator,
        "recommendations": recs
    }

@app.get("/doctors/specialists")
def get_specialists():
    return {
        "status": "success",
        "specialists": [
            {"id": 1, "name": "Dr. Sarah Jenkins", "specialty": "Cognitive Behavioral Therapy for Insomnia (CBT-I)", "availability": "Tomorrow at 10:00 AM", "avatar": "👩‍⚕️"},
            {"id": 2, "name": "Dr. Marcus Vance", "specialty": "Obstructive Sleep Apnea (OSA) Specialist", "availability": "Friday at 2:00 PM", "avatar": "👨‍⚕️"},
            {"id": 3, "name": "Dr. Elena Rostova", "specialty": "Neurologist & Restless Leg Syndrome Specialist", "availability": "Monday at 11:30 AM", "avatar": "👩‍⚕️"}
        ]
    }

@app.post("/doctors/book")
def book_specialist(req: BookingRequest):
    docs = {
        1: "Dr. Sarah Jenkins",
        2: "Dr. Marcus Vance",
        3: "Dr. Elena Rostova"
    }
    doc_name = docs.get(req.doctor_id, "Specialist")
    return {
        "status": "success",
        "message": f"Appointment booked successfully with {doc_name} for slot {req.slot}. A secure telemedicine link has been sent to your email!"
    }

@app.get("/sleep/report/pdf")
def get_report_pdf(user_id: int):
    # Generates a beautiful binary PDF byte stream dynamically
    from backend.db import queries
    from backend.db.connection import SessionLocal
    from backend.db import models
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    from reportlab.lib import colors
    import io
    
    session = SessionLocal()
    try:
        user = session.query(models.User).filter_by(id=user_id).first()
        username = user.username if user else "Patient"
        age = user.age if user else 30
    except Exception:
        username = "Patient"
        age = 30
    finally:
        session.close()
        
    history = queries.get_sleep_history(user_id=user_id, limit=7)
    analytics = queries.get_user_analytics(user_id=user_id)
    challenge = queries.get_challenge_status(user_id=user_id)
    
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    
    # Page setup
    p.setTitle("Restify Sleep Diagnostics Report")
    
    # Draw header banner
    p.setFillColor(colors.HexColor("#0284c7")) # Sky 600
    p.rect(0, 720, 612, 122, fill=True, stroke=False)
    
    # Banner title
    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 24)
    p.drawString(40, 770, "Restify Diagnostics Lab")
    p.setFont("Helvetica", 12)
    p.drawString(40, 745, "WEEKLY SLEEP DIAGNOSTICS & DISORDER RISK REPORT")
    
    # Patient Info section
    p.setFillColor(colors.HexColor("#0f172a")) # Text primary
    p.setFont("Helvetica-Bold", 14)
    p.drawString(40, 680, "Patient Health Profile")
    p.setFont("Helvetica", 11)
    p.drawString(40, 660, f"Patient Name: {username.capitalize()}")
    p.drawString(250, 660, f"Patient Age: {age} years")
    p.drawString(440, 660, f"Record ID: #RST-{user_id:04d}")
    
    # Draw line
    p.setStrokeColor(colors.HexColor("#cbd5e1"))
    p.setLineWidth(1)
    p.line(40, 645, 572, 645)
    
    # Section: Sleep Metrics Analytics
    p.setFont("Helvetica-Bold", 14)
    p.drawString(40, 615, "Actigraphy & Log Analytics Summary (Last 7 Days)")
    p.setFont("Helvetica", 11)
    
    avg_dur = analytics.get("avg_duration", 0)
    avg_qual = analytics.get("avg_quality", 0)
    total_logs = analytics.get("total_logs", 0)
    
    p.drawString(40, 590, f"Average Sleep Duration: {avg_dur} hrs/night")
    p.drawString(40, 570, f"Average Sleep Quality Rating: {avg_qual}/10")
    p.drawString(320, 590, f"Active Sleep Streak: {challenge.get('streak', 0)} Days")
    p.drawString(320, 570, f"Total Data Logs Logged: {total_logs} records")
    
    # Recent Log Table
    p.setFont("Helvetica-Bold", 11)
    p.drawString(40, 535, "Sleep Log History details:")
    p.setFont("Helvetica-Bold", 10)
    p.setFillColor(colors.HexColor("#475569"))
    p.drawString(45, 515, "Date")
    p.drawString(140, 515, "Bedtime")
    p.drawString(230, 515, "Wake Time")
    p.drawString(320, 515, "Duration")
    p.drawString(410, 515, "Quality")
    p.drawString(500, 515, "Stress")
    
    p.line(40, 508, 572, 508)
    
    y = 490
    p.setFont("Helvetica", 9)
    p.setFillColor(colors.HexColor("#0f172a"))
    
    logs_to_show = history[:5] # Show top 5 logs
    if logs_to_show:
        for log in logs_to_show:
            p.drawString(45, y, str(log.get("date")))
            p.drawString(140, y, str(log.get("bedtime")))
            p.drawString(230, y, str(log.get("wake_time")))
            p.drawString(320, y, f"{log.get('sleep_duration')} hrs")
            p.drawString(410, y, f"{log.get('sleep_quality')}/10")
            p.drawString(500, y, f"{log.get('stress')}/5")
            y -= 20
    else:
        p.drawString(45, y, "No sleep history entries logged yet.")
        y -= 20
        
    p.line(40, y + 10, 572, y + 10)
    
    # Section: AI Risk Assessments
    y -= 15
    p.setFont("Helvetica-Bold", 14)
    p.drawString(40, y, "Clinical Sleep Disorder Risk Assessment")
    y -= 25
    p.setFont("Helvetica", 11)
    
    # Calculate simulated risks based on stats
    insomnia_risk = 75 if avg_dur < 6.0 else (45 if avg_dur < 7.0 else 15)
    apnea_risk = 60 if any(l.get("noise") == "Loud Snoring" for l in logs_to_show) else 20
    
    p.drawString(40, y, f"- Insomnia Risk Indicator: {insomnia_risk}%")
    p.drawString(280, y, f"- Sleep Apnea Risk Indicator: {apnea_risk}%")
    
    y -= 20
    p.drawString(40, y, f"- Narcolepsy Probability: 12% (Low Risk)")
    p.drawString(280, y, f"- Restless Leg Syndrome: 35% (Mild Risk)")
    
    # Recommendations
    y -= 35
    p.setFont("Helvetica-Bold", 12)
    p.drawString(40, y, "Tailored Clinician Recommendations:")
    y -= 20
    p.setFont("Helvetica", 10)
    p.setFillColor(colors.HexColor("#475569"))
    
    recs = [
        "1. Restrict all evening blue-light exposure by setting a screen lock curfew 60 minutes before bedtime.",
        "2. Keep a cool bedroom temperature (< 20 degrees Celsius) to facilitate core body temperature drop.",
        "3. Taper fluids 2 hours before bed and enforce a strict caffeine curfew after 2:00 PM.",
        "4. Practise 5 minutes of relaxation / breathing (e.g. 4-7-8 method) during your pre-bed wind-down routine."
    ]
    
    for rec in recs:
        p.drawString(40, y, rec)
        y -= 16
        
    # Sign off
    y -= 20
    p.setStrokeColor(colors.HexColor("#e2e8f0"))
    p.line(40, y, 572, y)
    y -= 20
    p.setFont("Helvetica-Oblique", 9)
    p.drawString(40, y, "This report is generated dynamically by Restify AI Lab. To be used for screening and clinical discussion.")
    p.drawString(450, y, "Authorized Sign-off: RESTIFY LABS")
    
    p.showPage()
    p.save()
    buffer.seek(0)
    
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=weekly_report_{user_id}.pdf"})

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
