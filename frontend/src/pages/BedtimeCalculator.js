import React, { useState } from "react";
import axios from "axios";
import { FiClock, FiPlay, FiSmile } from "react-icons/fi";

const BedtimeCalculator = ({ backendUrl }) => {
  const [wakeTime, setWakeTime] = useState("06:00");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCalculate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await axios.post(`${backendUrl}/sleep/calculate-bedtime`, {
        wake_time: wakeTime
      });
      if (res.data && res.data.options) {
        setResults(res.data.options);
      }
    } catch (err) {
      setError("Failed to run calculation. Check time format.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
      
      {/* Input panel */}
      <div className="glass-panel" style={{ height: "fit-content" }}>
        <div className="glass-card-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FiClock style={{ color: "var(--primary)" }} />
            <h3>Optimal Bedtime Calculator</h3>
          </div>
        </div>

        <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginBottom: "20px" }}>
          Sleeping in alignment with standard 90-minute cycles prevents waking up in deep sleep phases (which causes sleep inertia and morning fatigue).
        </p>

        <form onSubmit={handleCalculate}>
          <div className="form-group">
            <label className="form-label">What time do you need to wake up?</label>
            <input 
              type="time" 
              className="form-input" 
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Calculating Cycles..." : "Calculate Optimal bedtimes"}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: "12px", color: "var(--accent-rose)", fontSize: "13px" }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Result panel */}
      <div className="glass-panel">
        <div className="glass-card-header">
          <h3>Calculated Cycle Recommendations</h3>
        </div>

        {!results ? (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "220px", color: "var(--text-secondary)", gap: "10px" }}>
            <FiClock style={{ fontSize: "32px", color: "var(--text-muted)" }} />
            <p>Input your wake-up hour on the left to see recommended sleep cycles.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {results.map((opt, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  padding: "16px", 
                  background: idx === 1 ? "var(--primary-light)" : "var(--bg-main)", 
                  border: idx === 1 ? "1px solid var(--primary)" : "1px solid var(--border-color)",
                  borderRadius: "12px"
                }}
              >
                <div>
                  <h4 style={{ fontSize: "14px", fontWeight: "700" }}>{opt.time}</h4>
                  <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                    Includes 15 mins buffer to fall asleep
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="badge badge-info" style={{ display: "inline-block", marginBottom: "4px" }}>
                    {opt.hours} Hours Sleep
                  </span>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    {opt.cycles} Complete Cycles
                  </div>
                </div>
              </div>
            ))}
            <div style={{ fontSize: "11.5px", color: "var(--text-muted)", fontStyle: "italic", marginTop: "10px", textAlign: "center" }}>
              💡 Highlighted bedtime represents the clinical gold-standard 7.5 hours of sleep (5 cycles).
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default BedtimeCalculator;
