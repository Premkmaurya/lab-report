import api from './api';

export const laboratoryService = {
  getAllLaboratories: async (params = {}) => {
    const response = await api.get('/laboratories', { params });
    return response.data;
  },

  getLaboratoryById: async (id) => {
    const response = await api.get(`/laboratories/${id}`);
    return response.data;
  },

  getLaboratoryUsers: async (id) => {
    const response = await api.get(`/laboratories/${id}/users`);
    return response.data;
  },

  getLaboratoryPatients: async (id, params = {}) => {
    const response = await api.get(`/laboratories/${id}/patients`, { params });
    return response.data;
  },

  getLaboratoryDoctors: async (id) => {
    const response = await api.get(`/laboratories/${id}/doctors`);
    return response.data;
  },

  getLaboratoryTests: async (id) => {
    const response = await api.get(`/laboratories/${id}/tests`);
    return response.data;
  },

  getLaboratoryReports: async (id) => {
    const response = await api.get(`/laboratories/${id}/reports`);
    return response.data;
  },

  createLaboratory: async (data) => {
    const response = await api.post('/laboratories', data);
    return response.data;
  },

  updateLaboratory: async (id, data) => {
    const response = await api.patch(`/laboratories/${id}`, data);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.patch(`/laboratories/${id}/status`, { status });
    return response.data;
  },

  deleteLaboratory: async (id) => {
    const response = await api.delete(`/laboratories/${id}`);
    return response.data;
  },
};

export default laboratoryService;
