import { apiSlice, buildQueryString } from './apiSlice';

export const patientApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPatients: builder.query({
      query: (params = {}) => `/patients${buildQueryString(params)}`,
      providesTags: (result) =>
        result?.patients
          ? [
              ...result.patients.map(({ _id }) => ({ type: 'Patient', id: _id })),
              { type: 'Patient', id: 'LIST' },
            ]
          : [{ type: 'Patient', id: 'LIST' }],
    }),

    getPatientById: builder.query({
      query: (id) => `/patients/${id}`,
      providesTags: (result, error, id) => [{ type: 'Patient', id }],
    }),

    createPatient: builder.mutation({
      query: (patientData) => ({
        url: '/patients',
        method: 'POST',
        body: patientData,
      }),
      invalidatesTags: [
        { type: 'Patient', id: 'LIST' },
        'DashboardStats',
        { type: 'Laboratory', id: 'STATS' },
      ],
    }),

    updatePatient: builder.mutation({
      query: ({ id, ...patientData }) => ({
        url: `/patients/${id}`,
        method: 'PATCH',
        body: patientData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Patient', id },
        { type: 'Patient', id: 'LIST' },
        'DashboardStats',
      ],
    }),

    deletePatient: builder.mutation({
      query: (id) => ({
        url: `/patients/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Patient', id },
        { type: 'Patient', id: 'LIST' },
        'DashboardStats',
        { type: 'Laboratory', id: 'STATS' },
      ],
    }),

    assignPatientTests: builder.mutation({
      query: ({ patientId, tests, laboratoryId }) => ({
        url: '/patient-tests',
        method: 'POST',
        body: { patientId, tests, ...(laboratoryId ? { laboratoryId } : {}) },
      }),
      invalidatesTags: [
        { type: 'Report', id: 'LIST' },
        { type: 'Patient', id: 'LIST' },
        'DashboardStats',
        { type: 'Laboratory', id: 'STATS' },
      ],
    }),
  }),
});

export const {
  useGetPatientsQuery,
  useGetPatientByIdQuery,
  useCreatePatientMutation,
  useUpdatePatientMutation,
  useDeletePatientMutation,
  useAssignPatientTestsMutation,
} = patientApi;
