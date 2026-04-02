import axios from 'axios';

// Get API base URL - use window location for production, localhost for development
const getApiUrl = () => {
  if (typeof window === 'undefined') {
    return 'http://localhost:3000';
  }
  
  // In production (Vercel), use empty baseURL since API routes are on same origin
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    console.log('🌐 Production mode - Using relative API paths');
    return '';
  }
  
  // In development, use localhost:3000
  const url = 'http://localhost:3000';
  console.log('🖥️ Development API URL:', url);
  return url;
};

const api = axios.create({
  baseURL: getApiUrl(),
});

console.log('✅ API initialized with baseURL:', api.defaults.baseURL || 'relative paths');

api.interceptors.request.use(
  (config) => {
    // Ensure full URL construction for relative paths
    if (!config.baseURL && !config.url?.startsWith('http')) {
      console.log('📤 API Request:', { method: config.method, url: config.url });
    } else {
      console.log('📤 API Request:', { method: config.method, url: config.url, baseURL: config.baseURL });
    }
    
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
    console.log('📥 API Response:', { status: response.status, statusText: response.statusText });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', { 
      status: error.response?.status, 
      message: error.response?.data?.message,
      url: error.config?.url,
      error: error.message 
    });
    return Promise.reject(error);
  }
);

export default api;

