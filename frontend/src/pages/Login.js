import React, { useState } from "react";
import axios from "axios";
import { FiUser, FiLock, FiCalendar, FiClock } from "react-icons/fi";

const Login = ({ backendUrl, onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const endpoint = isRegister ? "/auth/register" : "/auth/login";
    try {
      const res = await axios.post(`${backendUrl}${endpoint}`, {
        username,
        password,
        age: parseInt(age)
      });

      if (res.data && res.data.status === "success") {
        if (isRegister) {
          setSuccess("Registration successful! You can now log in.");
          setIsRegister(false);
          setPassword("");
        } else {
          onLoginSuccess(res.data.user);
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Authentication failed. Check if API is online.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0f7ff, #e0f2fe)",
        width: "100vw",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 999
      }}
    >
      <div 
        className="glass-panel" 
        style={{ 
          width: "100%", 
          maxWidth: "400px", 
          padding: "30px",
          background: "#ffffff",
          boxShadow: "0 20px 40px rgba(14, 165, 233, 0.08)"
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "25px" }}>
          <div 
            style={{ 
              width: "60px", 
              height: "60px", 
              borderRadius: "50%", 
              background: "var(--primary-light)", 
              color: "var(--primary)", 
              display: "inline-flex", 
              alignItems: "center", 
              justifyContent: "center",
              fontSize: "28px",
              marginBottom: "12px"
            }}
          >
            <FiClock />
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: "800", color: "var(--primary)" }}>Restify</h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Sleep Disorder Prevention System
          </p>
        </div>

        {error && (
          <div 
            style={{ 
              color: "var(--accent-rose)", 
              background: "rgba(244,63,94,0.05)", 
              border: "1px solid rgba(244,63,94,0.15)",
              padding: "10px 14px", 
              borderRadius: "8px", 
              fontSize: "12.5px",
              marginBottom: "16px"
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div 
            style={{ 
              color: "var(--accent-teal)", 
              background: "rgba(13,148,136,0.05)", 
              border: "1px solid rgba(13,148,136,0.15)",
              padding: "10px 14px", 
              borderRadius: "8px", 
              fontSize: "12.5px",
              marginBottom: "16px"
            }}
          >
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <FiUser /> Username
            </label>
            <input 
              type="text" 
              className="form-input" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="Enter username"
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <FiLock /> Password
            </label>
            <input 
              type="password" 
              className="form-input" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Enter password"
              required 
            />
          </div>

          {isRegister && (
            <div className="form-group">
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <FiCalendar /> Age
              </label>
              <input 
                type="number" 
                className="form-input" 
                value={age} 
                onChange={(e) => setAge(e.target.value)} 
                min="5"
                max="120"
                required 
              />
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: "100%", padding: "12px", marginTop: "10px" }}
            disabled={loading}
          >
            {loading ? "Processing..." : isRegister ? "Create Free Account" : "Access Diagnostics"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "13px" }}>
          <button 
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
              setSuccess(null);
            }}
            style={{ 
              background: "transparent", 
              border: "none", 
              color: "var(--primary)", 
              fontWeight: "600",
              cursor: "pointer" 
            }}
          >
            {isRegister ? "Already have an account? Sign In" : "New to Restify? Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
