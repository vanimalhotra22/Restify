import React from "react";
import { 
  FiGrid, 
  FiBookOpen, 
  FiLayers, 
  FiSliders, 
  FiClock, 
  FiAward, 
  FiSmile, 
  FiSettings, 
  FiLogOut 
} from "react-icons/fi";

const Sidebar = ({ activeTab, setActiveTab, user, onLogout }) => {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <FiGrid /> },
    { id: "diary", label: "Sleep Diary", icon: <FiBookOpen /> },
    { id: "quiz", label: "Risk Screening", icon: <FiLayers /> },
    { id: "meditation", label: "Relaxation Center", icon: <FiSmile /> },
    { id: "challenge", label: "Sleep Challenge", icon: <FiAward /> },
    { id: "calculator", label: "Bedtime Clock", icon: <FiClock /> },
    { id: "simulator", label: "Risk Simulator", icon: <FiSliders /> },
    { id: "settings", label: "Settings", icon: <FiSettings /> },
  ];

  return (
    <aside className="sidebar">
      <div className="logo-container">
        <FiClock className="logo-icon" />
        <span className="logo-text">Sleeplens</span>
      </div>

      <nav style={{ flex: 1 }}>
        <ul className="nav-links">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                className={`nav-link ${activeTab === item.id ? "active" : ""}`}
                onClick={() => setActiveTab(item.id)}
                style={{
                  width: "100%",
                  border: "none",
                  background: "transparent",
                  textAlign: "left",
                  fontFamily: "inherit",
                  fontSize: "inherit",
                }}
              >
                <span style={{ display: "inline-flex", fontSize: "16px" }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {user && (
        <div 
          className="sidebar-footer" 
          style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            width: "100%"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              👤 {user.username}
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Patient #{user.id}
            </span>
          </div>
          <button 
            onClick={onLogout}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--accent-rose)",
              cursor: "pointer",
              fontSize: "18px",
              display: "flex",
              alignItems: "center"
            }}
            title="Log Out"
          >
            <FiLogOut />
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
