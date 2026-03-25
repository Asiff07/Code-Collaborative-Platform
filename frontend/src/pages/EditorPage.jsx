import React, { useEffect, useState, useRef, useCallback } from "react";
import Peer from "simple-peer";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import useSocket from "../hooks/useSocket";
import { AuthContext } from "../context/AuthContext";

import UserList from "../components/UserList";
import CodeEditor from "../components/CodeEditor";
import ChatPanel from "../components/ChatPanel";
import VideoGrid from "../components/VideoGrid";
import CreditPlansPanel from "../components/CreditPlansPanel";

const EditorPage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = React.useContext(AuthContext);

  const handleCreditUpdate = (newCredits) => {
    if (user) {
      const updatedUser = { ...user, credits: newCredits };
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  const username = location.state?.username || user?.name;
  const { socket } = useSocket();

  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [initialCode, setInitialCode] = useState("");
  const [initialLanguage, setInitialLanguage] = useState("javascript");
  const [isReady, setIsReady] = useState(false);
  const [activePanel, setActivePanel] = useState(null); // 'chat', 'ai', or null

  // WebRTC State
  const [peers, setPeers] = useState([]); // [{ peerID, peer, username }]
  const [localStream, setLocalStream] = useState(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [callStarted, setCallStarted] = useState(false);

  // Use a Map keyed by peerID to avoid duplicates and race conditions
  const peersMap = useRef(new Map()); // peerID -> { peer, username }
  const localStreamRef = useRef(null); // always holds the latest localStream
  const screenTrackRef = useRef(null);

  // Keep localStreamRef in sync
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // Helper: sync peersMap → React state
  const syncPeersState = useCallback(() => {
    const arr = [];
    peersMap.current.forEach((val, peerID) => {
      arr.push({ peerID, peer: val.peer, username: val.username, isMicOn: val.isMicOn, isCamOn: val.isCamOn });
    });
    setPeers([...arr]);
  }, []);

  // Helper: destroy and remove a peer by ID
  const removePeer = useCallback((peerID) => {
    const existing = peersMap.current.get(peerID);
    if (existing) {
      try { existing.peer.destroy(); } catch (_) {}
      peersMap.current.delete(peerID);
      syncPeersState();
    }
  }, [syncPeersState]);

  // ─── Room Join ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!username) {
      console.warn("No username found, redirecting to home");
      navigate("/", { replace: true });
      return;
    }

    if (socket.current) {
      const s = socket.current;

      s.emit("join-room", { roomId, username });

      s.on("sync-code", ({ code, language }) => {
        setInitialCode(code);
        setInitialLanguage(language || "javascript");
        setIsReady(true);
      });

      s.on("user-joined", (updatedUsers) => setUsers(updatedUsers));
      s.on("user-left", (updatedUsers) => setUsers(updatedUsers));

      s.on("receive-message", (msg) => {
        setMessages((prev) => [...prev, msg]);
      });

      // ── Handle Remote Media Toggles (Video Call UI) ──
      s.on("user-video-state-changed", ({ socketId, isMicOn, isCamOn }) => {
        const existing = peersMap.current.get(socketId);
        if (existing) {
          existing.isMicOn = isMicOn;
          existing.isCamOn = isCamOn;
          peersMap.current.set(socketId, existing);
          syncPeersState();
        }
      });

      s.on("error", (err) => {
        console.error("Socket error:", err);
        alert(err.message || "An error occurred");
        navigate("/");
      });
    }

    return () => {
      if (socket.current) {
        socket.current.off("sync-code");
        socket.current.off("user-joined");
        socket.current.off("user-left");
        socket.current.off("receive-message");
        socket.current.off("user-video-state-changed");
        socket.current.off("error");
      }
    };
  }, [roomId, username, navigate, socket, syncPeersState]);

  // ─── WebRTC ─────────────────────────────────────────────────────────────────
  // Free TURN servers (Open Relay Project) — required for cross-network / mobile
  const ICE_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:80?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ];

  const createPeer = useCallback((userToSignal, callerID, stream) => {
    const peer = new Peer({
      initiator: true,
      trickle: true,
      stream,
      config: { iceServers: ICE_SERVERS },
    });

    peer.on("signal", (signal) => {
      socket.current?.emit("sending-signal", {
        userToSignal,
        callerID,
        signal,
        callerUsername: username,
      });
    });

    peer.on("error", (err) => {
      console.warn("Peer error (initiator):", err.message);
      removePeer(userToSignal);
    });

    peer.on("close", () => removePeer(userToSignal));

    return peer;
  }, [socket, username, removePeer]);

  const addPeer = useCallback((incomingSignal, callerID, stream, callerUsername) => {
    const peer = new Peer({
      initiator: false,
      trickle: true,
      stream,
      config: { iceServers: ICE_SERVERS },
    });

    peer.on("signal", (signal) => {
      socket.current?.emit("returning-signal", { signal, callerID });
    });

    peer.on("error", (err) => {
      console.warn("Peer error (receiver):", err.message);
      removePeer(callerID);
    });

    peer.on("close", () => removePeer(callerID));

    peer.signal(incomingSignal);

    return peer;
  }, [socket, removePeer]);

  const startCall = useCallback(async () => {
    if (callStarted) {
      setIsCallOpen(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      localStreamRef.current = stream;
      setCallStarted(true);
      setIsCallOpen(true);

      const s = socket.current;
      if (!s) return;

      // ── Handle: an EXISTING user signals ME (they saw me join-video-group) ──
      s.on("user-joined-video", (payload) => {
        // payload: { signal, callerID, callerUsername, isMicOn, isCamOn }
        const existing = peersMap.current.get(payload.callerID);
        
        // Critical Fix: If peer already exists, this is NOT a new connection, 
        // it is a Simple-Peer 'trickle' ICE Candidate. Pass it directly!
        if (existing) {
          existing.peer.signal(payload.signal);
          return;
        }

        const peer = addPeer(
          payload.signal,
          payload.callerID,
          localStreamRef.current,
          payload.callerUsername
        );
        peersMap.current.set(payload.callerID, { 
          peer, 
          username: payload.callerUsername,
          isMicOn: payload.isMicOn ?? true,
          isCamOn: payload.isCamOn ?? true
        });
        syncPeersState();
      });

      // ── Handle: signal returned from receiver ──
      s.on("receiving-returned-signal", (payload) => {
        const existing = peersMap.current.get(payload.id);
        if (existing) {
          existing.peer.signal(payload.signal);
        }
      });

      // ── Handle: user leaves ──
      s.on("user-left-video", (socketId) => {
        removePeer(socketId);
      });

      // ── Request list of existing users → create offers ──
      s.emit("join-video-group", { roomId, isMicOn: true, isCamOn: true });

      s.on("all-users-video", (usersInRoom) => {
        // usersInRoom: [{ socketId, username, isMicOn, isCamOn }] — filtered to exclude us by server
        usersInRoom.forEach((userObj) => {
          if (userObj.socketId === s.id) return; // skip self
          if (peersMap.current.has(userObj.socketId)) return; // skip duplicates

          const peer = createPeer(userObj.socketId, s.id, localStreamRef.current);
          peersMap.current.set(userObj.socketId, { 
            peer, 
            username: userObj.username,
            isMicOn: userObj.isMicOn ?? true,
            isCamOn: userObj.isCamOn ?? true
          });
        });
        syncPeersState();
      });

    } catch (err) {
      console.error("Camera/mic access error:", err);
      if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
        alert("Video calling requires HTTPS on non-localhost. Use ngrok or a local SSL cert.");
      } else {
        alert("Could not access camera or microphone. Please check permissions.");
      }
    }
  }, [callStarted, socket, roomId, addPeer, createPeer, syncPeersState, removePeer]);

  const leaveCall = useCallback(() => {
    setIsCallOpen(false);
    // Destroy all peers
    peersMap.current.forEach(({ peer }) => {
      try { peer.destroy(); } catch (_) {}
    });
    peersMap.current.clear();
    setPeers([]);

    // Stop local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
      localStreamRef.current = null;
    }
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }
    setIsSharingScreen(false);
    setIsMicOn(true);
    setIsCamOn(true);
    setCallStarted(false);

    // Detach socket listeners
    if (socket.current) {
      socket.current.off("user-joined-video");
      socket.current.off("receiving-returned-signal");
      socket.current.off("all-users-video");
      socket.current.off("user-left-video");
    }
  }, [socket]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      leaveCall();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Mic / Camera / Screen Share ─────────────────────────────────────────
  const toggleMic = () => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
      socket.current?.emit("toggle-video-state", { roomId, isMicOn: audioTrack.enabled, isCamOn });
    }
  };

  const toggleCam = () => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCamOn(videoTrack.enabled);
      socket.current?.emit("toggle-video-state", { roomId, isMicOn, isCamOn: videoTrack.enabled });
    }
  };

  const toggleShareScreen = async () => {
    if (!isSharingScreen) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, cursor: "always" });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        const camVideoTrack = localStreamRef.current?.getVideoTracks()[0];
        peersMap.current.forEach(({ peer }) => {
          if (camVideoTrack && localStreamRef.current) {
            peer.replaceTrack(camVideoTrack, screenTrack, localStreamRef.current);
          }
        });

        setIsSharingScreen(true);

        screenTrack.onended = () => stopScreenShare();
      } catch (err) {
        console.error("Screen share error:", err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    const screenTrack = screenTrackRef.current;
    if (!screenTrack) return;

    const camVideoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (camVideoTrack && localStreamRef.current) {
      peersMap.current.forEach(({ peer }) => {
        peer.replaceTrack(screenTrack, camVideoTrack, localStreamRef.current);
      });
    }
    screenTrack.stop();
    screenTrackRef.current = null;
    setIsSharingScreen(false);
  };

  // ─── Chat ────────────────────────────────────────────────────────────────
  const handleSendMessage = (text) => {
    if (socket.current && roomId && username) {
      socket.current.emit("send-message", { roomId, username, message: text });
    }
  };

  // ─── Loading Screen ───────────────────────────────────────────────────────
  if (!isReady) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#050508] relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none opacity-20" />
        <div className="relative z-10 flex flex-col items-center gap-6 glass p-8 rounded-3xl border border-white/[0.05]">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-t-2 border-purple-500 animate-[spin_1.5s_linear_infinite_reverse]"></div>
          </div>
          <p className="text-slate-300 font-medium tracking-wide">Initializing Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#050508] relative selection:bg-indigo-500/30">
      {/* Dynamic Background */}
      <div className="absolute top-[-15%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none opacity-30" />

      {/* Main Workspace */}
      <div className="relative z-10 flex h-full w-full overflow-hidden">
        <UserList users={users} copyRoomId={roomId} currentUser={username} />

        <div className="flex-1 w-full h-full relative z-20 shadow-[0_0_40px_rgba(0,0,0,0.5)] border-x border-white/[0.05] bg-[#050508]/50 backdrop-blur-md min-w-0">
          <CodeEditor
            socket={socket.current}
            roomId={roomId}
            initialCode={initialCode}
            initialLanguage={initialLanguage}
            currentUser={username}
            onUpdateCredits={handleCreditUpdate}
            activePanel={activePanel}
          />
        </div>

        {activePanel === "chat" && (
          <ChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            currentUser={username}
            onClose={() => setActivePanel(null)}
          />
        )}

        {activePanel === "credits" && (
          <CreditPlansPanel
            onClose={() => setActivePanel(null)}
            currentUserCredits={user?.credits}
          />
        )}

        {/* Vertical Toolbar */}
        <div className="w-14 h-full bg-white/[0.02] backdrop-blur-[24px] border-l border-white/[0.05] flex flex-col items-center py-6 gap-6 shrink-0 z-30">
          <button
            onClick={() => setActivePanel(activePanel === "chat" ? null : "chat")}
            className={`p-3 rounded-xl transition-all ${activePanel === "chat" ? "bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]" : "text-slate-400 hover:text-white hover:bg-white/[0.05]"}`}
            title="Team Chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          </button>

          <button
            onClick={() => setActivePanel(activePanel === "ai" ? null : "ai")}
            className={`p-3 rounded-xl transition-all ${activePanel === "ai" ? "bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]" : "text-slate-400 hover:text-white hover:bg-white/[0.05]"}`}
            title="Gemini AI Assistant"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </button>

          {/* Video Call Toggle */}
          <button
            onClick={() => {
              if (!callStarted) {
                startCall();
              } else {
                setIsCallOpen((prev) => !prev);
              }
            }}
            className={`p-3 rounded-xl transition-all relative ${isCallOpen ? "bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]" : "text-slate-400 hover:text-white hover:bg-white/[0.05]"}`}
            title={isCallOpen ? "Hide Video Call" : "Join Video Call"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
            {callStarted && !isCallOpen && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            )}
          </button>

          {/* Credits Panel Toggle */}
          <button
            onClick={() => setActivePanel(activePanel === "credits" ? null : "credits")}
            className={`p-3 rounded-xl transition-all ${activePanel === "credits" ? "bg-yellow-500 text-white shadow-[0_0_15px_rgba(234,179,8,0.4)]" : "text-slate-400 hover:text-white hover:bg-white/[0.05]"}`}
            title="AI Credits"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </button>
        </div>
      </div>

      {/* Video Call Overlay — Google Meet style */}
      {isCallOpen && (
        <VideoGrid
          localStream={localStream}
          peers={peers}
          currentUser={username}
          onToggleMic={toggleMic}
          onToggleCam={toggleCam}
          onShareScreen={toggleShareScreen}
          onLeaveCall={leaveCall}
          isMicOn={isMicOn}
          isCamOn={isCamOn}
          isSharingScreen={isSharingScreen}
        />
      )}
    </div>
  );
};

export default EditorPage;
