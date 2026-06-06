import React, { useEffect, useState, useRef } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import axios from "axios";
import { FiClock, FiStar, FiHeart, FiSmile, FiAlertCircle, FiTrendingUp } from "react-icons/fi";

const Dashboard = ({ backendUrl, user }) => {
  const [analytics, setAnalytics] = useState({
    avg_duration: 0,
    avg_quality: 0,
    avg_mood: 0,
    total_logs: 0,
    weekly_trends: []
  });
  const [challenge, setChallenge] = useState({ streak: 0, max_streak: 0, badges: [] });
  const [liveReminder, setLiveReminder] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const wsRef = useRef(null);

  const fetchDashboardData = async () => {
    try {
      const [analyticsRes, challengeRes] = await Promise.all([
        axios.get(`${backendUrl}/sleep/analytics?user_id=${user.id}`),
        axios.get(`${backendUrl}/sleep/challenge?user_id=${user.id}`)
      ]);
      
      if (analyticsRes.data && analyticsRes.data.status === "success") {
        setAnalytics(analyticsRes.data.analytics);
      }
      if (challengeRes.data && challengeRes.data.status === "success") {
        setChallenge(challengeRes.data.challenge);
      }
    } catch (e) {
      console.error("Dashboard pull error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Setup WebSocket Bedtime Reminders
    let wsUrl = "ws://localhost:8000/ws/reminders";
    if (backendUrl) {
      const parsed = new URL(backendUrl);
      const proto = parsed.protocol === "https:" ? "wss:" : "ws:";
      wsUrl = `${proto}//${parsed.host}/ws/reminders`;
    }

    const connectWS = () => {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setLiveReminder(data.msg);
      };

      ws.onclose = () => {
        setTimeout(connectWS, 5000); // Reconnect
      };
    };

    connectWS();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [backendUrl, user.id]);

  // Compute a dynamic Sleep Score (0-100) based on average sleep hours and quality
  const calculateSleepScore = () => {
    if (analytics.total_logs === 0) return 0;
    
    // Heuristic: ideal hours = 7.5 to 8.5. quality = 5
    const durationScore = Math.max(0, 100 - Math.abs(analytics.avg_duration - 8.0) * 35);
    const qualityScore = (analytics.avg_quality / 5.0) * 100;
    
    return Math.round((durationScore * 0.6) + (qualityScore * 0.4));
  };

  const getScoreRating = (score) => {
    if (score === 0) return { text: "No logs logged", class: "badge-info" };
    if (score >= 85) return { text: "Optimal Sleep Quality", class: "badge-success" };
    if (score >= 60) return { text: "Fair Sleep Habits", class: "badge-warning" };
    return { text: "High Sleep Debt Risk", class: "badge-danger" };
  };

  const sleepScore = calculateSleepScore();
  const rating = getScoreRating(sleepScore);

  // Generate personalized coaching items based on logs
  const getCoachingRecommendations = () => {
    const recs = [];
    if (analytics.avg_duration < 7.0 && analytics.total_logs > 0) {
      recs.push({
        title: "Extend Sleep Window",
        desc: "Your average sleep duration is below the clinical recommended 7-9 hours. Target going to bed 30 minutes earlier.",
        action: "Earliest cycle: 10:30 PM"
      });
    }
    if (analytics.avg_quality < 3.5 && analytics.total_logs > 0) {
      recs.push({
        title: "Optimize Room Climate",
        desc: "Your reported sleep quality is lower. Studies show lowering room temp to 18°C reduces micro-awakenings.",
        action: "Check Environment Analyzer"
      });
    }
    if (recs.length === 0) {
      recs.push({
        title: "Maintain Circadian Alignment",
        desc: "Excellent sleep patterns! Continue waking up and going to bed at consistent times to align melatonin release.",
        action: "Active Streak: " + challenge.streak + " Days"
      });
    }
    return recs;
  };

  const recommendations = getCoachingRecommendations();

  // Create chart data matching trends
  const trendData = (analytics.weekly_trends && analytics.weekly_trends.length > 0)
    ? analytics.weekly_trends.map((item, idx) => ({ name: `Log ${idx+1}`, hours: item.duration, quality: item.quality, mood: item.mood }))
    : [
        { name: "Mon", hours: 6.5, quality: 3, mood: 3 },
        { name: "Tue", hours: 7.2, quality: 4, mood: 4 },
        { name: "Wed", hours: 5.8, quality: 2, mood: 2 },
        { name: "Thu", hours: 8.0, quality: 5, mood: 5 },
        { name: "Fri", hours: 7.5, quality: 4, mood: 4 },
        { name: "Sat", hours: 8.5, quality: 5, mood: 5 },
        { name: "Sun", hours: 7.0, quality: 3, mood: 3 }
      ];

  return (
    <div>
      {/* Live Reminder Header Notification */}
      {liveReminder && (
        <div 
          className="glass-panel" 
          style={{ 
            padding: "12px 20px", 
            borderRadius: "12px", 
            marginBottom: "24px",
            background: "var(--primary-light)",
            border: "1px solid rgba(14, 165, 233, 0.2)",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}
        >
          <FiAlertCircle style={{ color: "var(--primary)", fontSize: "20px", flexShrink: 0 }} />
          <span style={{ fontSize: "13.5px", fontWeight: "600", color: "var(--text-primary)" }}>
            {liveReminder}
          </span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="metric-grid">
        {/* Sleep Score Gauge */}
        <div className="glass-panel" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600" }}>SLEEP SCORE</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", margin: "10px 0" }}>
              <h1 style={{ fontSize: "36px", color: "var(--primary)" }}>{sleepScore === 0 ? "--" : sleepScore}</h1>
              <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>/100</span>
            </div>
          </div>
          <span className={`badge ${rating.class}`} style={{ width: "fit-content" }}>{rating.text}</span>
        </div>

        {/* Sleep Duration */}
        <div className="glass-panel" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600" }}>AVG SLEEP HOURS</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", margin: "10px 0" }}>
              <h1 style={{ fontSize: "36px", color: "var(--accent-teal)" }}>
                {analytics.avg_duration === 0 ? "--" : analytics.avg_duration}
              </h1>
              <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>Hours</span>
            </div>
          </div>
          <span className="badge badge-info" style={{ width: "fit-content", display: "flex", alignItems: "center", gap: "4px" }}>
            <FiClock /> Target: 8.0h
          </span>
        </div>

        {/* Mood & Sleep Quality */}
        <div className="glass-panel" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600" }}>AVG MOOD LEVEL</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", margin: "10px 0" }}>
              <h1 style={{ fontSize: "36px", color: "var(--accent-purple)" }}>
                {analytics.avg_mood === 0 ? "--" : `${analytics.avg_mood}/5`}
              </h1>
              <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>Energy</span>
            </div>
          </div>
          <span className="badge badge-success" style={{ width: "fit-content", display: "flex", alignItems: "center", gap: "4px" }}>
            <FiSmile /> Stable Biomarkers
          </span>
        </div>

        {/* 30-Day Sleep Challenge Streaks */}
        <div className="glass-panel" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600" }}>CHALLENGE STREAK</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", margin: "10px 0" }}>
              <h1 style={{ fontSize: "36px", color: "var(--accent-amber)" }}>{challenge.streak}</h1>
              <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>Days</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            {challenge.badges && challenge.badges.map((b, idx) => (
              <span key={idx} style={{ fontSize: "14px" }} title={b}>
                🏆
              </span>
            ))}
            {(!challenge.badges || challenge.badges.length === 0) && <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>No badges unlocked</span>}
          </div>
        </div>
      </div>

      {/* Main Graphs & Recommendations Panel */}
      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: "24px" }}>
        
        {/* Trend Graph */}
        <div className="glass-panel" style={{ height: "420px" }}>
          <div className="glass-card-header">
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FiTrendingUp style={{ color: "var(--primary)" }} /> Sleep & Mood Correlation
            </h3>
            <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Weekly tracking log</span>
          </div>

          <div style={{ width: "100%", height: "300px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-teal)" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="var(--accent-teal)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-purple)" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="var(--accent-purple)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="var(--text-muted)" style={{ fontSize: "11px" }} />
                <YAxis stroke="var(--text-muted)" style={{ fontSize: "11px" }} />
                <Tooltip 
                  contentStyle={{ 
                    background: "#ffffff", 
                    borderColor: "var(--border-color)", 
                    borderRadius: "8px" 
                  }} 
                />
                <Area name="Sleep Duration (hrs)" type="monotone" dataKey="hours" stroke="var(--accent-teal)" fillOpacity={1} fill="url(#colorHours)" strokeWidth={2} />
                <Area name="Daytime Mood (1-5)" type="monotone" dataKey="mood" stroke="var(--accent-purple)" fillOpacity={1} fill="url(#colorMood)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Personalized recommendations */}
        <div className="glass-panel" style={{ height: "420px", display: "flex", flexDirection: "column" }}>
          <div className="glass-card-header">
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FiStar style={{ color: "var(--accent-amber)" }} /> Personal Sleep Coaching
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1, overflowY: "auto" }}>
            {recommendations.map((item, idx) => (
              <div 
                key={idx} 
                style={{ 
                  padding: "16px", 
                  background: "var(--bg-main)", 
                  borderLeft: "4px solid var(--primary)",
                  borderRadius: "0 8px 8px 0"
                }}
              >
                <h4 style={{ fontSize: "14px", fontWeight: "700" }}>{item.title}</h4>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>{item.desc}</p>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--primary)", marginTop: "8px" }}>
                  💡 Suggested: {item.action}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
