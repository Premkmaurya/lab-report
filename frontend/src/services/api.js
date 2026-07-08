import axios from "axios";
import { toast } from "../lib/toast";

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
    // If the request is configured to hide global toasts, skip
    if (error.config?.hideGlobalToast) {
      return Promise.reject(error);
    }

    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message;
      
      switch (status) {
        case 401:
          toast.error("Session expired. Please login again.");
          break;
        case 403:
          toast.error("You don't have permission to perform this action.");
          break;
        case 404:
          toast.error("Requested resource not found.");
          break;
        case 429:
          toast.warning(message || "Too many requests. Please try again later.");
          break;
        case 500:
          toast.error("Something went wrong on the server. Please try again.");
          break;
        // Do not intercept 400 or 422 globally - let components handle form validation errors
        default:
          break;
      }
    } else if (error.request) {
      toast.error("Network error. Please check your connection.");
    }
    
    return Promise.reject(error);
  }
);

export default API;
