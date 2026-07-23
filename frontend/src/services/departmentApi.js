import { apiSlice, buildQueryString } from './apiSlice';

export const departmentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDepartments: builder.query({
      query: (params = {}) => `/departments${buildQueryString(params)}`,
      providesTags: (result) =>
        result?.departments
          ? [
              ...result.departments.map(({ _id }) => ({ type: 'Department', id: _id })),
              { type: 'Department', id: 'LIST' },
            ]
          : [{ type: 'Department', id: 'LIST' }],
    }),

    createDepartment: builder.mutation({
      query: (data) => ({
        url: '/departments',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Department', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
} = departmentApi;
