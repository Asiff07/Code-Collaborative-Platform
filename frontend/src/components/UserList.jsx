import React from "react";
import { useNavigate } from "react-router-dom";

const getInitials = (name) => {
  return name.substring(0, 2).toUpperCase();
};

const UserList = ({ users, copyRoomId, currentUser }) => {
  const navigate = useNavigate();

  const handleLeave = () => {
    navigate("/", { replace: true });
  };

  return (
    <div className="w-64 h-full bg-white/[0.02] backdrop-blur-[24px] flex flex-col pt-6 relative shrink-0">
      <div className="px-5 mb-8">
        <h2 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-3">Workspace Session</h2>
        <div className="flex items-center gap-2">
          <div className="bg-black/40 border border-white/[0.05] text-indigo-300 text-xs px-3 py-2 rounded-lg w-full overflow-hidden text-ellipsis whitespace-nowrap font-mono shadow-inner shadow-black/50">
            {copyRoomId}
          </div>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(copyRoomId);
            }}
            className="flex-shrink-0 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.05] p-2 rounded-lg transition-all text-slate-400 hover:text-white hover:scale-105 active:scale-95"
            title="Copy Room ID"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </button>
        </div>
      </div>

      <div className="px-5 mb-3">
        <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center justify-between">
          <span>Collaborators</span>
          <span className="bg-white/10 text-white px-2 py-0.5 rounded-full text-[9px]">{users.length}</span>
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 pb-4 space-y-2.5">
        {users.map((user, index) => (
          <div key={index} className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all group ${user.username === currentUser ? 'bg-indigo-500/[0.08] border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'bg-white/[0.02] border-white/[0.03] hover:bg-white/[0.05]'}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div 
                className="w-8 h-8 rounded-full flex shrink-0 items-center justify-center text-[11px] font-bold text-slate-900 shadow-sm ring-2 ring-white/10"
                style={{ backgroundColor: user.color, boxShadow: `0 0 12px ${user.color}40` }}
              >
                {getInitials(user.username)}
              </div>
              <div className="flex flex-col">
                <span className={`truncate text-sm font-medium transition-colors ${user.username === currentUser ? 'text-indigo-200' : 'text-slate-200 group-hover:text-white'}`}>
                  {user.username}
                </span>
                {user.username === currentUser && (
                  <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">You</span>
                )}
              </div>
            </div>
            
            {user.credits !== undefined && (
              <div className="shrink-0 flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-md ml-2" title={`${user.credits} AI credits remaining`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                <span className="text-[10px] font-bold text-indigo-300 font-mono">{user.credits}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="p-5 border-t border-white/[0.05] bg-black/20">
        <div className="flex items-center justify-between mb-5 px-1">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-500/90">Connected</span>
          </div>
        </div>
        <button 
          onClick={handleLeave}
          className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 text-red-400 hover:text-red-300 rounded-xl py-3 text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 group"
        >
          <svg className="group-hover:-translate-x-1 transition-transform" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          Leave Workspace
        </button>
      </div>
    </div>
  );
};

export default UserList;
