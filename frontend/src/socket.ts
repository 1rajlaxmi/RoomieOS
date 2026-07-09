import { io } from "socket.io-client";

// Point this directly to your backend server port deployment URL instance
const SOCKET_URL = "http://localhost:5000";

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnectionAttempts: 5,
  timeout: 10000,
});