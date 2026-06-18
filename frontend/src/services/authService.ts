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
  }
};