import { apiSlice, buildQueryString } from './apiSlice';

export const testApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTests: builder.query({
      query: (params = {}) => `/tests${buildQueryString(params)}`,
      providesTags: (result) =>
        result?.tests
          ? [
              ...result.tests.map(({ _id }) => ({ type: 'Test', id: _id })),
              { type: 'Test', id: 'LIST' },
            ]
          : [{ type: 'Test', id: 'LIST' }],
    }),

    getGlobalTests: builder.query({
      query: (params = {}) => `/tests/global${buildQueryString(params)}`,
      providesTags: (result) =>
        result?.globalTests
          ? [
              ...result.globalTests.map(({ _id }) => ({ type: 'GlobalTest', id: _id })),
              { type: 'GlobalTest', id: 'LIST' },
            ]
          : [{ type: 'GlobalTest', id: 'LIST' }],
    }),

    getTestById: builder.query({
      query: (id) => `/tests/${id}`,
      providesTags: (result, error, id) => [{ type: 'Test', id }],
    }),

    createTest: builder.mutation({
      query: (testData) => ({
        url: '/tests',
        method: 'POST',
        body: testData,
      }),
      invalidatesTags: (result, error, testData) => [
        { type: 'Test', id: 'LIST' },
        ...(testData.isGlobal ? [{ type: 'GlobalTest', id: 'LIST' }] : []),
        { type: 'Laboratory', id: 'STATS' },
      ],
    }),

    updateTest: builder.mutation({
      query: ({ id, ...testData }) => ({
        url: `/tests/${id}`,
        method: 'PATCH',
        body: testData,
      }),
      invalidatesTags: (result, error, { id, isGlobal }) => [
        { type: 'Test', id },
        { type: 'Test', id: 'LIST' },
        ...(isGlobal ? [{ type: 'GlobalTest', id: 'LIST' }] : []),
      ],
    }),

    deleteTest: builder.mutation({
      query: (id) => ({
        url: `/tests/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Test', id },
        { type: 'Test', id: 'LIST' },
        { type: 'GlobalTest', id: 'LIST' },
        { type: 'Laboratory', id: 'STATS' },
      ],
    }),

    importGlobalTest: builder.mutation({
      query: (globalTestId) => ({
        url: `/tests/global/${globalTestId}/import`,
        method: 'POST',
      }),
      invalidatesTags: [
        { type: 'Test', id: 'LIST' },
        { type: 'GlobalTest', id: 'LIST' },
        { type: 'Laboratory', id: 'STATS' },
        'DashboardStats',
      ],
    }),
  }),
});

export const {
  useGetTestsQuery,
  useGetGlobalTestsQuery,
  useGetTestByIdQuery,
  useCreateTestMutation,
  useUpdateTestMutation,
  useDeleteTestMutation,
  useImportGlobalTestMutation,
} = testApi;
