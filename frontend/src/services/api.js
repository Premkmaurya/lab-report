import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:3000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 429) {
      // Handle rate limit gracefully
      window.alert(error.response.data?.message || "Too many requests. Please try again later.");
    }
    return Promise.reject(error);
  }
);

export default API;
