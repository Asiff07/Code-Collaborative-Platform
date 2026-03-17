require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const connectDB = require("./config/db");
const workspaceRoutes = require("./routes/workspaceRoutes");
const authRoutes = require("./routes/authRoutes");
const aiRoutes = require("./routes/aiRoutes");
const stripeRoutes = require("./routes/stripeRoutes");
const { webhookHandler } = require("./controllers/stripeController");
const setupSocketHandler = require("./sockets/socketHandler");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));

// STRIPE WEBHOOK MUST BE BEFORE express.json()
// Stripe requires the raw, un-parsed body to verify the signature
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), webhookHandler);

app.use(express.json());

app.use("/api/workspaces", workspaceRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/stripe", stripeRoutes);

app.get("/health", (req, res) => res.json({ status: "ok" }));

setupSocketHandler(io);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
