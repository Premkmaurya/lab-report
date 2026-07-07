import API from "./api";

export const userService = {
  getAllUsers: async () => {
    const response = await API.get("/auth/users");
    return response.data;
  },

  getUserById: async (id) => {
    const response = await API.get(`/auth/users/${id}`);
    return response.data;
  },

  createUser: async (userData) => {
    const response = await API.post("/auth/users", userData);
    return response.data;
  },

  updateUserStatus: async (id, status, permissions) => {
    // Send both parameter names to satisfy validator (isAuthorized) and controller (status)
    const response = await API.patch(`/auth/users/${id}/status`, {
      isAuthorized: status,
      status: status,
      permissions: permissions,
    });
    return response.data;
  },
};

export default userService;
