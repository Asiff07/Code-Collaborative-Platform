import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import useSocket from "../hooks/useSocket";

import UserList from "../components/UserList";
import CodeEditor from "../components/CodeEditor";
import ChatPanel from "../components/ChatPanel";

const EditorPage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const username = location.state?.username;

  const { socket } = useSocket();

  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [initialCode, setInitialCode] = useState("");
  const [initialLanguage, setInitialLanguage] = useState("javascript");
  const [isReady, setIsReady] = useState(false);

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
      <div className="relative z-10 flex h-full w-full">
        <UserList users={users} copyRoomId={roomId} />

        <div className="flex-1 w-full h-full relative z-20 shadow-[0_0_40px_rgba(0,0,0,0.5)] border-x border-white/[0.05] bg-[#050508]/50 backdrop-blur-md">
          <CodeEditor
            socket={socket.current}
            roomId={roomId}
            initialCode={initialCode}
            initialLanguage={initialLanguage}
            currentUser={username}
          />
        </div>

        <ChatPanel
          messages={messages}
          onSendMessage={handleSendMessage}
          currentUser={username}
        />
      </div>
    </div>
  );
};

export default EditorPage;
