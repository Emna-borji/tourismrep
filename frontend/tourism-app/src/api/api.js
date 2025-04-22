// src/api/api.js
import axios from 'axios';

// Set the base URL for all API requests
axios.defaults.baseURL = 'http://localhost:8000'; // Replace with your actual API URL

// Add a request interceptor to include the token in the headers
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Adjust based on where you store your token
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axios;