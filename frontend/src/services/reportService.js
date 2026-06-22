import API from "./api";

export const reportService = {
  getAllReports: async () => {
    const response = await API.get("/patient-tests");
    return response.data;
  },

  getReportsByPatientId: async (patientId) => {
    const response = await API.get(`/patient-tests/patient/${patientId}`);
    return response.data;
  },

  getReportById: async (id) => {
    const response = await API.get(`/patient-tests/${id}`);
    return response.data;
  },

  createReport: async (reportData) => {
    const response = await API.post("/patient-tests", reportData);
    return response.data;
  },

  updateReport: async (id, reportData) => {
    const response = await API.patch(`/patient-tests/${id}`, reportData);
    return response.data;
  },

  updatePatientTest: async (id, reportData) => {
    const response = await API.patch(`/patient-tests/${id}`, reportData);
    return response.data;
  },

  deleteReport: async (id) => {
    const response = await API.delete(`/patient-tests/${id}`);
    return response.data;
  },

  addTestToReport: async (id, testData) => {
    const response = await API.patch(`/patient-tests/${id}/add-test`, testData);
    return response.data;
  },
};

export default reportService;
