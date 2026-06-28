import http from "http";
import { Server } from "socket.io";

let io: Server;

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      // ✅ FIXED: Pulls from .env dynamically, with a safe local development fallback
      origin: process.env.FRONTEND_URL || "http://localhost:5173", 
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true // Good practice to include if you manage HTTP cookies or session states
    }
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io has not been initialized!");
  }
  return io;
};