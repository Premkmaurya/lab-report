export const PERMISSIONS = {
  MANAGE_DOCTORS: 'manage_doctors',
  MANAGE_TESTS: 'manage_tests',
};

export const canManagePatients = (user) => !!user;
export const canManageReports = (user) => !!user;
export const canPrintReports = (user) => !!user;

export const canManageDoctors = (user) => 
  user?.role === 'admin' || user?.role === 'system_admin' || (user?.permissions || []).includes(PERMISSIONS.MANAGE_DOCTORS);

export const canManageTests = (user) => 
  user?.role === 'admin' || user?.role === 'system_admin' || (user?.permissions || []).includes(PERMISSIONS.MANAGE_TESTS);
