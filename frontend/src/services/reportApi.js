import { apiSlice, buildQueryString } from './apiSlice';

export const reportApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getReports: builder.query({
      query: (params = {}) => `/patient-tests${buildQueryString(params)}`,
      providesTags: (result) =>
        result?.patientTests
          ? [
              ...result.patientTests.map(({ _id }) => ({ type: 'Report', id: _id })),
              { type: 'Report', id: 'LIST' },
            ]
          : [{ type: 'Report', id: 'LIST' }],
    }),

    getReportsByPatientId: builder.query({
      query: (patientId) => `/patient-tests/patient/${patientId}`,
      providesTags: (result, error, patientId) => [
        { type: 'Report', id: `PATIENT_${patientId}` },
        { type: 'Report', id: 'LIST' },
      ],
    }),

    getReportById: builder.query({
      query: (id) => `/patient-tests/${id}`,
      providesTags: (result, error, id) => [{ type: 'Report', id }],
    }),

    getReportAndTestTemplate: builder.query({
      query: ({ reportId, testId }) => `/patient-tests/${reportId}/test/${testId}`,
      providesTags: (result, error, { reportId }) => [{ type: 'Report', id: reportId }],
    }),

    createReport: builder.mutation({
      query: (reportData) => ({
        url: '/patient-tests',
        method: 'POST',
        body: reportData,
      }),
      invalidatesTags: [
        { type: 'Report', id: 'LIST' },
        { type: 'Patient', id: 'LIST' },
        'DashboardStats',
        { type: 'Laboratory', id: 'STATS' },
      ],
    }),

    updateReport: builder.mutation({
      query: ({ id, ...reportData }) => ({
        url: `/patient-tests/${id}`,
        method: 'PATCH',
        body: reportData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Report', id },
        { type: 'Report', id: 'LIST' },
        'DashboardStats',
      ],
    }),

    deleteReport: builder.mutation({
      query: (id) => ({
        url: `/patient-tests/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Report', id },
        { type: 'Report', id: 'LIST' },
        'DashboardStats',
        { type: 'Laboratory', id: 'STATS' },
      ],
    }),

    addTestToReport: builder.mutation({
      query: ({ id, ...testData }) => ({
        url: `/patient-tests/${id}/add-test`,
        method: 'PATCH',
        body: testData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Report', id },
        { type: 'Report', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetReportsQuery,
  useGetReportsByPatientIdQuery,
  useGetReportByIdQuery,
  useGetReportAndTestTemplateQuery,
  useCreateReportMutation,
  useUpdateReportMutation,
  useDeleteReportMutation,
  useAddTestToReportMutation,
} = reportApi;
