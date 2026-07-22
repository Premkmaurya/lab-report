import API from "./api";

const API_URL = "/settings/print-template";

export const printTemplateService = {
  getTemplate: async (laboratoryId) => {
    const params = laboratoryId ? { laboratoryId } : {};
    const response = await API.get(API_URL, { params });
    return response.data;
  },

  updateTemplate: async (templateData, laboratoryId) => {
    const payload = { ...templateData };
    if (laboratoryId) {
      payload.laboratoryId = laboratoryId;
    }
    const response = await API.put(API_URL, payload);
    return response.data;
  },

  resetTemplate: async (laboratoryId) => {
    const payload = laboratoryId ? { laboratoryId } : {};
    const response = await API.post(`${API_URL}/reset`, payload);
    return response.data;
  }
};
