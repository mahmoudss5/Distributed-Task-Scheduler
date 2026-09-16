import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? 'http://localhost:3000' : '/api'),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Error]', error.response?.status, error.message);
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers?.['retry-after'];
      error.message = retryAfter
        ? `Rate limit exceeded. Try again in ${retryAfter} seconds.`
        : 'Rate limit exceeded. Please try again shortly.';
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Optionally dispatch an event here, or rely on ProtectedRoute to redirect when context updates
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
