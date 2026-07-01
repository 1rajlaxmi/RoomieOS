import { apiRequest } from "./api"; 

export const choreService = {
  // 1. ✅ FETCH ALL METHOD
  getAll: async () => {
    try {
      // Pass the method type inside the options config wrapper
      return await apiRequest("/chores", { method: "GET" });
    } catch (err: any) {
      throw new Error(err.message || "Failed to pull household chore logs.");
    }
  },

  // 2. CREATE / DELEGATE TASK METHOD
  create: async (title: string, assignedTo: string) => {
    try {
      // Pass both method and stringified data body inside a single options block object
      return await apiRequest("/chores", {
        method: "POST",
        body: JSON.stringify({ title, assignedTo })
      });
    } catch (err: any) {
      throw new Error(err.message || "Failed to create task.");
    }
  },

  // 3. TOGGLE COMPLETION STATUS METHOD
  toggleStatus: async (choreId: string) => {
    try {
      return await apiRequest(`/chores/${choreId}/toggle`, { method: "PUT" });
    } catch (err: any) {
      throw new Error(err.message || "Failed to toggle item.");
    }
  }
};