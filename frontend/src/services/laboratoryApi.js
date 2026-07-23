import { apiSlice, buildQueryString } from './apiSlice';

export const laboratoryApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLaboratories: builder.query({
      query: (params = {}) => `/laboratories${buildQueryString(params)}`,
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Laboratory', id: _id })),
              { type: 'Laboratory', id: 'LIST' },
            ]
          : [{ type: 'Laboratory', id: 'LIST' }],
    }),

    getLaboratoryById: builder.query({
      query: (id) => `/laboratories/${id}`,
      providesTags: (result, error, id) => [
        { type: 'Laboratory', id },
        { type: 'Laboratory', id: 'STATS' },
      ],
    }),

    getLaboratoryUsers: builder.query({
      query: (id) => `/laboratories/${id}/users`,
      providesTags: (result, error, id) => [{ type: 'User', id: `LAB_${id}` }],
    }),

    getLaboratoryPatients: builder.query({
      query: ({ id, ...params }) => `/laboratories/${id}/patients${buildQueryString(params)}`,
      providesTags: (result, error, { id }) => [{ type: 'Patient', id: `LAB_${id}` }],
    }),

    getLaboratoryDoctors: builder.query({
      query: (id) => `/laboratories/${id}/doctors`,
      providesTags: (result, error, id) => [{ type: 'Doctor', id: `LAB_${id}` }],
    }),

    getLaboratoryTests: builder.query({
      query: (id) => `/laboratories/${id}/tests`,
      providesTags: (result, error, id) => [{ type: 'Test', id: `LAB_${id}` }],
    }),

    getLaboratoryReports: builder.query({
      query: (id) => `/laboratories/${id}/reports`,
      providesTags: (result, error, id) => [{ type: 'Report', id: `LAB_${id}` }],
    }),

    createLaboratory: builder.mutation({
      query: (data) => ({
        url: '/laboratories',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Laboratory', id: 'LIST' }],
    }),

    updateLaboratory: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/laboratories/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Laboratory', id },
        { type: 'Laboratory', id: 'LIST' },
      ],
    }),

    updateLaboratoryStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/laboratories/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Laboratory', id },
        { type: 'Laboratory', id: 'LIST' },
      ],
    }),

    deleteLaboratory: builder.mutation({
      query: (id) => ({
        url: `/laboratories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Laboratory', id },
        { type: 'Laboratory', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetLaboratoriesQuery,
  useGetLaboratoryByIdQuery,
  useGetLaboratoryUsersQuery,
  useGetLaboratoryPatientsQuery,
  useGetLaboratoryDoctorsQuery,
  useGetLaboratoryTestsQuery,
  useGetLaboratoryReportsQuery,
  useCreateLaboratoryMutation,
  useUpdateLaboratoryMutation,
  useUpdateLaboratoryStatusMutation,
  useDeleteLaboratoryMutation,
} = laboratoryApi;
