import axios from 'axios';

// Get API base URL - use window location for production, localhost for development
const getApiUrl = () => {
  if (typeof window === 'undefined') {
    return 'http://localhost:3000';
  }
  
  // In production (Vercel), use the same origin as the app
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    const url = window.location.origin;
    console.log('🌐 Production API URL:', url);
    return url;
  }
  
  // In development, use localhost:3000
  const url = 'http://localhost:3000';
  console.log('🖥️ Development API URL:', url);
  return url;
};

const api = axios.create({
  baseURL: getApiUrl(),
});

console.log('✅ API initialized with baseURL:', api.defaults.baseURL);

api.interceptors.request.use(
  (config) => {
    console.log('📤 API Request:', { method: config.method, url: config.url });
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

api.interceptors.response.use(
  (response) => {
    console.log('📥 API Response:', { status: response.status, url: response.config.url });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', { status: error.response?.status, url: error.config?.url });
    return Promise.reject(error);
  }
);

export default api;
