import axios from 'axios';

const getBaseURL = () => {
  let envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    envUrl = envUrl.trim();
    if (envUrl.endsWith('/')) envUrl = envUrl.slice(0, -1);
    if (!envUrl.endsWith('/api') && !envUrl.includes('/api/')) {
      envUrl = `${envUrl}/api`;
    }
    return envUrl;
  }
  return '/api';
};

const API = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
API.interceptors.request.use(
  (config) => {
    const user = JSON.parse(sessionStorage.getItem('apex_user') || 'null');
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiry / unauthenticated errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or invalid
      if (sessionStorage.getItem('apex_user')) {
        sessionStorage.removeItem('apex_user');
        window.dispatchEvent(new Event('storage_token_expired'));
      }
    }
    return Promise.reject(error);
  }
);

export default API;
