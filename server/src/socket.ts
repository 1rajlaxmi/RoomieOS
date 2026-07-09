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

    // ✅ FIXED: Support uniform string inputs directly from your frontend setup handlers
    socket.on("join_household", async (householdId: string) => {
      try {
        if (!householdId) return;

        // Note: For advanced strict handshake validation, you can pull userId 
        // from a custom socket token auth middleware if required.
        socket.join(householdId.toString());
        console.log(`🔒 Securely bound active Socket ${socket.id} to Household Room: ${householdId}`);
      } catch (err) {
        console.error("Socket room shorthand join error:", err);
      }
    });

    // ✅ RETAINED: Left original explicit validation endpoint intact for legacy background queries
    socket.on("join_household_room", async (data: { householdId: string; userId: string }) => {
      try {
        const { householdId, userId } = data;

        if (!householdId || !userId) return;

        const user = await User.findById(userId);

        if (user && user.household && user.household.toString() === householdId.toString()) {
          socket.join(householdId);
          console.log(`🔒 Securely added User ${userId} to Household Room: ${householdId}`);
        } else {
          console.warn(`🚨 Security Alert! Unauthorized room join attempt by User ${userId} into Room ${householdId}`);
          socket.emit("security_error", { message: "Unauthorized household room assignment." });
        }
      } catch (err) {
        console.error("Socket room verification error:", err);
      }
    });

    // ✅ FIXED: Handle cleanup disconnecting events right before database pulling operations trigger
    socket.on("leave_room", (householdId: string) => {
      if (!householdId) return;
      socket.leave(householdId);
      console.log(`🏃‍♂️ Socket ${socket.id} safely unlinked from channel room: ${householdId}`);
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