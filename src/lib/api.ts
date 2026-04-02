import axios from 'axios';

const api = axios.create({
  baseURL: '/',
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
