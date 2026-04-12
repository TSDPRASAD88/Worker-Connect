import app from "./app.js";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { setIO } from "./sockets/socketInstance.js";

dotenv.config();
connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
  },
});

// Export io via the shared instance module (avoids circular imports)
setIO(io);

io.on("connection", (socket) => {
  try {
    const token = socket.handshake.auth.token;
    const userId = socket.handshake.auth.userId;

    // ── GUEST USER (no token, has userId) ─────────────────────
    if (!token && userId) {
      // Join user's personal room to receive booking-accepted events
      socket.join(`user-${userId}`);
      console.log(`🟡 User ${userId} connected as guest`);

      socket.on("join-tracking", ({ bookingId }) => {
        if (!bookingId) return;
        socket.join(`track-${bookingId}`);
        console.log(`📍 User joined tracking room: track-${bookingId}`);
      });

      socket.on("leave-tracking", ({ bookingId }) => {
        socket.leave(`track-${bookingId}`);
      });

      // User broadcasts their live location
      socket.on("user-location", ({ bookingId, lat, lng }) => {
        if (!bookingId || lat == null || lng == null) return;
        socket.to(`track-${bookingId}`).emit("user-location", { lat, lng });
      });

      socket.on("disconnect", () => {
        console.log(`🟡 User ${userId} disconnected`);
      });

      return; // Stop here for guest connections
    }

    // ── AUTHENTICATED WORKER (has JWT token) ──────────────────
    if (!token) {
      console.log("❌ No token and no userId, disconnecting");
      return socket.disconnect();
    }

    const cleanToken = token.startsWith("Bearer ") ? token.slice(7) : token;
    const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
    const workerId = decoded.id;

    if (!workerId) {
      console.log("❌ No workerId in token");
      return socket.disconnect();
    }

    // Worker's own room — receives new-booking events
    socket.join(workerId.toString());
    console.log(`🟢 Worker ${workerId} connected`);

    // Worker joins tracking room for an accepted booking
    socket.on("join-tracking", ({ bookingId }) => {
      if (!bookingId) return;
      socket.join(`track-${bookingId}`);
      console.log(`📍 Worker joined tracking room: track-${bookingId}`);
    });

    socket.on("leave-tracking", ({ bookingId }) => {
      socket.leave(`track-${bookingId}`);
    });

    // Worker broadcasts their live location → relayed to everyone in booking room
    socket.on("worker-location", ({ bookingId, lat, lng }) => {
      if (!bookingId || lat == null || lng == null) return;
      socket.to(`track-${bookingId}`).emit("worker-location", { lat, lng });
    });

    socket.on("disconnect", () => {
      console.log(`🔴 Worker ${workerId} disconnected`);
    });

  } catch (error) {
    console.log("❌ Socket error:", error.message);
    socket.disconnect();
  }
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});