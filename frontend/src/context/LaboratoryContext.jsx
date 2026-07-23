import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setSelectedLabId as setReduxSelectedLabId, setTenantLaboratories, clearTenant } from '../features/tenant/tenantSlice';
import laboratoryService from '../services/laboratoryService';
import { useAuth } from '../hooks/useAuth';

const LaboratoryContext = createContext(null);

export const LaboratoryProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [laboratories, setLaboratories] = useState([]);
  const [selectedLabId, setSelectedLabId] = useState(null);
  const [loading, setLoading] = useState(false);

  const isSystemAdmin = user?.role === 'system_admin';

  const fetchLaboratories = async () => {
    if (!isSystemAdmin) return;
    setLoading(true);
    try {
      const res = await laboratoryService.getAllLaboratories({ limit: 100 });
      if (res.success) {
        setLaboratories(res.data || []);
        dispatch(setTenantLaboratories(res.data || []));
      }
    } catch (err) {
      console.error('Failed to fetch laboratories for System Admin context:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSystemAdmin) {
      fetchLaboratories();
    } else {
      setLaboratories([]);
      setSelectedLabId(null);
      dispatch(clearTenant());
    }
  }, [user?.role]);

  const handleSetSelectedLabId = (labId) => {
    setSelectedLabId(labId);
    dispatch(setReduxSelectedLabId(labId));
  };

  const getTenantQueryParam = () => {
    if (isSystemAdmin && selectedLabId) {
      return `laboratoryId=${selectedLabId}`;
    }
    return '';
  };

  return (
    <LaboratoryContext.Provider
      value={{
        laboratories,
        selectedLabId,
        setSelectedLabId: handleSetSelectedLabId,
        loading,
        fetchLaboratories,
        getTenantQueryParam,
        isSystemAdmin,
      }}
    >
      {children}
    </LaboratoryContext.Provider>
  );
};

export const useLaboratory = () => {
  const context = useContext(LaboratoryContext);
  if (!context) {
    return {
      laboratories: [],
      selectedLabId: null,
      setSelectedLabId: () => {},
      loading: false,
      fetchLaboratories: () => {},
      getTenantQueryParam: () => '',
      isSystemAdmin: false,
    };
  }
  return context;
};

export default LaboratoryContext;
