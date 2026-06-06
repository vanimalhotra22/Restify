import React, { useState, useEffect, useRef } from "react";
import { FiSmile, FiVolume2, FiVolumeX, FiPlay, FiSquare } from "react-icons/fi";

const RelaxationCenter = () => {
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathState, setBreathState] = useState("idle"); // "idle", "inhale", "hold", "exhale"
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [activeSound, setActiveSound] = useState(null); // null, "white", "ocean", "rain"
  const [volume, setVolume] = useState(0.5);

  const audioCtxRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const gainNodeRef = useRef(null);
  const filterNodeRef = useRef(null);
  const lfoNodeRef = useRef(null);

  // 4-7-8 Breathing Timer
  useEffect(() => {
    let timer = null;
    if (breathingActive) {
      // Initialize breathing cycle
      setBreathState("inhale");
      setSecondsLeft(4);

      timer = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            // State transitions
            setBreathState((currState) => {
              if (currState === "inhale") {
                setSecondsLeft(7);
                return "hold";
              } else if (currState === "hold") {
                setSecondsLeft(8);
                return "exhale";
              } else {
                setSecondsLeft(4);
                return "inhale";
              }
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setBreathState("idle");
      setSecondsLeft(0);
    }

    return () => clearInterval(timer);
  }, [breathingActive]);

  // Stop any playing audio
  const stopAudio = () => {
    try {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
      }
      if (lfoNodeRef.current) {
        lfoNodeRef.current.stop();
        lfoNodeRef.current.disconnect();
        lfoNodeRef.current = null;
      }
      setActiveSound(null);
    } catch (e) {
      console.error("Audio stop error:", e);
    }
  };

  // Web Audio API Synthesizer (Generates self-contained ambient sounds!)
  const playSound = (type) => {
    stopAudio();

    // Create audio context
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;

    // 1. Generate White Noise Buffer
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // 2. Create Gain Node for volume
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNodeRef.current = gainNode;

    // 3. Create Filters for different sound characters
    const filter = ctx.createBiquadFilter();
    filterNodeRef.current = filter;

    if (type === "white") {
      // Plain white noise
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1000, ctx.currentTime);
      
      whiteNoise.connect(filter);
      filter.connect(gainNode);
    } 
    else if (type === "ocean") {
      // Ocean waves (low-pass filter swept by a slow LFO to simulate waves swelling)
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(350, ctx.currentTime);

      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // Wave swell frequency (8 seconds cycle)
      
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(250, ctx.currentTime); // Swell amplitude

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      
      lfo.start();
      lfoNodeRef.current = lfo;

      whiteNoise.connect(filter);
      filter.connect(gainNode);
    } 
    else if (type === "rain") {
      // Rain (band-pass filter to sound like rustling rain drops)
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(600, ctx.currentTime);
      filter.Q.setValueAtTime(1.0, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(gainNode);
    }

    gainNode.connect(ctx.destination);
    whiteNoise.start();
    
    sourceNodeRef.current = whiteNoise;
    setActiveSound(type);
  };

  // Handle volume change
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume, audioCtxRef.current ? audioCtxRef.current.currentTime : 0);
    }
  }, [volume]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const getBreathInstructions = () => {
    switch (breathState) {
      case "inhale": return "Breathe In (4s)";
      case "hold": return "Hold Breath (7s)";
      case "exhale": return "Breathe Out (8s)";
      default: return "Ready to Start";
    }
  };

  const getBubbleScaleClass = () => {
    if (breathState === "inhale") return 1.5;
    if (breathState === "hold") return 1.5;
    if (breathState === "exhale") return 1.0;
    return 1.0;
  };

  const getBreathColor = () => {
    if (breathState === "inhale") return "var(--primary)";
    if (breathState === "hold") return "var(--accent-purple)";
    if (breathState === "exhale") return "var(--accent-teal)";
    return "var(--text-muted)";
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px" }}>
      
      {/* 4-7-8 Breathing Guide */}
      <div className="glass-panel" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div className="glass-card-header" style={{ width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FiSmile style={{ color: "var(--primary)" }} />
            <h3>Guided 4-7-8 Breathing Coach</h3>
          </div>
        </div>

        <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", textAlign: "center", marginBottom: "40px", maxWidth: "400px" }}>
          The 4-7-8 breathing method is a natural tranquilizer for the nervous system, reducing pre-sleep heart rates and blocking insomnia.
        </p>

        {/* Breathing Circle Container */}
        <div style={{ height: "260px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div 
            style={{
              width: "140px",
              height: "140px",
              borderRadius: "50%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              color: getBreathColor(),
              border: `3px solid ${getBreathColor()}`,
              boxShadow: `0 0 30px ${getBreathColor()}20`,
              transform: `scale(${getBubbleScaleClass()})`,
              transition: breathState === "hold" ? "none" : "transform 4s ease-in-out, border-color 0.5s",
              background: "#ffffff",
              cursor: "pointer"
            }}
          >
            <div style={{ fontSize: "14px", textAlign: "center" }}>{getBreathInstructions()}</div>
            {secondsLeft > 0 && <div style={{ fontSize: "20px", marginTop: "4px" }}>{secondsLeft}s</div>}
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
          {!breathingActive ? (
            <button className="btn btn-primary" onClick={() => setBreathingActive(true)}>
              <FiPlay /> Start Breathing Cycle
            </button>
          ) : (
            <button className="btn btn-danger" onClick={() => setBreathingActive(false)}>
              <FiSquare /> Stop Guided Cycle
            </button>
          )}
        </div>
      </div>

      {/* White Noise Audio Machine */}
      <div className="glass-panel" style={{ display: "flex", flexDirection: "column" }}>
        <div className="glass-card-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FiVolume2 style={{ color: "var(--accent-teal)" }} />
            <h3>Sleep Noise Machine</h3>
          </div>
        </div>

        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
          Block out sudden environmental noises and align brainwaves using synthesized ambient signals.
        </p>

        {/* Noise Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
          {/* White Noise */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px", background: activeSound === "white" ? "var(--primary-light)" : "var(--bg-main)", borderRadius: "10px", border: "1px solid", borderColor: activeSound === "white" ? "var(--primary)" : "var(--border-color)" }}>
            <div>
              <h4 style={{ fontSize: "13.5px" }}>Steady White Noise</h4>
              <p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Pure frequencies to mask light disturbances</p>
            </div>
            {activeSound === "white" ? (
              <button className="btn btn-danger" onClick={stopAudio} style={{ padding: "8px" }}><FiSquare /></button>
            ) : (
              <button className="btn btn-primary" onClick={() => playSound("white")} style={{ padding: "8px" }}><FiPlay /></button>
            )}
          </div>

          {/* Ocean waves */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px", background: activeSound === "ocean" ? "var(--primary-light)" : "var(--bg-main)", borderRadius: "10px", border: "1px solid", borderColor: activeSound === "ocean" ? "var(--primary)" : "var(--border-color)" }}>
            <div>
              <h4 style={{ fontSize: "13.5px" }}>Swell Ocean Waves</h4>
              <p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Synthesized LFO wave swells (8s cycles)</p>
            </div>
            {activeSound === "ocean" ? (
              <button className="btn btn-danger" onClick={stopAudio} style={{ padding: "8px" }}><FiSquare /></button>
            ) : (
              <button className="btn btn-primary" onClick={() => playSound("ocean")} style={{ padding: "8px" }}><FiPlay /></button>
            )}
          </div>

          {/* Rain */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px", background: activeSound === "rain" ? "var(--primary-light)" : "var(--bg-main)", borderRadius: "10px", border: "1px solid", borderColor: activeSound === "rain" ? "var(--primary)" : "var(--border-color)" }}>
            <div>
              <h4 style={{ fontSize: "13.5px" }}>Band-Pass Rain rustle</h4>
              <p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Calming rustling drops (600Hz frequency)</p>
            </div>
            {activeSound === "rain" ? (
              <button className="btn btn-danger" onClick={stopAudio} style={{ padding: "8px" }}><FiSquare /></button>
            ) : (
              <button className="btn btn-primary" onClick={() => playSound("rain")} style={{ padding: "8px" }}><FiPlay /></button>
            )}
          </div>
        </div>

        {/* Volume controls */}
        <div style={{ marginTop: "20px", borderTop: "1px solid var(--border-color)", paddingTop: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px" }}>
            <span>Volume Control</span>
            <span>{Math.round(volume * 100)}%</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FiVolumeX />
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05" 
              className="form-input" 
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              style={{ flex: 1, padding: 0 }}
            />
            <FiVolume2 />
          </div>
        </div>
      </div>

    </div>
  );
};

export default RelaxationCenter;
