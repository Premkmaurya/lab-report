import API from "./api";

const API_URL = "/settings/print-template";

export const printTemplateService = {
  getTemplate: async () => {
    const response = await API.get(API_URL);
    return response.data;
  },

  updateTemplate: async (templateData) => {
    const response = await API.put(API_URL, templateData);
    return response.data;
  },

  resetTemplate: async () => {
    const response = await API.post(`${API_URL}/reset`);
    return response.data;
  }
};
