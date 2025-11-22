import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api',
});

// Request interceptor để tự động thêm token vào header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor để xử lý 401 và refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    // Xử lý lỗi 401 (Unauthorized) - token hết hạn
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
          // Không có refresh token, logout
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Gọi API refresh token
        const response = await axios.post(
          (import.meta.env.VITE_API_URL || '') + '/api/Auth/refresh-token',
          {
            token: token,
            refreshToken: refreshToken
          }
        );

        // Response có thể có format Token/RefreshToken hoặc token/refreshToken
        const newToken = response.data.Token || response.data.token;
        const newRefreshToken = response.data.RefreshToken || response.data.refreshToken;

        // Lưu token mới
        if (newToken) {
          localStorage.setItem('token', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        // Retry request với token mới
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token failed, logout user
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;