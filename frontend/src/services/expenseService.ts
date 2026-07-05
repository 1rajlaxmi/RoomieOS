// 🚀 Switch from raw axios to your centralized API utility client wrapper
import { apiRequest } from "./api"; 

export const expenseService = {
  // 1. CREATE A NEW EXPENSE / SPLIT BILL
  create: async (expenseData: { description: string; amount: number }) => {
    try {
      // Automatically forwards JWT headers and routes to your backend server port
      return await apiRequest("/expenses", {
        method: "POST",
        body: JSON.stringify(expenseData)
      });
    } catch (err: any) {
      throw new Error(err.message || "Failed to split household bill.");
    }
  },

  // 2. FETCH HOUSEHOLD EXPENSES
  getHouseholdExpenses: async () => {
    try {
      return await apiRequest("/expenses", { method: "GET" });
    } catch (err: any) {
      throw new Error(err.message || "Failed to pull balance ledger sheet.");
    }
  },

  // 3. SETTLE BALANCES BETWEEN ROOMMATES
  settle: async (expenseId: string, userId: string) => {
    try {
      return await apiRequest(`/expenses/${expenseId}/settle`, {
        method: "PUT",
        body: JSON.stringify({ userId })
      });
    } catch (err: any) {
      throw new Error(err.message || "Failed to settle roommate balance.");
    }
  }
};