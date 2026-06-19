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
};

export default testService;
