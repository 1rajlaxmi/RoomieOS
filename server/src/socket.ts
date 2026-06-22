import { Server } from "socket.io";
import http from "http";

let io: Server;

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", // Your frontend local URL
      methods: ["GET", "POST", "PUT", "DELETE"]
    }
  });

  io.on("connection", (socket) => {
    console.log("🔌 Real-time user connected:", socket.id);

    // 🏠 Secure Room Isolation: Users join a room mapped to their household ID
    socket.on("join_household_room", (householdId: string) => {
      socket.join(householdId);
      console.log(`🚪 User joined private household room: ${householdId}`);
    });

    socket.on("disconnect", () => {
      console.log("❌ Real-time user disconnected:", socket.id);
    });
  });

  return io;
};

// Accessor utility to pull the IO instance into any controller file
export const getIO = () => {
  if (!io) throw new Error("Socket.io layer has not been initialized!");
  return io;
};