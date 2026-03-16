import React, { useEffect, useRef } from "react";

const Video = ({ peer, username }) => {
  const ref = useRef();

  useEffect(() => {
    peer.on("stream", (stream) => {
      if (ref.current) {
        ref.current.srcObject = stream;
      }
    });
  }, [peer]);

  return (
    <div className="relative group w-full aspect-video rounded-xl overflow-hidden bg-black/40 border border-white/10 shadow-lg">
      <video
        playsInline
        autoPlay
        ref={ref}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
        {username}
      </div>
    </div>
  );
};

const VideoGrid = ({ localStream, peers, currentUser, onToggleMic, onToggleCam, onShareScreen, isMicOn, isCamOn, isSharingScreen }) => {
  const localVideoRef = useRef();

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  return (
    <div className="fixed bottom-6 right-20 z-50 flex flex-col items-end gap-4 pointer-events-none">
      {/* Peers Grid */}
      <div className="grid grid-cols-1 gap-3 w-48 pointer-events-auto">
        {/* Local Stream */}
        <div className="relative group w-full aspect-video rounded-xl overflow-hidden bg-black/40 border-2 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
          <video
            playsInline
            muted
            autoPlay
            ref={localVideoRef}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-indigo-500 px-2 py-1 rounded-md text-[10px] font-bold text-white shadow-lg">
            You
          </div>
        </div>

        {/* Remote Peers */}
        {peers.map((peerObj) => (
          <Video 
            key={peerObj.peerID} 
            peer={peerObj.peer} 
            username={peerObj.username} 
          />
        ))}
      </div>

      {/* Controls Bar */}
      <div className="flex items-center gap-2 bg-[#0a0a0f]/80 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl pointer-events-auto">
        <button
          onClick={onToggleMic}
          className={`p-2.5 rounded-xl transition-all ${isMicOn ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-red-500/20 text-red-500 border border-red-500/20'}`}
          title={isMicOn ? "Mute" : "Unmute"}
        >
          {isMicOn ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="2" x2="22" y2="22"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/><path d="M5 10v2a7 7 0 0 0 12 5"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
          )}
        </button>

        <button
          onClick={onToggleCam}
          className={`p-2.5 rounded-xl transition-all ${isCamOn ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-red-500/20 text-red-500 border border-red-500/20'}`}
          title={isCamOn ? "Stop Video" : "Start Video"}
        >
          {isCamOn ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 16 3 3 3-3"/><path d="m22 8-6 4 6 4V8Z"/><path d="M2 6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6Z"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
          )}
        </button>

        <div className="w-px h-6 bg-white/10 mx-1" />

        <button
          onClick={onShareScreen}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${isSharingScreen ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="14" x="3" y="3" rx="2"/><path d="M17 21H7"/><path d="M12 17v4"/></svg>
          {isSharingScreen ? "Stop Share" : "Share Screen"}
        </button>
      </div>
    </div>
  );
};

export default VideoGrid;
