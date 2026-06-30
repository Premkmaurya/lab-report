import api from "./api";

export const departmentService = {
  getAllDepartments: async () => {
    const response = await api.get("/departments");
    return response.data;
  },

  createDepartment: async (data) => {
    const response = await api.post("/departments", data);
    return response.data;
  },

  updateDepartment: async (id, data) => {
    const response = await api.patch(`/departments/${id}`, data);
    return response.data;
  },

  deleteDepartment: async (id) => {
    const response = await api.delete(`/departments/${id}`);
    return response.data;
  }
};
