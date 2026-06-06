import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { FiSend, FiCpu, FiMessageSquare } from "react-icons/fi";

const Chatbot = ({ backendUrl }) => {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! I am Sleeplens Coach, your personal sleep hygiene assistant. Ask me anything about caffeine, sleep hygiene, screen time, or managing sleep disorders!",
      fallback: false
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef(null);

  const suggestions = [
    "I can't sleep at night",
    "Should I drink coffee after 4 PM?",
    "Why does blue light screen ruin sleep?",
    "What temperature is best for sleeping?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    if (!textToSend) {
      setInputText("");
    }

    // Append User Message
    setMessages((prev) => [...prev, { sender: "user", text }]);
    setLoading(true);

    try {
      const res = await axios.post(`${backendUrl}/chatbot`, {
        message: text
      });

      if (res.data && res.data.reply) {
        setMessages((prev) => [
          ...prev, 
          { 
            sender: "bot", 
            text: res.data.reply, 
            fallback: res.data.fallback,
            matched: res.data.question_matched 
          }
        ]);
      } else if (res.data && res.data.error) {
        setMessages((prev) => [...prev, { sender: "bot", text: `Error: ${res.data.error}`, isError: true }]);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev, 
        { 
          sender: "bot", 
          text: "Failed to connect to the Sleeplens API server. Please check your connection and configuration.", 
          isError: true 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel chat-window">
      <div className="glass-card-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FiMessageSquare style={{ color: "var(--primary)", fontSize: "20px" }} />
          <h3>Sleeplens AI Sleep Coach</h3>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <span className="badge badge-info" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <FiCpu /> Hybrid Coach Active
          </span>
        </div>
      </div>

      {/* Message List */}
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`chat-bubble ${msg.sender} ${msg.fallback ? "fallback" : ""}`}
            style={msg.isError ? { borderLeft: "4px solid var(--accent-rose)", background: "rgba(244,63,94,0.05)" } : {}}
          >
            <div>{msg.text}</div>
            
            {/* Model Badge */}
            {msg.sender === "bot" && !msg.isError && (
              <div 
                style={{ 
                  marginTop: "6px", 
                  fontSize: "10px", 
                  color: "var(--text-muted)", 
                  display: "flex", 
                  justifyContent: "space-between" 
                }}
              >
                <span>{msg.fallback ? "✦ Gemini AI Engine" : "🗂️ Sleep Guidelines DB"}</span>
                {msg.matched && <span style={{ fontStyle: "italic" }}>Keyword: "{msg.matched}"</span>}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="chat-bubble bot" style={{ display: "flex", alignItems: "center", gap: "8px", width: "120px", background: "#f1f5f9" }}>
            <div className="pulse-dot" style={{ margin: 0, backgroundColor: "var(--primary)" }} />
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Analyzing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="suggestion-chips" style={{ marginTop: "10px" }}>
        {suggestions.map((sug, idx) => (
          <button 
            key={idx} 
            className="suggestion-chip"
            onClick={() => handleSendMessage(sug)}
            disabled={loading}
          >
            {sug}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="chat-input-area">
        <input 
          type="text" 
          className="form-input" 
          placeholder="Ask your sleep coach (e.g. How to prevent sleep apnea?)..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          disabled={loading}
          style={{ flex: 1 }}
        />
        <button 
          className="btn btn-primary" 
          onClick={() => handleSendMessage()}
          disabled={loading}
        >
          <FiSend />
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
