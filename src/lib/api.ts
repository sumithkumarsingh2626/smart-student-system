import axios from 'axios';

// Get API base URL - use window location for production, localhost for development
const getApiUrl = () => {
  if (typeof window === 'undefined') {
    return 'http://localhost:3000';
  }
  
  // In production (Vercel), use the same origin as the app
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return window.location.origin;
  }
  
  // In development, use localhost:3000
  return 'http://localhost:3000';
};

const api = axios.create({
  baseURL: getApiUrl(),
});

api.interceptors.request.use(
  (config) => {
    const storedUser = localStorage.getItem('smart_student_user');
    if (storedUser) {
      const { token } = JSON.parse(storedUser);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
