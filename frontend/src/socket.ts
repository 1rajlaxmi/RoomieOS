import { io } from "socket.io-client";

// Point this directly to your backend server port deployment URL instance
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const socket = io(API_URL, {
  autoConnect: true,
  transports: ["websocket"] 
});