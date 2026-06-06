import React, { useState } from "react";
import axios from "axios";
import { FiBookOpen, FiActivity, FiSmile, FiShield, FiAlertTriangle, FiCheck } from "react-icons/fi";

const SleepDiary = ({ backendUrl, user }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    bedtime: "23:00",
    wake_time: "07:00",
    sleep_quality: 4,
    mood: 3,
    energy: 3,
    stress: 2,
    temp: 20.0,
    noise: "Quiet",
    light: "Pitch Dark"
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await axios.post(`${backendUrl}/sleep/log`, {
        user_id: user.id,
        date: formData.date,
        bedtime: formData.bedtime,
        wake_time: formData.wake_time,
        sleep_quality: parseInt(formData.sleep_quality),
        mood: parseInt(formData.mood),
        energy: parseInt(formData.energy),
        stress: parseInt(formData.stress),
        temp: parseFloat(formData.temp),
        noise: formData.noise,
        light: formData.light
      });

      if (res.data && res.data.status === "success") {
        setSuccess(true);
      }
    } catch (err) {
      setError("Failed to record sleep diary. Check API connection.");
    } finally {
      setLoading(false);
    }
  };

  // Environment Analyzer suggestions
  const analyzeEnvironment = () => {
    const alerts = [];
    const t = parseFloat(formData.temp);
    
    if (t > 22.0) {
      alerts.push({
        type: "warning",
        msg: "Room temperature is too hot! Ideal sleep climate is between 16°C and 19°C. Lowering your room temperature triggers your natural melatonin release."
      });
    } else if (t < 15.0) {
      alerts.push({
        type: "info",
        msg: "Room temperature is slightly cold. Wear warm socks: cold extremities can disrupt sleep onset."
      });
    } else {
      alerts.push({
        type: "success",
        msg: "Room temperature is in the optimal range (16-20°C). Good job!"
      });
    }

    if (formData.noise !== "Quiet") {
      alerts.push({
        type: "warning",
        msg: `Ambient noise level is ${formData.noise}. Constant noise triggers minor arousal events. Consider earplugs or a pink noise generator.`
      });
    } else {
      alerts.push({
        type: "success",
        msg: "Ambient noise level is Quiet. Perfect!"
      });
    }

    if (formData.light !== "Pitch Dark") {
      alerts.push({
        type: "warning",
        msg: "Luminosity is too high! Even low levels of light pass through eyelids, suppressing melatonin production. Use blackout curtains or a sleep mask."
      });
    } else {
      alerts.push({
        type: "success",
        msg: "Ambient light level is Pitch Dark. Perfect for sleep cycles."
      });
    }

    return alerts;
  };

  const envAlerts = analyzeEnvironment();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
      
      {/* Diary Entry Form */}
      <div className="glass-panel">
        <div className="glass-card-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FiBookOpen style={{ color: "var(--primary)" }} />
            <h3>Log Daily Sleep Diary</h3>
          </div>
        </div>

        {success && (
          <div style={{ color: "var(--accent-teal)", background: "rgba(13,148,136,0.05)", border: "1px solid rgba(13,148,136,0.15)", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}>
            ✅ Daily sleep diary logged successfully! Challenge streak updated.
          </div>
        )}

        {error && (
          <div style={{ color: "var(--accent-rose)", background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.15)", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={formData.date} 
                onChange={(e) => setFormData({ ...formData, date: e.target.value })} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Bedtime</label>
              <input 
                type="time" 
                className="form-input" 
                value={formData.bedtime} 
                onChange={(e) => setFormData({ ...formData, bedtime: e.target.value })} 
                required 
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label">Wake-Up Time</label>
              <input 
                type="time" 
                className="form-input" 
                value={formData.wake_time} 
                onChange={(e) => setFormData({ ...formData, wake_time: e.target.value })} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Sleep Quality (1-5)</label>
              <input 
                type="range" 
                min="1" 
                max="5" 
                className="form-input"
                value={formData.sleep_quality} 
                onChange={(e) => setFormData({ ...formData, sleep_quality: e.target.value })} 
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
            <div className="form-group">
              <label className="form-label">Mood (1-5)</label>
              <input 
                type="number" 
                min="1" 
                max="5" 
                className="form-input" 
                value={formData.mood} 
                onChange={(e) => setFormData({ ...formData, mood: e.target.value })} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Energy (1-5)</label>
              <input 
                type="number" 
                min="1" 
                max="5" 
                className="form-input" 
                value={formData.energy} 
                onChange={(e) => setFormData({ ...formData, energy: e.target.value })} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Stress (1-5)</label>
              <input 
                type="number" 
                min="1" 
                max="5" 
                className="form-input" 
                value={formData.stress} 
                onChange={(e) => setFormData({ ...formData, stress: e.target.value })} 
                required 
              />
            </div>
          </div>

          <hr style={{ border: "0", borderTop: "1px solid var(--border-color)", margin: "16px 0" }} />

          <h4 style={{ fontSize: "14px", marginBottom: "12px", color: "var(--text-secondary)" }}>Environment Diagnostics</h4>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label">Temperature (°C)</label>
              <input 
                type="number" 
                step="0.5" 
                className="form-input" 
                value={formData.temp} 
                onChange={(e) => setFormData({ ...formData, temp: e.target.value })} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Noise Level</label>
              <select 
                className="form-input" 
                value={formData.noise} 
                onChange={(e) => setFormData({ ...formData, noise: e.target.value })}
              >
                <option value="Quiet">Quiet</option>
                <option value="Moderate">Moderate</option>
                <option value="Loud">Loud</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Room Luminosity</label>
            <select 
              className="form-input" 
              value={formData.light} 
              onChange={(e) => setFormData({ ...formData, light: e.target.value })}
            >
              <option value="Pitch Dark">Pitch Dark (Optimal)</option>
              <option value="Dim">Dim Light</option>
              <option value="Bright">Bright Light</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: "100%", marginTop: "10px" }}
            disabled={loading}
          >
            {loading ? "Recording Log..." : "Log Sleep & Environment"}
          </button>
        </form>
      </div>

      {/* Environment Analyzer */}
      <div className="glass-panel" style={{ display: "flex", flexDirection: "column" }}>
        <div className="glass-card-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FiShield style={{ color: "var(--accent-teal)" }} />
            <h3>Sleep Environment Analyzer</h3>
          </div>
        </div>

        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
          Biomedical research confirms room atmosphere impacts sleep architecture. Adjust values on the left to see recommendations.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
          {envAlerts.map((alert, idx) => (
            <div 
              key={idx} 
              style={{
                padding: "14px",
                borderRadius: "10px",
                borderLeft: "4px solid",
                background: alert.type === "success" ? "rgba(13,148,136,0.04)" : alert.type === "warning" ? "rgba(244,63,94,0.04)" : "rgba(14,165,233,0.04)",
                borderLeftColor: alert.type === "success" ? "var(--accent-teal)" : alert.type === "warning" ? "var(--accent-rose)" : "var(--primary)",
                display: "flex",
                gap: "10px",
                alignItems: "flex-start"
              }}
            >
              <span style={{ display: "inline-flex", fontSize: "16px", marginTop: "2px" }}>
                {alert.type === "success" ? <FiCheck style={{ color: "var(--accent-teal)" }} /> : <FiAlertTriangle style={{ color: alert.type === "warning" ? "var(--accent-rose)" : "var(--primary)" }} />}
              </span>
              <div style={{ fontSize: "12.5px", color: "var(--text-primary)", lineHeight: "1.5" }}>
                {alert.msg}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default SleepDiary;
