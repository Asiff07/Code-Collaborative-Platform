import React, { useState, useEffect, useRef } from "react";

export default function LivePreview({ files, isAuto, forceRender, onToggleAuto, onRunManual, onErrorsChange }) {
  const [srcDoc, setSrcDoc] = useState("");
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deviceWidth, setDeviceWidth] = useState("100%");
  const debounceRef = useRef(null);
  const logEndRef = useRef(null);

  const generateSrcDoc = () => {
    const htmlContent = files["index.html"]?.content || "";
    const cssContent = files["style.css"]?.content || "";
    const jsContent = files["script.js"]?.content || "";

    const safeScript = `
      <script>
        const _log = console.log;
        const _warn = console.warn;
        const _error = console.error;
        const _info = console.info;

        function postLog(level, args) {
          try {
            window.parent.postMessage({ 
              type: "playground-log", 
              level, 
              data: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)) 
            }, "*");
          } catch(e) {
             window.parent.postMessage({ type: "playground-log", level, data: ["Unserializable log output"] }, "*");
          }
        }

        console.log = function(...args) { postLog("log", args); _log && _log.apply(console, args); };
        console.warn = function(...args) { postLog("warn", args); _warn && _warn.apply(console, args); };
        console.error = function(...args) { postLog("error", args); _error && _error.apply(console, args); };
        console.info = function(...args) { postLog("info", args); _info && _info.apply(console, args); };

        window.onerror = function(msg, url, line) {
          window.parent.postMessage({ type: "playground-log", level: "error", data: [msg], line }, "*");
          return false;
        };
        
        window.addEventListener('unhandledrejection', function(event) {
          window.parent.postMessage({
            type: "playground-log",
            level: "error",
            data: [event.reason ? event.reason.toString() : "Unhandled Promise Rejection"]
          }, "*");
        });
      </script>
    `;

    // To cleanly capture exact user-JS line errors, we place it in exactly 
    // structured tags so we know its start offset.
    const beforeJS = `<!DOCTYPE html>
<html>
  <head>
    <style>${cssContent}</style>
${safeScript}
  </head>
  <body>
    ${htmlContent}
    <script>
      try {
// [JS_BOUND]`;

    // We calculate the number of newlines that exist *before* the JS content physically starts.
    const offsetLines = beforeJS.split("\\n").length;
    
    // Inject the offset globally for the iframe to consume natively
    const formattedPre = beforeJS.replace(
      'window.onerror = function(msg, url, line) {', 
      `window.__jsOffset = ${offsetLines};
       window.onerror = function(msg, url, line) {
         const actualLine = Math.max(1, line - window.__jsOffset);`);

         // Also replace catch line
    const afterJS = `
      } catch (e) {
        const offset = ${offsetLines};
        const activeLine = typeof e.lineNumber !== 'undefined' ? Math.max(1, e.lineNumber - offset) : 0;
        window.parent.postMessage({ type: "playground-log", level: "error", data: [e.message], line: activeLine }, "*");
      }
    </script>
  </body>
</html>`;

    return formattedPre + '\\n' + jsContent + afterJS;
  };

  const updatePreview = () => {
    setSrcDoc(generateSrcDoc());
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isAuto) return;
    setIsLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updatePreview();
    }, 400); // UI loading gives context, standard 400 debounce
    return () => clearTimeout(debounceRef.current);
  }, [files, isAuto]);

  useEffect(() => {
    if (forceRender > 0) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setIsLoading(true);
      // Let React render loading state rapidly before injection freeze
      setTimeout(() => updatePreview(), 10);
    }
  }, [forceRender]);

  useEffect(() => {
    updatePreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleMsg = (e) => {
      if (e.data && e.data.type === "playground-log") {
        setLogs(prev => {
          const newLogs = [...prev, e.data];
          return newLogs.slice(-50);
        });
      }
    };
    window.addEventListener("message", handleMsg);
    return () => window.removeEventListener("message", handleMsg);
  }, []);

  // Bubble up errors uniquely to Monaco 
  useEffect(() => {
    const errorLogs = logs.filter(l => l.level === "error");
    if (onErrorsChange) {
      onErrorsChange(errorLogs.map(err => ({
        msg: err.data.join(" "),
        line: err.line || 1
      })));
    }
  }, [logs, onErrorsChange]);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  useEffect(() => {
    setLogs([]);
  }, [srcDoc]);

  return (
    <div className="flex flex-col w-full h-full bg-[#1e1e24] relative overflow-hidden">
      <div className="h-10 bg-[#0a0a0f] border-b border-white/10 flex items-center justify-between px-4 flex-shrink-0 z-10 w-full">
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
            Output
            {isLoading && <span className="text-[10px] text-indigo-400 normal-case flex items-center gap-1 animate-pulse"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Running...</span>}
          </span>
          <div className="flex items-center gap-1 bg-[#1e1e24] p-0.5 rounded border border-white/10">
            <button
              onClick={() => setDeviceWidth("100%")}
              className={`p-1 rounded transition-colors text-slate-400 ${deviceWidth === "100%" ? "bg-white/10 text-white" : "hover:text-slate-200"}`}
              title="Desktop"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
            </button>
            <button
              onClick={() => setDeviceWidth("768px")}
              className={`p-1 rounded transition-colors text-slate-400 ${deviceWidth === "768px" ? "bg-white/10 text-white" : "hover:text-slate-200"}`}
              title="Tablet"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
            </button>
            <button
              onClick={() => setDeviceWidth("375px")}
              className={`p-1 rounded transition-colors text-slate-400 ${deviceWidth === "375px" ? "bg-white/10 text-white" : "hover:text-slate-200"}`}
              title="Mobile"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleAuto}
            className={`text-xs font-semibold px-2 py-1 rounded transition-colors ${
              isAuto ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-white/5 text-slate-400 border border-white/10"
            }`}
          >
            {isAuto ? "Auto" : "Auto: OFF"}
          </button>
          {!isAuto && (
            <button
              onClick={onRunManual}
              className="text-xs font-bold px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded transition-colors shadow shadow-indigo-500/20 flex items-center gap-1"
              title="Ctrl+S"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              Run
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 relative bg-[repeating-linear-gradient(45deg,#1a1a1e_25%,transparent_25%,transparent_75%,#1a1a1e_75%,#1a1a1e),repeating-linear-gradient(45deg,#1a1a1e_25%,#1e1e24_25%,#1e1e24_75%,#1a1a1e_75%,#1a1a1e)] bg-[length:20px_20px] bg-[0_0,10px_10px] min-h-0 flex flex-col items-center justify-center p-4">
        <div 
          className="bg-white rounded-md shadow-2xl relative transition-all duration-300 ease-in-out border border-white/10"
          style={{ width: deviceWidth, height: '100%', maxWidth: '100%', overflow: 'hidden' }}
        >
          <iframe
            sandbox="allow-scripts"
            srcDoc={srcDoc}
            className="w-full h-full border-none absolute top-0 left-0 bg-white"
            title="Playground Preview"
          />
        </div>
      </div>

      <div className="h-48 bg-[#1e1e24] flex flex-col flex-shrink-0 w-full shadow-[inset_0_10px_20px_rgba(0,0,0,0.5)] border-t border-black/50">
        <div className="flex items-center justify-between px-4 py-1.5 bg-black/40 border-b border-white/5">
          <div className="text-slate-400 font-bold text-xs uppercase flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
            Console ({logs.length})
          </div>
          <button onClick={() => setLogs([])} className="text-xs text-slate-500 hover:text-white px-2 py-0.5 rounded hover:bg-white/10 transition-colors">
            Clear
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] scrollbar-thin">
          {logs.length === 0 && <div className="text-slate-600 italic">No output...</div>}
          {logs.map((log, i) => {
            let colorClass = "text-slate-300";
            if (log.level === "error") colorClass = "text-red-400 bg-red-500/10 px-1 rounded";
            if (log.level === "warn") colorClass = "text-yellow-400";
            if (log.level === "info") colorClass = "text-blue-400";
            return (
              <div key={i} className={`mb-1.5 pb-1 ${log.level === 'error' ? '' : 'border-b border-white/5 last:border-0'} flex flex-col`}>
                <div className={colorClass}>
                  {log.line ? <span className="text-red-500 font-bold mr-2">Line {log.line}:</span> : null}
                  {log.data.join(" ")}
                </div>
              </div>
            );
          })}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
}
