import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidV4 } from "uuid";
import { createRoom } from "../services/api";

const RoomJoin = () => {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoin = (e) => {
    e.preventDefault();
    if (!roomId.trim() || !username.trim()) {
      setError("Please fill in both fields");
      return;
    }
    navigate(`/editor/${roomId.trim()}`, { state: { username: username.trim() } });
  };

  const handleCreateNewRoom = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Username is required to create a room");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const { roomId } = await createRoom();
      navigate(`/editor/${roomId}`, { state: { username: username.trim() } });
    } catch (err) {
      setError("Failed to create room. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnterKey = (e) => {
    if (e.code === "Enter") handleJoin(e);
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-[#050508] overflow-hidden selection:bg-indigo-500/30">
      
      {/* Abstract Glowing Orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none mix-blend-screen" />
      
      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none opacity-30" />

      {/* Main Glass Panel */}
      <div className="relative z-10 w-full max-w-[420px] mx-6">
        <div className="bg-white/[0.02] backdrop-blur-[24px] border border-white/[0.05] border-t-white/[0.1] border-l-white/[0.08] p-10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] animate-[fadeIn_0.6s_ease-out]">
          
          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-indigo-100 to-indigo-400 drop-shadow-sm mb-3">
              DevSync
            </h1>
            <p className="text-slate-400 font-medium text-sm tracking-wide">
              Real-time workspace for developers
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-6 text-center flex items-center justify-center gap-2 animate-[fadeIn_0.3s_ease-out]">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400/80 ml-1 uppercase tracking-wider">
                Display Name
              </label>
              <input
                type="text"
                placeholder="e.g. Alex"
                className="w-full bg-black/20 border border-white/[0.06] rounded-xl px-4 py-3.5 text-slate-200 text-sm outline-none transition-all duration-300 focus:bg-white/[0.03] focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyUp={handleEnterKey}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400/80 ml-1 uppercase tracking-wider">
                Workspace ID
              </label>
              <input
                type="text"
                placeholder="Paste room code here"
                className="w-full bg-black/20 border border-white/[0.06] rounded-xl px-4 py-3.5 text-slate-200 text-sm font-mono outline-none transition-all duration-300 focus:bg-white/[0.03] focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                onKeyUp={handleEnterKey}
              />
            </div>
            
            <button
              onClick={handleJoin}
              disabled={isLoading}
              className="group relative w-full flex items-center justify-center gap-2 rounded-xl mt-4 px-6 py-3.5 font-semibold text-sm text-white transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 group-hover:opacity-90 transition-opacity"></div>
              <div className="absolute inset-0 w-full h-full bg-gradient-to-bl from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              <span className="relative drop-shadow-md">Join Workspace</span>
              <svg className="relative w-4 h-4 group-hover:translate-x-1 transition-transform" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>

            <div className="relative flex py-5 items-center">
              <div className="flex-grow border-t border-white/[0.06]"></div>
              <span className="flex-shrink-0 mx-4 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                Autogenerate
              </span>
              <div className="flex-grow border-t border-white/[0.06]"></div>
            </div>

            <button
              onClick={handleCreateNewRoom}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] hover:border-white/[0.1] text-slate-300 hover:text-white rounded-xl px-6 py-3.5 text-sm font-medium transition-all duration-300"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>
                  Create New Workspace
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomJoin;
