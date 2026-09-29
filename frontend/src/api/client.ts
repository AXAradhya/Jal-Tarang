import axios from 'axios';

export const apiClient = axios.create({
  baseURL: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '/api/v1',
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT from localStorage on every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('marinex_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// Response interceptor: auto-refresh expired access tokens & redirect on unauthorized
apiClient.interceptors.response.use(
  (res) => {
    // If Vercel or a static host rewrites API routes to index.html, reject so callers handle fallback
    if (typeof res.data === 'string' && (res.data.includes('<!DOCTYPE html') || res.data.includes('<!doctype html>'))) {
      const err: any = new Error('API server returned HTML page instead of JSON. Ensure backend is running or API proxy is configured.');
      err.response = { status: 404, data: { error: { message: err.message } } };
      return Promise.reject(err);
    }
    return res;
  },
  async (err) => {
    const originalRequest = err.config;
    if (err.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(err);
      }

      const refreshToken = localStorage.getItem('marinex_refresh_token');
      if (!refreshToken) {
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          localStorage.removeItem('marinex_token');
          localStorage.removeItem('marinex_user');
          window.location.href = '/login';
        }
        return Promise.reject(err);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((retryErr) => Promise.reject(retryErr));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken });
        const newAccessToken = data.data?.accessToken;
        const newRefreshToken = data.data?.refreshToken;
        if (newAccessToken) {
          localStorage.setItem('marinex_token', newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem('marinex_refresh_token', newRefreshToken);
          }
          apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('marinex_token');
        localStorage.removeItem('marinex_refresh_token');
        localStorage.removeItem('marinex_user');
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(err);
  }
);

export default apiClient;
