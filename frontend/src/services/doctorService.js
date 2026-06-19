import API from "./api";

export const doctorService = {
  getAllDoctors: async () => {
    const response = await API.get("/doctors");
    return response.data;
  },

  getDoctorById: async (id) => {
    const response = await API.get(`/doctors/${id}`);
    return response.data;
  },

  createDoctor: async (formData) => {
    const response = await API.post("/doctors", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  updateDoctor: async (id, formData) => {
    const response = await API.patch(`/doctors/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  deleteDoctor: async (id) => {
    const response = await API.delete(`/doctors/${id}`);
    return response.data;
  },
};

export default doctorService;
