import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiDatabase, FiRefreshCw, FiGrid, FiBarChart2 } from "react-icons/fi";

const DatabaseHub = ({ backendUrl }) => {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({ avg_hr: 0, avg_spo2: 0, total_records: 0 });
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dataRes, summaryRes] = await Promise.all([
        axios.get(`${backendUrl}/db/data?limit=50`),
        axios.get(`${backendUrl}/db/summary`)
      ]);
      
      if (dataRes.data && dataRes.data.status === "success") {
        setData(dataRes.data.data);
      }
      if (summaryRes.data && summaryRes.data.status === "success") {
        setSummary(summaryRes.data.summary);
      }
    } catch (e) {
      setError("Failed to fetch database information. Verify API connection health.");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await axios.post(`${backendUrl}/db/import`);
      if (res.data && res.data.status === "success") {
        setSuccessMsg(res.data.message);
        fetchData(); // Refresh logs
      } else {
        setError("Invalid response format from database import.");
      }
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to trigger CSV import to database. Ensure files exist in backend/data/.");
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [backendUrl]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* Import & Actions Bar */}
      <div className="glass-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h3>Historical SQLite Database Hub</h3>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Inspect historical ECG waveforms, SpO₂ values, and EEG logs stored in local SQLite database (`sleeplens.db`).
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button className="btn btn-secondary" onClick={fetchData} disabled={loading || importing}>
            <FiRefreshCw className={loading ? "spin-icon" : ""} /> Refresh Data
          </button>
          <button className="btn btn-primary" onClick={handleImport} disabled={loading || importing}>
            <FiDatabase /> {importing ? "Importing CSVs..." : "Load PTBDB CSV to DB"}
          </button>
        </div>
      </div>

      {error && (
        <div className="glass-panel" style={{ color: "var(--accent-rose)", borderLeft: "4px solid var(--accent-rose)" }}>
          {error}
        </div>
      )}

      {successMsg && (
        <div className="glass-panel" style={{ color: "var(--accent-emerald)", borderLeft: "4px solid var(--accent-emerald)" }}>
          {successMsg}
        </div>
      )}

      {/* Summary Vitals stats */}
      <div className="metric-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="glass-panel" style={{ display: "flex", alignItems: "center", gap: "16px", padding: "20px" }}>
          <FiGrid style={{ fontSize: "36px", color: "var(--primary)" }} />
          <div>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "500" }}>TOTAL RECORDS</span>
            <h2 style={{ fontSize: "28px", fontWeight: "700", fontFamily: "var(--font-title)" }}>{summary.total_records}</h2>
          </div>
        </div>

        <div className="glass-panel" style={{ display: "flex", alignItems: "center", gap: "16px", padding: "20px" }}>
          <FiBarChart2 style={{ fontSize: "36px", color: "var(--accent-rose)" }} />
          <div>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "500" }}>AVG ECG AMPLITUDE</span>
            <h2 style={{ fontSize: "28px", fontWeight: "700", fontFamily: "var(--font-title)" }}>{summary.avg_hr}</h2>
          </div>
        </div>

        <div className="glass-panel" style={{ display: "flex", alignItems: "center", gap: "16px", padding: "20px" }}>
          <FiDatabase style={{ fontSize: "36px", color: "var(--accent-cyan)" }} />
          <div>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "500" }}>AVG SPO2 VALUE</span>
            <h2 style={{ fontSize: "28px", fontWeight: "700", fontFamily: "var(--font-title)" }}>{summary.avg_spo2}</h2>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="glass-panel">
        <div className="glass-card-header">
          <h3>SQLite Records (sensor_data)</h3>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Showing last 50 entries</span>
        </div>

        {loading && data.length === 0 ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px", color: "var(--text-secondary)" }}>
            Loading database table...
          </div>
        ) : data.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "200px", color: "var(--text-secondary)", gap: "10px" }}>
            <FiDatabase style={{ fontSize: "32px", color: "var(--text-muted)" }} />
            <p>Database is empty. Click "Load PTBDB CSV to DB" to import ECG datasets.</p>
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Record ID</th>
                  <th>Timestamp</th>
                  <th>ECG Value (Ch 0)</th>
                  <th>SpO2 Value (Ch 1)</th>
                  <th>EEG Value (Ch 2)</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: "600", color: "var(--primary)" }}>#{row.id}</td>
                    <td>{row.timestamp ? new Date(row.timestamp).toLocaleString() : "--"}</td>
                    <td>{row.ecg !== null ? row.ecg.toFixed(4) : "--"}</td>
                    <td>{row.spo2 !== null ? row.spo2.toFixed(4) : "--"}</td>
                    <td>{row.eeg !== null ? row.eeg.toFixed(4) : "--"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default DatabaseHub;
