import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiAward, FiCheck, FiCheckSquare, FiBookOpen, FiArrowRight } from "react-icons/fi";

const ChallengeTracker = ({ backendUrl, user }) => {
  const [challenge, setChallenge] = useState({ streak: 0, max_streak: 0, badges: [] });
  const [checklist, setChecklist] = useState({
    no_caffeine: false,
    no_screens: false,
    dark_room: false,
    fixed_schedule: false,
    room_cool: false
  });
  
  // CBT-I Reframing Journal states
  const [worryLog, setWorryLog] = useState([]);
  const [automaticWorry, setAutomaticWorry] = useState("");
  const [rationalReframed, setRationalReframed] = useState("");

  const fetchChallengeData = async () => {
    try {
      const res = await axios.get(`${backendUrl}/sleep/challenge?user_id=${user.id}`);
      if (res.data && res.data.status === "success") {
        setChallenge(res.data.challenge);
      }
    } catch (e) {
      console.error("Streak pull error:", e);
    }
  };

  useEffect(() => {
    fetchChallengeData();
    
    // Load local storage states for daily checklist & CBT journal
    const storedChecklist = localStorage.getItem(`checklist_${user.id}_${new Date().toDateString()}`);
    if (storedChecklist) {
      setChecklist(JSON.parse(storedChecklist));
    }

    const storedLogs = localStorage.getItem(`cbt_logs_${user.id}`);
    if (storedLogs) {
      setWorryLog(JSON.parse(storedLogs));
    }
  }, [backendUrl, user.id]);

  const toggleChecklistItem = (item) => {
    const updated = { ...checklist, [item]: !checklist[item] };
    setChecklist(updated);
    localStorage.setItem(`checklist_${user.id}_${new Date().toDateString()}`, JSON.stringify(updated));
  };

  const handleCbtSubmit = (e) => {
    e.preventDefault();
    if (!automaticWorry.trim() || !rationalReframed.trim()) return;

    const newLog = {
      id: Date.now(),
      worry: automaticWorry,
      reframed: rationalReframed,
      date: new Date().toLocaleDateString()
    };

    const updatedLogs = [newLog, ...worryLog];
    setWorryLog(updatedLogs);
    localStorage.setItem(`cbt_logs_${user.id}`, JSON.stringify(updatedLogs));
    
    setAutomaticWorry("");
    setRationalReframed("");
  };

  const deleteCbtLog = (id) => {
    const updatedLogs = worryLog.filter((log) => log.id !== id);
    setWorryLog(updatedLogs);
    localStorage.setItem(`cbt_logs_${user.id}`, JSON.stringify(updatedLogs));
  };

  const badgeDescriptions = {
    "3DayStreak": { name: "Early Bird", desc: "Maintained a consistent sleep routine for 3 days." },
    "CircadianHero": { name: "Circadian Hero", desc: "Aligned sleep cycles for 7 days straight." },
    "SleepMaster": { name: "Sleep Master", desc: "Achieved a solid 15-day streak of healthy sleep habits!" }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
      
      {/* 30-Day Sleep Challenge & Streaks */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Challenge Streaks */}
        <div className="glass-panel">
          <div className="glass-card-header">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FiAward style={{ color: "var(--accent-amber)" }} />
              <h3>30-Day Sleep Challenge</h3>
            </div>
            <span className="badge badge-warning">Active Challenge</span>
          </div>

          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
            Log sleep diaries daily to build streaks. Unifying your circadian rhythm prevents chronic insomnia.
          </p>

          <div style={{ display: "flex", gap: "30px", marginBottom: "24px" }}>
            <div>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600" }}>CURRENT STREAK</span>
              <h2 style={{ fontSize: "32px", color: "var(--accent-amber)", fontFamily: "var(--font-title)" }}>{challenge.streak} Days</h2>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600" }}>MAX STREAK RECORD</span>
              <h2 style={{ fontSize: "32px", color: "var(--text-primary)", fontFamily: "var(--font-title)" }}>{challenge.max_streak} Days</h2>
            </div>
          </div>

          <h4 style={{ fontSize: "14px", marginBottom: "14px" }}>Unlocked Rewards Badges</h4>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {["3DayStreak", "CircadianHero", "SleepMaster"].map((badgeId) => {
              const hasBadge = challenge.badges.includes(badgeId);
              const info = badgeDescriptions[badgeId];
              return (
                <div 
                  key={badgeId} 
                  className={`badge-unlocked ${hasBadge ? "active" : ""}`}
                  style={{ opacity: hasBadge ? 1.0 : 0.45 }}
                >
                  <span className="badge-icon">{hasBadge ? "🏆" : "🔒"}</span>
                  <span style={{ fontSize: "11.5px", fontWeight: "700" }}>{info.name}</span>
                  <span style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "4px" }}>{info.desc}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily Sleep Hygiene Checklist */}
        <div className="glass-panel">
          <div className="glass-card-header">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FiCheckSquare style={{ color: "var(--accent-teal)" }} />
              <h3>Sleep Hygiene Checklist</h3>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div 
              className={`checklist-item ${checklist.no_caffeine ? "checked" : ""}`}
              onClick={() => toggleChecklistItem("no_caffeine")}
            >
              <span style={{ fontSize: "16px", color: checklist.no_caffeine ? "var(--accent-teal)" : "var(--text-muted)" }}>
                {checklist.no_caffeine ? "✅" : "⬜"}
              </span>
              <span style={{ fontSize: "13px" }}>Avoided caffeine after 2:00 PM</span>
            </div>

            <div 
              className={`checklist-item ${checklist.no_screens ? "checked" : ""}`}
              onClick={() => toggleChecklistItem("no_screens")}
            >
              <span style={{ fontSize: "16px", color: checklist.no_screens ? "var(--accent-teal)" : "var(--text-muted)" }}>
                {checklist.no_screens ? "✅" : "⬜"}
              </span>
              <span style={{ fontSize: "13px" }}>No mobile or screens 1 hour before bed</span>
            </div>

            <div 
              className={`checklist-item ${checklist.dark_room ? "checked" : ""}`}
              onClick={() => toggleChecklistItem("dark_room")}
            >
              <span style={{ fontSize: "16px", color: checklist.dark_room ? "var(--accent-teal)" : "var(--text-muted)" }}>
                {checklist.dark_room ? "✅" : "⬜"}
              </span>
              <span style={{ fontSize: "13px" }}>Set bedroom to pitch dark / used sleep mask</span>
            </div>

            <div 
              className={`checklist-item ${checklist.fixed_schedule ? "checked" : ""}`}
              onClick={() => toggleChecklistItem("fixed_schedule")}
            >
              <span style={{ fontSize: "16px", color: checklist.fixed_schedule ? "var(--accent-teal)" : "var(--text-muted)" }}>
                {checklist.fixed_schedule ? "✅" : "⬜"}
              </span>
              <span style={{ fontSize: "13px" }}>Maintained regular wake-up target hour</span>
            </div>

            <div 
              className={`checklist-item ${checklist.room_cool ? "checked" : ""}`}
              onClick={() => toggleChecklistItem("room_cool")}
            >
              <span style={{ fontSize: "16px", color: checklist.room_cool ? "var(--accent-teal)" : "var(--text-muted)" }}>
                {checklist.room_cool ? "✅" : "⬜"}
              </span>
              <span style={{ fontSize: "13px" }}>Set room temperature below 20°C (cool room)</span>
            </div>
          </div>
        </div>

      </div>

      {/* CBT-I Thought Reframing Log */}
      <div className="glass-panel" style={{ display: "flex", flexDirection: "column" }}>
        <div className="glass-card-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FiBookOpen style={{ color: "var(--accent-purple)" }} />
            <h3>CBT-I Thought Reframer</h3>
          </div>
        </div>

        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
          Cognitive Behavioral Therapy for Insomnia (CBT-I) uses thought logs to challenge catastrophic sleep anxieties (e.g., "If I don't sleep now, I will fail tomorrow").
        </p>

        {/* Thought Input Form */}
        <form onSubmit={handleCbtSubmit} style={{ marginBottom: "20px" }}>
          <div className="form-group">
            <label className="form-label">Automatic Worry Sleep Thought</label>
            <input 
              type="text" 
              className="form-input" 
              value={automaticWorry} 
              onChange={(e) => setAutomaticWorry(e.target.value)} 
              placeholder="e.g., If I stay awake tonight, my presentation will be ruined"
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Rational/Cognitive Reframing</label>
            <input 
              type="text" 
              className="form-input" 
              value={rationalReframed} 
              onChange={(e) => setRationalReframed(e.target.value)} 
              placeholder="e.g., I have worked tired before. I can handle it. Sleep will come."
              required 
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
            Record Reframed Thought
          </button>
        </form>

        {/* Journals Log */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
          {worryLog.map((log) => (
            <div 
              key={log.id} 
              style={{
                padding: "12px 14px",
                background: "var(--bg-main)",
                borderLeft: "4px solid var(--accent-purple)",
                borderRadius: "0 8px 8px 0",
                fontSize: "12.5px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "11px", marginBottom: "4px" }}>
                <span>{log.date}</span>
                <button 
                  onClick={() => deleteCbtLog(log.id)}
                  style={{ background: "transparent", border: "none", color: "var(--accent-rose)", cursor: "pointer", fontWeight: "600" }}
                >
                  Delete
                </button>
              </div>
              <div style={{ color: "var(--accent-rose)", textDecoration: "line-through" }}>
                ❌ "{log.worry}"
              </div>
              <div style={{ color: "var(--accent-teal)", fontWeight: "600", marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                <FiArrowRight /> "{log.reframed}"
              </div>
            </div>
          ))}

          {worryLog.length === 0 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "120px", color: "var(--text-muted)" }}>
              No CBT-I journals logged yet.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default ChallengeTracker;
