import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedLabId: null,
  laboratories: [],
};

const tenantSlice = createSlice({
  name: 'tenant',
  initialState,
  reducers: {
    setSelectedLabId: (state, action) => {
      state.selectedLabId = action.payload;
      if (typeof window !== 'undefined') {
        window.__ACTIVE_LABORATORY_ID__ = action.payload || null;
      }
    },
    setTenantLaboratories: (state, action) => {
      state.laboratories = action.payload || [];
    },
    clearTenant: (state) => {
      state.selectedLabId = null;
      state.laboratories = [];
      if (typeof window !== 'undefined') {
        window.__ACTIVE_LABORATORY_ID__ = null;
      }
    },
  },
});

export const { setSelectedLabId, setTenantLaboratories, clearTenant } = tenantSlice.actions;

export const selectSelectedLabId = (state) => state.tenant.selectedLabId;
export const selectTenantLaboratories = (state) => state.tenant.laboratories;

export default tenantSlice.reducer;
