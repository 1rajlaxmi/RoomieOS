import { apiRequest } from "./api";

export const choreService = {
  getAll: async () => apiRequest("/chores"),
  create: async (title: string, assignedTo: string) => apiRequest("/chores", {
    method: "POST",
    body: JSON.stringify({ title, assignedTo }),
  }),
  toggleStatus: async (choreId: string) => apiRequest(`/chores/${choreId}/toggle`, {
    method: "PUT",
  }),
};