import React, { useState } from "react";
import axios from "axios";
import { FiLayers, FiPlay, FiAward, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";

const AssessmentQuiz = ({ backendUrl, user }) => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    sleep_hours: 7.0,
    stress: 3,
    exercise_min: 30,
    screen_time_min: 120,
    snoring_freq: "Never",
    awakenings: 0,
    difficulty_falling: "No",
    frequent_awakenings: "No",
    leg_discomfort: "No"
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const steps = [
    {
      title: "Duration & Quality",
      fields: (
        <>
          <div className="form-group">
            <label className="form-label">How many hours of sleep do you average per night?</label>
            <input 
              type="number" 
              step="0.5" 
              className="form-input" 
              value={formData.sleep_hours} 
              onChange={(e) => setFormData({ ...formData, sleep_hours: parseFloat(e.target.value) })}
              min="2"
              max="16"
            />
          </div>
          <div className="form-group">
            <label className="form-label">How many times do you wake up during the night?</label>
            <input 
              type="number" 
              className="form-input" 
              value={formData.awakenings} 
              onChange={(e) => setFormData({ ...formData, awakenings: parseInt(e.target.value) })}
              min="0"
              max="20"
            />
          </div>
        </>
      )
    },
    {
      title: "Lifestyle & Environment",
      fields: (
        <>
          <div className="form-group">
            <label className="form-label">What is your daily stress level (1-5)?</label>
            <input 
              type="number" 
              min="1" 
              max="5" 
              className="form-input" 
              value={formData.stress} 
              onChange={(e) => setFormData({ ...formData, stress: parseInt(e.target.value) })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Daily exercise duration (minutes)</label>
            <input 
              type="number" 
              className="form-input" 
              value={formData.exercise_min} 
              onChange={(e) => setFormData({ ...formData, exercise_min: parseInt(e.target.value) })}
              min="0"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Daily mobile/screen time before bed (minutes)</label>
            <input 
              type="number" 
              className="form-input" 
              value={formData.screen_time_min} 
              onChange={(e) => setFormData({ ...formData, screen_time_min: parseInt(e.target.value) })}
              min="0"
            />
          </div>
        </>
      )
    },
    {
      title: "Clinical Screening Indicators",
      fields: (
        <>
          <div className="form-group">
            <label className="form-label">Do you snore loudly at night?</label>
            <select 
              className="form-input" 
              value={formData.snoring_freq} 
              onChange={(e) => setFormData({ ...formData, snoring_freq: e.target.value })}
            >
              <option value="Never">Never / Quietly</option>
              <option value="Occasionally">Occasionally</option>
              <option value="Frequently">Frequently (Possible Apnea)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Do you experience difficulty falling asleep (>30 mins)?</label>
            <select 
              className="form-input" 
              value={formData.difficulty_falling} 
              onChange={(e) => setFormData({ ...formData, difficulty_falling: e.target.value })}
            >
              <option value="No">No</option>
              <option value="Yes">Yes (Possible Insomnia)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Do you have crawling/cramping sensations in your legs at night?</label>
            <select 
              className="form-input" 
              value={formData.leg_discomfort} 
              onChange={(e) => setFormData({ ...formData, leg_discomfort: e.target.value })}
            >
              <option value="No">No</option>
              <option value="Yes">Yes (Possible Restless Leg Syndrome)</option>
            </select>
          </div>
        </>
      )
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleQuizSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await axios.post(`${backendUrl}/ai/predict-risk`, {
        sleep_hours: formData.sleep_hours,
        stress: formData.stress,
        age: user ? user.age : 30,
        exercise_min: formData.exercise_min,
        screen_time_min: formData.screen_time_min,
        snoring_freq: formData.snoring_freq,
        awakenings: formData.awakenings
      });

      if (res.data && res.data.status === "success") {
        setResult(res.data);
      }
    } catch (err) {
      setError("Failed to run prediction diagnostics. Check API.");
    } finally {
      setLoading(false);
    }
  };

  const resetQuiz = () => {
    setStep(0);
    setResult(null);
    setError(null);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
      
      {/* Quiz Question Panel */}
      <div className="glass-panel" style={{ height: "fit-content" }}>
        <div className="glass-card-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FiLayers style={{ color: "var(--primary)" }} />
            <h3>Sleep Screening Quiz</h3>
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>
            Step {step + 1} of {steps.length}
          </span>
        </div>

        {!result ? (
          <div>
            <h4 style={{ fontSize: "14px", color: "var(--primary)", marginBottom: "14px" }}>
              {steps[step].title}
            </h4>

            {steps[step].fields}

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
              <button 
                className="btn btn-secondary" 
                onClick={handlePrev} 
                disabled={step === 0}
              >
                Previous
              </button>
              
              {step < steps.length - 1 ? (
                <button className="btn btn-primary" onClick={handleNext}>
                  Next Section
                </button>
              ) : (
                <button 
                  className="btn btn-primary" 
                  onClick={handleQuizSubmit}
                  disabled={loading}
                >
                  {loading ? "Analyzing Factors..." : "Calculate Risk Probability"}
                </button>
              )}
            </div>

            {error && (
              <div style={{ marginTop: "12px", color: "var(--accent-rose)", fontSize: "12px" }}>
                ⚠️ {error}
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <FiCheckCircle style={{ fontSize: "48px", color: "var(--accent-teal)", marginBottom: "14px" }} />
            <h4>Diagnostics Complete</h4>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "6px" }}>
              Sleeplens AI risk predictor has formulated your report.
            </p>
            <button className="btn btn-secondary" onClick={resetQuiz} style={{ marginTop: "20px" }}>
              Retake Quiz
            </button>
          </div>
        )}
      </div>

      {/* Predictions & Findings Panel */}
      <div className="glass-panel" style={{ display: "flex", flexDirection: "column" }}>
        <div className="glass-card-header">
          <h3>Screener Diagnosis Report</h3>
        </div>

        {!result ? (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "300px", color: "var(--text-secondary)", gap: "10px" }}>
            <FiLayers style={{ fontSize: "36px", color: "var(--text-muted)" }} />
            <p>Please complete all quiz steps to generate risk indices.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Risk Score Indicator */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "var(--bg-main)", borderRadius: "12px" }}>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600" }}>DOMINANT RISK SCORE</span>
                <h2 style={{ fontSize: "28px", color: result.risk_level === "High" ? "var(--accent-rose)" : result.risk_level === "Moderate" ? "var(--accent-amber)" : "var(--accent-teal)" }}>
                  {result.risk_score}%
                </h2>
              </div>
              <span className={`badge ${result.risk_level === "High" ? "badge-danger" : result.risk_level === "Moderate" ? "badge-warning" : "badge-success"}`} style={{ padding: "8px 12px", fontSize: "12px" }}>
                {result.risk_level} Risk
              </span>
            </div>

            {/* Disorder Breakdown */}
            <div>
              <h4 style={{ fontSize: "14px", marginBottom: "12px" }}>AI Sleep Disorder Breakdown</h4>
              
              {/* Insomnia Progress */}
              <div style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                  <span>Difficulty Maintaining Sleep / Insomnia</span>
                  <span style={{ fontWeight: "700" }}>{result.breakdown.insomnia}%</span>
                </div>
                <div style={{ width: "100%", height: "6px", background: "#e2e8f0", borderRadius: "3px" }}>
                  <div style={{ width: `${result.breakdown.insomnia}%`, height: "100%", background: "var(--primary)", borderRadius: "3px" }} />
                </div>
              </div>

              {/* Sleep Apnea Progress */}
              <div style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                  <span>Breathing Pauses / Sleep Apnea</span>
                  <span style={{ fontWeight: "700" }}>{result.breakdown.sleep_apnea}%</span>
                </div>
                <div style={{ width: "100%", height: "6px", background: "#e2e8f0", borderRadius: "3px" }}>
                  <div style={{ width: `${result.breakdown.sleep_apnea}%`, height: "100%", background: "var(--accent-amber)", borderRadius: "3px" }} />
                </div>
              </div>

              {/* RLS Progress */}
              <div style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                  <span>Leg Discomfort / Restless Legs</span>
                  <span style={{ fontWeight: "700" }}>{result.breakdown.restless_leg}%</span>
                </div>
                <div style={{ width: "100%", height: "6px", background: "#e2e8f0", borderRadius: "3px" }}>
                  <div style={{ width: `${result.breakdown.restless_leg}%`, height: "100%", background: "var(--accent-purple)", borderRadius: "3px" }} />
                </div>
              </div>
            </div>

            {/* AI Findings List */}
            <div style={{ marginTop: "10px", padding: "16px", background: "rgba(2, 132, 199, 0.04)", borderRadius: "10px", border: "1px solid rgba(2, 132, 199, 0.1)" }}>
              <h4 style={{ fontSize: "13px", color: "var(--primary)", marginBottom: "8px" }}>AI Clinical Log Findings</h4>
              <ul style={{ listStyle: "inside", fontSize: "12px", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "6px" }}>
                {result.findings.map((f, idx) => (
                  <li key={idx}>{f}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default AssessmentQuiz;
