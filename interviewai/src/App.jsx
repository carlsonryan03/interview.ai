import { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

// Simple markdown parser
function parseMarkdown(text) {
  if (!text) return "";
  let html = text;
  html = html.replace(/^### (.*$)/gim, '<h3 style="font-size: 1.1em; font-weight: bold; margin-top: 12px; margin-bottom: 8px; color: #fff;">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 style="font-size: 1.25em; font-weight: bold; margin-top: 12px; margin-bottom: 8px; color: #fff;">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 style="font-size: 1.5em; font-weight: bold; margin-top: 12px; margin-bottom: 8px; color: #fff;">$1</h1>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: bold; color: #fff;">$1</strong>');
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre style="background: #1e1e1e; padding: 12px; border-radius: 4px; margin: 8px 0; overflow-x: auto; border: 1px solid #444;"><code style="color: #4ec9b0; font-size: 13px; font-family: monospace;">$2</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code style="background: #1e1e1e; padding: 2px 6px; border-radius: 3px; color: #4ec9b0; font-size: 13px; font-family: monospace;">$1</code>');
  html = html.replace(/\n/g, "<br>");
  return html;
}

// Map Judge0 languages to Monaco editor languages
function mapToMonaco(name) {
  const lower = name.toLowerCase();
  if (lower.includes("python")) return "python";
  if (lower.includes("javascript") || lower.includes("nodejs")) return "javascript";
  if (lower.includes("typescript")) return "typescript";
  if (lower.includes("java")) return "java";
  if (lower.includes("c++")) return "cpp";
  if (lower.includes("c#")) return "csharp";
  if (lower.match(/\bc\b/) && !lower.includes("objc")) return "c";
  if (lower.includes("ruby")) return "ruby";
  if (lower.includes("php")) return "php";
  if (lower.includes("go")) return "go";
  if (lower.includes("swift")) return "swift";
  if (lower.includes("kotlin")) return "kotlin";
  if (lower.includes("r " ) || lower === "r") return "r";
  if (lower.includes("rust")) return "rust";
  if (lower.includes("sql")) return "sql";
  if (lower.includes("bash") || lower.includes("shell")) return "shell";
  return "plaintext";
}

export default function App() {
  const [languages, setLanguages] = useState([]);
  const [language, setLanguage] = useState(null);
  const [code, setCode] = useState("// Type your code here\n");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [question, setQuestion] = useState("");
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const chatEndRef = useRef(null);
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("");

  // Scroll chat to bottom on new messages
  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => scrollToBottom(), [messages]);

  // Fetch all supported languages from Judge0 (via backend)
  useEffect(() => {
    async function loadLanguages() {
      try {
        const res = await fetch(`${API_URL}/api/languages`);
        if (!res.ok) throw new Error("Failed to fetch languages");
        const langs = await res.json();

        const mapped = langs
          .map((l) => ({
            id: l.id,
            name: l.name,
            monaco: mapToMonaco(l.name),
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        setLanguages(mapped);
        // Default to Python or first language
        const defaultLang = mapped.find((l) => l.name.toLowerCase().includes("python")) || mapped[0];
        setLanguage(defaultLang);
      } catch (err) {
        console.error("Error loading languages:", err);
      }
    }
    loadLanguages();
  }, []);

  const handleRunCode = async () => {
    if (!language) return;
    setRunning(true);
    setOutput("Running...");
    try {
      const submitRes = await fetch(`${API_URL}/api/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_code: code, language_id: language.id }),
      });
      if (!submitRes.ok) {
        const errorData = await submitRes.json();
        throw new Error(errorData.error || submitRes.statusText);
      }
      const { token } = await submitRes.json();
      if (!token) throw new Error("No token returned from server");

      let result = null;
      for (let i = 0; i < 40; i++) {
        const res = await fetch(`${API_URL}/api/submissions/${token}`);
        const json = await res.json();
        if (json.status && json.status.id >= 3) {
          result = json;
          break;
        }
        await new Promise((r) => setTimeout(r, 500));
      }
      if (!result) throw new Error("Timed out waiting for result");

      const outputText =
        result.stdout || result.compile_output || result.stderr || result.message || "No output";
      setOutput(outputText);
    } catch (err) {
      setOutput("Error: " + (err?.message || String(err)));
    } finally {
      setRunning(false);
    }
  };

  const generateQuestion = async () => {
  setLoadingQuestion(true);
  try {
    const res = await fetch(`${API_URL}/api/generate-question`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        difficulty, // use the dropdown value
        instruction: `
You are an AI coding interviewer. Generate a concise coding problem ONLY.
- Include topic: ${topic} and difficulty: ${difficulty}
- Provide only problem description
- Optional: sample input/output
- DO NOT provide the solution or explanation
- Keep it short and focused
        `.trim(),
      }),
    });

    const data = await res.json();
    setQuestion(data.question || "Failed to generate question.");
    setMessages([{ role: "assistant", content: data.question || "" }]);
  } catch (err) {
    alert("Error generating question: " + err.message);
  } finally {
    setLoadingQuestion(false);
  }
};


  const sendMessage = async (customMessage = null) => {
    const msg = customMessage || input.trim();
    if (!msg && !customMessage) return;

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
      setMessages([...newMessages, { role: "assistant", content: data.message }]);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSending(false);
    }
  };

  const askForHint = () => sendMessage("Can you give me a hint for this problem?");
  const submitForReview = () =>
    sendMessage("Please review my solution and let me know if it's correct and efficient.");

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        background: "#1e1e1e",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <header
        style={{
          padding: "15px 20px",
          background: "#252526",
          color: "white",
          borderBottom: "1px solid #3e3e42",
          flexShrink: 0,
        }}
      >
        <h2 style={{ margin: 0 }}>💻 AI Coding Interview</h2>
      </header>

      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          flexDirection: "row",
          flexWrap: "nowrap",
        }}
      >
        {/* Left Panel */}
        <div
          style={{
            width: "35%",
            minWidth: "300px",
            maxWidth: "500px",
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid #3e3e42",
            background: "#252526",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "15px", borderBottom: "1px solid #3e3e42" }}>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ color: "white", fontSize: "13px" }}>
                Difficulty:{" "}
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  style={{ padding: "4px", marginLeft: "4px", borderRadius: "3px", background: "#3c3c3c", color: "white", border: "1px solid #555" }}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </label>
            </div>

            <button
              onClick={generateQuestion}
              disabled={loadingQuestion}
              style={{
                padding: "10px 20px",
                background: "#007acc",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: loadingQuestion ? "not-allowed" : "pointer",
                width: "100%",
              }}
            >
              {loadingQuestion ? "Generating..." : "Generate New Question"}
            </button>
          </div>

          {/* Chat */}
          <div style={{ flex: 1, overflowY: "auto", padding: "15px" }}>
            {messages.length === 0 && (
              <p style={{ color: "#888", textAlign: "center", marginTop: "20px" }}>
                Click "Generate New Question" to start an interview
              </p>
            )}
            {question && (
            <div style={{ marginBottom: "10px", color: "#fff", fontSize: "13px" }}>
              <strong>Topic:</strong> {topic} &nbsp;|&nbsp; <strong>Difficulty:</strong> {difficulty}
            </div>
          )}
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  marginBottom: "15px",
                  padding: "12px",
                  borderRadius: "8px",
                  background: msg.role === "user" ? "#094771" : "#2d2d30",
                  color: "white",
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    marginBottom: "8px",
                    fontSize: "11px",
                    color: "#888",
                    textTransform: "uppercase",
                  }}
                >
                  {msg.role === "user" ? "You" : "AI Interviewer"}
                </div>
                <div
                  style={{ fontSize: "14px", lineHeight: "1.6" }}
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }}
                />
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {messages.length > 0 && (
            <div style={{ padding: "10px", borderTop: "1px solid #3e3e42", display: "flex", gap: "8px" }}>
              <button
                onClick={askForHint}
                disabled={sending}
                style={{
                  flex: 1,
                  padding: "8px",
                  background: "#3a3a3c",
                  color: "white",
                  border: "1px solid #555",
                  borderRadius: "4px",
                  cursor: sending ? "not-allowed" : "pointer",
                  fontSize: "12px",
                }}
              >
                💡 Hint
              </button>
              <button
                onClick={submitForReview}
                disabled={sending}
                style={{
                  flex: 1,
                  padding: "8px",
                  background: "#3a3a3c",
                  color: "white",
                  border: "1px solid #555",
                  borderRadius: "4px",
                  cursor: sending ? "not-allowed" : "pointer",
                  fontSize: "12px",
                }}
              >
                ✓ Review
              </button>
            </div>
          )}

          <div style={{ padding: "10px", borderTop: "1px solid #3e3e42" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask a question..."
                disabled={sending}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#3c3c3c",
                  border: "1px solid #555",
                  borderRadius: "4px",
                  color: "white",
                  fontSize: "14px",
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={sending || !input.trim()}
                style={{
                  padding: "10px 20px",
                  background: sending || !input.trim() ? "#555" : "#007acc",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: sending || !input.trim() ? "not-allowed" : "pointer",
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div
            style={{
              padding: "10px",
              background: "#252526",
              borderBottom: "1px solid #3e3e42",
              display: "flex",
              gap: "10px",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <label style={{ color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
              Language:
              <select
                value={language?.id || ""}
                onChange={(e) => setLanguage(languages.find((l) => l.id === Number(e.target.value)))}
                style={{
                  padding: "8px",
                  background: "#3c3c3c",
                  color: "white",
                  border: "1px solid #555",
                  borderRadius: "4px",
                  minWidth: "180px",
                }}
              >
                {languages.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>

            <button
              onClick={handleRunCode}
              disabled={running || !language}
              style={{
                padding: "8px 20px",
                background: running ? "#555" : "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: running ? "not-allowed" : "pointer",
                marginLeft: "auto",
              }}
            >
              {running ? "Running..." : "▶ Run Code"}
            </button>
          </div>

          <div style={{ flex: 1 }}>
            <Editor
              height="100%"
              language={language?.monaco || "plaintext"}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{ fontSize: 14, minimap: { enabled: false }, wordWrap: "on" }}
            />
          </div>

          <div
            style={{
              height: "150px",
              background: "#1e1e1e",
              borderTop: "1px solid #3e3e42",
              padding: "10px",
              overflowY: "auto",
            }}
          >
            <div style={{ color: "#888", fontSize: "12px", marginBottom: "5px" }}>OUTPUT:</div>
            <pre style={{ color: "#0f0", fontSize: "13px", margin: 0, fontFamily: "monospace" }}>
              {output || "Click 'Run Code' to see output"}
            </pre>
          </div>
        </div>
      </div>

      {/* Responsive layout for small screens */}
      <style>
        {`
          @media (max-width: 900px) {
            div[style*="display: flex"][style*="flex: 1"][style*="flex-wrap: nowrap"] {
              flex-direction: column !important;
            }
            div[style*="border-right: 1px solid #3e3e42"] {
              width: 100% !important;
              max-width: none !important;
              border-right: none !important;
              border-bottom: 1px solid #3e3e42 !important;
              height: 50%;
            }
            div[style*="flex: 1; display: flex; flex-direction: column; overflow: hidden"] {
              height: 50%;
            }
          }
        `}
      </style>
    </div>
  );
}
