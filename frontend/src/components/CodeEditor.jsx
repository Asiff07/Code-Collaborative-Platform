import React, { useRef, useEffect, useState } from "react";
import Editor from "@monaco-editor/react";

const CodeEditor = ({
  socket,
  roomId,
  initialCode,
  initialLanguage,
  currentUser,
}) => {
  const [language, setLanguage] = useState(initialLanguage || "javascript");
  const [isEditorReady, setIsEditorReady] = useState(false);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const isRemoteChange = useRef(false);
  const cursorDecorationsRef = useRef({});

  useEffect(() => {
    setLanguage(initialLanguage);
  }, [initialLanguage]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

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

    setIsEditorReady(true);
  };

  const handleEditorChange = (value) => {
    if (!socket || !roomId) return;
    
    if (!isRemoteChange.current) {
      socket.emit("code-change", { roomId, code: value });
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
    <div className="flex flex-col h-full bg-transparent">
      <div className="h-14 bg-white/[0.02] border-b border-white/[0.05] flex items-center justify-between px-6 backdrop-blur-sm z-10 relative">
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

      <div className="flex-1 w-full h-full relative">
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
    </div>
  );
};

export default CodeEditor;
