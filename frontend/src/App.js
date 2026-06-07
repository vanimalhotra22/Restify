import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SleepDiary from "./pages/SleepDiary";
import AssessmentQuiz from "./pages/AssessmentQuiz";
import RelaxationCenter from "./pages/RelaxationCenter";
import ChallengeTracker from "./pages/ChallengeTracker";
import BedtimeCalculator from "./pages/BedtimeCalculator";
import RiskSimulator from "./pages/RiskSimulator";
import Settings from "./pages/Settings";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [backendUrl, setBackendUrl] = useState("http://localhost:8000");
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user session exists in local storage
    const storedUser = localStorage.getItem("restify_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem("restify_user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("restify_user");
    setActiveTab("dashboard");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard backendUrl={backendUrl} user={user} />;
      case "diary":
        return <SleepDiary backendUrl={backendUrl} user={user} />;
      case "quiz":
        return <AssessmentQuiz backendUrl={backendUrl} user={user} />;
      case "meditation":
        return <RelaxationCenter />;
      case "challenge":
        return <ChallengeTracker backendUrl={backendUrl} user={user} />;
      case "calculator":
        return <BedtimeCalculator backendUrl={backendUrl} />;
      case "simulator":
        return <RiskSimulator backendUrl={backendUrl} user={user} />;
      case "settings":
        return <Settings backendUrl={backendUrl} user={user} />;
      default:
        return <Dashboard backendUrl={backendUrl} user={user} />;
    }
  };

  if (!user) {
    return <Login backendUrl={backendUrl} onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={handleLogout} />
      
      <main className="main-content">
        <Navbar activeTab={activeTab} backendUrl={backendUrl} />
        <div style={{ marginTop: "20px" }}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
