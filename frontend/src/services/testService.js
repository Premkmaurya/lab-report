import API from "./api";

export const testService = {
  getAllTests: async () => {
    const response = await API.get("/tests");
    return response.data;
  },

  getTestById: async (id) => {
    const response = await API.get(`/tests/${id}`);
    return response.data;
  },

  createTest: async (testData) => {
    const response = await API.post("/tests", testData);
    return response.data;
  },

  updateTest: async (id, testData) => {
    const response = await API.patch(`/tests/${id}`, testData);
    return response.data;
  },

  deleteTest: async (id) => {
    const response = await API.delete(`/tests/${id}`);
    return response.data;
  },

  // Global Test Library Service Methods
  getGlobalTests: async (params) => {
    const response = await API.get("/tests/global", { params });
    return response.data;
  },

  getGlobalTestById: async (id) => {
    const response = await API.get(`/tests/global/${id}`);
    return response.data;
  },

  createGlobalTest: async (testData) => {
    const response = await API.post("/tests/global", testData);
    return response.data;
  },

  updateGlobalTest: async (id, testData) => {
    const response = await API.patch(`/tests/global/${id}`, testData);
    return response.data;
  },

  deleteGlobalTest: async (id) => {
    const response = await API.delete(`/tests/global/${id}`);
    return response.data;
  },

  importGlobalTest: async (id, data = {}) => {
    const response = await API.post(`/tests/global/${id}/import`, data);
    return response.data;
  },
};

export default testService;
