import axios from "axios";

const API = axios.create({
  baseURL: "https://lab-report-779w.onrender.com/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default API;
