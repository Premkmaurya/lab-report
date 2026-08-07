import API from "./api";

const API_URL = "/settings/print-template";

export const printTemplateService = {
  getTemplate: async (paramsOrLabId) => {
    let params = {};
    if (typeof paramsOrLabId === "string") {
      params = { laboratoryId: paramsOrLabId };
    } else if (paramsOrLabId && typeof paramsOrLabId === "object") {
      params = { ...paramsOrLabId };
    }
    const response = await API.get(API_URL, { params });
    return response.data;
  },

  updateTemplate: async (templateData, laboratoryId) => {
    const payload = { ...templateData };
    if (laboratoryId) {
      payload.laboratoryId = laboratoryId;
    }
    const response = await API.patch(API_URL, payload);
    return response.data;
  },

  resetTemplate: async (laboratoryId) => {
    const payload = laboratoryId ? { laboratoryId } : {};
    const response = await API.post(`${API_URL}/reset`, payload);
    return response.data;
  }
};
