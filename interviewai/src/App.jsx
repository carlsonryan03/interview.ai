import { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";


import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";


const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";


// Starter templates that use the correct line comment symbol
const getStarterCode = (languageName = "") => {
  const lower = (languageName || "").toLowerCase();
  const c = getLineCommentSymbol(lower);
  const comment = (txt) => `${c} ${txt}\n`;

  if (lower.includes("python")) {
    return "# Type your code here\n\ndef solution():\n    pass\n\nif __name__ == \"__main__\":\n    print(solution())\n";
  }
  if (lower.includes("javascript") || lower.includes("node")) {
    return `${comment("Type your code here")}\nfunction solution() {\n  // TODO\n}\n\nconsole.log(solution());\n`;
  }
  if (lower.includes("typescript")) {
    return `${comment("Type your code here")}\nfunction solution(): any {\n  // TODO\n}\n\nconsole.log(solution());\n`;
  }
  if (lower.includes("java")) {
    return `${comment("Type your code here")}\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println(\"Hello\");\n  }\n}\n`;
  }
  if (lower.includes("c++") || lower.includes("cpp")) {
    return `${comment("Type your code here")}\n#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << \"Hello\" << endl;\n  return 0;\n}\n`;
  }
  if (lower.match(/\bc\b/) && !lower.includes("objc")) {
    return `${comment("Type your code here")}\n#include <stdio.h>\nint main(){\n  puts(\"Hello\");\n  return 0;\n}\n`;
  }
  if (lower.includes("c#")) {
    return `${comment("Type your code here")}\nusing System;\nclass Program { static void Main(){ Console.WriteLine(\"Hello\"); } }\n`;
  }
  if (lower.includes("go")) {
    return `${comment("Type your code here")}\npackage main\nimport \"fmt\"\nfunc main(){ fmt.Println(\"Hello\") }\n`;
  }
  if (lower.includes("rust")) {
    return `${comment("Type your code here")}\nfn main(){ println!(\"Hello\"); }\n`;
  }
  if (lower.includes("php")) {
    return `<?php\n${comment("Type your code here")}\nfunction solution(){\n  // TODO\n}\n\necho \"Hello\\n\";\n`;
  }
  if (lower.includes("ruby")) {
    return `# Type your code here\nputs 'Hello'\n`;
  }
  if (lower.includes("bash") || lower.includes("shell")) {
    return `# Type your code here\n\necho \"Hello\"\n`;
  }
  if (lower.includes("sql")) {
    return `-- Type your SQL query here\nSELECT 1;\n`;
  }
  if (lower.includes("swift")) {
    return `${comment("Type your code here")}\nprint(\"Hello\")\n`;
  }
  if (lower.includes("kotlin")) {
    return `${comment("Type your code here")}\nfun main(){ println(\"Hello\") }\n`;
  }
  if (lower.includes("lua")) {
    return `-- Type your code here\nprint('Hello')\n`;
  }
  if (lower.includes("r ")) {
    return `# Type your code here\nprint(1)\n`;
  }
  if (lower.includes("perl")) {
    return `# Type your code here\nprint \"Hello\\n\";\n`;
  }
  if (lower.includes("haskell")) {
    return `-- Type your code here\nmain = putStrLn \"Hello\"\n`;
  }
  if (lower.includes("scala")) {
    return `${comment("Type your code here")}\nobject Main extends App { println(\"Hello\") }\n`;
  }
  if (lower.includes("dart")) {
    return `${comment("Type your code here")}\nvoid main(){ print('Hello'); }\n`;
  }
  if (lower.includes("clojure") || lower.includes("lisp")) {
    return `;; Type your code here\n(println "Hello")\n`;
  }
  if (lower.includes("fortran")) {
    return `${comment("Type your code here")}\nprogram main\n  print *, 'Hello'\nend program main\n`;
  }
  // Fall back: simple comment + placeholder
  return `${comment("Type your code here")}\n`;
};


function parseMarkdown(text) {
 if (!text) return "";
 let html = text;
 html = html.replace(/^### (.*$)/gim, '<h3 style="font-size: 1.1em; font-weight: bold; margin-top: 12px; margin-bottom: 8px; color: #fff;">$1</h3>');
 html = html.replace(/^## (.*$)/gim, '<h2 style="font-size: 1.25em; font-weight: bold; margin-top: 12px; margin-bottom: 8px; color: #fff;">$1</h2>');
 html = html.replace(/^# (.*$)/gim, '<h1 style="font-size: 1.5em; font-weight: bold; margin-top: 12px; margin-bottom: 8px; color: #fff;">$1</h1>');
 html = html.replace(/\\*\\*(.*?)\\*\\*/g, '<strong style="font-weight: bold; color: #fff;">$1</strong>');
 html = html.replace(/```(\\w+)?\\n([\\s\\S]*?)```/g, '<pre style="background: #1e1e1e; padding: 12px; border-radius: 4px; margin: 8px 0; overflow-x: auto; border: 1px solid #444;"><code style="color: #4ec9b0; font-size: 13px; font-family: monospace;">$2</code></pre>');
 html = html.replace(/`([^`]+)`/g, '<code style="background: #1e1e1e; padding: 2px 6px; border-radius: 3px; color: #4ec9b0; font-size: 13px; font-family: monospace;">$1</code>');
 html = html.replace(/\\n/g, "<br>");
 return html;
}

// choose the correct line comment symbol based on language name
function getLineCommentSymbol(name = "") {
  const lower = name.toLowerCase();

  if (!name) return "//";

  // Shell-like
  if (
    lower.includes("bash") ||
    lower.includes("shell") ||
    lower.includes("sh")
  ) return "#";

  // Python / Ruby / R / YAML-ish
  if (
    lower.includes("python") ||
    lower.includes("ruby") ||
    lower === "r" ||
    lower.includes("r ")
  ) return "#";

  // Lua, SQL, Haskell
  if (
    lower.includes("lua") ||
    lower.includes("sql") ||
    lower.includes("haskell")
  ) return "--";

  // Assembly (NASM, MASM, GAS)
  if (lower.includes("asm") || lower.includes("assembly") || lower.includes("nasm"))
    return ";";

  // Fortran
  if (lower.includes("fortran")) return "!";

  // Pascal
  if (lower.includes("pascal")) return "//"; // FPC accepts // as line comment

  // Visual Basic / VB.NET
  if (lower.includes("vb") || lower.includes("visual basic"))
    return "'";

  // Lisp family
  if (lower.includes("lisp") || lower.includes("clojure"))
    return ";;";

  // Prolog
  if (lower.includes("prolog"))
    return "%";

  // COBOL
  if (lower.includes("cobol"))
    return "*";  // standard line comment column

  // D language
  if (lower === "d " || lower.includes("d ("))
    return "//";

  // Elixir / Erlang
  if (lower.includes("elixir") || lower.includes("erlang"))
    return "#";

  // F#
  if (lower.startsWith("f#"))
    return "//";

  // MATLAB / Octave
  if (lower.includes("octave"))
    return "%";

  // Objective-C = C-style
  if (lower.includes("objective-c"))
    return "//";

  // Groovy / Scala / Kotlin / Swift / Dart → C-style
  if (
    lower.includes("groovy") ||
    lower.includes("scala") ||
    lower.includes("kotlin") ||
    lower.includes("swift") ||
    lower.includes("dart")
  ) return "//";

  // Basic (FreeBASIC)
  if (lower.includes("basic") || lower.includes("fbc"))
    return "'";

  // Plaintext
  if (lower.includes("plain text"))
    return "";

  // Default to C-style
  return "//";
}


// Map Judge0 language names to Monaco language ids where possible
function mapToMonaco(name = "") {
  const lower = (name || "").toLowerCase();
  if (lower.includes("python")) return "python";
  if (lower.includes("javascript") || lower.includes("node")) return "javascript";
  if (lower.includes("typescript")) return "typescript";
  if (lower.includes("java")) return "java";
  if (lower.includes("c++") || lower.includes("cpp")) return "cpp";
  if (lower.match(/\bc\b/) && !lower.includes("objc")) return "c";
  if (lower.includes("c#") || lower.includes("csharp")) return "csharp";
  if (lower.includes("go")) return "go";
  if (lower.includes("rust")) return "rust";
  if (lower.includes("ruby")) return "ruby";
  if (lower.includes("php")) return "php";
  if (lower.includes("swift")) return "swift";
  if (lower.includes("kotlin")) return "kotlin";
  if (lower.includes("lua")) return "lua";
  if (lower.includes("r ") || lower === "r") return "r";
  if (lower.includes("sql")) return "sql";
  if (lower.includes("perl")) return "perl";
  if (lower.includes("haskell")) return "haskell";
  if (lower.includes("scala")) return "scala";
  if (lower.includes("dart")) return "dart";
  if (lower.includes("elixir")) return "elixir";
  if (lower.includes("erlang")) return "erlang";
  if (lower.includes("groovy")) return "groovy";
  if (lower.includes("ocaml")) return "ocaml";
  // Editor doesn't support every niche language — fallback to plaintext
  return "plaintext";
}


function formatTime(seconds) {
 const mins = Math.floor(seconds / 60);
 const secs = seconds % 60;
 return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Base64 helpers (Unicode-safe)
function encodeBase64Safe(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function decodeBase64Safe(str) {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch {
    return str || "";
  }
}

export default function App({ user, onLogout }) {
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
 const [timerActive, setTimerActive] = useState(false);
 const [showCLI, setShowCLI] = useState(false);
 const [cliInput, setCliInput] = useState("");
 const chatEndRef = useRef(null);
 const streamingMessageRef = useRef("");


 const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
 useEffect(() => scrollToBottom(), [messages]);


 // Timer effect
 useEffect(() => {
   let interval;
   if (timerActive) {
     interval = setInterval(() => {
       setTimer(prev => prev + 1);
     }, 1000);
   }
   return () => clearInterval(interval);
 }, [timerActive]);


 useEffect(() => {
   async function loadLanguages() {
     try {
       const res = await fetch(`${API_URL}/api/languages`);
       if (!res.ok) throw new Error("Failed to fetch languages");
       const langs = await res.json();


       // Filter out archived safely
       const activeLangs = Array.isArray(langs) ? langs.filter(l => !l.is_archived && !l.archived) : [];


       const mapped = activeLangs
         .map((l) => ({
           id: l.id,
           name: l.name,
           monaco: mapToMonaco(l.name),
         }))
         .sort((a, b) => a.name.localeCompare(b.name));


       setLanguages(mapped);


       // Pick first Python language or fallback to first language (if exists)
       const defaultLang =
         mapped.find((l) => l.name.toLowerCase().includes("python")) ||
         mapped[0] ||
         null;


       if (defaultLang) {
         setLanguage(defaultLang);
         setCode(getStarterCode(defaultLang.name || ""));
       } else {
         // no languages returned — set sane defaults
         setLanguage(null);
         setCode("// Type your code here\n");
         console.warn("No languages returned from API");
       }
     } catch (err) {
       console.error("Error loading languages:", err);
     }
   }
   loadLanguages();
 }, []);

 // existing handleLanguageChange that accepts object stays:
 const handleLanguageChange = (newLanguage) => {
   if (!newLanguage) return;
   setLanguage(newLanguage);
   setCode(getStarterCode(newLanguage.name || ""));
 };


 // helper that accepts an id (used by the <select>)
 const handleLanguageChangeById = (id) => {
   const selected = languages.find(l => l.id === Number(id));
   if (selected) handleLanguageChange(selected);
   else console.warn("Selected language id not found:", id);
 };


  const handleRunCode = async () => {
    if (!language) return;

    setRunning(true);
    setTerminalLines([]);
    setOutput("");         // clear previous output
    setTerminalLines(prev => prev.filter(line => line !== "Running..."));
    appendLine("Running..."); // add placeholder
    setCliToken(null);

    const stdin = showCLI ? cliInputBuffer || "" : ""; // CLI buffer or empty

    try {
      const submitRes = await fetch(`${API_URL}/api/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_code: code,
          language_id: language.id,
          stdin: stdin
        }),
      });

      const json = await submitRes.json();
      const token = json.token;
      if (!token) throw new Error("No token returned from backend");
      setCliToken(token);

      let result = null;
      const maxPolls = 40; // ~20 seconds
      for (let i = 0; i < maxPolls; i++) {
        const res = await fetch(`${API_URL}/api/submissions/${token}`);
        if (!res.ok) continue;
        const json = await res.json();
        if (json.status?.id >= 3) {
          result = json;
          break;
        }
        await new Promise(r => setTimeout(r, 500));
      }
      console.log("Submission result:", result);

      if (!result) {
        setOutput("Error: Timed out waiting for backend to finish execution.");
        return;
      }

      const outputText =
        decodeBase64Safe(result.stdout)?.trim() ||
        decodeBase64Safe(result.compile_output)?.trim() ||
        decodeBase64Safe(result.stderr)?.trim() ||
        result.message ||
        "";

      appendLine(outputText);
      setOutput(outputText);
    } catch (err) {
      setOutput("Error: " + (err.message || String(err)));
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
   } catch (err) {
     alert("Error running tests: " + err.message);
   } finally {
     setRunningTests(false);
   }
 };


 const generateQuestion = async () => {
 setLoadingQuestion(true);
 setTimer(0);
 setTimerActive(false);
 setTestResults([]);


 try {
   const res = await fetch(`${API_URL}/api/generate-question`, {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ topic, difficulty }),
   });


   const data = await res.json();
   setQuestionData(data);


   // Take the backend 'question' field directly
   const questionText = data.question || "Coding Challenge";


   setMessages([{ role: "assistant", content: questionText }]);
   setTimerActive(true);
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
  streamingMessageRef.current = "";

  // Add placeholder for streaming message
  setMessages(prev => [...prev, { role: "assistant", content: "", streaming: true }]);

  try {
    const res = await fetch(`${API_URL}/api/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: newMessages,
        code,
        output,
        language: language?.name,
      }),
    });

    if (!res.body) throw new Error("No response body from server");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let pollCount = 0;
    const maxPolls = 300; // ~30s timeout

    while (!done && pollCount < maxPolls) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      pollCount++;

      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              done = true;
              break;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                streamingMessageRef.current += parsed.content;
                setMessages(prev => [
                  ...prev.slice(0, -1),
                  {
                    role: "assistant",
                    content: streamingMessageRef.current,
                    streaming: true,
                  },
                ]);
              }
            } catch (e) {
              console.warn("Failed to parse chunk:", e);
            }
          }
        }
      }
    }

    // Finalize message
    setMessages(prev => [
      ...prev.slice(0, -1),
      {
        role: "assistant",
        content: streamingMessageRef.current,
      },
    ]);
  } catch (err) {
    console.error("Streaming failed, fallback:", err);
    try {
      const fallback = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          code,
          output,
          language: language?.name,
        }),
      });
      const data = await fallback.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.message }]);
    } catch (fallbackErr) {
      alert("Error: " + fallbackErr.message);
      setMessages(newMessages);
    }
  } finally {
    setSending(false);
  }
};



 const askForHint = () => sendMessage("Can you give me a hint for this problem?");
 const submitForReview = () =>
   sendMessage("Please review my solution and let me know if it's correct and efficient.");


 const passedTests = testResults.filter(r => r.passed).length;
 const totalTests = testResults.length;


 const [terminalLines, setTerminalLines] = useState([]);
 const terminalRef = useRef(null);


 // Auto-scroll terminal
 useEffect(() => {
   terminalRef.current?.scrollIntoView({ behavior: "smooth" });
 }, [terminalLines]);


 const appendLine = (text) => setTerminalLines((lines) => [...lines, text]);

 const [cliInputBuffer, setCliInputBuffer] = useState(""); // stores stdin lines
const [cliToken, setCliToken] = useState(null);           // stores the current submission token


const runCodeWithStdin = async (stdinLine = "") => {
  
  if (!language) return;
  setRunning(true);

  // Add to input buffer
  let updatedBuffer = cliInputBuffer;
  if (stdinLine) updatedBuffer += stdinLine + "\n";
  setCliInputBuffer(updatedBuffer);

  try {
    // Always submit fresh code
    const submitRes = await fetch(`${API_URL}/api/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_code: code,
        language_id: language.id,
        stdin: updatedBuffer,
      }),
    });
    const json = await submitRes.json();
    const token = json.token;
    setCliToken(token);


    let result = null;
    for (let i = 0; i < 100; i++) { // ~20s timeout at 200ms
      const res = await fetch(`${API_URL}/api/submissions/${token}`);
      if (!res.ok) continue;          // skip if network error
      const json = await res.json();
      if (json.status?.id >= 3) {
        result = json;
        break;
      }
      await new Promise(r => setTimeout(r, 200));
    }
    if (!result) throw new Error("Timed out waiting for result");

    if (stdinLine) appendLine(`> ${stdinLine}`); // show user input

    const outputText =
      decodeBase64Safe(result.stdout)?.trim() ||
      decodeBase64Safe(result.compile_output)?.trim() ||
      decodeBase64Safe(result.stderr)?.trim() ||
      result.message ||
      "";

      const lines = outputText.split("\n");

      lines.forEach(line => {
      if (line.trim() !== stdinLine && !line.includes(stdinLine)) {
        appendLine(line);
      }
    });
    // Only show the backend output if it is NOT the same as the prompt
    const filteredOutput = outputText
      .split("\n")
      .filter(line => line.trim() !== stdinLine) // remove the duplicated input line
      .join("\n");

    if (filteredOutput) appendLine(filteredOutput); // show backend response


    // Reset CLI state if finished
    setCliInputBuffer("");
    setCliToken(null);
  } catch (err) {
    // Remove placeholder if present
    // setTerminalLines(prev => prev.filter(line => line !== "Running..."));
    appendLine("Error: " + (err.message || String(err)));
    setCliToken(null);
  } finally {
    setRunning(false);
  }
};

