import { useState } from "react";
import Editor from "@monaco-editor/react";

export default function App() {
  const [code, setCode] = useState("// Type your JavaScript code here\nconsole.log('Hello world');");
  const [output, setOutput] = useState("");

  const handleRunCode = () => {
    try {
      // Capture console.log output
      let logs = [];
      const originalConsoleLog = console.log;
      console.log = (...args) => logs.push(args.join(" "));

      eval(code); // <-- runs JS code in browser

      setOutput(logs.join("\n"));

      console.log = originalConsoleLog; // restore original console.log
    } catch (err) {
      setOutput(err.toString());
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "10px", background: "#111", color: "white" }}>
        <h2>💻 Vibe Coded Interview</h2>
      </header>

      <div style={{ flexGrow: 1 }}>
        <Editor
          height="60vh"
          defaultLanguage="javascript"
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value)}
          options={{ fontSize: 14, minimap: { enabled: false }, wordWrap: "on" }}
        />
      </div>

      <button
        onClick={handleRunCode}
        style={{ padding: "10px", margin: "10px", background: "#4CAF50", color: "white", border: "none", borderRadius: "4px" }}
      >
        Run Code
      </button>

      <div style={{ padding: "10px", background: "#222", color: "#0f0", height: "20vh", overflowY: "auto" }}>
        <pre>{output}</pre>
      </div>
    </div>
  );
}
