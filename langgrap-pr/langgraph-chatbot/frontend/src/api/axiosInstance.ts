import { BASE_URL } from "@/constants/api_endpoints";
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: BASE_URL, // FastAPI backend URL
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosInstance;
