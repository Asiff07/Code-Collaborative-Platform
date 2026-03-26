import React, { useEffect, useRef, useState, useCallback } from "react";

// ─── Single remote peer video tile ─────────────────────────────────────────
const RemoteVideo = ({ peer, username, isMicOn = true, isCamOn = true }) => {
  const [stream, setStream] = useState(null);

  useEffect(() => {
    if (!peer) return;

    const handleStream = (remoteStream) => {
      setStream(remoteStream);
    };

    // React 18 / Chrome 120+ track-level listener fallback
    const handleTrack = (track, remoteStream) => {
      setStream(remoteStream);
    };

    peer.on("stream", handleStream);
    peer.on("track", handleTrack);

    // Handle case where stream already arrived
    if (peer.streams && peer.streams.length > 0) {
      handleStream(peer.streams[0]);
    } else if (peer._remoteStreams && peer._remoteStreams.length > 0) {
      handleStream(peer._remoteStreams[0]);
    }

    return () => {
      peer.off("stream", handleStream);
      peer.off("track", handleTrack);
    };
  }, [peer]);

  // Use a callback ref to safely attach the stream when the <video> element mounts
  const videoRef = useCallback((node) => {
    if (node && stream) {
      node.srcObject = stream;
      node.play().catch(() => {});
    }
  }, [stream]);

  const initial = username ? username[0].toUpperCase() : "?";

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#1a1a2e] border border-white/10 shadow-xl flex items-center justify-center group">
      {stream && isCamOn ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            {initial}
          </div>
          <p className="text-slate-400 text-sm">{stream ? "Camera Off" : "Connecting…"}</p>
        </div>
      )}

      {/* Username label */}
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-semibold text-white shadow">
        {username}
        {!isMicOn && (
          <div className="text-red-400 ml-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="2" x2="22" y2="22"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/><path d="M5 10v2a7 7 0 0 0 12 5"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Local video tile ───────────────────────────────────────────────────────
const LocalVideo = ({ stream, username, isMicOn, isCamOn }) => {
  const videoRef = useCallback((node) => {
    if (node && stream) {
      node.srcObject = stream;
      node.play().catch(() => {});
    }
  }, [stream]);

  const initial = username ? username[0].toUpperCase() : "Y";

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#1a1a2e] border-2 border-indigo-500/50 shadow-xl flex items-center justify-center">
      {isCamOn && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover scale-x-[-1]" // mirror effect
        />
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg"
            style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
          >
            {initial}
          </div>
          <p className="text-slate-400 text-sm">Camera Off</p>
        </div>
      )}

      {/* Labels */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2">
        <div className="bg-indigo-600 px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow">
          You
        </div>
        {!isMicOn && (
          <div className="bg-red-600/80 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="2" x2="22" y2="22"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/><path d="M5 10v2a7 7 0 0 0 12 5"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
            Muted
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Icon components ────────────────────────────────────────────────────────
const MicOnIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>
  </svg>
);
const MicOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" y1="2" x2="22" y2="22"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/><path d="M5 10v2a7 7 0 0 0 12 5"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><line x1="12" y1="19" x2="12" y2="22"/>
  </svg>
);
const CamOnIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>
  </svg>
);
const CamOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m16 16 3 3 3-3"/><path d="m22 8-6 4 6 4V8Z"/><path d="M2 6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6Z"/><line x1="2" y1="2" x2="22" y2="22"/>
  </svg>
);
const ScreenShareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="14" x="3" y="3" rx="2"/><path d="M17 21H7"/><path d="M12 17v4"/>
  </svg>
);
const LeaveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

// ─── Layout helper ──────────────────────────────────────────────────────────
const getGridClass = (count) => {
  if (count === 1) return "grid-cols-1 grid-rows-1";
  if (count === 2) return "grid-cols-2 grid-rows-1";
  if (count <= 4) return "grid-cols-2 grid-rows-2";
  if (count <= 6) return "grid-cols-3 grid-rows-2";
  return "grid-cols-3 grid-rows-3";
};

