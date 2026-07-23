import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api',
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const state = getState();
    const selectedLabId = state.tenant?.selectedLabId || window.__ACTIVE_LABORATORY_ID__;
    if (selectedLabId) {
      headers.set('x-laboratory-id', selectedLabId);
    }
    return headers;
  },
});

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [
    'User',
    'Patient',
    'Doctor',
    'Test',
    'GlobalTest',
    'Report',
    'Laboratory',
    'Department',
    'DashboardStats',
  ],
  endpoints: () => ({}),
});

export const buildQueryString = (params = {}) => {
  if (!params || typeof params !== 'object') return '';
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(
      ([_, v]) => v !== undefined && v !== null && v !== '' && v !== 'undefined' && v !== 'null'
    )
  );
  const queryString = new URLSearchParams(cleanParams).toString();
  return queryString ? `?${queryString}` : '';
};

export default apiSlice;
