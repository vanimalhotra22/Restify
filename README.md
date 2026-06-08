# 🌌 Restify: Sleep Disorder Prevention & Diagnostics Hub

Restify is an advanced, light sky-blue themed **Digital Health Platform** designed to help users track sleep hygiene, identify risk biomarkers for clinical sleep disorders early, and connect with telehealth specialist interventions.

The application combines heuristic risk models, computer vision, acoustic soundscape analysis, interactive sound synthesis, and generative AI sleep coaching to deliver a premium wellness experience.

---

## 🚀 Key Features

### 🧠 1. Clinical Diagnostics & AI Risk Screening
* **AI Sleep Disorder Classifier**: Screens for **Insomnia, Sleep Apnea, Narcolepsy, and Restless Leg Syndrome (RLS)** using behavioral questionnaires.
* **Risk Simulator Sandbox**: An interactive playground where users slide lifestyle variables (sleep duration, stress, age, exercise, screen time, snoring) to see live-updating risk needles and gauges.
* **Cardiac ECG Analyzer**: Plots 187-point voltage waveforms on SVG charts and classifies normal sinus rhythms versus cardiac arrhythmias with confidence percentages.
* **AI Dark Circle Scanner**: Upload a selfie to detect sub-orbital vascular pooling (dark circles) and puffiness, outputting sleep-deprivation levels.
* **AI Respiration Acoustic Monitor**: Upload sleep audio clips to count snore events, evaluate decibel loudness, and flag obstructive breathing pauses (apnea markers).

### 📅 2. Habit Building & Sleep Diary
* **Smart Sleep Diary**: Logs bedtime, wake-up times, daily mood, energy levels, and room indicators.
* **Sleep Environment Analyzer**: Measures room temperature, light exposure, and ambient noise to give a sleep environment score (out of 100) with actions (e.g. blackout curtains, lowering thermostat).
* **Caffeine Clearance & Curfew Tracker**: Logs caffeine drinks (coffee, tea, energy drinks, soda) and uses a 5-hour half-life model to graph active caffeine in the bloodstream at target bedtime.
* **90-Min Sleep Cycle Bedtime Clock**: Calculates optimal bedtimes backward from wake targets based on natural sleep physiology cycles.

### 🧘 3. Interactive Coaching & Relaxation
* **Virtual Sleep Therapist Chatbot**: An AI coach powered by a local clinical knowledge base with fallback to **Google Gemini AI** (`gemini-pro`).
* **4-7-8 Guided Breathing Ring**: A pulsating visual bubble matching the clinical inhale-hold-exhale method.
* **Synthesized Ambient Sound Machine**: Uses the Web Audio API to synthesize White Noise, Ocean Waves, and Rain sounds in the browser (zero external media dependencies).
* **30-Day Sleep Streak Gamification**: Gamifies sleeping habits. Tracks consecutive streaks and unlocks trophies and badges.

### 🏥 4. Telehealth & Reporting
* **Doctor Booking Module**: Allows patients to schedule appointments with sleep psychologists and pulmonologists, triggering appointment confirmations and unlocking a live consultation chat channel.
* **Printable Weekly PDF Sleep Reports**: Generates a clinical sleep summary containing patient info, weekly statistics, log tables, risk indices, and physician-facing sign-off fields.

---

## 🛠️ Tech Stack & Architecture

### Frontend (SPA)
* **React.js (v18)**
* **Recharts**: For high-performance responsive SVG graphing (trends, ECG signals, active caffeine decay).
* **Feather Icons (`react-icons/fi`)**
* **Web Audio API**: Browser-native sound synthesis.
* **Axios**: HTTP client.

### Backend (REST API & WebSockets)
* **FastAPI**: Modern, fast ASGI web framework.
* **Uvicorn**: ASGI server.
* **SQLAlchemy**: ORM for database mapping.
* **ReportLab**: PDF document generation engine.
* **WebSockets**: Persistent duplex alerts engine for live bedtime reminders.
* **Google Gemini SDK**: Generative AI coaching logic.

### Database
* **SQLite**: Lightweight SQL relational database (`restify.db`).

---

## ⚙️ Installation & Setup

### Prerequisites
* Python 3.10 or higher installed.
* Node.js (v16+) and npm installed.

### 1. Backend Setup
1. Open a terminal in the root directory `Sleeplens`:
2. Install Python dependencies:
   ```bash
   pip install fastapi uvicorn sqlalchemy reportlab python-dotenv google-generativeai pandas numpy scikit-learn
   ```
3. Create a `.env` file in the root directory (optional, for Gemini chatbot):
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
4. Start the FastAPI server:
   ```bash
   python -m uvicorn backend.main:app --port 8000 --reload
   ```

### 2. Frontend Setup
1. Open a second terminal window and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install node dependencies:
   ```bash
   npm install
   ```
3. Launch the development server:
   ```bash
   npm start
   ```
4. The application will automatically boot at `http://localhost:3000`.

---

## 🚀 One-Click Launch (Windows PowerShell)
For convenience, you can boot both servers concurrently with a single launcher script. In the project root, open PowerShell and run:
```powershell
powershell -ExecutionPolicy Bypass -File .\run.ps1
```

---

## 🩺 Clinical Disclaimer
*Restify is a sleep hygiene screening tool designed for educational and demonstration purposes. It does not replace professional medical advice, clinical diagnosis, or therapeutic intervention.*
