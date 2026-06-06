import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiSettings, FiClock, FiMoon, FiBell, FiTrash2, FiAward } from "react-icons/fi";

const Settings = ({ backendUrl, user }) => {
  const [goals, setGoals] = useState({
    target_duration: 8.0,
    target_bedtime: "22:30",
    target_waketime: "06:30"
  });

  const [chronotype, setChronotype] = useState("bear");
  const [reminders, setReminders] = useState({
    screen_dim: true,
    hydration: true,
    cool_room: false
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load local storage preferences if exist
    const storedGoals = localStorage.getItem(`goals_${user.id}`);
    if (storedGoals) setGoals(JSON.parse(storedGoals));

    const storedChrono = localStorage.getItem(`chrono_${user.id}`);
    if (storedChrono) setChronotype(storedChrono);

    const storedReminders = localStorage.getItem(`reminders_${user.id}`);
    if (storedReminders) setReminders(JSON.parse(storedReminders));
  }, [user.id]);

  const handleSave = (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      localStorage.setItem(`goals_${user.id}`, JSON.stringify(goals));
      localStorage.setItem(`chrono_${user.id}`, chronotype);
      localStorage.setItem(`reminders_${user.id}`, JSON.stringify(reminders));
      setSuccess(true);
    } catch (err) {
      setError("Failed to save goals.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("⚠️ Are you absolutely sure you want to clear your entire sleep history, streaks, and achievements? This action is irreversible.")) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const res = await axios.delete(`${backendUrl}/sleep/clear?user_id=${user.id}`);
      if (res.data && res.data.status === "success") {
        alert("🧹 History successfully purged!");
        // Clear local storage items too
        localStorage.removeItem(`checklist_${user.id}_${new Date().toDateString()}`);
        localStorage.removeItem(`cbt_logs_${user.id}`);
        window.location.reload(); // Hard reload dashboard
      }
    } catch (err) {
      setError("Failed to communicate with DB to clear logs.");
    } finally {
      setLoading(false);
    }
  };

  const chronotypeDescriptions = {
    bear: {
      title: "🐻 The Bear (Circadian Sync)",
      desc: "Your energy tracks the sun. You wake up easily with daylight and wind down naturally when the sun sets. Ideal sleep window: 11:00 PM to 7:00 AM."
    },
    lark: {
      title: "🌅 The Lark (Early Riser)",
      desc: "You have peak productivity in the early hours. You wake up energized at dawn but experience heavy sleep pressure in the early evening. Ideal sleep window: 10:00 PM to 6:00 AM."
    },
    owl: {
      title: "🦉 The Night Owl (Late Peak)",
      desc: "You experience peak creativity and energy late in the evening. Waking early feels unnatural. Ideal sleep window: 12:30 AM to 8:30 AM."
    },
    dolphin: {
      title: "🐬 The Dolphin (Light Sleeper)",
      desc: "You are a very light sleeper, highly sensitive to noise and room temperature. Often experiences sleep onset anxiety. Ideal sleep window: 11:30 PM to 6:30 AM."
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px" }}>
      
      {/* Settings Form */}
      <div className="glass-panel">
        <div className="glass-card-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FiSettings style={{ color: "var(--primary)" }} />
            <h3>Personal Sleep Goals & Profile</h3>
          </div>
        </div>

        {success && (
          <div style={{ color: "var(--accent-teal)", background: "rgba(13,148,136,0.05)", border: "1px solid rgba(13,148,136,0.15)", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}>
            ✅ Goals and sleep preferences updated successfully!
          </div>
        )}

        {error && (
          <div style={{ color: "var(--accent-rose)", background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.15)", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSave}>
          {/* Target sleep parameters */}
          <h4 style={{ fontSize: "14px", marginBottom: "12px", color: "var(--text-secondary)" }}>Sleep Target Windows</h4>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label">Sleep Duration (hrs)</label>
              <input 
                type="number" 
                step="0.5" 
                className="form-input" 
                value={goals.target_duration}
                onChange={(e) => setGoals({ ...goals, target_duration: parseFloat(e.target.value) })}
                min="4"
                max="12"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Bedtime Target</label>
              <input 
                type="time" 
                className="form-input" 
                value={goals.target_bedtime}
                onChange={(e) => setGoals({ ...goals, target_bedtime: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Wake Time Target</label>
              <input 
                type="time" 
                className="form-input" 
                value={goals.target_waketime}
                onChange={(e) => setGoals({ ...goals, target_waketime: e.target.value })}
              />
            </div>
          </div>

          <hr style={{ border: "0", borderTop: "1px solid var(--border-color)", margin: "20px 0" }} />

          {/* Chronotype selection */}
          <h4 style={{ fontSize: "14px", marginBottom: "12px", color: "var(--text-secondary)" }}>Select Chronotype</h4>
          <div className="form-group">
            <select 
              className="form-input" 
              value={chronotype} 
              onChange={(e) => setChronotype(e.target.value)}
            >
              <option value="bear">Bear (Daylight Tracker)</option>
              <option value="lark">Lark (Morning Person)</option>
              <option value="owl">Night Owl (Late Peak)</option>
              <option value="dolphin">Dolphin (Light/Insomnia-Prone)</option>
            </select>
          </div>

          <hr style={{ border: "0", borderTop: "1px solid var(--border-color)", margin: "20px 0" }} />

          {/* Bedtime reminders preferences */}
          <h4 style={{ fontSize: "14px", marginBottom: "12px", color: "var(--text-secondary)" }}>Active Bedtime Reminders</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13.5px", cursor: "pointer" }}>
              <input 
                type="checkbox" 
                checked={reminders.screen_dim} 
                onChange={() => setReminders({ ...reminders, screen_dim: !reminders.screen_dim })} 
              />
              Screen Dim Reminder (60 mins before bed)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13.5px", cursor: "pointer" }}>
              <input 
                type="checkbox" 
                checked={reminders.hydration} 
                onChange={() => setReminders({ ...reminders, hydration: !reminders.hydration })} 
              />
              Taper Fluids reminder (2 hours before bed)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13.5px", cursor: "pointer" }}>
              <input 
                type="checkbox" 
                checked={reminders.cool_room} 
                onChange={() => setReminders({ ...reminders, cool_room: !reminders.cool_room })} 
              />
              Thermostat cool down warning
            </label>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
            Save Sleep Profile
          </button>
        </form>
      </div>

      {/* Profile Sidebar Info */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Chronotype Info Card */}
        <div className="glass-panel" style={{ borderLeft: "4px solid var(--accent-purple)", background: "rgba(139, 92, 246, 0.03)" }}>
          <h3 style={{ fontSize: "15px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
            <FiMoon /> Chronotype Assessment
          </h3>
          <h4 style={{ fontSize: "13.5px", color: "var(--accent-purple)", marginBottom: "6px" }}>
            {chronotypeDescriptions[chronotype].title}
          </h4>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
            {chronotypeDescriptions[chronotype].desc}
          </p>
        </div>

        {/* Danger Zone / Reset */}
        <div className="glass-panel" style={{ borderLeft: "4px solid var(--accent-rose)", background: "rgba(244, 63, 94, 0.03)" }}>
          <h3 style={{ fontSize: "15px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px", color: "var(--accent-rose)" }}>
            <FiTrash2 /> Purge Account Data
          </h3>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "14px" }}>
            Reset sleep logs, challenge streaks, badges, and sleep history.
          </p>
          <button className="btn btn-danger" onClick={handleClearHistory} style={{ width: "100%" }} disabled={loading}>
            Clear History
          </button>
        </div>

      </div>

    </div>
  );
};

export default Settings;
