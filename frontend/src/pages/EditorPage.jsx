import React, { useEffect, useState, useRef } from "react";
import Peer from "simple-peer";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import useSocket from "../hooks/useSocket";
import { AuthContext } from "../context/AuthContext";

import UserList from "../components/UserList";
import CodeEditor from "../components/CodeEditor";
import ChatPanel from "../components/ChatPanel";
import VideoGrid from "../components/VideoGrid";

const EditorPage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, login } = React.useContext(AuthContext); // Can use login or a dedicated sync method, but we usually just update local storage and state.

  // We need a helper to safely update just the credits in AuthContext, 
  // but to keep it simple without changing Context drastically, we can trick it or reload the user.
  // Actually, since `user` is state in AuthContext, we can create an update function there, 
  // or just let a hard refresh sync it on the dashboard. Let's make an updateUser function if we can,
  // or we'll manage it silently and dashboard will fetch it eventually. 
  // Wait, the API returns it, let's pass it to CodeEditor.
  const handleCreditUpdate = (newCredits) => {
    if (user) {
      const updatedUser = { ...user, credits: newCredits };
      // A small hack: we store it in localStorage so Dashboard picks it up on navigation
      localStorage.setItem("user", JSON.stringify(updatedUser));
      // Ideally AuthContext should export setUser.
    }
  };

  const username = location.state?.username;

  const { socket } = useSocket();

  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [initialCode, setInitialCode] = useState("");
  const [initialLanguage, setInitialLanguage] = useState("javascript");
  const [isReady, setIsReady] = useState(false);
  const [activePanel, setActivePanel] = useState(null); // 'chat', 'ai', or null

  // WebRTC State
  const [peers, setPeers] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isSharingScreen, setIsSharingScreen] = useState(false);

  const peersRef = useRef([]);
  const screenTrackRef = useRef(null);

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

      s.on("user-joined", (updatedUsers) => {
        setUsers(updatedUsers);
      });

      s.on("user-left", (updatedUsers) => {
        setUsers(updatedUsers);
        // Handle video peer cleanup will be handled in a separate useEffect for granularity
      });

      s.on("receive-message", (msg) => {
        setMessages((prev) => [...prev, msg]);
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
        socket.current.off("error");
      }
    };
  }, [roomId, username, navigate, socket]);

  // Clean up media tracks on component unmount
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [localStream]);

  // WebRTC Implementation
  useEffect(() => {
    if (!isReady || !socket.current) return;

    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);

        socket.current.on("user-joined-video", (payload) => {
          const peer = addPeer(payload.signal, payload.callerID, stream, payload.callerUsername);
          peersRef.current.push({
            peerID: payload.callerID,
            peer,
            username: payload.callerUsername
          });
        });

        socket.current.on("receiving-returned-signal", (payload) => {
          const item = peersRef.current.find((p) => p.peerID === payload.id);
          if (item) {
            item.peer.signal(payload.signal);
          }
        });

        // Inform existing users that we are ready for video
        socket.current.emit("join-video-group", { roomId });
        
        socket.current.on("all-users-video", (usersInRoom) => {
          const peersList = [];
          usersInRoom.forEach((userObj) => {
            if (userObj.socketId !== socket.current.id) {
              const peer = createPeer(userObj.socketId, socket.current.id, stream);
              peersRef.current.push({
                peerID: userObj.socketId,
                peer,
                username: userObj.username
              });
              peersList.push({
                peerID: userObj.socketId,
                peer,
                username: userObj.username
              });
            }
          });
          setPeers(peersList);
        });

        socket.current.on("user-left-video", (socketId) => {
          const peerObj = peersRef.current.find(p => p.peerID === socketId);
          if (peerObj) peerObj.peer.destroy();
          const peersUpdate = peersRef.current.filter(p => p.peerID !== socketId);
          peersRef.current = peersUpdate;
          setPeers(peersUpdate);
        });

      } catch (err) {
        console.error("Camera access denied:", err);
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
          alert("WebRTC (Video Calling) requires HTTPS to work on non-localhost addresses (like your mobile phone). Use a tool like ngrok or configure a local SSL certificate.");
        }
      }
    };

    initMedia();

    return () => {
      if (socket.current) {
        socket.current.off("user-joined-video");
        socket.current.off("receiving-returned-signal");
        socket.current.off("all-users-video");
        socket.current.off("user-left-video");
      }
      peersRef.current.forEach(p => p.peer.destroy());
    };
  }, [isReady]);

  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.current.emit("sending-signal", {
        userToSignal,
        callerID,
        signal,
        callerUsername: username,
      });
    });

    return peer;
  }

  function addPeer(incomingSignal, callerID, stream, callerUsername) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.current.emit("returning-signal", { signal, callerID });
    });

    peer.signal(incomingSignal);

    // Update UI state
    setPeers(prev => [...prev, { peerID: callerID, peer, username: callerUsername }]);

    return peer;
  }

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const toggleCam = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCamOn(videoTrack.enabled);
      }
    }
  };

  const toggleShareScreen = async () => {
    if (!isSharingScreen) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ cursor: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        peersRef.current.forEach(({ peer }) => {
          const videoTrack = localStream.getVideoTracks()[0];
          peer.replaceTrack(videoTrack, screenTrack, localStream);
        });

        setIsSharingScreen(true);

        screenTrack.onended = () => {
          stopScreenShare();
        };
      } catch (err) {
        console.error("Error sharing screen:", err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (screenTrackRef.current) {
      const videoTrack = localStream.getVideoTracks()[0];
      peersRef.current.forEach(({ peer }) => {
        peer.replaceTrack(screenTrackRef.current, videoTrack, localStream);
      });
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
      setIsSharingScreen(false);
    }
  };

  const handleSendMessage = (text) => {
    if (socket.current && roomId && username) {
      socket.current.emit("send-message", { roomId, username, message: text });
    }
  };

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

      {/* Main Workspace Workspace */}
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

        {/* Vertical Toolbar for toggling panels */}
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
        </div>
      </div>

      <VideoGrid
        localStream={localStream}
        peers={peers}
        currentUser={username}
        onToggleMic={toggleMic}
        onToggleCam={toggleCam}
        onShareScreen={toggleShareScreen}
        isMicOn={isMicOn}
        isCamOn={isCamOn}
        isSharingScreen={isSharingScreen}
      />
    </div>
  );
};

export default EditorPage;
