import app from "./app.js";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken"; // 🔥 YOU FORGOT THIS

dotenv.config();
connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// export io (used in routes)
export { io };

io.on("connection", (socket) => {
  try {
    const token = socket.handshake.auth.token;

    console.log("Incoming token:", token);

    if (!token) {
      console.log("❌ No token, disconnecting...");
      return socket.disconnect();
    }

    // 🔥 VERIFY TOKEN
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("✅ Decoded token:", decoded);

    const workerId = decoded.id;

    if (!workerId) {
      console.log("❌ No workerId in token");
      return socket.disconnect();
    }

    // 🔥 JOIN ROOM
    socket.join(workerId);

    console.log(`🟢 Worker ${workerId} connected and joined room`);

    socket.on("disconnect", () => {
      console.log(`🔴 Worker ${workerId} disconnected`);
    });

  } catch (error) {
    console.log("❌ JWT ERROR:", error.message);
    socket.disconnect();
  }
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});