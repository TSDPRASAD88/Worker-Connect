import { io } from "socket.io-client";

let socket = null;

export const connectSocket = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    console.log("No token, skipping socket connection");
    return null;
  }

  // Already connected with same socket
  if (socket && socket.connected) {
    return socket;
  }

  // Clean up stale socket before creating new one
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:8080", {
    auth: { token },
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};