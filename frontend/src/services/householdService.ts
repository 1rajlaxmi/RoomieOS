import { apiRequest } from "./api";

export const householdService = {
  getProfile: async () => {
    return apiRequest("/households/my-household");
  },

  create: async (name: string) => {
    return apiRequest("/households/create", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },

  join: async (inviteCode: string) => {
    return apiRequest("/households/join", {
      method: "POST",
      body: JSON.stringify({ inviteCode }),
    });
  },

  leave: async () => {
    return apiRequest("/households/leave", {
      method: "PUT",
    });
  },

  evictRoommate: async (memberId: string) => {
    return apiRequest(`/households/evict/${memberId}`, {
      method: "DELETE",
    });
  },

  transferOwnership: async (newOwnerId: string) => {
    return apiRequest("/households/transfer", {
      method: "POST",
      body: JSON.stringify({ newOwnerId }),
    });
  },

  dissolveRoom: async () => {
    return apiRequest("/households", {
      method: "DELETE",
    });
  }
};