const handleCliKeyPress = (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const inputLine = cliInput.trim();
    if (!inputLine && !cliInputBuffer) return; // ignore empty
    setCliInput("");
    runCodeWithStdin(inputLine);
  }
};


 return (
   <div
     style={{
       height: "100vh",
       width: "100vw",
       display: "flex",
       flexDirection: "column",
       background: "#1e1e1e",
       overflow: "hidden",
     }}
   >
     {/* Header */}
     <header
       style={{
         padding: "15px 20px",
         background: "#252526",
         color: "white",
         borderBottom: "1px solid #3e3e42",
         display: "flex",
         justifyContent: "space-between",
         alignItems: "center",
       }}
     >
       <h2 style={{ margin: 0 }}>💻 AI Coding Interview</h2>
       {timerActive && (
         <div
           style={{
             fontSize: "24px",
             fontWeight: "bold",
             color: timer > 1800 ? "#ff6b6b" : "#4CAF50",
           }}
         >
           ⏱️ {formatTime(timer)}
         </div>
       )}
       {/* Only show logout button if not a guest */}
        {!user?.isGuest && (
          <button
            onClick={onLogout}
            style={{
              padding: "8px 16px",
              background: "#ff4444",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Logout
          </button>
        )}
     </header>


     <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
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
         {/* Topic/Difficulty & Generate Question */}
         <div style={{ padding: "15px", borderBottom: "1px solid #3e3e42" }}>
           <div style={{ marginBottom: "10px", display: "flex", gap: "10px" }}>
             <input
               type="text"
               placeholder="Topic (e.g., arrays, strings)"
               value={topic}
               onChange={(e) => setTopic(e.target.value)}
               style={{
                 flex: 1,
                 padding: "8px",
                 background: "#3c3c3c",
                 color: "white",
                 border: "1px solid #555",
                 borderRadius: "4px",
               }}
             />
             <select
               value={difficulty}
               onChange={(e) => setDifficulty(e.target.value)}
               style={{
                 padding: "8px",
                 background: "#3c3c3c",
                 color: "white",
                 border: "1px solid #555",
                 borderRadius: "4px",
               }}
             >
               <option value="easy">Easy</option>
               <option value="medium">Medium</option>
               <option value="hard">Hard</option>
             </select>
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
             {loadingQuestion ? "Generating..." : "🎲 Generate New Question"}
           </button>
         </div>


         {/* Chat */}
         <div style={{ flex: 1, overflowY: "auto", padding: "15px" }}>
           {messages.length === 0 && (
             <p
               style={{
                 color: "#888",
                 textAlign: "center",
                 marginTop: "20px",
               }}
             >
               Generate a question to start
             </p>
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
                 {msg.role === "user" ? "You" : "AI Interviewer"}{" "}
                 {msg.streaming && "▋"}
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


         {/* Hint/Review Buttons */}
         {messages.length > 0 && (
           <div
             style={{
               padding: "10px",
               borderTop: "1px solid #3e3e42",
               display: "flex",
               gap: "8px",
             }}
           >
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


         {/* Input Box */}
         <div
           style={{
             padding: "10px",
             borderTop: "1px solid #3e3e42",
           }}
         >
           <div style={{ display: "flex", gap: "8px" }}>
             <input
               type="text"
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => e.key === "Enter" && sendMessage()}
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
                 background:
                   sending || !input.trim() ? "#555" : "#007acc",
                 color: "white",
                 border: "none",
                 borderRadius: "4px",
                 cursor:
                   sending || !input.trim() ? "not-allowed" : "pointer",
               }}
             >
               Send
             </button>
           </div>
         </div>
       </div>


       {/* Right Panel */}
       <div
         style={{
           flex: 1,
           display: "flex",
           flexDirection: "column",
           overflow: "hidden",
         }}
       >
         {/* Top toolbar */}
         <div
           style={{
             padding: "10px",
             background: "#252526",
             borderBottom: "1px solid #3e3e42",
             display: "flex",
             gap: "10px",
             alignItems: "center",
           }}
         >
           <label
             style={{
               color: "white",
               display: "flex",
               alignItems: "center",
               gap: "8px",
             }}
           >
             Language:
             <select
               value={language?.id ?? ""}
               onChange={(e) => handleLanguageChangeById(e.target.value)}
               style={{
                 padding: "8px",
                 background: "#3c3c3c",
                 color: "white",
                 border: "1px solid #555",
                 borderRadius: "4px",
                 minWidth: "180px",
               }}
             >
               <option value="" disabled>
                 Select language
               </option>
               {languages.map((l) => (
                 <option key={l.id} value={l.id}>
                   {l.name}
                 </option>
               ))}
             </select>


           </label>


           <button
             onClick={() => setShowCLI(!showCLI)}
             style={{
               padding: "8px 16px",
               background: showCLI ? "#007acc" : "#3a3a3c",
               color: "white",
               border: "1px solid #555",
               borderRadius: "4px",
               cursor: "pointer",
             }}
           >
             {showCLI ? "📟 CLI On" : "📟 CLI Off"}
           </button>


           {questionData?.testCases && questionData.testCases.length > 0 && (
             <button
               onClick={runTestCases}
               disabled={runningTests}
               style={{
                 padding: "8px 16px",
                 background: runningTests ? "#555" : "#ff9800",
                 color: "white",
                 border: "none",
                 borderRadius: "4px",
                 cursor: runningTests ? "not-allowed" : "pointer",
               }}
             >
               {runningTests ? "Testing..." : `🧪 Run Tests (${totalTests})`}
             </button>
           )}


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


         {/* Main content: Editor + CLI + Output */}
         <div
           style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
         >
           {/* Editor */}
           <div style={{ flex: 1, overflow: "hidden" }}>
             <Editor
               key={language?.id ?? "editor-blank"}
               height="100%"
               language={language?.monaco || "plaintext"}
               theme="vs-dark"
               value={code}
               onChange={(value) => setCode(value || "")}
               options={{ fontSize: 14, minimap: { enabled: false }, wordWrap: "on" }}
             />


           </div>


           {/* Terminal vs Output */}
           {showCLI ? (
             <div
               style={{
                 flex: 1,
                 display: "flex",
                 flexDirection: "column",
                 borderTop: "1px solid #3e3e42",
                 background: "#1e1e1e",
               }}
             >
               <div
                 style={{
                   padding: "10px",
                   fontWeight: "bold",
                   color: "#fff",
                   borderBottom: "1px solid #3e3e42",
                 }}
               >
                 Terminal
               </div>


               <div
                 style={{
                   flex: 1,
                   padding: "10px",
                   overflowY: "auto",
                   color: "#0f0",
                   fontFamily: "monospace",
                   fontSize: "13px",
                   background: "#1e1e1e",
                 }}
               >
                 {terminalLines.map((line, i) => (
                   <div key={i}>{line}</div>
                 ))}
                 <div ref={terminalRef} />
               </div>


               <input
                 type="text"
                 value={cliInput}
                 onChange={(e) => setCliInput(e.target.value)}
                 onKeyDown={handleCliKeyPress}
                 placeholder='Select "Run Code" then type standard input here and press Enter...'
                 style={{
                   padding: "10px",
                   border: "none",
                   borderTop: "1px solid #3e3e42",
                   background: "#1e1e1e",
                   color: "#0f0",
                   fontFamily: "monospace",
                   fontSize: "13px",
                 }}
               />
             </div>
           ) : (
             <div
               style={{
                 height: "100px",
                 background: "#1e1e1e",
                 borderTop: "1px solid #3e3e42",
                 padding: "10px",
                 overflowY: "auto",
               }}
             >
               <div
                 style={{ color: "#888", fontSize: "12px", marginBottom: "5px" }}
               >
                 OUTPUT:
               </div>
               <pre
                 style={{
                   color: "#0f0",
                   fontSize: "13px",
                   margin: 0,
                   fontFamily: "monospace",
                 }}
               >
                 {output || "Click 'Run Code' to see output"}
               </pre>
             </div>
           )}


           {/* Test Results */}
           {testResults.length > 0 && (
            <div
              style={{
                maxHeight: "200px",
                background: "#1e1e1e",
                borderTop: "1px solid #3e3e42",
                padding: "10px",
                overflowY: "auto",
              }}
            >
              {testResults.map((result, i) => (
                <div key={i} style={{ marginBottom: "8px" }}>
                  <div>Input: {result.input}</div>
                  <div>Expected: {result.expectedOutput}</div>
                  <div>Output: {result.actualOutput}</div>
                  <div style={{ color: result.passed ? "lightgreen" : "tomato" }}>
                    {result.passed ? "Passed ✅" : "Failed ❌"}
                  </div>
                  {result.stderr && <div style={{ color: "orange" }}>Error: {result.stderr}</div>}
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