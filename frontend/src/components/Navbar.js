import React, { useEffect, useState } from "react";
import { FiCheckCircle, FiActivity, FiClock, FiHeart } from "react-icons/fi";
import axios from "axios";

const Navbar = ({ activeTab, backendUrl, reminders }) => {
  const [status, setStatus] = useState("checking");
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await axios.get(`${backendUrl}/health`);
        if (res.data && res.data.status === "online") {
          setStatus("online");
        } else {
          setStatus("warning");
        }
      } catch (e) {
        setStatus("offline");
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, [backendUrl]);

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  const getTitle = () => {
    switch (activeTab) {
      case "dashboard": return "Sleep Analytics Dashboard";
      case "diary": return "Daily Sleep Diary & Environment Log";
      case "quiz": return "Sleep Disorder Risk Assessment";
      case "meditation": return "Meditation & Relaxation Center";
      case "challenge": return "30-Day Sleep Challenge";
      case "calculator": return "Smart Bedtime Calculator";
      case "admin": return "Administrative System Panel";
      case "settings": return "System Configuration";
      default: return "Sleeplens Prevention Center";
    }
  };

  return (
    <header className="header-bar">
      <div>
        <h2 style={{ fontSize: "22px", fontWeight: "800", color: "var(--primary)" }}>{getTitle()}</h2>
        <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
          Preventing sleep disorders through scientific hygiene and healthy cycles.
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        {/* Clock */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "13px" }}>
          <FiClock />
          <span style={{ fontWeight: "500" }}>{currentTime}</span>
        </div>

        {/* Health Status */}
        <div 
          style={{ 
            padding: "6px 14px", 
            borderRadius: "20px", 
            display: "flex", 
            alignItems: "center", 
            gap: "8px",
            fontSize: "12px",
            background: "var(--primary-light)",
            border: "1px solid rgba(14, 165, 233, 0.15)",
            color: "var(--primary)",
            fontWeight: "600"
          }}
        >
          <FiActivity />
          <span>Status:</span>
          {status === "checking" && <span style={{ color: "var(--text-muted)" }}>Checking</span>}
          {status === "online" && <span style={{ color: "var(--accent-teal)" }}>Operational</span>}
          {status === "warning" && <span style={{ color: "var(--accent-amber)" }}>Maintenance</span>}
          {status === "offline" && <span style={{ color: "var(--accent-rose)" }}>Connection Error</span>}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
