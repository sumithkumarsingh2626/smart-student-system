import axios from 'axios';

// Get API base URL - use window location for production, localhost for development
const getApiUrl = () => {
  if (typeof window === 'undefined') {
    return 'http://localhost:3000';
  }
  
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  
  if (!isLocalhost) {
    // Production (Vercel) - use the full origin for API calls
    const url = `${window.location.protocol}//${window.location.host}`;
    console.log('🌐 Production mode - API URL:', url);
    return url;
  }
  
  // In development, use localhost:3000
  const url = 'http://localhost:3000';
  console.log('🖥️ Development API URL:', url);
  return url;
};

const baseURL = getApiUrl();
const api = axios.create({
  baseURL: baseURL,
});

console.log('✅ API initialized with baseURL:', baseURL);

api.interceptors.request.use(
  (config) => {
    const fullUrl = config.baseURL ? `${config.baseURL}${config.url}` : config.url;
    console.log('📤 API Request:', { method: config.method, url: fullUrl });
    
    const storedUser = localStorage.getItem('smart_student_user');
    if (storedUser) {
      try {
        const { token } = JSON.parse(storedUser);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (e) {
        console.error('Error parsing stored user:', e);
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
      statusText: error.response?.statusText,
      message: error.response?.data?.message,
      url: error.config?.url,
      fullUrl: error.config?.baseURL ? `${error.config.baseURL}${error.config.url}` : error.config?.url,
      error: error.message,
      code: error.code,
    });
    return Promise.reject(error);
  }
);

export default api;
    });
    return Promise.reject(error);
  }
);

export default api;

