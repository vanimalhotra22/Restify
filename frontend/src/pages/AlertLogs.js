import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiBell, FiTrash2, FiSearch, FiRefreshCw, FiAlertTriangle } from "react-icons/fi";

const AlertLogs = ({ backendUrl, clearAlertCount }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${backendUrl}/alerts`);
      if (res.data && res.data.status === "success") {
        setAlerts(res.data.alerts);
        clearAlertCount(); // Reset navbar notifications count
      }
    } catch (e) {
      setError("Failed to retrieve anomaly alert history from API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [backendUrl]);

  const filteredAlerts = alerts.filter(
    (alert) =>
      alert.condition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* Alert Header Bar */}
      <div className="glass-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h3>Anomaly Notification Center</h3>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Central log tracker of all automated health events, oxygen desaturations, and heart rate threshold warnings.
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button className="btn btn-secondary" onClick={fetchAlerts} disabled={loading}>
            <FiRefreshCw className={loading ? "spin-icon" : ""} /> Refresh Logs
          </button>
        </div>
      </div>

      {error && (
        <div className="glass-panel" style={{ color: "var(--accent-rose)", borderLeft: "4px solid var(--accent-rose)" }}>
          {error}
        </div>
      )}

      {/* Filter and Content panel */}
      <div className="glass-panel">
        <div 
          style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            marginBottom: "20px",
            gap: "16px",
            flexWrap: "wrap"
          }}
        >
          {/* Search bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "200px" }}>
            <FiSearch style={{ color: "var(--text-muted)" }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by diagnosis or condition (e.g. Hypoxemia)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            Showing {filteredAlerts.length} of {alerts.length} logged events
          </span>
        </div>

        {/* Logs list */}
        {filteredAlerts.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "200px", color: "var(--text-secondary)", gap: "12px" }}>
            <FiBell style={{ fontSize: "36px", color: "var(--text-muted)" }} />
            <p>No logged events match the query.</p>
          </div>
        ) : (
          <div className="alerts-list">
            {filteredAlerts.map((alert, idx) => (
              <div 
                key={idx} 
                className={`alert-item ${alert.condition}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "rgba(255, 255, 255, 0.02)",
                  borderLeftWidth: "4px",
                  borderRadius: "0 10px 10px 0",
                  padding: "16px 20px"
                }}
              >
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <FiAlertTriangle 
                    style={{ 
                      color: alert.condition === "Hypoxemia" || alert.condition === "Tachycardia" ? "var(--accent-rose)" : "var(--accent-amber)",
                      fontSize: "20px" 
                    }} 
                  />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <h4 style={{ fontSize: "15px", fontWeight: "600" }}>{alert.condition} Alert</h4>
                      <span className={`badge ${alert.condition === "Hypoxemia" || alert.condition === "Tachycardia" ? "badge-danger" : "badge-warning"}`}>
                        {alert.condition === "Hypoxemia" || alert.condition === "Tachycardia" ? "Critical" : "Warning"}
                      </span>
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>{alert.message}</p>
                  </div>
                </div>

                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                  {new Date(alert.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default AlertLogs;
