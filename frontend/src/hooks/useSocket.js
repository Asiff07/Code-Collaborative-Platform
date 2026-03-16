import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

/**
 * Custom hook that returns a stable Socket.IO client ref.
 * The socket is created once on mount and disconnected on unmount.
 *
 * @returns {{ socket: React.MutableRefObject<import('socket.io-client').Socket|null> }}
 */
const useSocket = () => {
  const socketRef = useRef(null);

  useEffect(() => {
    const url = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

    socketRef.current = io(url, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on("connect", () => {
      console.log("Socket connected:", socketRef.current.id);
    });

    socketRef.current.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return { socket: socketRef };
};

export default useSocket;
