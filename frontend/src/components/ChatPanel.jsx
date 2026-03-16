import React, { useState, useEffect, useRef } from "react";

const ChatPanel = ({ messages, onSendMessage, currentUser, onClose }) => {
  const [inputText, setInputText] = useState("");
  const scrollContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    if (inputText.length > 500) return; // Client-side check

    onSendMessage(inputText.trim());
    setInputText("");
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-80 h-full bg-white/[0.02] backdrop-blur-[24px] border-l border-white/[0.05] flex flex-col relative shrink-0">
      <div className="p-5 border-b border-white/[0.05] bg-black/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          </div>
          <h2 className="text-slate-200 text-sm font-bold tracking-wide">Team Chat</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-slate-500 bg-white/[0.05] px-2 py-1 rounded-md">{messages.length}</span>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>

      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5"
      >
        {messages.map((msg, idx) => {
          const isOwn = msg.username === currentUser;
          return (
            <div key={idx} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
              <div className="flex items-baseline gap-2 mb-1.5 px-1">
                <span className="text-[11px] font-bold text-indigo-300 line-clamp-1">{msg.username} {isOwn && <span className="text-slate-500 font-medium">(You)</span>}</span>
                <span className="text-[9px] font-medium text-slate-500 flex-shrink-0">{formatTime(msg.ts)}</span>
              </div>
              <div className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed max-w-[90%] break-words shadow-sm ${
                isOwn 
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-tr-sm' 
                  : 'bg-white/[0.05] border border-white/[0.05] text-slate-200 rounded-tl-sm'
              }`}>
                {msg.message}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-5 border-t border-white/[0.05] bg-black/20">
        <form onSubmit={handleSend} className="relative group">
          <input
            type="text"
            className="w-full bg-black/40 border border-white/[0.06] rounded-xl pl-4 pr-12 py-3.5 text-slate-200 text-sm outline-none transition-all duration-300 focus:bg-white/[0.03] focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 placeholder-slate-500"
            placeholder="Type your message..."
            value={inputText}
            maxLength={500}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-400 hover:text-white hover:bg-indigo-500 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-indigo-400"
            disabled={!inputText.trim()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`${inputText.trim() ? 'translate-x-0.5 -translate-y-0.5' : ''} transition-transform`}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;
