import { apiSlice, buildQueryString } from './apiSlice';

export const userApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: (params = {}) => `/auth/users${buildQueryString(params)}`,
      providesTags: (result) =>
        result?.users
          ? [
              ...result.users.map(({ _id }) => ({ type: 'User', id: _id })),
              { type: 'User', id: 'LIST' },
            ]
          : [{ type: 'User', id: 'LIST' }],
    }),

    getUserById: builder.query({
      query: (id) => `/auth/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),

    createUser: builder.mutation({
      query: (userData) => ({
        url: '/auth/users',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: [
        { type: 'User', id: 'LIST' },
        { type: 'Laboratory', id: 'STATS' },
      ],
    }),

    updateUser: builder.mutation({
      query: ({ id, status, isAuthorized, ...userData }) => {
        const normalizedStatus = typeof status === 'boolean'
          ? status
          : typeof isAuthorized === 'boolean'
            ? isAuthorized
            : undefined;

        return {
          url: `/auth/users/${id}/status`,
          method: 'PATCH',
          body: {
            ...userData,
            status: normalizedStatus,
            isAuthorized: normalizedStatus,
          },
        };
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
      ],
    }),

    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/auth/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
        { type: 'Laboratory', id: 'STATS' },
      ],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = userApi;
