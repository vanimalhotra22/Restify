import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiAward, FiCheckSquare, FiCoffee, FiClock, FiAlertTriangle, FiTrash2, FiPlus } from "react-icons/fi";

const ChallengeTracker = ({ backendUrl, user }) => {
  const [challenge, setChallenge] = useState({ streak: 0, max_streak: 0, badges: [] });
  const [checklist, setChecklist] = useState({
    no_caffeine: false,
    no_screens: false,
    dark_room: false,
    fixed_schedule: false,
    room_cool: false
  });
  
  // Target bedtime from Settings, default to 22:30
  const [targetBedtime, setTargetBedtime] = useState("22:30");

  // Caffeine Curfew states
  const [caffeineLogs, setCaffeineLogs] = useState([]);
  const [drinkType, setDrinkType] = useState("brewed_coffee");
  const [consumeTime, setConsumeTime] = useState("14:00");

  const drinkDatabase = {
    brewed_coffee: { name: "☕ Brewed Drip Coffee (12oz)", caffeine: 140 },
    espresso: { name: "☕ Single Espresso Shot", caffeine: 75 },
    double_espresso: { name: "☕ Double Espresso Shot", caffeine: 150 },
    energy_drink: { name: "⚡ Energy Drink (12oz)", caffeine: 160 },
    black_tea: { name: "🍵 Black Tea (8oz)", caffeine: 50 },
    green_tea: { name: "🍵 Green Tea (8oz)", caffeine: 30 },
    cola: { name: "🥤 Soda / Cola (12oz)", caffeine: 35 }
  };

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
    
    // Load local storage states for daily checklist & caffeine logs
    const storedChecklist = localStorage.getItem(`checklist_${user.id}_${new Date().toDateString()}`);
    if (storedChecklist) {
      setChecklist(JSON.parse(storedChecklist));
    }

    const storedLogs = localStorage.getItem(`caffeine_logs_${user.id}`);
    if (storedLogs) {
      setCaffeineLogs(JSON.parse(storedLogs));
    }

    // Retrieve target bedtime
    const storedGoals = localStorage.getItem(`goals_${user.id}`);
    if (storedGoals) {
      try {
        const parsed = JSON.parse(storedGoals);
        if (parsed.target_bedtime) {
          setTargetBedtime(parsed.target_bedtime);
        }
      } catch (err) {
        console.error("Failed to parse goals", err);
      }
    }
  }, [backendUrl, user.id]);

  const toggleChecklistItem = (item) => {
    const updated = { ...checklist, [item]: !checklist[item] };
    setChecklist(updated);
    localStorage.setItem(`checklist_${user.id}_${new Date().toDateString()}`, JSON.stringify(updated));
  };

  // Helper to calculate decimal hours elapsed between two times
  const getElapsedHours = (timeStart, timeEnd) => {
    const [h1, m1] = timeStart.split(":").map(Number);
    const [h2, m2] = timeEnd.split(":").map(Number);
    
    let diffMin = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diffMin < 0) {
      // If target bedtime is after midnight (e.g. 00:30) and coffee was at 14:00
      diffMin += 24 * 60;
    }
    return diffMin / 60;
  };

  // Calculate remaining caffeine at bedtime based on 5-hour half-life
  const calculateRemainingCaffeine = (log) => {
    const hoursElapsed = getElapsedHours(log.time, targetBedtime);
    // Formula: Initial * 0.5 ^ (hours / half_life)
    const remaining = log.initialCaffeine * Math.pow(0.5, hoursElapsed / 5.0);
    return Math.round(remaining * 10) / 10;
  };

  // Sum of all active caffeine at bedtime
  const totalCaffeineAtBedtime = caffeineLogs.reduce((sum, log) => {
    return sum + calculateRemainingCaffeine(log);
  }, 0);

  const getCaffeineStatus = (mg) => {
    if (mg < 20) {
      return { text: "Safe Zone", color: "var(--accent-teal)", desc: "Minimal impact on sleep structure and latency." };
    }
    if (mg <= 55) {
      return { text: "Alert Zone", color: "var(--accent-amber)", desc: "May delay sleep onset & reduce deep sleep phases." };
    }
    return { text: "Disruption Risk", color: "var(--accent-rose)", desc: "High likelihood of insomnia, micro-awakenings, and light sleep." };
  };

  const handleAddCaffeine = (e) => {
    e.preventDefault();
    const drink = drinkDatabase[drinkType];
    const newLog = {
      id: Date.now(),
      name: drink.name,
      initialCaffeine: drink.caffeine,
      time: consumeTime,
      date: new Date().toLocaleDateString()
    };

    const updated = [...caffeineLogs, newLog];
    setCaffeineLogs(updated);
    localStorage.setItem(`caffeine_logs_${user.id}`, JSON.stringify(updated));
  };

  const handleDeleteLog = (id) => {
    const updated = caffeineLogs.filter((log) => log.id !== id);
    setCaffeineLogs(updated);
    localStorage.setItem(`caffeine_logs_${user.id}`, JSON.stringify(updated));
  };

  const badgeDescriptions = {
    "3DayStreak": { name: "Early Bird", desc: "Maintained a consistent sleep routine for 3 days." },
    "CircadianHero": { name: "Circadian Hero", desc: "Aligned sleep cycles for 7 days straight." },
    "SleepMaster": { name: "Sleep Master", desc: "Achieved a solid 15-day streak of healthy sleep habits!" }
  };

  const caffeineStatus = getCaffeineStatus(totalCaffeineAtBedtime);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
      
      {/* Left Column: Streaks & Daily Checklist */}
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

      {/* Right Column: Caffeine Clearance & Curfew Tracker */}
      <div className="glass-panel" style={{ display: "flex", flexDirection: "column" }}>
        <div className="glass-card-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FiCoffee style={{ color: "var(--accent-amber)", fontSize: "20px" }} />
            <h3>Caffeine Clearance Tracker</h3>
          </div>
        </div>

        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
          Caffeine blocks adenosine receptors for up to 10 hours. Log drinks to calculate estimated caffeine concentration remaining in your system at bedtime (Target: <b>{targetBedtime}</b>).
        </p>

        {/* Dynamic Caffeine Bedtime Gauge */}
        <div style={{ background: "#f8fafc", border: "1px solid var(--border-color)", padding: "16px", borderRadius: "12px", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-secondary)" }}>ESTIMATED BEDTIME CAFFEINE</span>
            <span style={{ fontSize: "18px", fontWeight: "800", color: caffeineStatus.color }}>{Math.round(totalCaffeineAtBedtime)} mg</span>
          </div>

          <div style={{ height: "10px", background: "#cbd5e1", borderRadius: "5px", overflow: "hidden", marginBottom: "8px" }}>
            <div 
              style={{ 
                width: `${Math.min(totalCaffeineAtBedtime / 150 * 100, 100)}%`, 
                height: "100%", 
                background: caffeineStatus.color,
                transition: "width 0.35s ease"
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", fontSize: "12px" }}>
            <FiAlertTriangle style={{ color: caffeineStatus.color, marginTop: "2px", flexShrink: 0 }} />
            <div>
              <b style={{ color: caffeineStatus.color }}>{caffeineStatus.text}</b> — {caffeineStatus.desc}
            </div>
          </div>
        </div>

        {/* Caffeine Log Form */}
        <form onSubmit={handleAddCaffeine} style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr auto", gap: "10px", marginBottom: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label className="form-label">Drink Name</label>
            <select 
              className="form-input" 
              value={drinkType} 
              onChange={(e) => setDrinkType(e.target.value)}
              style={{ padding: "8px 10px" }}
            >
              {Object.keys(drinkDatabase).map((key) => (
                <option key={key} value={key}>{drinkDatabase[key].name} ({drinkDatabase[key].caffeine}mg)</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <label className="form-label">Time Consumed</label>
            <input 
              type="time" 
              className="form-input" 
              value={consumeTime} 
              onChange={(e) => setConsumeTime(e.target.value)}
              style={{ padding: "7px 10px" }}
              required 
            />
          </div>

          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button type="submit" className="btn btn-primary" style={{ padding: "10px", borderRadius: "8px", height: "38px" }}>
              <FiPlus />
            </button>
          </div>
        </form>

        {/* Log list */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
          {caffeineLogs.map((log) => {
            const rem = calculateRemainingCaffeine(log);
            return (
              <div 
                key={log.id} 
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 14px",
                  background: "#f1f5f9",
                  borderLeft: "4px solid var(--accent-amber)",
                  borderRadius: "0 8px 8px 0",
                  fontSize: "12.5px"
                }}
              >
                <div>
                  <div style={{ fontWeight: "700", color: "var(--text-primary)" }}>{log.name}</div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                    <FiClock /> Drank at {log.time} | Initial: {log.initialCaffeine}mg
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: "700", color: rem > 30 ? "var(--accent-rose)" : "var(--accent-teal)" }}>{rem} mg</div>
                    <div style={{ fontSize: "9.5px", color: "var(--text-muted)" }}>at bedtime</div>
                  </div>
                  <button 
                    onClick={() => handleDeleteLog(log.id)}
                    style={{ background: "transparent", border: "none", color: "var(--accent-rose)", cursor: "pointer", fontSize: "15px" }}
                    title="Remove drink"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            );
          })}

          {caffeineLogs.length === 0 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "120px", color: "var(--text-muted)", fontSize: "12.5px" }}>
              No caffeine logged for today.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default ChallengeTracker;
