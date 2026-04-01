import React, { useRef, useEffect, useState, useContext } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import AiActionPanel from "./AiActionPanel";
import LivePreview from "./LivePreview";

const CodeEditor = ({
  socket,
  roomId,
  initialCode,
  initialLanguage,
  currentUser,
  onUpdateCredits,
  activePanel
}) => {
  const [language, setLanguage] = useState(initialLanguage || "javascript");
  const [isEditorReady, setIsEditorReady] = useState(false);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const isRemoteChange = useRef(false);
  const cursorDecorationsRef = useRef({});
  const [selectedCode, setSelectedCode] = useState("");

  const [outputTerminalHeight, setOutputTerminalHeight] = useState(0);
  const [executionOutput, setExecutionOutput] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const { user } = useContext(AuthContext);
  const [isCommitting, setIsCommitting] = useState(false);
  const lastCommittedCodeRef = useRef(initialCode || "");
  const typingTimeoutRef = useRef(null);
  
  const previewRef = useRef(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isManualPreview, setIsManualPreview] = useState(false);
  const [isHtmlLike, setIsHtmlLike] = useState(false);

  const runCode = async () => {
    if (!editorRef.current) return;
    const code = editorRef.current.getValue();
    setIsExecuting(true);
    setOutputTerminalHeight(250); // Open terminal
    setExecutionOutput(null);
    try {
      const { executeCode } = await import("../services/api");
      const result = await executeCode(language, code);
      setExecutionOutput(result);
    } catch (err) {
      // Axios error from backend usually in err.response.data.message
      setExecutionOutput({ error: err.response?.data?.message || err.message || "Execution failed" });
    } finally {
      setIsExecuting(false);
    }
  };

  const triggerCommit = async (code, type, message = "") => {
    if (!user?.token) return;
    try {
      setIsCommitting(true);
      const headers = { Authorization: `Bearer ${user.token}` };
      await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/commits`, {
        roomId,
        codeContent: code,
        type,
        message
      }, { headers });
      lastCommittedCodeRef.current = code;
    } catch (err) {
      console.error("Commit error:", err);
      // Ignore 400 identical code or 429 rate limit silently for auto, alert for manual
      if (type === "manual") {
        alert(err.response?.data?.message || "Failed to commit");
      }
    } finally {
      setIsCommitting(false);
    }
  };

  const manualCommit = () => {
    if (!editorRef.current) return;
    const code = editorRef.current.getValue();
    if (code === lastCommittedCodeRef.current) {
      alert("No changes to commit.");
      return;
    }
    const message = window.prompt("Enter commit message:");
    if (message === null) return; // User cancelled
    triggerCommit(code, "manual", message || "Manual Commit");
  };

  useEffect(() => {
    setLanguage(initialLanguage);
  }, [initialLanguage]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Fix cursor drift by remeasuring fonts after custom web fonts load
    document.fonts.ready.then(() => {
      monaco.editor.remeasureFonts();
    });

    isRemoteChange.current = true;
    editor.setValue(initialCode || "");
    isRemoteChange.current = false;

    editor.onDidChangeCursorPosition((e) => {
      if (!socket || !roomId || !currentUser) return;
      socket.emit("cursor-move", {
        roomId,
        username: currentUser,
        lineNumber: e.position.lineNumber,
        column: e.position.column,
      });
    });

    editor.onDidChangeCursorSelection((e) => {
      const selection = e.selection;
      const model = editor.getModel();
      if (!model) return;
      const text = model.getValueInRange(selection);
      setSelectedCode(text);
    });

    setIsEditorReady(true);
  };

  const handleEditorChange = (value) => {
    if (!socket || !roomId) return;
    
    const lowerVal = value.toLowerCase();
    const htmlLike = lowerVal.includes("<html") || lowerVal.includes("<head") || lowerVal.includes("<body") || lowerVal.includes("<style");
    if (htmlLike !== isHtmlLike) setIsHtmlLike(htmlLike);
    
    if (isPreviewOpen && previewRef.current && !isManualPreview) {
      previewRef.current.syncCode(value);
    }
    
    if (!isRemoteChange.current) {
      socket.emit("code-change", { roomId, code: value });

      // Auto commit logic
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (value !== lastCommittedCodeRef.current) {
          triggerCommit(value, "auto");
        }
      }, 15000); // 15 seconds idle
    }
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    if (socket && roomId) {
      socket.emit("language-change", { roomId, language: newLang });
    }
  };

  useEffect(() => {
    if (!socket || !isEditorReady || !editorRef.current || !monacoRef.current) return;

    const onCodeUpdate = (newCode) => {
      isRemoteChange.current = true;
      const currentPos = editorRef.current.getPosition();
      editorRef.current.setValue(newCode);
      if (currentPos) {
        editorRef.current.setPosition(currentPos);
      }
      isRemoteChange.current = false;
      lastCommittedCodeRef.current = newCode;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      const htmlLike = newCode.toLowerCase().includes("<html") || newCode.toLowerCase().includes("<head") || newCode.toLowerCase().includes("<body") || newCode.toLowerCase().includes("<style");
      if (htmlLike !== isHtmlLike) setIsHtmlLike(htmlLike);

      if (isPreviewOpen && previewRef.current && !isManualPreview) {
        previewRef.current.syncCode(newCode);
      }
    };

    const onCursorUpdate = ({ socketId, username, color, lineNumber, column }) => {
      const monaco = monacoRef.current;
      const editor = editorRef.current;
      if (!monaco || !editor) return;

      const oldDec = cursorDecorationsRef.current[socketId] || [];
      const cssColorClass = `remote-cursor-${socketId}`;

      if (!document.getElementById(cssColorClass)) {
        const style = document.createElement("style");
        style.id = cssColorClass;
        style.innerHTML = `
          .${cssColorClass} {
            border-left: 2px solid ${color} !important;
            position: absolute;
          }
          .${cssColorClass}::before {
            content: '${username}';
            position: absolute;
            top: -18px;
            left: -2px;
            background: ${color};
            color: #111;
            font-size: 10px;
            padding: 2px 4px;
            border-radius: 4px;
            white-space: nowrap;
            font-weight: 600;
            pointer-events: none;
            z-index: 50;
          }
        `;
        document.head.appendChild(style);
      }

      const newDecoration = {
        range: new monaco.Range(lineNumber, column, lineNumber, column),
        options: {
          className: cssColorClass,
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      };

      cursorDecorationsRef.current[socketId] = editor.deltaDecorations(
        oldDec,
        [newDecoration]
      );
    };

    const onLanguageUpdate = (newLang) => {
      setLanguage(newLang);
    };

    const onUserLeft = (usersList) => {
      const editor = editorRef.current;
      if (!editor) return;
      Object.keys(cursorDecorationsRef.current).forEach(socketId => {
        editor.deltaDecorations(cursorDecorationsRef.current[socketId], []);
      });
      cursorDecorationsRef.current = {};
    };

    socket.on("code-update", onCodeUpdate);
    socket.on("cursor-update", onCursorUpdate);
    socket.on("language-update", onLanguageUpdate);
    socket.on("user-left", onUserLeft);

    return () => {
      socket.off("code-update", onCodeUpdate);
      socket.off("cursor-update", onCursorUpdate);
      socket.off("language-update", onLanguageUpdate);
      socket.off("user-left", onUserLeft);
    };
  }, [socket, isEditorReady]);

  return (
    <div className="flex h-full w-full bg-transparent overflow-hidden">
      <div className="flex flex-col flex-1 h-full min-w-0">
        <div className="h-14 bg-white/[0.02] border-b border-white/[0.05] flex items-center justify-between px-6 backdrop-blur-sm z-10 relative flex-shrink-0">
        <div className="flex gap-4 items-center">
          <div className="flex gap-2 mr-2">
            <div className="w-3 h-3 rounded-full bg-[#FF5F56] shadow-[0_0_8px_rgba(255,95,86,0.5)]"></div>
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E] shadow-[0_0_8px_rgba(255,189,46,0.5)]"></div>
            <div className="w-3 h-3 rounded-full bg-[#27C93F] shadow-[0_0_8px_rgba(39,201,63,0.5)]"></div>
          </div>
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-md border border-white/[0.05]">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <span className="text-slate-300 text-xs font-semibold font-mono tracking-wide">
              {roomId}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {["javascript", "typescript", "python", "java", "cpp"].includes(language) && (
            <button
              onClick={runCode}
              disabled={isExecuting}
              className="flex items-center gap-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition-all shadow-green-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Run Code"
            >
              {isExecuting ? (
                <div className="w-3.5 h-3.5 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              )}
              Run
            </button>
          )}

          <button
            onClick={manualCommit}
            disabled={isCommitting}
            className="flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition-all shadow-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Commit Code"
          >
            {isCommitting ? (
              <div className="w-3.5 h-3.5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            )}
            Commit
          </button>

          {(language === "html" || isHtmlLike || isPreviewOpen) && (
            <button
              onClick={() => setIsPreviewOpen(!isPreviewOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm transition-all ${
                isPreviewOpen 
                  ? "bg-pink-500/20 border border-pink-500/40 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.3)]" 
                  : "bg-black/40 text-slate-400 border border-white/[0.08] hover:border-pink-500/30 hover:text-pink-400"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              {isPreviewOpen ? "Close Preview" : "Live Preview"}
            </button>
          )}

          <div className="relative">
            <select
              value={language}
            onChange={handleLanguageChange}
            className="appearance-none bg-black/40 border border-white/[0.08] text-slate-300 text-xs font-semibold rounded-lg pl-4 pr-10 py-2 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer shadow-inner shadow-black/50"
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="json">JSON</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
        </div>
      </div>

      <div className="flex-1 w-full h-full relative flex flex-col min-h-0">
        <div className="flex flex-1 min-h-0 w-full overflow-hidden relative">
          <div className="flex flex-1 min-w-0 relative h-full">
            <Editor
              height="100%"
              width="100%"
              language={language}
              theme="vs-dark"
              onMount={handleEditorDidMount}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineHeight: 24,
                padding: { top: 24 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                formatOnPaste: true,
                contextmenu: true,
                scrollbar: {
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8,
                },
              }}
              loading={
                <div className="absolute inset-0 flex flex-col gap-4 items-center justify-center bg-transparent text-slate-400">
                  <div className="relative w-10 h-10 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
                    <div className="absolute inset-1.5 rounded-full border-t-2 border-purple-500 animate-[spin_1.5s_linear_infinite_reverse]"></div>
                  </div>
                  <p className="text-sm font-medium tracking-wide">Initializing Editor...</p>
                </div>
              }
            />
          </div>
          
          {isPreviewOpen && (
            <div className={`transition-all duration-300 ease-in-out h-full flex flex-col min-w-0 ${isPreviewOpen ? 'w-1/2 flex-none' : 'w-0'}`}>
              <LivePreview 
                ref={previewRef}
                initialCode={editorRef.current?.getValue() || initialCode}
                isManual={isManualPreview}
                onToggleMode={() => setIsManualPreview(!isManualPreview)}
              />
            </div>
          )}
        </div>

        {/* Output Terminal */}
        {outputTerminalHeight > 0 && (
          <div 
            style={{ height: outputTerminalHeight }} 
            className="w-full bg-[#0a0a0f] border-t border-white/[0.1] flex flex-col z-20 flex-shrink-0"
          >
            <div className="flex items-center justify-between px-4 py-2 bg-black/40 border-b border-white/[0.05]">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 tracking-wide uppercase">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
                Output Terminal
              </div>
              <button 
                onClick={() => setOutputTerminalHeight(0)}
                className="text-slate-500 hover:text-white transition-colors"
                title="Close Terminal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4 font-mono text-sm scrollbar-thin">
              {isExecuting ? (
                <div className="text-slate-500 flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                  Executing code on remote server...
                </div>
              ) : executionOutput?.error ? (
                <div className="text-red-400 whitespace-pre-wrap">{executionOutput.error}</div>
              ) : executionOutput?.compile || executionOutput?.run ? (
                <div className="whitespace-pre-wrap">
                  {executionOutput.compile?.output && (
                    <div className="text-yellow-400 mb-2">{executionOutput.compile.output}</div>
                  )}
                  {executionOutput.run?.stdout && (
                    <div className="text-slate-300">{executionOutput.run.stdout}</div>
                  )}
                  {executionOutput.run?.stderr && (
                    <div className="text-red-400">{executionOutput.run.stderr}</div>
                  )}
                  {!executionOutput.compile?.output && !executionOutput.run?.stdout && !executionOutput.run?.stderr && (
                    <div className="text-slate-500 italic">Program exited with no output.</div>
                  )}
                  {executionOutput.run && (
                    <div className="mt-4 pt-2 border-t border-white/[0.05] text-slate-500 text-xs flex gap-4">
                      <span>Exit Code: {executionOutput.run.code}</span>
                      {executionOutput.run.signal && <span>Signal: {executionOutput.run.signal}</span>}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
      </div>
      
      {/* AI Assistant Panel */}
      {activePanel === "ai" && (
        <AiActionPanel 
          socket={socket}
          roomId={roomId}
          currentUser={currentUser}
          selectedCode={selectedCode} 
          language={language}
          onUpdateCredits={onUpdateCredits}
        />
      )}
    </div>
  );
};

export default CodeEditor;
