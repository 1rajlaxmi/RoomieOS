import { apiRequest } from "./api";

export const authService = {
  login: async (credentials: object) => {
    return apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },
  
  register: async (userData: object) => {
    return apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  forgotPassword: async (email: string) => {
    return await apiRequest("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email })
    });
  },

  resetPassword: async (token: string, password: string) => {
    return await apiRequest(`/auth/reset-password/${token}`, {
      method: "PUT",
      body: JSON.stringify({ password })
    });
  }
};