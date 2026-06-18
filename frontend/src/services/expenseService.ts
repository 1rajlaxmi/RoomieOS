import { apiRequest } from "./api"

export const expenseService = {
  getAll: async () => apiRequest("/expenses"),
  create: async (description: string, amount: number) => apiRequest("/expenses", {
    method: "POST",
    body: JSON.stringify({ description, amount }),
  }),
  settle: async (expenseId: string, userId: string) => apiRequest(`/expenses/${expenseId}/settle`, {
    method: "PUT",
    body: JSON.stringify({ userId }),
  }),
};