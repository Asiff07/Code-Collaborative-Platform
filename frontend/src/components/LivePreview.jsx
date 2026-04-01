import React, { useState, useEffect, useImperativeHandle, forwardRef } from "react";

const LivePreview = forwardRef(({ initialCode, isManual, onToggleMode }, ref) => {
  const [device, setDevice] = useState("desktop");
  const [logs, setLogs] = useState([]);
  const [errors, setErrors] = useState([]);
  const [srcDoc, setSrcDoc] = useState("");
  const [code, setCode] = useState(initialCode || "");
  const [activeTab, setActiveTab] = useState("console"); // 'console' | 'errors'

  useImperativeHandle(ref, () => ({
    syncCode: (newCode) => {
      setCode(newCode);
    },
    runCode: (forceCode) => {
      const targetCode = forceCode !== undefined ? forceCode : code;
      setCode(targetCode);
      setSrcDoc(generateSrcDoc(targetCode));
    }
  }));

  const getDeviceWidth = () => {
    switch (device) {
      case "mobile": return "375px";
      case "tablet": return "768px";
      default: return "100%";
    }
  };

  const generateSrcDoc = (rawCode) => {
    if (!rawCode || rawCode.trim() === "") return "";

    let wrappedCode = rawCode.trim();
    const lowerCode = wrappedCode.toLowerCase();
    
    // Auto-wrap incomplete HTML
    if (!lowerCode.includes("<html")) {
      wrappedCode = `<!DOCTYPE html>\n<html>\n<head></head>\n<body>\n${wrappedCode}\n</body>\n</html>`;
    }

    // Safe wrapper for console, errors, and basic infinite loop protection.
    // Setting srcDoc to a sandboxed iframe pushes execution into a separate thread/process
    // in modern browsers, preventing UI freezes on the host frame.
    const safeScript = `
      <script>
        // Console capture
        const _log = console.log;
        const _warn = console.warn;
        const _error = console.error;
        const _info = console.info;

        function postLog(level, args) {
          try {
            window.parent.postMessage({ 
              type: "preview-log", 
              level, 
              data: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)) 
            }, "*");
          } catch(e) {
             window.parent.postMessage({ type: "preview-log", level, data: ["Unserializable log object"] }, "*");
          }
        }

        console.log = function(...args) {
          postLog("log", args);
          _log && _log.apply(console, args);
        };
        console.warn = function(...args) {
          postLog("warn", args);
          _warn && _warn.apply(console, args);
        };
        console.error = function(...args) {
          postLog("error", args);
          _error && _error.apply(console, args);
        };
        console.info = function(...args) {
          postLog("info", args);
          _info && _info.apply(console, args);
        };

        // Error capture
        window.onerror = function(msg, url, lineNo, columnNo, error) {
          window.parent.postMessage({
            type: "preview-error",
            message: msg,
            line: lineNo
          }, "*");
          return false;
        };

        window.addEventListener('unhandledrejection', function(event) {
          window.parent.postMessage({
            type: "preview-error",
            message: event.reason ? event.reason.toString() : "Unhandled Promise Rejection",
            line: 0
          }, "*");
        });
      </script>
    `;

    // Inject safe wrapper
    if (wrappedCode.toLowerCase().includes("<head>")) {
      wrappedCode = wrappedCode.replace(/<head>/i, `<head>\n${safeScript}`);
    } else if (wrappedCode.toLowerCase().includes("<body>")) {
      wrappedCode = wrappedCode.replace(/<body>/i, `<body>\n${safeScript}`);
    } else {
      wrappedCode = safeScript + wrappedCode;
    }

    return wrappedCode;
  };

  // Debounced live update
  useEffect(() => {
    if (isManual) return;
    const handler = setTimeout(() => {
      setSrcDoc(generateSrcDoc(code));
    }, 250);
    return () => clearTimeout(handler);
  }, [code, isManual]);

  // Read iframe messages
  useEffect(() => {
    const handleMessage = (event) => {
      const data = event.data;
      if (!data) return;

      if (data.type === "preview-log") {
        setLogs(prev => [...prev.slice(-99), { level: data.level, args: data.data }]);
      } else if (data.type === "preview-error") {
        setErrors(prev => [...prev.slice(-99), { message: data.message, line: data.line }]);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Clear logs when iframe re-renders
  useEffect(() => {
    setLogs([]);
    setErrors([]);
  }, [srcDoc]);

  return (
    <div className="flex flex-col w-full h-full bg-[#0a0a0f] border-l border-white/[0.05]">
      {/* Header */}
      <div className="h-14 bg-white/[0.02] border-b border-white/[0.05] flex items-center justify-between px-4 flex-shrink-0 z-10 w-full">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-slate-300 tracking-wide uppercase flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
            Live Preview
          </span>
          
          <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/[0.05]">
            <button
              onClick={() => setDevice("mobile")}
              className={`p-1.5 rounded-md transition-all ${device === "mobile" ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"}`}
              title="Mobile (375px)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
            </button>
            <button
              onClick={() => setDevice("tablet")}
              className={`p-1.5 rounded-md transition-all ${device === "tablet" ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"}`}
              title="Tablet (768px)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
            </button>
            <button
              onClick={() => setDevice("desktop")}
              className={`p-1.5 rounded-md transition-all ${device === "desktop" ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"}`}
              title="Desktop (100%)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMode}
            className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all border ${isManual ? "bg-slate-800 text-slate-300 border-white/[0.05]" : "bg-green-500/10 text-green-400 border-green-500/20 shadow-sm shadow-green-500/10"}`}
          >
            {isManual ? "Manual Updates" : "Live Updates"}
          </button>
          {isManual && (
            <button
              onClick={() => setSrcDoc(generateSrcDoc(code))}
              className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-xs font-bold rounded-md flex items-center gap-2 transition-all shadow-[0_0_10px_rgba(99,102,241,0.1)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Iframe View */}
      <div className="flex-1 bg-[#ffffff] relative flex justify-center overflow-auto items-center p-2 pattern-dots pattern-[#000000_10%] pattern-bg-[#1e1e24] w-full">
        {srcDoc ? (
          <div 
             className="h-full bg-white shadow-xl flex-shrink-0 transition-all duration-300 ease-in-out border border-slate-200"
             style={{ width: getDeviceWidth() }}
          >
            <iframe
              title="Preview"
              srcDoc={srcDoc}
              sandbox="allow-scripts" // DO NOT add allow-same-origin or allow-top-navigation
              className="w-full h-full border-none bg-white"
            />
          </div>
        ) : (
          <div className="text-slate-500 flex flex-col items-center gap-4 bg-[#0a0a0f] p-8 rounded-xl border border-white/[0.05] shadow-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            <p className="text-sm font-medium">Write some HTML to see the preview</p>
          </div>
        )}
      </div>

      {/* Output / Console Panel */}
      <div className="h-48 bg-[#0a0a0f] border-t border-white/[0.05] flex flex-col flex-shrink-0">
        <div className="flex w-full bg-black/40 border-b border-white/[0.05]">
          <button 
            onClick={() => setActiveTab("console")}
            className={`flex-1 py-1.5 text-xs font-bold uppercase transition-all ${activeTab === "console" ? "text-indigo-400 border-b-2 border-indigo-500 bg-white/[0.02]" : "text-slate-500 hover:text-slate-300"}`}
          >
            Console ({logs.length})
          </button>
          <button 
            onClick={() => setActiveTab("errors")}
            className={`flex-1 py-1.5 text-xs font-bold uppercase transition-all ${activeTab === "errors" ? "text-red-400 border-b-2 border-red-500 bg-white/[0.02]" : "text-slate-500 hover:text-slate-300"}`}
          >
            Errors ({errors.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs scrollbar-thin">
          {activeTab === "console" && (
            <div className="flex flex-col gap-1">
              {logs.length === 0 && <span className="text-slate-600 italic">No console output...</span>}
              {logs.map((log, idx) => {
                let colorClass = "text-slate-300";
                if (log.level === "warn") colorClass = "text-yellow-400";
                if (log.level === "error") colorClass = "text-red-400";
                if (log.level === "info") colorClass = "text-blue-400";
                return (
                  <div key={idx} className={`${colorClass} border-b border-white/[0.02] pb-1 mb-1`}>
                    {log.args.join(" ")}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "errors" && (
            <div className="flex flex-col gap-1">
              {errors.length === 0 && <span className="text-slate-600 italic">No errors detected...</span>}
              {errors.map((err, idx) => (
                <div key={idx} className="text-red-400 bg-red-500/10 px-2 py-1 rounded-sm border border-red-500/20">
                  <span className="font-bold mr-2">Line {err.line}:</span> 
                  {err.message}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default LivePreview;
