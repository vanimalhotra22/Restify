import React, { useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import axios from "axios";
import { FiHeart, FiUpload, FiPlay, FiCheck, FiAlertTriangle } from "react-icons/fi";

// Helper to generate a realistic Normal ECG Beat (187 points)
const generateNormalECG = () => {
  const points = [];
  for (let i = 0; i < 187; i++) {
    let val = 0.0;
    if (i >= 30 && i <= 40) { // P Wave
      val = 0.12 * Math.sin(((i - 30) / 10) * Math.PI);
    } else if (i >= 50 && i <= 52) { // Q Wave
      val = -0.08 * ((i - 50) / 2);
    } else if (i > 52 && i <= 56) { // R Spike
      val = 1.0 * Math.sin(((i - 52) / 4) * Math.PI / 2);
    } else if (i > 56 && i <= 60) { // S Wave
      val = -0.25 * Math.sin(((i - 56) / 4) * Math.PI / 2);
    } else if (i >= 80 && i <= 100) { // T Wave
      val = 0.22 * Math.sin(((i - 80) / 20) * Math.PI);
    }
    // Add minor baseline noise
    val += (Math.random() - 0.5) * 0.015;
    points.push(parseFloat(val.toFixed(4)));
  }
  return points;
};

// Helper to generate a realistic Abnormal Arrhythmia Beat (187 points)
const generateAbnormalECG = () => {
  const points = [];
  for (let i = 0; i < 187; i++) {
    let val = 0.0;
    // Irregular baseline with no distinct P-wave and multiple chaotic spikes
    if (i >= 15 && i <= 35) { // Chaotic baseline vibration
      val = 0.15 * Math.sin((i / 3) * Math.PI);
    } else if (i >= 45 && i <= 58) { // First abnormal wide QRS
      val = 0.85 * Math.sin(((i - 45) / 13) * Math.PI);
    } else if (i >= 58 && i <= 65) { // Deep S-wave
      val = -0.45 * Math.sin(((i - 58) / 7) * Math.PI);
    } else if (i >= 110 && i <= 122) { // Premature Ventricular Contraction (PVC) spike
      val = 0.75 * Math.sin(((i - 110) / 12) * Math.PI);
    } else if (i >= 122 && i <= 135) { // Wide T-wave anomaly
      val = -0.35 * Math.sin(((i - 122) / 13) * Math.PI);
    }
    val += (Math.random() - 0.5) * 0.03; // Higher noise
    points.push(parseFloat(val.toFixed(4)));
  }
  return points;
};

const ECGAnalyzer = ({ backendUrl }) => {
  const [ecgSignal, setEcgSignal] = useState(generateNormalECG());
  const [selectedSample, setSelectedSample] = useState("normal");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inputText, setInputText] = useState("");

  const handleSampleChange = (type) => {
    setSelectedSample(type);
    setResult(null);
    setError(null);
    if (type === "normal") {
      setEcgSignal(generateNormalECG());
    } else {
      setEcgSignal(generateAbnormalECG());
    }
  };

  const handleCustomSubmit = () => {
    try {
      const parsed = inputText
        .split(",")
        .map((x) => parseFloat(x.trim()))
        .filter((x) => !isNaN(x));

      if (parsed.length === 0) {
        throw new Error("Could not parse any valid numbers.");
      }

      // Pad or truncate to 187 elements
      let padded = [...parsed];
      if (padded.length < 187) {
        padded = padded.concat(Array(187 - padded.length).fill(0.0));
      } else if (padded.length > 187) {
        padded = padded.slice(0, 187);
      }

      setEcgSignal(padded);
      setSelectedSample("custom");
      setResult(null);
      setError(null);
    } catch (e) {
      setError("Invalid custom format. Ensure values are comma-separated numbers.");
    }
  };

  const handlePredict = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await axios.post(`${backendUrl}/predict`, {
        features: ecgSignal
      });
      if (res.data && res.data.status === "success") {
        setResult(res.data.result);
      } else {
        setError("Invalid response payload from prediction server.");
      }
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to contact ECG analysis endpoint.");
    } finally {
      setLoading(false);
    }
  };

  // Convert array to Recharts data format
  const chartData = ecgSignal.map((val, idx) => ({ index: idx, voltage: val }));

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
        
        {/* Signal Config Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Sample Select Panel */}
          <div className="glass-panel">
            <h3 style={{ marginBottom: "16px" }}>Select Signal Sample</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button 
                className={`btn ${selectedSample === "normal" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => handleSampleChange("normal")}
              >
                Normal Sinus Beat
              </button>
              <button 
                className={`btn ${selectedSample === "abnormal" ? "btn-danger" : "btn-secondary"}`}
                onClick={() => handleSampleChange("abnormal")}
              >
                Arrhythmia Beat (Abnormal)
              </button>
            </div>
          </div>

          {/* Custom Input Panel */}
          <div className="glass-panel">
            <h3 style={{ marginBottom: "12px" }}>Custom Signal Data</h3>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "14px" }}>
              Paste 187 comma-separated numbers representing an ECG wave.
            </p>
            <div className="form-group">
              <textarea 
                className="form-input"
                rows="5"
                placeholder="e.g. 0.05, 0.12, 0.0, -0.05, 0.95..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                style={{ resize: "none", fontFamily: "monospace", fontSize: "12px" }}
              />
            </div>
            <button 
              className="btn btn-secondary" 
              onClick={handleCustomSubmit} 
              style={{ width: "100%" }}
            >
              <FiUpload /> Load Custom Signal
            </button>
          </div>

          {/* Run Prediction Panel */}
          <div className="glass-panel">
            <button 
              className="btn btn-primary" 
              onClick={handlePredict} 
              disabled={loading}
              style={{ width: "100%", padding: "16px", fontSize: "16px" }}
            >
              <FiPlay /> {loading ? "Analyzing Beat..." : "Classify ECG Signal"}
            </button>
            {error && (
              <div style={{ marginTop: "12px", color: "var(--accent-rose)", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                <FiAlertTriangle /> {error}
              </div>
            )}
          </div>

        </div>

        {/* Chart and Result display panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Signal Visualization */}
          <div className="glass-panel" style={{ height: "340px" }}>
            <div className="glass-card-header">
              <h3>ECG Voltage Plot</h3>
              <span className="badge badge-info">{selectedSample.toUpperCase()} SIGNAL</span>
            </div>
            <div style={{ width: "100%", height: "220px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="index" stroke="var(--text-muted)" style={{ fontSize: "11px" }} />
                  <YAxis stroke="var(--text-muted)" style={{ fontSize: "11px" }} domain={[-0.6, 1.2]} />
                  <Tooltip 
                    contentStyle={{ 
                      background: "rgba(10, 11, 30, 0.95)", 
                      borderColor: "var(--border-glass)", 
                      borderRadius: "8px",
                      color: "#fff"
                    }} 
                  />
                  <Line type="monotone" dataKey="voltage" stroke="var(--primary)" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Analysis Result */}
          {result && (
            <div className="glass-panel" style={{ borderLeft: `6px solid ${result.label === "Normal" ? "var(--accent-emerald)" : "var(--accent-rose)"}` }}>
              <h3 style={{ display: "flex", alignItems: "center", gap: "10px", color: result.label === "Normal" ? "var(--accent-emerald)" : "var(--accent-rose)" }}>
                {result.label === "Normal" ? <FiCheck /> : <FiAlertTriangle />}
                ECG Signal Diagnosis: {result.label}
              </h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px", marginTop: "20px" }}>
                <div>
                  <span className="form-label">Classification Confidence</span>
                  <div style={{ fontSize: "28px", fontWeight: "700", fontFamily: "var(--font-title)" }}>
                    {(result.confidence * 100).toFixed(2)}%
                  </div>
                </div>
                <div>
                  <span className="form-label">Medical Assessment</span>
                  <p style={{ fontSize: "14px", color: "var(--text-primary)" }}>
                    {result.label === "Normal" 
                      ? "The waveform shows standard sinus parameters with healthy P-QRS-T complexes. Cardiac rhythm appears stable and there are no signs of myocardial injury or acute ischemia."
                      : "The classifier detected irregular or abnormal complexes. This signature is common in patients experiencing arrhythmia, blockages, or premature contractions. Further clinical validation is advised."}
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default ECGAnalyzer;
