import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  getUserWorkspaces,
  createWorkspace,
  joinWorkspace,
  deleteWorkspace,
} from "../services/api";

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newName, setNewName] = useState("");
  const [joinId, setJoinId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const data = await getUserWorkspaces();
      setWorkspaces(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load workspaces.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setActionLoading(true);
    setError("");
    try {
      const workspace = await createWorkspace(newName.trim());
      navigate(`/editor/${workspace.roomId}`, { state: { username: user.name } });
    } catch (err) {
      console.error(err);
      setError("Failed to create workspace.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinId.trim()) return;
    setActionLoading(true);
    setError("");
    try {
      const workspace = await joinWorkspace(joinId.trim());
      navigate(`/editor/${workspace.roomId}`, { state: { username: user.name } });
    } catch (err) {
      console.error(err);
      setError("Failed to join workspace. It may not exist.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (roomId) => {
    if (!window.confirm("Are you sure you want to delete this workspace?")) return;
    try {
      await deleteWorkspace(roomId);
      setWorkspaces(workspaces.filter((w) => w.roomId !== roomId));
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to delete workspace.");
    }
  };

  const enterWorkspace = (roomId) => {
    navigate(`/editor/${roomId}`, { state: { username: user.name } });
  };

  return (
    <div className="relative min-h-screen bg-[#050508] overflow-auto selection:bg-indigo-500/30 font-sans text-slate-200 pb-12">
      {/* Background Effects */}
      <div className="fixed top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none opacity-30" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-12">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400 drop-shadow-sm mb-2">
              Dashboard
            </h1>
            <p className="text-slate-400 font-medium">
              Welcome back, <span className="text-white">{user?.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/[0.03] backdrop-blur-md border border-indigo-500/20 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-[0_4px_20px_rgba(79,70,229,0.15)] animate-[fadeIn_0.5s_ease-out]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
              </div>
              <div>
                <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Credits Remaining</p>
                <p className="text-xl font-bold text-white leading-tight">{user?.credits ?? 0}</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 px-4 py-3 rounded-2xl text-sm font-semibold transition-all shadow-[0_4px_20px_rgba(239,68,68,0.1)] flex items-center gap-2"
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-8 flex items-center gap-2 animate-[fadeIn_0.3s_ease-out]">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Create Workspace Card */}
          <div className="bg-white/[0.02] backdrop-blur-[12px] border border-white/[0.05] p-6 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-white/[0.1] transition-colors relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white relative z-10">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>
              Create Workspace
            </h2>
            <form onSubmit={handleCreate} className="space-y-4 relative z-10">
              <input
                type="text"
                placeholder="Workspace Name"
                className="w-full bg-black/20 border border-white/[0.06] rounded-xl px-4 py-3 text-sm outline-none transition-all focus:bg-white/[0.03] focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-semibold rounded-xl py-3 text-sm shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
              >
                {actionLoading ? "Creating..." : "Create"}
              </button>
            </form>
          </div>

          {/* Join Workspace Card */}
          <div className="bg-white/[0.02] backdrop-blur-[12px] border border-white/[0.05] p-6 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-white/[0.1] transition-colors relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white relative z-10">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
              Join Workspace
            </h2>
            <form onSubmit={handleJoin} className="space-y-4 relative z-10">
              <input
                type="text"
                placeholder="Workspace Invite ID"
                className="w-full bg-black/20 border border-white/[0.06] rounded-xl px-4 py-3 text-sm font-mono outline-none transition-all focus:bg-white/[0.03] focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
              />
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-white/[0.05] hover:bg-white/[0.1] text-white font-semibold border border-white/[0.1] rounded-xl py-3 text-sm transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
              >
                {actionLoading ? "Joining..." : "Join"}
              </button>
            </form>
          </div>
        </div>

        {/* Workspaces List Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            My Workspaces
          </h2>

          {loading ? (
             <div className="flex flex-col items-center justify-center py-20">
               <div className="relative w-10 h-10 flex items-center justify-center mb-4">
                 <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
                 <div className="absolute inset-1.5 rounded-full border-t-2 border-purple-500 animate-[spin_1.5s_linear_infinite_reverse]"></div>
               </div>
               <p className="text-slate-400 text-sm">Loading workspaces...</p>
             </div>
          ) : workspaces.length === 0 ? (
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/[0.05] flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
              </div>
              <h3 className="text-lg font-bold text-slate-300 mb-2">No workspaces found</h3>
              <p className="text-slate-500 text-sm max-w-sm">
                Create a new workspace or join an existing one to start collaborating.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {workspaces.map((ws) => {
                const isOwner = ws.ownerId?._id === user?._id;
                return (
                  <div 
                    key={ws._id}
                    className="group bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] hover:border-indigo-500/30 rounded-2xl p-5 transition-all shadow-sm hover:shadow-[0_4px_20px_rgba(79,70,229,0.1)] flex flex-col cursor-pointer mt-1"
                    onClick={() => enterWorkspace(ws.roomId)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-lg text-white truncate max-w-[70%]" title={ws.name}>
                        {ws.name}
                      </h3>
                      <div className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${isOwner ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/20' : 'bg-slate-500/20 text-slate-300 border border-slate-500/20'}`}>
                        {isOwner ? "Owner" : "Collab"}
                      </div>
                    </div>
                    
                    <div className="text-xs text-slate-400 font-mono mb-4 flex items-center gap-2">
                       <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                       {ws.roomId}
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/[0.05]">
                      <span className="text-xs text-slate-500 font-medium tracking-wide">
                        {new Date(ws.updatedAt || ws.createdAt).toLocaleDateString()}
                      </span>
                      
                      {isOwner && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(ws.roomId);
                          }}
                          className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Delete Workspace"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
