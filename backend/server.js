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

    if (!token) {
      console.log("❌ No token on socket, disconnecting");
      return socket.disconnect();
    }

    // Support both raw token and "Bearer <token>"
    const cleanToken = token.startsWith("Bearer ") ? token.slice(7) : token;

    const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
    const workerId = decoded.id;

    if (!workerId) {
      console.log("❌ No workerId in token");
      return socket.disconnect();
    }

    socket.join(workerId.toString());
    console.log(`🟢 Worker ${workerId} connected and joined room`);

    socket.on("disconnect", () => {
      console.log(`🔴 Worker ${workerId} disconnected`);
    });

  } catch (error) {
    console.log("❌ Socket JWT error:", error.message);
    socket.disconnect();
  }
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});