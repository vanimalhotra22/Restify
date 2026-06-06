import React, { useState } from "react";
import axios from "axios";
import { FiCheck, FiCoffee, FiChevronRight, FiCheckCircle } from "react-icons/fi";

const DietPlanner = ({ backendUrl }) => {
  const [formData, setFormData] = useState({
    age: 30,
    gender: "male",
    sleep_hours: 7.0
  });
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const res = await axios.post(`${backendUrl}/diet`, {
        age: parseInt(formData.age),
        gender: formData.gender,
        sleep_hours: parseFloat(formData.sleep_hours)
      });
      if (res.data && res.data.diet_plan) {
        setPlan(res.data.diet_plan);
      } else {
        setError("Invalid response format.");
      }
    } catch (e) {
      setError("Failed to generate diet recommendations.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
      
      {/* Input Form Panel */}
      <div className="glass-panel" style={{ height: "fit-content" }}>
        <div className="glass-card-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FiCoffee style={{ color: "var(--primary)", fontSize: "20px" }} />
            <h3>Wellness Diagnostics</h3>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Age Form Group */}
          <div className="form-group">
            <label className="form-label">Patient Age (years)</label>
            <input 
              type="number" 
              className="form-input" 
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              min="1"
              max="120"
              required
            />
          </div>

          {/* Gender Form Group */}
          <div className="form-group">
            <label className="form-label">Biological Gender</label>
            <select 
              className="form-input" 
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other / Prefer not to say</option>
            </select>
          </div>

          {/* Sleep Hours Form Group */}
          <div className="form-group">
            <label className="form-label">Average Daily Sleep (hours)</label>
            <input 
              type="number" 
              step="0.1" 
              className="form-input" 
              value={formData.sleep_hours}
              onChange={(e) => setFormData({ ...formData, sleep_hours: e.target.value })}
              min="1"
              max="24"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: "100%", marginTop: "10px" }}
            disabled={loading}
          >
            {loading ? "Generating Plan..." : "Formulate Nutrition Plan"}
          </button>
        </form>
      </div>

      {/* Recommendations Results Panel */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {error && (
          <div className="glass-panel" style={{ color: "var(--accent-rose)", borderLeft: "4px solid var(--accent-rose)" }}>
            <h4>Diagnostic Error</h4>
            <p style={{ marginTop: "4px" }}>{error}</p>
          </div>
        )}

        {!plan && !loading && !error && (
          <div className="glass-panel" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "300px", color: "var(--text-secondary)", gap: "12px" }}>
            <FiCheckCircle style={{ fontSize: "48px", color: "rgba(255,255,255,0.05)" }} />
            <h3>No Wellness Plan Formulated</h3>
            <p>Please fill out the diagnostics form to receive nutritional and hydration plans.</p>
          </div>
        )}

        {loading && (
          <div className="glass-panel" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px", color: "var(--text-secondary)" }}>
            <div className="pulse-dot" /> Formulation active, processing biomarkers...
          </div>
        )}

        {plan && (
          <div className="glass-panel">
            <div className="glass-card-header">
              <h3>Sleep-Optimized Nutrition & Hydration Plan</h3>
              <span className="badge badge-success">Diagnostics Complete</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {plan.map((rec, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    display: "flex", 
                    gap: "12px", 
                    alignItems: "flex-start",
                    background: "rgba(255,255,255,0.02)",
                    padding: "16px",
                    borderRadius: "10px",
                    border: "1px solid var(--border-glass)"
                  }}
                >
                  <div 
                    style={{ 
                      background: "rgba(99, 102, 241, 0.15)", 
                      color: "var(--primary)",
                      borderRadius: "50%",
                      width: "24px",
                      height: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: "2px"
                    }}
                  >
                    <FiChevronRight style={{ fontSize: "14px" }} />
                  </div>
                  <div style={{ fontSize: "14px", color: "var(--text-primary)", lineHeight: "1.5" }}>
                    {rec}
                  </div>
                </div>
              ))}
            </div>

            {/* General Health Tip */}
            <div 
              style={{ 
                marginTop: "24px", 
                padding: "20px", 
                background: "rgba(6, 182, 212, 0.05)", 
                borderLeft: "4px solid var(--accent-cyan)",
                borderRadius: "0 12px 12px 0",
                fontSize: "13px"
              }}
            >
              <h4 style={{ color: "var(--accent-cyan)", marginBottom: "4px", fontSize: "14px" }}>Sleep Tip of the Day</h4>
              <p>Maintaining a regular circadian cycle is just as important as diet. Go to bed and wake up at the exact same times every day (even on weekends) to help align your biological clock.</p>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default DietPlanner;
