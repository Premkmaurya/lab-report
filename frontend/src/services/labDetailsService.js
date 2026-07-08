import API from './api';

const API_URL = '/settings/lab-details';

export const labDetailsService = {
  upsert: async (data) => {
    const response = await API.put(API_URL, data);
    return response.data;
  },

  get: async () => {
    const response = await API.get(API_URL);
    return response.data;
  },

  delete: async () => {
    const response = await API.delete(API_URL);
    return response.data;
  }
};

export default labDetailsService;
