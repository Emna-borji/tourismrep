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

axios.interceptors.response.use(
  (response) => response, // Pass through successful responses
  (error) => {
    if (error.response && error.response.status === 409) {
      console.log('Interceptor: Resolving 409 response', error.response); // Debug log
      return Promise.resolve(error.response); // Treat 409 as a success
    }
    return Promise.reject(error); // Reject other errors
  }
);

export default axios;