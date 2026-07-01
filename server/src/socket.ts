import http from "http";
import { Server } from "socket.io";
import User from "./models/User"; // 🚀 Import your User model to verify membership

let io: Server;

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173", 
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true 
    }
  });

  // =========================================================================
  // 🛡️ SECURITY FIX: REAL-TIME TENANT ISOLATION ROOM VERIFICATION
  // =========================================================================
  io.on("connection", (socket) => {
    console.log(`🔌 New Socket Connected: ${socket.id}`);

    // Listen securely for when a client requests to join a household room
    socket.on("join_household_room", async (data: { householdId: string; userId: string }) => {
      try {
        const { householdId, userId } = data;

        if (!householdId || !userId) return;

        const user = await User.findById(userId);

        // ✅ FIX: Use safe optional chaining and explicit toString() normalization
        if (user && user.household && user.household.toString() === householdId.toString()) {
          socket.join(householdId);
          console.log(`🔒 Securely added User ${userId} to Household Room: ${householdId}`);
        } else {
          console.warn(`🚨 Security Alert! Unauthorized room join attempt by User ${userId} into Room ${householdId}`);
          socket.emit("security_error", { message: "Unauthorized household room assignment." });
          // Note: Avoid hard socket disconnection here if you want to allow standard app retries safely
        }
      } catch (err) {
        console.error("Socket room verification error:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Socket Disconnected: ${socket.id}`);
    });
  });
  // =========================================================================

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io has not been initialized!");
  }
  return io;
};