import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiCalendar, FiClock, FiCheck, FiMessageSquare, FiSend, FiUserCheck } from "react-icons/fi";

const DoctorConsultation = ({ backendUrl, user }) => {
  const [specialists, setSpecialists] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [bookingMessage, setBookingMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Chat window simulator states
  const [activeChatDoc, setActiveChatDoc] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await axios.get(`${backendUrl}/doctors/specialists`);
        if (res.data && res.data.status === "success") {
          setSpecialists(res.data.specialists);
        }
      } catch (err) {
        console.error("Failed to fetch specialists", err);
      }
    };
    fetchDocs();
  }, [backendUrl]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedDoc || !selectedSlot) return;

    setLoading(true);
    setBookingMessage(null);

    try {
      const res = await axios.post(`${backendUrl}/doctors/book`, {
        user_id: user.id,
        doctor_id: selectedDoc.id,
        slot: selectedSlot
      });
      if (res.data && res.data.status === "success") {
        setBookingMessage(res.data.message);
        // Add doc to chat selection immediately
        setActiveChatDoc(selectedDoc);
        setMessages([
          { sender: "doc", text: `Hello ${user.username}! I am looking forward to our appointment on ${selectedSlot}. Do you have any specific sleep diary logs or issues you would like to share first?` }
        ]);
        setSelectedDoc(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = { sender: "user", text: inputText };
    const docReplyText = getDoctorSimulatedReply(inputText, activeChatDoc.specialty);
    
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");

    setTimeout(() => {
      setMessages((prev) => [...prev, { sender: "doc", text: docReplyText }]);
    }, 1000);
  };

  const getDoctorSimulatedReply = (text, specialty) => {
    const q = text.toLowerCase();
    if (q.includes("snore") || q.includes("apnea")) {
      return "Based on your snoring profile, airway obstruction during deep sleep is common. I recommend elevated head pillows and sleeping strictly on your side while we prepare for a sleep study.";
    }
    if (q.includes("anxiety") || q.includes("worry") || q.includes("stress")) {
      return "Sleep anxiety creates a feedback loop: worry delays melatonin release, leading to insomnia. I advise setting a digital curfew and utilizing the 4-7-8 breathing ring to reduce cardiac heart rate before bed.";
    }
    if (q.includes("caffeine") || q.includes("coffee")) {
      return "Caffeine blockades adenosine receptors for up to 8-10 hours. Be sure to check your sleep challenge page's Caffeine Tracker to check active milligrams at bedtime.";
    }
    return `As a specialist in ${specialty}, I recommend logging your daily Sleep Diary entries and Room environment diagnostics so I can evaluate your trends in detail during our session.`;
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "24px" }}>
      
      {/* Left Column: Specialists & Booking */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Specialists List */}
        <div className="glass-panel">
          <div className="glass-card-header">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FiUserCheck style={{ color: "var(--primary)", fontSize: "20px" }} />
              <h3>Book Sleep Medicine Specialist</h3>
            </div>
            <span className="badge badge-success">Telemedicine</span>
          </div>

          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
            Schedule virtual consultations with certified sleep neurologists, behavioral therapists, and pulmonologists to evaluate risk assessments.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px" }}>
            {specialists.map((doc) => (
              <div 
                key={doc.id} 
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px",
                  background: "#f8fafc",
                  border: "1px solid var(--border-color)",
                  borderRadius: "12px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "28px" }}>{doc.avatar}</span>
                  <div>
                    <h4 style={{ fontSize: "14px", color: "var(--text-primary)" }}>{doc.name}</h4>
                    <span style={{ fontSize: "11px", color: "var(--primary)", fontWeight: "600", display: "block" }}>{doc.specialty}</span>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                      <FiClock /> Next slot: {doc.availability}
                    </span>
                  </div>
                </div>

                <button 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setSelectedDoc(doc);
                    setSelectedSlot(doc.availability);
                    setBookingMessage(null);
                  }}
                  style={{ fontSize: "12px", padding: "6px 12px" }}
                >
                  Book Slot
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Booking Dialog Modal Form */}
        {selectedDoc && (
          <div className="glass-panel" style={{ borderLeft: "4px solid var(--primary)" }}>
            <h4 style={{ marginBottom: "12px", fontSize: "14px" }}>
              Confirm Booking with {selectedDoc.name}
            </h4>
            <form onSubmit={handleBook}>
              <div className="form-group">
                <label className="form-label">Selected Availability Slot</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  required 
                />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                  {loading ? "Confirming..." : "Confirm Booking"}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setSelectedDoc(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Success confirmation */}
        {bookingMessage && (
          <div className="glass-panel" style={{ borderLeft: "4px solid var(--accent-teal)", background: "rgba(13,148,136,0.02)" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <FiCheck style={{ color: "var(--accent-teal)", fontSize: "18px", marginTop: "2px" }} />
              <div>
                <h4 style={{ color: "var(--accent-teal)", fontSize: "13.5px", marginBottom: "4px" }}>Appointment Confirmed!</h4>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{bookingMessage}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Simulated Live Specialist Chat Consultation */}
      <div className="glass-panel" style={{ display: "flex", flexDirection: "column", height: "480px" }}>
        <div className="glass-card-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FiMessageSquare style={{ color: "var(--accent-purple)", fontSize: "18px" }} />
            <h3>Doctor Chat Consultation</h3>
          </div>
          {activeChatDoc && <span className="badge badge-success">Online</span>}
        </div>

        {activeChatDoc ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px", marginBottom: "10px" }}>
              <span style={{ fontSize: "24px" }}>{activeChatDoc.avatar}</span>
              <div>
                <span style={{ fontSize: "12px", fontWeight: "700", display: "block" }}>{activeChatDoc.name}</span>
                <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{activeChatDoc.specialty}</span>
              </div>
            </div>

            {/* Chat Messages */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", paddingBottom: "10px" }}>
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`chat-bubble ${msg.sender === "user" ? "user" : "bot"}`}
                  style={{
                    alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                    background: msg.sender === "user" ? "var(--primary-light)" : "#f1f5f9",
                    color: msg.sender === "user" ? "var(--primary)" : "var(--text-primary)",
                    border: msg.sender === "user" ? "none" : "1px solid var(--border-color)",
                    borderRadius: "12px",
                    padding: "8px 12px",
                    maxWidth: "85%",
                    fontSize: "12.5px",
                    lineHeight: "1.4"
                  }}
                >
                  {msg.text}
                </div>
              ))}
            </div>

            {/* Chat Send Form */}
            <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "10px", borderTop: "1px solid var(--border-color)", paddingTop: "10px" }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder={`Ask ${activeChatDoc.name}...`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                style={{ flex: 1, padding: "8px 12px" }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: "8px 12px" }}>
                <FiSend />
              </button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", color: "var(--text-muted)", textAlign: "center", padding: "20px" }}>
            <span style={{ fontSize: "48px", marginBottom: "10px" }}>💬</span>
            <h4 style={{ fontSize: "14px", color: "var(--text-secondary)" }}>No Active Consultation Chat</h4>
            <p style={{ fontSize: "12px", marginTop: "4px" }}>
              Book an appointment with a specialist in the left panel to begin your live chat session.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default DoctorConsultation;
