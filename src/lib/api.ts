import axios from 'axios';

const getApiUrl = () => {
  if (typeof window === 'undefined') {
    return 'http://localhost:3000';
  }

  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

  if (!isLocalhost) {
    const url = window.location.origin;
    console.log('[API] Production base URL:', url);
    return url;
  }

  const url = 'http://localhost:3000';
  console.log('[API] Development base URL:', url);
  return url;
};

const baseURL = getApiUrl();

const api = axios.create({
  baseURL,
});

console.log('[API] Initialized with baseURL:', baseURL);

api.interceptors.request.use(
  (config) => {
    const fullUrl = config.baseURL ? `${config.baseURL}${config.url}` : config.url;
    console.log('[API] Request:', { method: config.method, url: fullUrl });

    const storedUser = localStorage.getItem('smart_student_user');
    if (storedUser) {
      try {
        const { token } = JSON.parse(storedUser);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('[API] Failed to parse stored user:', error);
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => {
    console.log('[API] Response:', {
      status: response.status,
      statusText: response.statusText,
    });
    return response;
  },
  (error) => {
    console.error('[API] Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.message,
      url: error.config?.url,
      fullUrl: error.config?.baseURL
        ? `${error.config.baseURL}${error.config.url}`
        : error.config?.url,
      error: error.message,
      code: error.code,
    });

    return Promise.reject(error);
  },
);

export default api;
