import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://mtaa-connect.onrender.com/api',
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mtaa_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses - don't auto-redirect on 401 to avoid loops
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stored credentials but don't force redirect
      // Let the AuthContext handle navigation
      localStorage.removeItem('mtaa_token');
      localStorage.removeItem('mtaa_user');
    }
    return Promise.reject(error);
  }
);

export default API;
