import { apiSlice } from './apiSlice';

export const dashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardSummary: builder.query({
      query: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return `/patient-tests${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: ['DashboardStats'],
    }),

    getTodayStats: builder.query({
      query: (period = 'today') => `/patient-tests?period=${period}`,
      providesTags: ['DashboardStats'],
    }),
  }),
});

export const {
  useGetDashboardSummaryQuery,
  useGetTodayStatsQuery,
} = dashboardApi;
