import React, { useState } from "react";
import axios from "axios";
import { FiCamera, FiMic, FiActivity, FiAlertTriangle, FiCheckCircle, FiUploadCloud } from "react-icons/fi";

const DarkCircleSnoringLab = ({ backendUrl }) => {
  // Selfie States
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageResult, setImageResult] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(null);

  // Audio States
  const [audioFile, setAudioFile] = useState(null);
  const [audioResult, setAudioResult] = useState(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setImageResult(null);
      setImageError(null);
    }
  };

  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioFile(file);
      setAudioResult(null);
      setAudioError(null);
    }
  };

  const handleImageUpload = async (e) => {
    e.preventDefault();
    if (!imageFile) return;

    setImageLoading(true);
    setImageError(null);
    setImageResult(null);

    const formData = new FormData();
    formData.append("file", imageFile);

    try {
      const res = await axios.post(`${backendUrl}/ai/detect-dark-circles`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data && res.data.status === "success") {
        setImageResult(res.data);
      }
    } catch (err) {
      console.error(err);
      setImageError("Failed to analyze selfie. Check your internet connection.");
    } finally {
      setImageLoading(false);
    }
  };

  const handleAudioUpload = async (e) => {
    e.preventDefault();
    if (!audioFile) return;

    setAudioLoading(true);
    setAudioError(null);
    setAudioResult(null);

    const formData = new FormData();
    formData.append("file", audioFile);

    try {
      const res = await axios.post(`${backendUrl}/ai/detect-snoring`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data && res.data.status === "success") {
        setAudioResult(res.data);
      }
    } catch (err) {
      console.error(err);
      setAudioError("Failed to analyze audio file. Try again.");
    } finally {
      setAudioLoading(false);
    }
  };

  const getLevelColor = (level) => {
    if (level === "High") return "var(--accent-rose)";
    if (level === "Moderate") return "var(--accent-amber)";
    return "var(--accent-teal)";
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
      
      {/* Panel 1: Dark Circle Detection */}
      <div className="glass-panel" style={{ display: "flex", flexDirection: "column" }}>
        <div className="glass-card-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FiCamera style={{ color: "var(--primary)", fontSize: "20px" }} />
            <h3>AI Dark Circle & Fatigue Scanner</h3>
          </div>
          <span className="badge badge-info">Computer Vision</span>
        </div>

        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
          Upload a clear front-facing selfie. The AI model checks for facial fatigue indicators, vascular pooling (dark circles), and sub-orbital puffiness.
        </p>

        <form onSubmit={handleImageUpload} style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px" }}>
          <div 
            style={{ 
              border: "2px dashed var(--border-color)", 
              borderRadius: "12px", 
              padding: "20px", 
              textAlign: "center", 
              background: "#f8fafc",
              position: "relative",
              cursor: "pointer"
            }}
          >
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange}
              style={{ 
                position: "absolute", 
                top: 0, 
                left: 0, 
                width: "100%", 
                height: "100%", 
                opacity: 0, 
                cursor: "pointer" 
              }}
            />
            {imagePreview ? (
              <img 
                src={imagePreview} 
                alt="Selfie Preview" 
                style={{ width: "120px", height: "120px", borderRadius: "50%", objectFit: "cover", border: "3px solid var(--primary-light)" }} 
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", color: "var(--text-secondary)" }}>
                <FiUploadCloud style={{ fontSize: "36px", color: "var(--primary)" }} />
                <span style={{ fontSize: "13px", fontWeight: "600" }}>Drag or Click to upload Selfie</span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>PNG, JPG or JPEG format</span>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={!imageFile || imageLoading}
            style={{ width: "100%" }}
          >
            {imageLoading ? "Scanning Facial Biomarkers..." : "Scan Selfie for Fatigue"}
          </button>
        </form>

        {imageError && (
          <div style={{ color: "var(--accent-rose)", background: "rgba(244,63,94,0.05)", padding: "10px", borderRadius: "8px", fontSize: "12.5px" }}>
            ⚠️ {imageError}
          </div>
        )}

        {/* Selfie Results */}
        {imageResult && (
          <div style={{ background: "#f8fafc", border: "1px solid var(--border-color)", padding: "16px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-secondary)" }}>SLEEP DEPRIVATION RATIO</span>
              <span 
                className="badge" 
                style={{ 
                  background: getLevelColor(imageResult.sleep_deprivation_level) + "1a", 
                  color: getLevelColor(imageResult.sleep_deprivation_level),
                  fontWeight: "700"
                }}
              >
                {imageResult.sleep_deprivation_level} Indicators
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "600", marginBottom: "4px" }}>
                  <span>Dark Circles</span>
                  <span>{imageResult.dark_circle_score}%</span>
                </div>
                <div style={{ height: "6px", background: "#cbd5e1", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: `${imageResult.dark_circle_score}%`, height: "100%", background: getLevelColor(imageResult.sleep_deprivation_level) }} />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "600", marginBottom: "4px" }}>
                  <span>Eye Puffiness</span>
                  <span>{imageResult.eye_puffiness_score}%</span>
                </div>
                <div style={{ height: "6px", background: "#cbd5e1", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: `${imageResult.eye_puffiness_score}%`, height: "100%", background: getLevelColor(imageResult.sleep_deprivation_level) }} />
                </div>
              </div>
            </div>

            <div style={{ borderTop: "1px dashed var(--border-color)", paddingTop: "12px" }}>
              <span style={{ fontSize: "11.5px", fontWeight: "700", color: "var(--primary)", display: "block", marginBottom: "6px" }}>
                AI Visual Advice
              </span>
              <ul style={{ fontSize: "12px", color: "var(--text-secondary)", paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "4px" }}>
                {imageResult.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Panel 2: Snoring Audio Analysis */}
      <div className="glass-panel" style={{ display: "flex", flexDirection: "column" }}>
        <div className="glass-card-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FiMic style={{ color: "var(--accent-purple)", fontSize: "20px" }} />
            <h3>AI Respiration & Snoring Analyzer</h3>
          </div>
          <span className="badge badge-success">Acoustic Logic</span>
        </div>

        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
          Upload an audio clip of your sleep session. The acoustic parser scans decibel volumes, counts snore events, and screens for obstructive breathing pauses (apnea markers).
        </p>

        <form onSubmit={handleAudioUpload} style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px" }}>
          <div 
            style={{ 
              border: "2px dashed var(--border-color)", 
              borderRadius: "12px", 
              padding: "20px", 
              textAlign: "center", 
              background: "#f8fafc",
              position: "relative",
              cursor: "pointer"
            }}
          >
            <input 
              type="file" 
              accept="audio/*" 
              onChange={handleAudioChange}
              style={{ 
                position: "absolute", 
                top: 0, 
                left: 0, 
                width: "100%", 
                height: "100%", 
                opacity: 0, 
                cursor: "pointer" 
              }}
            />
            {audioFile ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "36px" }}>🎙️</span>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--accent-purple)" }}>{audioFile.name}</span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Ready to analyze ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", color: "var(--text-secondary)" }}>
                <FiUploadCloud style={{ fontSize: "36px", color: "var(--accent-purple)" }} />
                <span style={{ fontSize: "13px", fontWeight: "600" }}>Drag or Click to upload Sleep Audio</span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>MP3, WAV, M4A or WEBM format</span>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={!audioFile || audioLoading}
            style={{ width: "100%", background: "var(--accent-purple)" }}
          >
            {audioLoading ? "Processing Soundwaves..." : "Analyze Audio Soundscape"}
          </button>
        </form>

        {audioError && (
          <div style={{ color: "var(--accent-rose)", background: "rgba(244,63,94,0.05)", padding: "10px", borderRadius: "8px", fontSize: "12.5px" }}>
            ⚠️ {audioError}
          </div>
        )}

        {/* Audio Results */}
        {audioResult && (
          <div style={{ background: "#f8fafc", border: "1px solid var(--border-color)", padding: "16px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ background: "#ffffff", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", textAlign: "center" }}>
                <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "600", display: "block" }}>SNORE EVENTS COUNT</span>
                <span style={{ fontSize: "20px", fontWeight: "800", color: "var(--accent-purple)" }}>{audioResult.snoring_count} times</span>
              </div>

              <div style={{ background: "#ffffff", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", textAlign: "center" }}>
                <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "600", display: "block" }}>AVERAGE VOLUME</span>
                <span style={{ fontSize: "20px", fontWeight: "800", color: "var(--accent-amber)" }}>{audioResult.average_loudness}</span>
              </div>
            </div>

            <div style={{ borderTop: "1px dashed var(--border-color)", paddingTop: "12px", display: "flex", gap: "8px", alignItems: "flex-start" }}>
              {audioResult.snoring_count > 25 ? (
                <FiAlertTriangle style={{ color: "var(--accent-rose)", flexShrink: 0, marginTop: "2px" }} />
              ) : (
                <FiCheckCircle style={{ color: "var(--accent-teal)", flexShrink: 0, marginTop: "2px" }} />
              )}
              <div>
                <span style={{ fontSize: "11.5px", fontWeight: "700", color: "var(--text-primary)", display: "block" }}>Respiration Indicator</span>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4" }}>{audioResult.apnea_indicators}</span>
              </div>
            </div>

            <div style={{ borderTop: "1px dashed var(--border-color)", paddingTop: "12px" }}>
              <span style={{ fontSize: "11.5px", fontWeight: "700", color: "var(--accent-purple)", display: "block", marginBottom: "6px" }}>
                Acoustic Recommendations
              </span>
              <ul style={{ fontSize: "12px", color: "var(--text-secondary)", paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "4px" }}>
                {audioResult.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default DarkCircleSnoringLab;
