const API_URL = "http://localhost:5000/api/chores";

export const choreService = {
  // 1. ✅ FETCH ALL METHOD: The missing function your dashboard is looking for
  getAll: async () => {
    const token = localStorage.getItem("token");
    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Failed to pull household chore logs.");
    }
    return await response.json();
  },

  // 2. CREATE / DELEGATE TASK METHOD
  create: async (title: string, assignedTo: string) => {
    const token = localStorage.getItem("token");
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ title, assignedTo })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create task.");
    }
    return await response.json(); // Returns the optimized fresh array back to the state wrapper
  },

  // 3. TOGGLE COMPLETION STATUS METHOD
  toggleStatus: async (choreId: string) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/${choreId}/toggle`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to toggle item.");
    }
    return await response.json();
  }
};