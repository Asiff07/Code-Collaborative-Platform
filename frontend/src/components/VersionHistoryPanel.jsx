import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

const VersionHistoryPanel = ({ roomId, onClose, token }) => {
  const { user } = useContext(AuthContext);
  const [commits, setCommits] = useState([]);
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revertLoading, setRevertLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmRevertId, setConfirmRevertId] = useState(null);

  useEffect(() => {
    fetchData();
  }, [roomId, token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch Workspace to see permissions
      const wsRes = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/workspaces/${roomId}`, { headers });
      setWorkspace(wsRes.data);

      // Fetch Commits
      const commitsRes = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/commits/${roomId}`, { headers });
      setCommits(commitsRes.data);

    } catch (err) {
      console.error("Error fetching version history:", err);
      setError("Failed to load history.");
    } finally {
      setLoading(false);
    }
  };

  const handleRevert = async (commitId) => {
    try {
      setRevertLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/commits/revert`, { roomId, commitId }, { headers });
      setConfirmRevertId(null);
      // We don't need to manually update code here because the socket "code-update" will handle it
    } catch (err) {
      console.error("Revert error:", err);
      alert(err.response?.data?.message || "Failed to revert code");
    } finally {
      setRevertLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const ownerIdStr = workspace?.ownerId?._id || workspace?.ownerId;
  const isOwner = user && ownerIdStr && String(ownerIdStr) === String(user._id);

  return (
    <div className="w-[350px] h-full bg-[#0a0a0f] border-l border-white/[0.05] flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-40 relative">
      <div className="h-14 flex items-center justify-between px-6 border-b border-white/[0.05] bg-black/40">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          Version History
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {loading ? (
          <div className="flex justify-center items-center h-20">
            <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-red-400 text-sm text-center">{error}</div>
        ) : commits.length === 0 ? (
          <div className="text-slate-500 text-sm text-center mt-10">No commits found for this workspace.</div>
        ) : (
          <div className="relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700/50 before:to-transparent">
            {commits.map((commit, index) => (
              <div key={commit._id} className={"relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-3 pl-8 md:pl-0 mb-2"}>
                {/* Timeline dot */}
                <div className={`absolute left-0 md:left-1/2 md:-translate-x-1/2 w-[11px] h-[11px] rounded-full ring-4 ring-[#0a0a0f] ${commit.type === 'manual' ? 'bg-indigo-500' : 'bg-slate-500'} mt-1.5`} />
                <div className={`w-full md:w-[calc(50%-1.5rem)] md:odd:pr-6 md:even:pl-6`}>
                  <div className="bg-white/[0.03] border border-white/[0.05] p-3 rounded-lg shadow-sm hover:bg-white/[0.05] transition-colors relative">
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${commit.type === 'manual' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-500/20 text-slate-300'}`}>
                        {commit.type}
                      </span>
                      <span className="text-[10px] text-slate-500">{formatDate(commit.createdAt)}</span>
                    </div>
                    
                    {commit.message && (
                      <p className="text-sm text-slate-200 mt-2 font-medium">{commit.message}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      {commit.createdBy}
                    </p>

                    {isOwner && (
                      <div className="mt-3 flex justify-end">
                        {confirmRevertId === commit._id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setConfirmRevertId(null)}
                              className="text-xs px-2 py-1 text-slate-400 hover:text-white transition-colors"
                              disabled={revertLoading}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleRevert(commit._id)}
                              className="text-xs px-2 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-md transition-colors border border-red-500/30 flex items-center gap-1"
                              disabled={revertLoading}
                            >
                              {revertLoading ? <div className="w-3 h-3 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div> : "Confirm"}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmRevertId(commit._id)}
                            className="text-xs px-2 py-1 text-slate-400 hover:text-white border border-white/10 rounded-md hover:bg-white/5 transition-all flex items-center gap-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="16 1 21 5 16 9"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path><polyline points="8 23 3 19 8 15"></polyline></svg>
                            Revert
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionHistoryPanel;
