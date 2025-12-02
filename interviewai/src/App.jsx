import { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import Login from "./Login";

const API_URL = "http://localhost:3001";

// Import modern fonts
const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  
  * {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
  }
`;

// Inject font styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = fontStyles;
  document.head.appendChild(styleSheet);
}

// Starter code templates
const getStarterCode = (languageName = "") => {
  const lower = (languageName || "").toLowerCase();
  if (lower.includes("python")) {
    return "import sys\n\n# Type your code here\ndef solution():\n    pass\n\nif __name__ == \"__main__\":\n    print(solution())\n";
  }
  if (lower.includes("javascript") || lower.includes("node")) {
    return "// Type your code here\nfunction solution() {\n  // TODO\n}\n\nconsole.log(solution());\n";
  }
  return "// Type your code here\n";
};

function mapToMonaco(name = "") {
  const lower = (name || "").toLowerCase();
  if (lower.includes("python")) return "python";
  if (lower.includes("javascript")) return "javascript";
  return "plaintext";
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function decodeBase64Safe(str) {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch {
    return str || "";
  }
}

// Dashboard Component
function Dashboard({ onStartInterview, stats, onViewHistory }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
    }}>
      <div style={{
        maxWidth: "1200px",
        width: "100%",
      }}>
        {/* Hero Section */}
        <div style={{
          textAlign: "center",
          marginBottom: "60px",
        }}>
          <h1 style={{
            fontSize: "56px",
            fontWeight: "800",
            color: "white",
            margin: "0 0 20px 0",
            textShadow: "0 4px 6px rgba(0,0,0,0.2)",
            letterSpacing: "-0.02em",
          }}>
            Interview.ai
          </h1>
          <p style={{
            fontSize: "20px",
            fontWeight: "400",
            color: "rgba(255,255,255,0.9)",
            maxWidth: "600px",
            margin: "0 auto",
            letterSpacing: "-0.01em",
            lineHeight: "1.5",
          }}>
            Practice coding interviews with AI-powered feedback and real-time assistance
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginBottom: "40px",
        }}>
          <StatCard 
            icon="🎯"
            title="Problems Solved"
            value={stats.problemsSolved}
            color="#4CAF50"
          />
          <StatCard 
            icon="⏱️"
            title="Total Time"
            value={formatTime(stats.totalTime)}
            color="#2196F3"
          />
          <StatCard 
            icon="✅"
            title="Tests Passed"
            value={`${stats.testsPassed}/${stats.totalTests}`}
            color="#FF9800"
          />
          <StatCard 
            icon="🔥"
            title="Current Streak"
            value={`${stats.streak} days`}
            color="#f44336"
          />
        </div>

        {/* Action Buttons */}
        <div style={{
          display: "flex",
          gap: "20px",
          justifyContent: "center",
          flexWrap: "wrap",
        }}>
          <button
            onClick={onStartInterview}
            style={{
              padding: "20px 40px",
              fontSize: "18px",
              fontWeight: "600",
              background: "white",
              color: "#667eea",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
              transition: "all 0.3s ease",
            }}
            onMouseOver={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 20px rgba(0,0,0,0.3)";
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 15px rgba(0,0,0,0.2)";
            }}
          >
            🚀 Start New Interview
          </button>
          
          <button
            onClick={onViewHistory}
            style={{
              padding: "20px 40px",
              fontSize: "18px",
              fontWeight: "600",
              background: "rgba(255,255,255,0.2)",
              color: "white",
              border: "2px solid white",
              borderRadius: "12px",
              cursor: "pointer",
              backdropFilter: "blur(10px)",
              transition: "all 0.3s ease",
            }}
            onMouseOver={(e) => {
              e.target.style.background = "rgba(255,255,255,0.3)";
            }}
            onMouseOut={(e) => {
              e.target.style.background = "rgba(255,255,255,0.2)";
            }}
          >
            📊 View History
          </button>
        </div>

        {/* Feature Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
          marginTop: "60px",
        }}>
          <FeatureCard 
            icon="🤖"
            title="AI-Powered Hints"
            description="Get intelligent suggestions as you code"
          />
          <FeatureCard 
            icon="⚡"
            title="Real-Time Execution"
            description="Run and test your code instantly"
          />
          <FeatureCard 
            icon="🎓"
            title="Multiple Languages"
            description="Practice in Python, JavaScript, and more"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color }) {
  return (
    <div style={{
      background: "white",
      borderRadius: "16px",
      padding: "30px",
      boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
      textAlign: "center",
      transition: "transform 0.3s ease",
    }}
    onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
    onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
    >
      <div style={{ fontSize: "48px", marginBottom: "10px" }}>{icon}</div>
      <div style={{ 
        fontSize: "13px", 
        color: "#666", 
        marginBottom: "8px", 
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}>
        {title}
      </div>
      <div style={{ 
        fontSize: "32px", 
        fontWeight: "700", 
        color,
        letterSpacing: "-0.02em",
      }}>
        {value}
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.15)",
      backdropFilter: "blur(10px)",
      borderRadius: "16px",
      padding: "30px",
      border: "1px solid rgba(255,255,255,0.2)",
      textAlign: "center",
    }}>
      <div style={{ fontSize: "48px", marginBottom: "15px" }}>{icon}</div>
      <h3 style={{ 
        fontSize: "20px", 
        fontWeight: "600", 
        color: "white", 
        margin: "0 0 10px 0",
        letterSpacing: "-0.01em",
      }}>
        {title}
      </h3>
      <p style={{ 
        fontSize: "14px", 
        fontWeight: "400",
        color: "rgba(255,255,255,0.8)", 
        margin: 0,
        lineHeight: "1.5",
      }}>
        {description}
      </p>
    </div>
  );
}

// Check if two strings are similar (simple word overlap check)
function areSimilar(str1, str2, threshold = 0.6) {
  if (!str1 || !str2) return false;
  
  const words1 = str1.toLowerCase().match(/\w+/g) || [];
  const words2 = str2.toLowerCase().match(/\w+/g) || [];
  
  if (words1.length === 0 || words2.length === 0) return false;
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  const similarity = intersection.size / union.size;
  return similarity >= threshold;
}

// Main App Component
export default function App() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [showDashboard, setShowDashboard] = useState(true);
  const [languages, setLanguages] = useState([]);
  const [language, setLanguage] = useState(null);
  const [code, setCode] = useState("// Type your code here\n");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [questionData, setQuestionData] = useState(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [testResults, setTestResults] = useState([]);
  const [runningTests, setRunningTests] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [helpLevel, setHelpLevel] = useState("off");
  const [showTests, setShowTests] = useState(false);
  const [commandLineArgs, setCommandLineArgs] = useState("");
  const [loadingAutoFeedback, setLoadingAutoFeedback] = useState(false);  
  const [lastAutoFeedback, setLastAutoFeedback] = useState("");
  const [lastAnalyzedCode, setLastAnalyzedCode] = useState("");

  // Mock stats (replace with real data from backend)
  const [stats] = useState({
    problemsSolved: 12,
    totalTime: 3600,
    testsPassed: 45,
    totalTests: 60,
    streak: 7,
  });

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (messages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
  if (user?.isGuest) {
    setShowDashboard(false);
  }
}, [user]);

  useEffect(() => {
  if (!timerRunning) return;

  const interval = setInterval(() => {
    setTimer(prev => prev + 1);
  }, 1000);

  return () => clearInterval(interval);
}, [timerRunning]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    async function loadLanguages() {
      try {
        const res = await fetch(`${API_URL}/api/languages`);
        if (!res.ok) throw new Error("Failed to fetch languages");
        const langs = await res.json();
        const activeLangs = Array.isArray(langs) ? langs.filter(l => !l.is_archived) : [];
        const mapped = activeLangs
          .map((l) => ({
            id: l.id,
            name: l.name,
            monaco: mapToMonaco(l.name),
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setLanguages(mapped);
        const defaultLang = mapped.find((l) => l.name.toLowerCase().includes("python")) || mapped[0];
        if (defaultLang) {
          setLanguage(defaultLang);
          setCode(getStarterCode(defaultLang.name));
        }
      } catch (err) {
        console.error("Error loading languages:", err);
      }
    }
    loadLanguages();
  }, []);

  // Auto-feedback when user stops typing
  useEffect(() => {
    console.log("🔍 Auto-feedback check - Help Level:", helpLevel);

    if (helpLevel === "off" || !code || code.trim().length < 20 || messages.length === 0) {
      return;
    }

    // Don't re-analyze if code hasn't changed significantly
    const codeChanged = code !== lastAnalyzedCode;
    if (!codeChanged) return;

    const timer = setTimeout(async () => {
      setLoadingAutoFeedback(true);
      try {
        const res = await fetch(`${API_URL}/api/auto-feedback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            conversation: messages.map(m => m.content).join("\n"),
            language: language?.name,
            helpLevel: helpLevel,
          }),
        });
        const data = await res.json();
        
        // Check if the new suggestion is similar to the last one
        if (data.suggestion && !areSimilar(data.suggestion, lastAutoFeedback)) {
          setMessages(prev => [
            ...prev,
            { role: "assistant", content: `💡 **Auto-suggestion:** ${data.suggestion}`, isAutoFeedback: true }
          ]);
          setLastAutoFeedback(data.suggestion);
        }
        
        setLastAnalyzedCode(code);
      } catch (err) {
        console.error("Auto-feedback error:", err);
      } finally {
        setLoadingAutoFeedback(false);
      }
    }, 7000);

    return () => clearTimeout(timer);
  }, [code, helpLevel, language?.name, lastAnalyzedCode, lastAutoFeedback]);

  const handleRunCode = async () => {
    if (!language) return;
    setRunning(true);
    setOutput("");

    const args = commandLineArgs.trim();
    console.log("🚀 Running code with arguments:", args || "(none)");

    try {
      const submitRes = await fetch(`${API_URL}/api/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_code: code,
          language_id: language.id,
          command_line_arguments: args || undefined,
        }),
      });

      const json = await submitRes.json();
      const token = json.token;
      if (!token) throw new Error("No token returned from backend");

      let result = null;
      for (let i = 0; i < 40; i++) {
        const res = await fetch(`${API_URL}/api/submissions/${token}`);
        if (!res.ok) continue;
        const json = await res.json();
        if (json.status?.id >= 3) {
          result = json;
          break;
        }
        await new Promise(r => setTimeout(r, 500));
      }

      if (!result) {
        setOutput("Error: Timed out waiting for backend to finish execution.");
        return;
      }

      const outputText =
        decodeBase64Safe(result?.stdout)?.trim() ||
        decodeBase64Safe(result?.compile_output)?.trim() ||
        decodeBase64Safe(result?.stderr)?.trim() ||
        result?.message ||
        "";

      setOutput(outputText);
    } catch (err) {
      setOutput("Error: " + err.message);
    } finally {
      setRunning(false);
    }
  };

  const runTestCases = async () => {
    if (!questionData?.testCases || questionData.testCases.length === 0) {
      alert("No test cases available");
      return;
    }

    setRunningTests(true);
    setTestResults([]);

    try {
      const res = await fetch(`${API_URL}/api/run-tests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_code: code,
          language_id: language.id,
          testCases: questionData.testCases,
        }),
      });

      const data = await res.json();
      setTestResults(data.results || []);
      setShowTests(true);
    } catch (err) {
      alert("Error running tests: " + err.message);
    } finally {
      setRunningTests(false);
    }
  };

  const generateQuestion = async () => {
    setLoadingQuestion(true);
    setTimer(0);
    setTimerRunning(true);
    setTestResults([]);
    setLastAutoFeedback("");  // Add this line
    setLastAnalyzedCode("");  // Add this line

    try {
      const res = await fetch(`${API_URL}/api/generate-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, difficulty }),
      });

      const data = await res.json();
      setQuestionData(data);
      setMessages([{ role: "assistant", content: data.question || "Coding Challenge" }]);
      setTimerActive(true);
      setShowDashboard(false);
    } catch (err) {
      alert("Error generating question: " + err.message);
    } finally {
      setLoadingQuestion(false);
    }
  };

  const sendMessage = async () => {
    const msg = input.trim();
    if (!msg) return;

    const userMessage = { role: "user", content: msg };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setSending(true);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          code,
          output,
          language: language?.name,
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.message }]);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSending(false);
    }
  };

  // 2. No user → go to login page
if (!user) {
  return <Login
      onLoginSuccess={(userData) => {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      }}
    />;
}

  if (showDashboard) {
    return (
      <Dashboard 
        onStartInterview={() => setShowDashboard(false)}
        stats={stats}
        onViewHistory={() => alert("History feature coming soon!")}
      />
    );
  }

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "#1e1e1e",
      overflow: "hidden",
    }}>
      {/* Enhanced Header */}
      <header
  style={{
    padding: "15px 30px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
  }}
>
  {/* LEFT SIDE */}
  <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
    <button
      onClick={() => setShowDashboard(true)}
      style={{
        background: "rgba(255,255,255,0.2)",
        border: "none",
        color: "white",
        padding: "8px 16px",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "14px",
      }}
    >
      ← Dashboard
    </button>

    <h2
      style={{
        margin: 0,
        fontSize: "24px",
        fontWeight: "700",
        letterSpacing: "-0.01em",
      }}
    >
      Interview.ai
    </h2>
  </div>

  {/* RIGHT SIDE */}
  <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
    {timerActive && (
      <div
        style={{
          fontSize: "28px",
          fontWeight: "bold",
          color: timer > 1800 ? "#ffeb3b" : "white",
          textShadow: "0 2px 4px rgba(0,0,0,0.3)",
        }}
      >
        ⏱️ {formatTime(timer)}
      </div>
    )}

    {/* SLIDER TOGGLE */}
    <label
      style={{
        position: "relative",
        display: "inline-block",
        width: "50px",
        height: "24px",
        cursor: "pointer",
      }}
    >
      <input
        type="checkbox"
        checked={timerActive}
        onChange={() => setTimerActive(!timerActive)}
        style={{ display: "none" }}
      />

      <span
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: timerActive
            ? "rgba(255,255,255,0.5)"
            : "rgba(255,255,255,0.2)",
          borderRadius: "24px",
          transition: "0.3s",
        }}
      />

      <span
        style={{
          position: "absolute",
          height: "20px",
          width: "20px",
          left: timerActive ? "28px" : "4px",
          bottom: "2px",
          backgroundColor: "white",
          borderRadius: "50%",
          transition: "0.3s",
          boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
        }}
      />
    </label>
  </div>
</header>



      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left Panel - Enhanced */}
        <div style={{
          width: "35%",
          minWidth: "350px",
          maxWidth: "500px",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid #3e3e42",
          background: "#252526",
          overflow: "hidden",
        }}>
          {/* Question Generator */}
          <div style={{ 
            padding: "20px", 
            borderBottom: "1px solid #3e3e42",
            background: "#2d2d30",
          }}>
            <input
              type="text"
              placeholder="Topic (e.g., arrays, strings)"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "12px",
                background: "#3c3c3c",
                color: "white",
                border: "1px solid #555",
                borderRadius: "8px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />

            <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: "#888", fontSize: "12px", marginBottom: "6px", display: "block" }}>
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "#3c3c3c",
                    color: "white",
                    border: "1px solid #555",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ color: "#888", fontSize: "12px", marginBottom: "6px", display: "block" }}>
                  AI Help
                </label>
                <select
                  value={helpLevel}
                  onChange={(e) => setHelpLevel(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "#3c3c3c",
                    color: "white",
                    border: "1px solid #555",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  <option value="off">Off</option>
                  <option value="hard">Minimal</option>
                  <option value="medium">Moderate</option>
                  <option value="easy">Maximum</option>
                </select>
              </div>
            </div>

            <button
              onClick={generateQuestion}
              disabled={loadingQuestion}
              style={{
                padding: "12px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: loadingQuestion ? "not-allowed" : "pointer",
                width: "100%",
                fontSize: "15px",
                fontWeight: "600",
                boxShadow: "0 2px 8px rgba(102, 126, 234, 0.4)",
              }}
            >
              {loadingQuestion ? "Generating..." : "🎲 Generate New Question"}
            </button>
          </div>

          {/* Chat Area - Enhanced */}
          <div style={{ 
            flex: 1, 
            overflowY: "auto", 
            padding: "20px",
            background: "#1e1e1e",
          }}>
            {messages.length === 0 && (
              <p style={{
                color: "#888",
                textAlign: "center",
                marginTop: "40px",
                fontSize: "15px",
              }}>
                Generate a question to start your interview
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  marginBottom: "16px",
                  padding: "16px",
                  borderRadius: "12px",
                  background: msg.role === "user" 
                    ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
                    : "#2d2d30",
                  color: "white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                }}
              >
                <div style={{
                  fontWeight: "600",
                  marginBottom: "8px",
                  fontSize: "12px",
                  color: msg.role === "user" ? "rgba(255,255,255,0.9)" : "#888",
                  textTransform: "uppercase",
                }}>
                  {msg.role === "user" ? "You" : "AI Interviewer"}
                </div>
                <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
                  <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area - Enhanced */}
          <div style={{
            padding: "15px",
            borderTop: "1px solid #3e3e42",
            background: "#2d2d30",
          }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask a question..."
                disabled={sending}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#3c3c3c",
                  border: "1px solid #555",
                  borderRadius: "8px",
                  color: "white",
                  fontSize: "14px",
                }}
              />
              <button
                onClick={sendMessage}
                disabled={sending || !input.trim()}
                style={{
                  padding: "12px 24px",
                  background: sending || !input.trim() ? "#555" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: sending || !input.trim() ? "not-allowed" : "pointer",
                  fontWeight: "600",
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Code Editor */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* Toolbar */}
          <div style={{
            padding: "12px 20px",
            background: "#2d2d30",
            borderBottom: "1px solid #3e3e42",
            display: "flex",
            gap: "12px",
            alignItems: "center",
          }}>
            <select
              value={language?.id ?? ""}
              onChange={(e) => {
                const selected = languages.find(l => l.id === Number(e.target.value));
                if (selected) {
                  setLanguage(selected);
                  setCode(getStarterCode(selected.name));
                }
              }}
              style={{
                padding: "10px 16px",
                background: "#3c3c3c",
                color: "white",
                border: "1px solid #555",
                borderRadius: "8px",
                minWidth: "180px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              <option value="" disabled>Select language</option>
              {languages.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>

            {questionData?.testCases && questionData.testCases.length > 0 && (
              <button
                onClick={runTestCases}
                disabled={runningTests}
                style={{
                  padding: "10px 24px",
                  background: runningTests ? "#555" : "#ff9800",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: runningTests ? "not-allowed" : "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                  boxShadow: runningTests ? "none" : "0 2px 8px rgba(255, 152, 0, 0.4)",
                }}
              >
                {runningTests ? "Testing..." : `Run Tests (${questionData.testCases.length})`}
              </button>
            )}

            <button
              onClick={handleRunCode}
              disabled={running || !language}
              style={{
                padding: "10px 24px",
                background: running ? "#555" : "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: running ? "not-allowed" : "pointer",
                marginLeft: "auto",
                fontWeight: "600",
                fontSize: "14px",
                boxShadow: running ? "none" : "0 2px 8px rgba(76, 175, 80, 0.4)",
              }}
            >
              {running ? "Running..." : "▶ Run Code"}
            </button>
          </div>

          {/* Editor */}
          <div style={{ flex: 1, overflow: "hidden" }}>
            <Editor
              key={language?.id ?? "editor-blank"}
              height="100%"
              language={language?.monaco || "plaintext"}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{ 
                fontSize: 14, 
                minimap: { enabled: false }, 
                wordWrap: "on",
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>

          {/* Output Panel */}
          <div style={{
            height: "250px",
            display: "flex",
            flexDirection: "column",
            borderTop: "1px solid #3e3e42",
            background: "#1e1e1e",
          }}>
            {/* Tab Bar */}
            <div style={{
              padding: "8px 20px",
              background: "#2d2d30",
              borderBottom: "1px solid #3e3e42",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}>
              <button
                onClick={() => setShowTests(false)}
                style={{
                  padding: "8px 16px",
                  background: !showTests ? "#3c3c3c" : "transparent",
                  color: !showTests ? "white" : "#888",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                Output
              </button>
              {testResults.length > 0 && (
                <button
                  onClick={() => setShowTests(true)}
                  style={{
                    padding: "8px 16px",
                    background: showTests ? "#3c3c3c" : "transparent",
                    color: showTests ? "white" : "#888",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                >
                  Test Results ({testResults.filter(t => t.passed).length}/{testResults.length} passed)
                </button>
              )}
            </div>

            {!showTests ? (
              <>
                {/* Command Line Args Input */}
                <div style={{
                  padding: "8px 20px",
                  background: "#2d2d30",
                  borderBottom: "1px solid #3e3e42",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}>
                  <label style={{ 
                    color: "#888", 
                    fontSize: "11px",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    whiteSpace: "nowrap",
                  }}>
                    Arguments:
                  </label>
                  <input
                    type="text"
                    value={commandLineArgs}
                    onChange={(e) => setCommandLineArgs(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !running) {
                        handleRunCode();
                      }
                    }}
                    placeholder='e.g., arg1 arg2 "quoted arg" (press Enter to run)'
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      background: "#3c3c3c",
                      color: "#4CAF50",
                      border: "1px solid #555",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontFamily: "monospace",
                    }}
                  />
                </div>

                {/* Output Display */}
                <div style={{
                  flex: 1,
                  padding: "15px 20px",
                  overflowY: "auto",
                }}>
                  <div style={{ 
                    color: "#888", 
                    fontSize: "11px", 
                    marginBottom: "8px",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}>
                    Output:
                  </div>
                  <pre style={{
                    color: "#4CAF50",
                    fontSize: "13px",
                    margin: 0,
                    fontFamily: "monospace",
                    whiteSpace: "pre-wrap",
                  }}>
                    {output || "Click 'Run Code' to see output"}
                  </pre>
                </div>
              </>
            ) : (
              /* Test Results Display */
              <div style={{
                flex: 1,
                padding: "15px 20px",
                overflowY: "auto",
              }}>
                {testResults.map((test, idx) => (
                  <div
                    key={idx}
                    style={{
                      marginBottom: "12px",
                      padding: "12px",
                      background: test.passed ? "#1a3a1a" : "#3a1a1a",
                      border: `1px solid ${test.passed ? "#2d5a2d" : "#5a2d2d"}`,
                      borderRadius: "8px",
                    }}
                  >
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "8px",
                    }}>
                      <span style={{
                        fontSize: "16px",
                      }}>
                        {test.passed ? "✅" : "❌"}
                      </span>
                      <span style={{
                        color: test.passed ? "#4CAF50" : "#f44336",
                        fontWeight: "600",
                        fontSize: "13px",
                      }}>
                        Test Case {idx + 1}
                      </span>
                    </div>
                    
                    <div style={{ fontSize: "12px", color: "#ccc", marginBottom: "4px" }}>
                      <strong>Input:</strong> {test.input || "(empty)"}
                    </div>
                    
                    <div style={{ fontSize: "12px", color: "#ccc", marginBottom: "4px" }}>
                      <strong>Expected:</strong> {test.expectedOutput}
                    </div>
                    
                    <div style={{ fontSize: "12px", color: test.passed ? "#4CAF50" : "#f44336" }}>
                      <strong>Got:</strong> {test.actualOutput || "(no output)"}
                    </div>
                    
                    {test.stderr && (
                      <div style={{ fontSize: "11px", color: "#ff9800", marginTop: "4px" }}>
                        <strong>Error:</strong> {test.stderr}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}