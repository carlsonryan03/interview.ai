import { useState } from "react";
import Editor from "@monaco-editor/react";

// Add more languages and their Judge0 IDs as needed
const languages = [
  { id: 63, name: "JavaScript", monaco: "javascript" },
  { id: 71, name: "Python (3.8.1)", monaco: "python" },
  { id: 54, name: "C++ (GCC 9.2.0)", monaco: "cpp" },
  { id: 62, name: "Java (OpenJDK 13.0.1)", monaco: "java" },
];

const API_URL = (import.meta.env.VITE_JUDGE0_URL || "").replace(/\/+$/, "");
const API_KEY = import.meta.env.VITE_JUDGE0_KEY;
const RAPIDAPI_HOST = import.meta.env.VITE_JUDGE0_RAPIDAPI_HOST;

function buildHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (API_KEY) {
    if (RAPIDAPI_HOST) {
      headers["X-RapidAPI-Key"] = API_KEY;
      headers["X-RapidAPI-Host"] = RAPIDAPI_HOST;
    } else {
      headers["X-Auth-Token"] = API_KEY;
    }
  }
  return headers;
}

export default function App() {
  const [code, setCode] = useState("// Type your code here\n");
  const [output, setOutput] = useState("");
  const [language, setLanguage] = useState(languages[1]); // default Python
  const [running, setRunning] = useState(false);

  const handleRunCode = async () => {
    setRunning(true);
    setOutput("Running...");

    if (!API_URL) {
      setOutput("Error: VITE_JUDGE0_URL not configured in .env");
      setRunning(false);
      return;
    }

    try {
      const submitRes = await fetch(
        `${API_URL}/submissions?base64_encoded=false&wait=false`,
        {
          method: "POST",
          headers: buildHeaders(),
          body: JSON.stringify({
            source_code: code,
            language_id: language.id,
          }),
        }
      );

      if (!submitRes.ok) {
        const txt = await submitRes.text();
        throw new Error(txt || submitRes.statusText);
      }

      const submitJson = await submitRes.json();
      const { token } = submitJson;
      if (!token) throw new Error("No token returned from Judge0");

      // Poll for result
      let result = null;
      for (let i = 0; i < 40; i++) {
        const res = await fetch(
          `${API_URL}/submissions/${token}?base64_encoded=false`,
          { headers: buildHeaders() }
        );
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || res.statusText);
        }
        const json = await res.json();
        if (json.status && json.status.id >= 3) {
          result = json;
          break;
        }
        await new Promise((r) => setTimeout(r, 500));
      }

      if (!result) throw new Error("Timed out waiting for Judge0 result");

      setOutput(
        result.stdout ||
          result.compile_output ||
          result.stderr ||
          result.message ||
          "No output"
      );
    } catch (err) {
      setOutput("Error: " + (err?.message || String(err)));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ height: "100vh", width: "100vw", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "10px", background: "#111", color: "white" }}>
        <h2>💻 Vibe Coded Interview</h2>
      </header>

      <div style={{ padding: "10px" }}>
        <label>
          Language:&nbsp;
          <select
            value={language.id}
            onChange={(e) => {
              const lang = languages.find((l) => l.id === Number(e.target.value));
              setLanguage(lang);
            }}
          >
            {languages.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ flexGrow: 1, width: "100%", display: "flex", flexDirection: "column" }}>
        <Editor
          height="60vh"
          width="100%"
          language={language.monaco}
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value)}
          options={{ fontSize: 14, minimap: { enabled: false }, wordWrap: "on" }}
        />
      </div>

      <button
        onClick={handleRunCode}
        disabled={running}
        style={{
          padding: "10px",
          margin: "10px",
          background: running ? "#888" : "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: running ? "not-allowed" : "pointer",
        }}
      >
        {running ? "Running..." : "Run Code"}
      </button>

      <div style={{ padding: "10px", background: "#222", color: "#0f0", height: "20vh", overflowY: "auto" }}>
        <pre>{output}</pre>
      </div>
    </div>
  );
}
