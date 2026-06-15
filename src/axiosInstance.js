// src/axiosInstance.js
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Track if we're already refreshing to prevent multiple refresh requests
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add token to every request based on the route
axiosInstance.interceptors.request.use((config) => {
  // For Caremax customer routes (shopping, payments, auth)
  if (config.url?.includes('/caremaxSales/') || 
      config.url?.includes('/caremax-auth/') ||
      config.url?.includes('/payments/caremaxSales/')) {
    const caremaxToken = localStorage.getItem("caremax_token");
    if (caremaxToken) {
      config.headers.Authorization = `Bearer ${caremaxToken}`;
    }
  } else {
    // For main app routes (admin, dashboard, etc.)
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Add response interceptor to handle 401 errors with token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Don't retry if it's already a retry request
    if (originalRequest._retry) {
      // Clear token and redirect
      const url = originalRequest.url || '';
      if (url.includes('/caremaxSales/') || 
          url.includes('/caremax-auth/') ||
          url.includes('/payments/caremaxSales/')) {
        localStorage.removeItem("caremax_token");
        window.location.href = "/";
      } else {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }
    
    // Check if it's a 401 error
    if (error.response && error.response.status === 401) {
      const url = originalRequest.url || '';
      const errorMessage = error.response?.data?.message || '';
      
      // For token expired specifically, try to refresh
      if (errorMessage.includes('expired') || errorMessage.includes('Token expired')) {
        
        // For Caremax routes - handle separately
        if (url.includes('/caremaxSales/') || 
            url.includes('/caremax-auth/') ||
            url.includes('/payments/caremaxSales/')) {
          const caremaxToken = localStorage.getItem("caremax_token");
          if (caremaxToken && !isRefreshing) {
            originalRequest._retry = true;
            
            try {
              // Try to refresh caremax token
              const refreshResponse = await axios.post(
                `${import.meta.env.VITE_API_URL}/users/refresh-token`,
                {},
                {
                  headers: { Authorization: `Bearer ${caremaxToken}` }
                }
              );
              
              if (refreshResponse.data.token) {
                localStorage.setItem("caremax_token", refreshResponse.data.token);
                originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.token}`;
                return axiosInstance(originalRequest);
              }
            } catch (refreshError) {
              localStorage.removeItem("caremax_token");
              window.location.href = "/";
              return Promise.reject(refreshError);
            }
          }
        } 
        // For main app routes (including guard)
        else {
          const token = localStorage.getItem("token");
          
          if (token && !isRefreshing) {
            originalRequest._retry = true;
            isRefreshing = true;
            
            try {
              // Try to refresh the token
              const refreshResponse = await axios.post(
                `${import.meta.env.VITE_API_URL}/users/refresh-token`,
                {},
                {
                  headers: { Authorization: `Bearer ${token}` }
                }
              );
              
              if (refreshResponse.data.token) {
                const newToken = refreshResponse.data.token;
                localStorage.setItem("token", newToken);
                
                // Process queued requests
                processQueue(null, newToken);
                
                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return axiosInstance(originalRequest);
              } else {
                throw new Error('No token in refresh response');
              }
            } catch (refreshError) {
              // Refresh failed - clear tokens and redirect
              processQueue(refreshError, null);
              localStorage.removeItem("token");
              
              // Check if user is guard - show appropriate message
              const userData = localStorage.getItem("user");
              if (userData) {
                try {
                  const user = JSON.parse(userData);
                  if (user.role?.includes('guard')) {
                    console.log('Guard session expired - please login again');
                  }
                } catch(e) {}
              }
              
              window.location.href = "/login";
              return Promise.reject(refreshError);
            } finally {
              isRefreshing = false;
            }
          }
        }
      } 
      // For other 401 errors (not expired), just clear and redirect
      else {
        if (url.includes('/caremaxSales/') || 
            url.includes('/caremax-auth/') ||
            url.includes('/payments/caremaxSales/')) {
          localStorage.removeItem("caremax_token");
          window.location.href = "/";
        } else {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;