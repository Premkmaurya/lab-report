import API from "./api";

export const patientService = {
  getAllPatients: async () => {
    const response = await API.get("/patients");
    return response.data;
  },

  getPatientById: async (id) => {
    const response = await API.get(`/patients/${id}`);
    return response.data;
  },

  createPatient: async (patientData) => {
    const response = await API.post("/patients", patientData);
    return response.data;
  },

  updatePatient: async (id, patientData) => {
    const response = await API.patch(`/patients/${id}`, patientData);
    return response.data;
  },

  getSummary: async (period, timezoneOffset) => {
    const response = await API.get(`/patients/summary/${period}`, {
      params: { timezoneOffset },
    });
    return response.data;
  },

  exportSummary: async (period, timezoneOffset) => {
    const response = await API.get(`/patients/export/${period}`, {
      params: { timezoneOffset },
      responseType: "blob",
    });
    return response.data;
  },
};

export default patientService;
