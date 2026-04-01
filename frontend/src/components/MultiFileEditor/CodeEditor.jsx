import React, { useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";

export default function CodeEditor({ file, filename, onChange, onSaveShortcut, onNewShortcut, onDeleteShortcut, editorErrors }) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Map Keyboard shortcuts natively inside Monaco
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSaveShortcut();
    });
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyN, () => {
      onNewShortcut();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyW, () => {
      onDeleteShortcut();
    });
  };

  const handleChange = (value) => {
    onChange(filename, value || "");
  };

  // Map errors into Monaco markers
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const monaco = monacoRef.current;
    
    if (file?.language === "javascript" && editorErrors && editorErrors.length > 0) {
      const markers = editorErrors.map(err => ({
        message: err.msg || err.data?.[0] || 'Error',
        severity: monaco.MarkerSeverity.Error,
        startLineNumber: err.line,
        startColumn: 1,
        endLineNumber: err.line,
        endColumn: 1000,
      }));
      monaco.editor.setModelMarkers(editorRef.current.getModel(), "live-preview", markers);
    } else {
      monaco.editor.setModelMarkers(editorRef.current.getModel(), "live-preview", []);
    }
  }, [editorErrors, file]);

  if (!file) {
    return (
      <div className="flex w-full h-full items-center justify-center text-slate-500 bg-[#050508]">
        No active file selected
      </div>
    );
  }

  return (
    <div className="w-full h-full relative flex flex-col bg-[#050508]">
      <div className="h-10 border-b border-white/10 flex flex-shrink-0 items-center justify-between px-4 bg-[#0a0a0f]">
        <div className="text-sm text-slate-300 font-mono flex items-center gap-2">
          {filename.endsWith('.html') && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-orange-400" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>}
          {filename.endsWith('.css') && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-blue-400" stroke="currentColor" strokeWidth="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>}
          {filename.endsWith('.js') && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-yellow-400" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>}
          <span>{filename}</span>
        </div>
      </div>
      <div className="flex-1 relative">
        <Editor
          height="100%"
          width="100%"
          language={file.language}
          value={file.content}
          theme="vs-dark"
          onMount={handleEditorDidMount}
          onChange={handleChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            wordWrap: "on",
            padding: { top: 16 },
            scrollBeyondLastLine: false,
          }}
          loading={
            <div className="flex w-full h-full items-center justify-center text-slate-500">
              Loading Editor...
            </div>
          }
        />
      </div>
    </div>
  );
}
