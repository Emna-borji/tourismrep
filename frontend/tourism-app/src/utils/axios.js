// src/axios.js
import axios from 'axios';

// Create an Axios instance with the base URL of your backend
const axiosInstance = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/', // Update with your backend URL
});

export default axiosInstance;
