import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// 1. Create your core configuration instance
const api = axios.create({
  baseURL: `${BASE_URL}/api`, // Adds the global /api prefix to every request
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // ✅ FIXED: Changed from credentials to withCredentials
});

// 2. Automatically inject the auth token into every single outbound call
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 3. Reusable core wrapper using our Axios instance
export const apiRequest = async (endpoint: string, options: any = {}) => {
  try {
    const response = await api({
      url: endpoint,
      method: options.method || "GET",
      data: options.body ? JSON.parse(options.body) : undefined,
      ...options,
    });
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || `HTTP error! status: ${error.response?.status}`;
    throw new Error(errorMessage);
  }
};

export default api;