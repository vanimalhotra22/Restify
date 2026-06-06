import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiSliders, FiActivity, FiShield, FiAlertTriangle, FiCheckCircle, FiRefreshCw } from "react-icons/fi";

const RiskSimulator = ({ backendUrl, user }) => {
  const defaultInputs = {
    sleep_hours: 7.5,
    stress: 2,
    age: user?.age || 30,
    exercise_min: 30,
    screen_time_min: 60,
    snoring_freq: "Never",
    awakenings: 1,
  };

  const [inputs, setInputs] = useState(defaultInputs);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Trigger prediction API whenever inputs change
  useEffect(() => {
    const fetchPrediction = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.post(`${backendUrl}/ai/predict-risk`, {
          sleep_hours: parseFloat(inputs.sleep_hours),
          stress: parseInt(inputs.stress),
          age: parseInt(inputs.age),
          exercise_min: parseInt(inputs.exercise_min),
          screen_time_min: parseInt(inputs.screen_time_min),
          snoring_freq: inputs.snoring_freq,
          awakenings: parseInt(inputs.awakenings),
        });
        if (response.data && response.data.status === "success") {
          setResults(response.data);
        }
      } catch (err) {
        console.error("Prediction error:", err);
        setError("Could not calculate risk prediction from server.");
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, [inputs, backendUrl]);

  const handleSliderChange = (key, val) => {
    setInputs((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleReset = () => {
    setInputs(defaultInputs);
  };

  const getRiskBadgeClass = (level) => {
    switch (level) {
      case "High":
        return "badge-danger";
      case "Moderate":
        return "badge-warning";
      case "Low":
      default:
        return "badge-success";
    }
  };

  const getRiskColor = (score) => {
    if (score > 70) return "var(--accent-rose)";
    if (score > 40) return "var(--accent-amber)";
    return "var(--accent-teal)";
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "24px" }}>
      
      {/* Simulation Controls Column */}
      <div className="glass-panel">
        <div className="glass-card-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FiSliders style={{ color: "var(--primary)", fontSize: "20px" }} />
            <h3>Sleep Risk Simulator Sandbox</h3>
          </div>
          <button 
            className="btn btn-secondary" 
            onClick={handleReset} 
            style={{ padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}
            title="Reset to Baseline"
          >
            <FiRefreshCw /> Reset
          </button>
        </div>

        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
          Move the sliders below to simulate different user profiles and observe how lifestyle habits, age, and sleep patterns affect statistical risk scores for primary sleep disorders.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Sleep Hours Slider */}
          <div className="form-group" style={{ marginBottom: "0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <label className="form-label" style={{ marginBottom: "0" }}>Sleep Duration</label>
              <span style={{ fontWeight: "700", color: "var(--primary)" }}>{inputs.sleep_hours} hours</span>
            </div>
            <input 
              type="range" 
              min="3" 
              max="12" 
              step="0.5" 
              value={inputs.sleep_hours}
              onChange={(e) => handleSliderChange("sleep_hours", e.target.value)}
              style={{ width: "100%", accentColor: "var(--primary)" }}
            />
            <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
              <span>Short sleep (&lt; 6h)</span>
              <span>Long sleep (&gt; 9h)</span>
            </span>
          </div>

          {/* Stress Level Slider */}
          <div className="form-group" style={{ marginBottom: "0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <label className="form-label" style={{ marginBottom: "0" }}>Stress Level</label>
              <span style={{ fontWeight: "700", color: "var(--accent-purple)" }}>{inputs.stress} / 5</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="5" 
              step="1" 
              value={inputs.stress}
              onChange={(e) => handleSliderChange("stress", e.target.value)}
              style={{ width: "100%", accentColor: "var(--accent-purple)" }}
            />
            <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
              <span>1 - Relaxed / Low</span>
              <span>5 - Extreme / Severe</span>
            </span>
          </div>

          {/* Age Slider */}
          <div className="form-group" style={{ marginBottom: "0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <label className="form-label" style={{ marginBottom: "0" }}>Age</label>
              <span style={{ fontWeight: "700", color: "var(--text-primary)" }}>{inputs.age} years old</span>
            </div>
            <input 
              type="range" 
              min="18" 
              max="90" 
              step="1" 
              value={inputs.age}
              onChange={(e) => handleSliderChange("age", e.target.value)}
              style={{ width: "100%", accentColor: "var(--text-primary)" }}
            />
          </div>

          {/* Daily Exercise Slider */}
          <div className="form-group" style={{ marginBottom: "0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <label className="form-label" style={{ marginBottom: "0" }}>Daily Physical Activity</label>
              <span style={{ fontWeight: "700", color: "var(--accent-teal)" }}>{inputs.exercise_min} mins</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="120" 
              step="5" 
              value={inputs.exercise_min}
              onChange={(e) => handleSliderChange("exercise_min", e.target.value)}
              style={{ width: "100%", accentColor: "var(--accent-teal)" }}
            />
            <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
              <span>Sedentary (0m)</span>
              <span>Highly Active (120m+)</span>
            </span>
          </div>

          {/* Screen Time Slider */}
          <div className="form-group" style={{ marginBottom: "0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <label className="form-label" style={{ marginBottom: "0" }}>Screen Time Before Bed</label>
              <span style={{ fontWeight: "700", color: "var(--accent-rose)" }}>{inputs.screen_time_min} mins</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="300" 
              step="10" 
              value={inputs.screen_time_min}
              onChange={(e) => handleSliderChange("screen_time_min", e.target.value)}
              style={{ width: "100%", accentColor: "var(--accent-rose)" }}
            />
            <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
              <span>Digital Detox (0m)</span>
              <span>Heavy Use (5h+)</span>
            </span>
          </div>

          {/* Awakenings Slider */}
          <div className="form-group" style={{ marginBottom: "0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <label className="form-label" style={{ marginBottom: "0" }}>Nighttime Awakenings</label>
              <span style={{ fontWeight: "700", color: "var(--accent-amber)" }}>{inputs.awakenings} times</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="10" 
              step="1" 
              value={inputs.awakenings}
              onChange={(e) => handleSliderChange("awakenings", e.target.value)}
              style={{ width: "100%", accentColor: "var(--accent-amber)" }}
            />
          </div>

          {/* Snoring Frequency Radio Group */}
          <div className="form-group" style={{ marginBottom: "0" }}>
            <label className="form-label">Snoring Frequency</label>
            <div style={{ display: "flex", gap: "16px", marginTop: "6px" }}>
              {["Never", "Occasionally", "Frequently"].map((freq) => (
                <label key={freq} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                  <input 
                    type="radio" 
                    name="snoring_freq" 
                    value={freq} 
                    checked={inputs.snoring_freq === freq}
                    onChange={(e) => handleSliderChange("snoring_freq", e.target.value)}
                    style={{ accentColor: "var(--primary)" }}
                  />
                  {freq}
                </label>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Simulator Analysis Output Column */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Main Risk Overview Gauge Panel */}
        <div className="glass-panel" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", position: "relative" }}>
          {loading && (
            <div style={{ position: "absolute", top: "16px", right: "16px", fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
              <div className="status-indicator" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--primary)", animation: "pulse 1s infinite alternate" }}></div>
              updating...
            </div>
          )}
          
          <h4 style={{ alignSelf: "flex-start", marginBottom: "16px", fontSize: "15px", display: "flex", alignItems: "center", gap: "6px" }}>
            <FiActivity style={{ color: "var(--primary)" }} /> Real-Time Analytics
          </h4>

          {results ? (
            <>
              {/* Radial Score Gauge */}
              <div style={{ position: "relative", width: "160px", height: "160px", margin: "10px 0" }}>
                {/* SVG circular track */}
                <svg width="160" height="160" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    fill="transparent" 
                    stroke="#e2e8f0" 
                    strokeWidth="8" 
                  />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    fill="transparent" 
                    stroke={getRiskColor(results.risk_score)} 
                    strokeWidth="8" 
                    strokeDasharray="251.2" 
                    strokeDashoffset={251.2 - (251.2 * results.risk_score) / 100}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.35s ease, stroke 0.35s ease" }}
                  />
                </svg>
                {/* Score label inside */}
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{ fontSize: "28px", fontWeight: "800", color: "var(--text-primary)" }}>
                    {results.risk_score}%
                  </span>
                  <span style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em", fontWeight: "600" }}>
                    Overall Risk
                  </span>
                </div>
              </div>

              <div style={{ marginTop: "12px", marginBottom: "8px" }}>
                <span className={`badge ${getRiskBadgeClass(results.risk_level)}`} style={{ fontSize: "12px", padding: "6px 12px", borderRadius: "20px" }}>
                  {results.risk_level} Risk Level
                </span>
              </div>
            </>
          ) : error ? (
            <div style={{ color: "var(--accent-rose)", margin: "40px 0" }}>
              <FiAlertTriangle style={{ fontSize: "32px", marginBottom: "8px" }} />
              <p style={{ fontSize: "13px" }}>{error}</p>
            </div>
          ) : (
            <div style={{ color: "var(--text-muted)", margin: "40px 0" }}>
              <p style={{ fontSize: "13px" }}>Initializing Simulator...</p>
            </div>
          )}
        </div>

        {/* Detailed Disorder Risk Breakdown */}
        {results && (
          <div className="glass-panel">
            <h4 style={{ marginBottom: "16px", fontSize: "14px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
              <FiShield style={{ color: "var(--accent-teal)" }} /> Disorder Risk Index
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Insomnia Bar */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>
                  <span>Insomnia Risk</span>
                  <span style={{ color: getRiskColor(results.breakdown.insomnia) }}>{results.breakdown.insomnia}%</span>
                </div>
                <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                  <div 
                    style={{ 
                      width: `${results.breakdown.insomnia}%`, 
                      height: "100%", 
                      background: getRiskColor(results.breakdown.insomnia),
                      borderRadius: "4px",
                      transition: "width 0.35s ease, background 0.35s ease"
                    }}
                  />
                </div>
              </div>

              {/* Sleep Apnea Bar */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>
                  <span>Sleep Apnea Risk</span>
                  <span style={{ color: getRiskColor(results.breakdown.sleep_apnea) }}>{results.breakdown.sleep_apnea}%</span>
                </div>
                <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                  <div 
                    style={{ 
                      width: `${results.breakdown.sleep_apnea}%`, 
                      height: "100%", 
                      background: getRiskColor(results.breakdown.sleep_apnea),
                      borderRadius: "4px",
                      transition: "width 0.35s ease, background 0.35s ease"
                    }}
                  />
                </div>
              </div>

              {/* Restless Leg Syndrome Bar */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>
                  <span>Restless Leg Syndrome (RLS)</span>
                  <span style={{ color: getRiskColor(results.breakdown.restless_leg) }}>{results.breakdown.restless_leg}%</span>
                </div>
                <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                  <div 
                    style={{ 
                      width: `${results.breakdown.restless_leg}%`, 
                      height: "100%", 
                      background: getRiskColor(results.breakdown.restless_leg),
                      borderRadius: "4px",
                      transition: "width 0.35s ease, background 0.35s ease"
                    }}
                  />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Clinical Signatures & Tips */}
        {results && (
          <div className="glass-panel" style={{ borderLeft: `4px solid ${getRiskColor(results.risk_score)}` }}>
            <h4 style={{ marginBottom: "12px", fontSize: "14px" }}>
              Clinical Assessment Findings
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {results.findings && results.findings.map((finding, idx) => (
                <div key={idx} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "12.5px", lineHeight: "1.5" }}>
                  {results.risk_level === "High" ? (
                    <FiAlertTriangle style={{ color: "var(--accent-rose)", flexShrink: 0, marginTop: "2px" }} />
                  ) : results.risk_level === "Moderate" ? (
                    <FiAlertTriangle style={{ color: "var(--accent-amber)", flexShrink: 0, marginTop: "2px" }} />
                  ) : (
                    <FiCheckCircle style={{ color: "var(--accent-teal)", flexShrink: 0, marginTop: "2px" }} />
                  )}
                  <span style={{ color: "var(--text-secondary)" }}>{finding}</span>
                </div>
              ))}
            </div>

            {/* AI/Heuristic Tips Panel */}
            <div style={{ marginTop: "16px", padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px dashed var(--border-color)" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--primary)", display: "block", marginBottom: "6px" }}>
                Simulator Action Recommendations
              </span>
              <ul style={{ fontSize: "12px", color: "var(--text-secondary)", paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "4px" }}>
                {inputs.sleep_hours < 6.5 && (
                  <li>⚠️ Low sleep duration detected. Focus on sleep consistency and prioritize a 7.5+ hour sleep window.</li>
                )}
                {inputs.stress > 3 && (
                  <li>🧘 High stress scores. Try practicing the 4-7-8 Breathing Ring in the Relaxation Center before bed.</li>
                )}
                {inputs.screen_time_min > 90 && (
                  <li>📱 Excessive evening screen time suppresses melatonin. Try to stay off devices 1 hour before sleeping.</li>
                )}
                {inputs.snoring_freq === "Frequently" && (
                  <li>💤 Frequent snoring with nighttime awakenings increases sleep apnea probability. Consider side sleeping or a physician screening.</li>
                )}
                {inputs.exercise_min < 20 && (
                  <li>🏃 Insufficient exercise limits deep sleep drive. Try at least 20-30 mins of moderate daylight activity.</li>
                )}
                {inputs.sleep_hours >= 7 && inputs.stress <= 2 && inputs.screen_time_min <= 60 && inputs.snoring_freq === "Never" && (
                  <li>✨ Exceptional health indicators! Maintain these positive habits to safeguard long-term sleep wellness.</li>
                )}
              </ul>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default RiskSimulator;
