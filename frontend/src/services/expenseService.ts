import axios from "axios";

export const expenseService = {
  // Creates a new expense
  create: async (expenseData: { description: string; amount: number }) => {
    const response = await axios.post("/api/expenses", expenseData);
    return response.data;
  },

  // Fetches household expenses (Make sure this name matches!)
  getHouseholdExpenses: async () => {
    const response = await axios.get("/api/expenses");
    return response.data;
  },

  // Accepts two separate parameters to pass one to URL and one to body
  settle: async (expenseId: string, userId: string) => {
    const response = await axios.put(`/api/expenses/${expenseId}/settle`, { userId });
    return response.data;
  }
};