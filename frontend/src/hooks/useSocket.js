import { io } from "socket.io-client";

const SOCKET_URL =import.meta.env.VITE_SOCKET_URL || "https://worker-connect-id09.onrender.com";

// Authenticated socket — used by workers (has JWT token)
let workerSocket = null;

export const connectSocket = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.log("No token, skipping worker socket connection");
    return null;
  }

  if (workerSocket && workerSocket.connected) return workerSocket;

  if (workerSocket) {
    workerSocket.disconnect();
    workerSocket = null;
  }

  workerSocket = io(SOCKET_URL, {
    auth: { token },
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  return workerSocket;
};

export const disconnectSocket = () => {
  if (workerSocket) {
    workerSocket.disconnect();
    workerSocket = null;
  }
};

// Guest socket — used by users on homepage/tracking (no JWT needed)
// Server must allow unauthenticated connections for user-facing rooms
let userSocket = null;

export const connectUserSocket = (userId) => {
  if (userSocket && userSocket.connected) return userSocket;

  if (userSocket) {
    userSocket.disconnect();
    userSocket = null;
  }

  userSocket = io(SOCKET_URL, {
    // Pass userId as query param so server can join user to their room
    auth: { userId },
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  return userSocket;
};

export const disconnectUserSocket = () => {
  if (userSocket) {
    userSocket.disconnect();
    userSocket = null;
  }
};