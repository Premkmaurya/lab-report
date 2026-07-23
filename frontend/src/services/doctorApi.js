import { apiSlice, buildQueryString } from './apiSlice';

export const doctorApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDoctors: builder.query({
      query: (params = {}) => `/doctors${buildQueryString(params)}`,
      providesTags: (result) =>
        result?.doctors
          ? [
              ...result.doctors.map(({ _id }) => ({ type: 'Doctor', id: _id })),
              { type: 'Doctor', id: 'LIST' },
            ]
          : [{ type: 'Doctor', id: 'LIST' }],
    }),

    getDoctorById: builder.query({
      query: (id) => `/doctors/${id}`,
      providesTags: (result, error, id) => [{ type: 'Doctor', id }],
    }),

    createDoctor: builder.mutation({
      query: (formData) => ({
        url: '/doctors',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: [
        { type: 'Doctor', id: 'LIST' },
        { type: 'Laboratory', id: 'STATS' },
      ],
    }),

    updateDoctor: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/doctors/${id}`,
        method: 'PATCH',
        body: formData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Doctor', id },
        { type: 'Doctor', id: 'LIST' },
      ],
    }),

    deleteDoctor: builder.mutation({
      query: (id) => ({
        url: `/doctors/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Doctor', id },
        { type: 'Doctor', id: 'LIST' },
        { type: 'Laboratory', id: 'STATS' },
      ],
    }),
  }),
});

export const {
  useGetDoctorsQuery,
  useGetDoctorByIdQuery,
  useCreateDoctorMutation,
  useUpdateDoctorMutation,
  useDeleteDoctorMutation,
} = doctorApi;
