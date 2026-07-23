import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  loading: true,
  isAuthorizedUser: false,
  authError: '',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthUser: (state, action) => {
      state.user = action.payload;
      state.isAuthorizedUser = !!action.payload?.isAuthorized;
      state.loading = false;
      state.authError = '';
    },
    setAuthError: (state, action) => {
      state.authError = action.payload || '';
      state.loading = false;
    },
    setUnauthorizedUser: (state, action) => {
      state.user = { isAuthorized: false };
      state.isAuthorizedUser = false;
      state.authError = action.payload || 'Account not authorized';
      state.loading = false;
    },
    clearAuth: (state) => {
      state.user = null;
      state.isAuthorizedUser = false;
      state.authError = '';
      state.loading = false;
    },
    setAuthLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const {
  setAuthUser,
  setAuthError,
  setUnauthorizedUser,
  clearAuth,
  setAuthLoading,
} = authSlice.actions;

export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthorized = (state) => state.auth.isAuthorizedUser;
export const selectIsSystemAdmin = (state) => state.auth.user?.role === 'system_admin';

export default authSlice.reducer;