// ─── Main VideoGrid ─────────────────────────────────────────────────────────
const VideoGrid = ({
  localStream,
  peers,
  currentUser,
  onToggleMic,
  onToggleCam,
  onShareScreen,
  onLeaveCall,
  isMicOn,
  isCamOn,
  isSharingScreen,
}) => {
  const totalTiles = peers.length + 1; // +1 for local
  const gridClass = getGridClass(totalTiles);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0d0d1a]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-black/40 backdrop-blur-md border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white font-semibold text-sm tracking-wide">Video Call</span>
          <span className="text-slate-400 text-xs bg-white/[0.06] px-2 py-0.5 rounded-full border border-white/10">
            {totalTiles} participant{totalTiles !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="text-slate-500 text-xs">
          Collab Code — {isSharingScreen ? "📺 You are sharing your screen" : ""}
        </div>
      </div>

      {/* Video Grid */}
      <div className={`flex-1 grid ${gridClass} gap-3 p-4 overflow-hidden`}>
        {/* Local Video — always first */}
        <LocalVideo
          stream={localStream}
          username={currentUser}
          isMicOn={isMicOn}
          isCamOn={isCamOn}
        />

        {/* Remote Peers */}
        {peers.map((peerObj) => (
          <RemoteVideo
            key={peerObj.peerID}
            peer={peerObj.peer}
            username={peerObj.username}
            isMicOn={peerObj.isMicOn}
            isCamOn={peerObj.isCamOn}
          />
        ))}
      </div>

      {/* Controls Bar */}
      <div className="shrink-0 flex items-center justify-center gap-3 px-6 py-4 bg-black/40 backdrop-blur-md border-t border-white/10">
        {/* Mic */}
        <button
          onClick={onToggleMic}
          title={isMicOn ? "Mute" : "Unmute"}
          className={`
            flex flex-col items-center gap-1 group
          `}
        >
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200
            ${isMicOn
              ? "bg-white/10 hover:bg-white/20 text-white"
              : "bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]"
            }
          `}>
            {isMicOn ? <MicOnIcon /> : <MicOffIcon />}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">{isMicOn ? "Mute" : "Unmute"}</span>
        </button>

        {/* Camera */}
        <button
          onClick={onToggleCam}
          title={isCamOn ? "Stop Camera" : "Start Camera"}
          className="flex flex-col items-center gap-1"
        >
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200
            ${isCamOn
              ? "bg-white/10 hover:bg-white/20 text-white"
              : "bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]"
            }
          `}>
            {isCamOn ? <CamOnIcon /> : <CamOffIcon />}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">{isCamOn ? "Stop Cam" : "Start Cam"}</span>
        </button>

        {/* Screen Share */}
        <button
          onClick={onShareScreen}
          title={isSharingScreen ? "Stop Sharing" : "Share Screen"}
          className="flex flex-col items-center gap-1"
        >
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200
            ${isSharingScreen
              ? "bg-indigo-500 hover:bg-indigo-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]"
              : "bg-white/10 hover:bg-white/20 text-white"
            }
          `}>
            <ScreenShareIcon />
          </div>
          <span className="text-[10px] text-slate-400 font-medium">{isSharingScreen ? "Stop Share" : "Share Screen"}</span>
        </button>

        {/* Divider */}
        <div className="w-px h-10 bg-white/10 mx-2" />

        {/* Leave */}
        <button
          onClick={onLeaveCall}
          title="Leave Call"
          className="flex flex-col items-center gap-1"
        >
          <div className="w-14 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all duration-200 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)]">
            <LeaveIcon />
          </div>
          <span className="text-[10px] text-red-400 font-medium">Leave</span>
        </button>
      </div>
    </div>
  );
};

export default VideoGrid;
