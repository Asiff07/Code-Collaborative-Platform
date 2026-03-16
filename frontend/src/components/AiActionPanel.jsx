import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { requestAiReview, requestAiExplain, requestAiAssist } from "../services/api";

const AiActionPanel = ({ socket, roomId, currentUser, selectedCode, language, onUpdateCredits, onAiSuggestion }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState(null); // 'review', 'explain', 'assist'
  const [error, setError] = useState("");

  const handleAiAction = async (actionType) => {
    if (!selectedCode) {
      setError("Please select some code in the editor first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult("");
    setMode(actionType);

    try {
      let data;
      if (actionType === "review") {
        data = await requestAiReview(selectedCode, language);
      } else if (actionType === "explain") {
        data = await requestAiExplain(selectedCode, language);
      } else if (actionType === "assist") {
        if (!prompt.trim()) {
          setError("Please enter a prompt for assistance.");
          setLoading(false);
          return;
        }
        data = await requestAiAssist(prompt, selectedCode, language);
      }

      setResult(data.result);
      setResult(data.result);
      if (data.credits !== undefined) {
        if (onUpdateCredits) onUpdateCredits(data.credits);
        if (socket && roomId && currentUser) {
          socket.emit("refresh-credits", { roomId, username: currentUser });
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "AI Request Failed. Check credits.");
    } finally {
      setLoading(false);
    }
  };

  const hasContent = result || loading || error || mode === 'assist';

  return (
    <div className="flex flex-col bg-[#0f0f16] border-l border-white/[0.05] w-[350px] h-full flex-shrink-0 relative overflow-hidden text-slate-200">
      
      {/* Header */}
      <div className="h-14 min-h-[56px] bg-white/[0.02] border-b border-white/[0.05] flex items-center justify-between px-5 backdrop-blur-sm z-10 sticky top-0">
        <h2 className="text-sm font-bold tracking-wide flex items-center gap-2 text-indigo-300">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          Gemini AI Assistant
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 flex flex-col gap-6 relative z-10">
        
        {/* Actions Menu */}
        <div className="flex flex-col gap-3">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Actions (1 Credit Each)</p>
          
          <button 
            onClick={() => handleAiAction("review")}
            disabled={loading || !selectedCode}
            className="flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] hover:border-indigo-500/30 p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M9 15L11 17L15 13"></path></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">Code Review</p>
              <p className="text-[10px] text-slate-500">Analyze selected code for improvements</p>
            </div>
          </button>

          <button 
            onClick={() => handleAiAction("explain")}
            disabled={loading || !selectedCode}
            className="flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] hover:border-purple-500/30 p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">Explain Code</p>
              <p className="text-[10px] text-slate-500">Get a beginner-friendly explanation</p>
            </div>
          </button>

          <button 
            onClick={() => setMode("assist")}
            disabled={loading || !selectedCode}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group text-left border ${mode === 'assist' ? 'bg-white/[0.08] border-green-500/30' : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.05] hover:border-green-500/30'}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${mode === 'assist' ? 'bg-green-500 text-white' : 'bg-green-500/20 text-green-300 group-hover:bg-green-500 group-hover:text-white'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">Ask / Generate</p>
              <p className="text-[10px] text-slate-500">Ask details or request code refactoring</p>
            </div>
          </button>
        </div>

        {/* Dynamic Display Area */}
        {hasContent && (
          <div className="flex flex-col flex-1 border-t border-white/[0.05] pt-5 animate-[fadeIn_0.3s_ease-out]">
            
            {mode === 'assist' && !result && !loading && (
              <div className="flex flex-col gap-3 h-full">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Your Request</p>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., Rewrite this function to be iterative instead of recursive..."
                  className="w-full bg-black/30 border border-white/[0.1] rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-green-500/50 resize-y min-h-[100px]"
                />
                <button
                  onClick={() => handleAiAction("assist")}
                  disabled={loading || !prompt.trim()}
                  className="btn-glow !bg-green-600 !shadow-none !w-full"
                >
                  Submit Prompt
                </button>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center h-40 gap-4 opacity-70">
                <div className="relative w-8 h-8 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
                  <div className="absolute inset-1 rounded-full border-t-2 border-purple-500 animate-[spin_1.5s_linear_infinite_reverse]"></div>
                </div>
                <span className="text-xs tracking-wider text-slate-400 font-medium">Gemini is thinking...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs leading-relaxed flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                {error}
              </div>
            )}

            {result && !loading && (
              <div className="flex flex-col gap-2 relative">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.05]">
                  <p className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">AI Response</p>
                  <button onClick={() => {setResult(''); setMode(null);}} className="text-slate-500 hover:text-white transition-colors">
                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
                <div className="text-sm text-slate-300 leading-relaxed bg-black/20 p-4 rounded-xl border border-white/[0.05] overflow-auto max-h-[400px] scrollbar-thin markdown-body">
                  <ReactMarkdown
                    components={{
                      code({node, inline, className, children, ...props}) {
                        return !inline ? (
                          <pre className="bg-[#050508] border border-white/10 p-3 rounded-lg overflow-x-auto my-3 text-[11px] font-mono shadow-inner shadow-black/50">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        ) : (
                          <code className="bg-indigo-500/20 text-indigo-200 px-1.5 py-0.5 rounded-md text-xs font-mono" {...props}>
                            {children}
                          </code>
                        )
                      },
                      p({node, children}) {
                        return <p className="mb-3 last:mb-0 text-[13px]">{children}</p>
                      },
                      ul({node, children}) {
                        return <ul className="list-disc pl-5 mb-3 space-y-1 text-[13px] text-slate-300/90">{children}</ul>
                      },
                      ol({node, children}) {
                        return <ol className="list-decimal pl-5 mb-3 space-y-1 text-[13px] text-slate-300/90">{children}</ol>
                      },
                      h1({node, children}) {
                        return <h1 className="text-lg font-bold text-white mb-3 mt-5 pb-1 border-b border-white/10">{children}</h1>
                      },
                      h2({node, children}) {
                        return <h2 className="text-base font-bold text-indigo-100 mb-2 mt-4">{children}</h2>
                      },
                      h3({node, children}) {
                        return <h3 className="text-sm font-bold text-indigo-300 mb-2 mt-3">{children}</h3>
                      },
                      strong({node, children}) {
                        return <strong className="font-semibold text-slate-100">{children}</strong>
                      },
                      blockquote({node, children}) {
                        return <blockquote className="border-l-2 border-indigo-500/50 pl-3 py-1 my-3 bg-indigo-500/5 rounded-r text-slate-400 italic">{children}</blockquote>
                      }
                    }}
                  >
                    {result}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AiActionPanel;
