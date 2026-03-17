const { getWorkspaceByRoomId, updateWorkspaceCode, updateWorkspaceLanguage } = require("../services/workspaceService");
const User = require("../models/User");

// In-memory room state
// rooms[roomId] = { users: { [socketId]: { username, color } } }
const rooms = {};

// Per-room debounce timers for MongoDB autosave
const saveTimers = {};

// Assign a deterministic color from a palette based on user index
const USER_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
  "#F0A500", "#2ECC71", "#E74C3C", "#3498DB", "#9B59B6",
];

const getColorForSocket = (roomId) => {
  if (!rooms[roomId]) return USER_COLORS[0];
  const index = Object.keys(rooms[roomId].users).length;
  return USER_COLORS[index % USER_COLORS.length];
};

const getUserList = (roomId) => {
  if (!rooms[roomId]) return [];
  return Object.values(rooms[roomId].users);
};

const setupSocketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("join-room", async ({ roomId, username }) => {
      // Validate inputs
      if (!roomId?.trim() || !username?.trim()) {
        socket.emit("error", { message: "Room ID and username are required." });
        return;
      }

      const cleanRoom = roomId.trim();
      const cleanUser = username.trim().slice(0, 30);

      socket.join(cleanRoom);

      // Initialize room state if needed
      if (!rooms[cleanRoom]) rooms[cleanRoom] = { users: {} };

      // Fetch user credits to display alongside username
      let credits = 10;
      try {
        const userDoc = await User.findOne({ name: cleanUser });
        if (userDoc) credits = userDoc.credits;
      } catch(e) {}

      const color = getColorForSocket(cleanRoom);
      rooms[cleanRoom].users[socket.id] = { username: cleanUser, color, credits };

      // Store roomId on the socket for disconnect cleanup
      socket.currentRoom = cleanRoom;
      socket.username = cleanUser;
      socket.credits = credits;

      // Fetch persisted code and sync to the joining user
      try {
        const workspace = await getWorkspaceByRoomId(cleanRoom);
        if (workspace) {
          socket.emit("sync-code", {
            code: workspace.codeContent,
            language: workspace.language,
          });
        } else {
          socket.emit("error", { message: "Workspace not found." });
          return;
        }
      } catch (err) {
        console.error("sync-code fetch error:", err.message);
        socket.emit("sync-code", { code: "", language: "javascript" });
      }

      // Broadcast updated user list to everyone in the room
      io.to(cleanRoom).emit("user-joined", getUserList(cleanRoom));

      console.log(`${cleanUser} joined room: ${cleanRoom} with ${credits} credits`);
    });

    socket.on("code-change", ({ roomId, code }) => {
      if (!roomId?.trim()) return;
      const cleanRoom = roomId.trim();

      // Broadcast to everyone else in the room (not the sender)
      socket.to(cleanRoom).emit("code-update", code);

      // Debounced autosave — only hits MongoDB after 1500ms of inactivity
      clearTimeout(saveTimers[cleanRoom]);
      saveTimers[cleanRoom] = setTimeout(async () => {
        try {
          await updateWorkspaceCode(cleanRoom, code);
        } catch (err) {
          console.error("Autosave error:", err.message);
        }
      }, 1500);
    });

    socket.on("cursor-move", ({ roomId, username, color, lineNumber, column }) => {
      if (!roomId?.trim()) return;
      socket.to(roomId.trim()).emit("cursor-update", {
        socketId: socket.id,
        username,
        color,
        lineNumber,
        column,
      });
    });

    socket.on("send-message", ({ roomId, username, message }) => {
      if (!roomId?.trim() || !username?.trim()) return;
      if (!message?.trim() || message.length > 500) return;

      const payload = {
        username: username.trim().slice(0, 30),
        message: message.trim(),
        ts: Date.now(),
      };

      io.to(roomId.trim()).emit("receive-message", payload);
    });

    socket.on("language-change", ({ roomId, language }) => {
      if (!roomId?.trim() || !language?.trim()) return;
      const cleanRoom = roomId.trim();
      // Broadcast to everyone in the room including sender
      io.to(cleanRoom).emit("language-update", language.trim());
      // Persist language choice
      updateWorkspaceLanguage(cleanRoom, language.trim()).catch(console.error);
    });

    socket.on("disconnect", () => {
      const roomId = socket.currentRoom;
      if (roomId && rooms[roomId]) {
        delete rooms[roomId].users[socket.id];

        // Always notify remaining peers to clean up video tile
        io.to(roomId).emit("user-left-video", socket.id);

        if (Object.keys(rooms[roomId].users).length === 0) {
          delete rooms[roomId];
          clearTimeout(saveTimers[roomId]);
        } else {
          io.to(roomId).emit("user-left", getUserList(roomId));
        }

        console.log(`${socket.username || socket.id} left room: ${roomId}`);
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
    
    // --- WebRTC Video Call Signaling ---
    socket.on("sending-signal", (payload) => {
      // payload: { userToSignal, callerID, signal, callerUsername }
      io.to(payload.userToSignal).emit("user-joined-video", {
        signal: payload.signal,
        callerID: payload.callerID,
        callerUsername: payload.callerUsername,
      });
    });

    socket.on("returning-signal", (payload) => {
      // payload: { callerID, signal }
      io.to(payload.callerID).emit("receiving-returned-signal", {
        signal: payload.signal,
        id: socket.id,
      });
    });

    socket.on("join-video-group", ({ roomId }) => {
      if (!roomId || !rooms[roomId]) return;
      
      // Filter out the requesting socket — they don't need to signal themselves
      const usersInRoom = Object.keys(rooms[roomId].users)
        .filter(id => id !== socket.id)
        .map(id => ({
          socketId: id,
          username: rooms[roomId].users[id].username
        }));

      socket.emit("all-users-video", usersInRoom);
    });

    // Add an endpoint for credits refreshing
    socket.on("refresh-credits", async ({ roomId, username }) => {
      if (!roomId || !username || !rooms[roomId]) return;
      try {
        const userDoc = await User.findOne({ name: username });
        if (userDoc && rooms[roomId].users[socket.id]) {
          rooms[roomId].users[socket.id].credits = userDoc.credits;
          io.to(roomId).emit("user-joined", getUserList(roomId)); // Broadcast updated users list
        }
      } catch(e) {}
    });

  });
};

module.exports = setupSocketHandler;
