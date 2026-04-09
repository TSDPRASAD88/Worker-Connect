import { io } from "socket.io-client";

let socket;

export const connectSocket = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    console.log("No token, not connecting socket");
    return null;
  }

  if (!socket) {
    socket = io("http://localhost:8080", {
      auth: { token },
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};