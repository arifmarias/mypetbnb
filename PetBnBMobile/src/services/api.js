import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use your computer's IP address (replace with your actual IP)
const API_BASE_URL = 'http://192.168.68.105:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
      return config;
    } catch (error) {
      console.error('Error getting token:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user_id');
      // You might want to redirect to login screen here
      console.log('Token expired, user needs to login again');
    }
    
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  getProfile: () => api.get('/api/auth/me'),
  verifyEmail: (token) => api.post('/api/auth/verify-email', { token }),
  resendVerification: () => api.post('/api/auth/resend-verification'),
  getVerificationStatus: () => api.get('/api/auth/verification-status'),
};

export const petsAPI = {
  getPets: () => api.get('/api/pets'),
  createPet: (petData) => api.post('/api/pets', petData),
  getPet: (petId) => api.get(`/api/pets/${petId}`),
  updatePet: (petId, petData) => api.put(`/api/pets/${petId}`, petData),
  deletePet: (petId) => api.delete(`/api/pets/${petId}`),
};

export const servicesAPI = {
  getServices: () => api.get('/api/caregiver/services'),
  createService: (serviceData) => api.post('/api/caregiver/services', serviceData),
  updateService: (serviceId, serviceData) => api.put(`/api/caregiver/services/${serviceId}`, serviceData),
  deleteService: (serviceId) => api.delete(`/api/caregiver/services/${serviceId}`),
  searchServices: (searchParams) => api.post('/api/search/location', searchParams),
};

export const bookingsAPI = {
  // Basic booking operations
  getBookings: () => api.get('/api/bookings'),
  createBooking: (bookingData) => api.post('/api/bookings', bookingData),
  getBooking: (bookingId) => api.get(`/api/bookings/${bookingId}`),
  
  // Enhanced booking operations
  getUpcomingBookings: () => api.get('/api/bookings/upcoming'),
  getTodayBookings: () => api.get('/api/bookings/today'),
  getBookingHistory: (params = {}) => api.get('/api/bookings/history', { params }),
  getBookingDetails: (bookingId) => api.get(`/api/bookings/${bookingId}/details`),
  
  // Booking status updates
  updateBookingStatus: (bookingId, status, data = {}) => 
    api.put(`/api/bookings/${bookingId}/status`, { status, ...data }),
  
  // Booking filters
  getFilteredBookings: (filter, params = {}) => 
    api.get(`/api/bookings/filter/${filter}`, { params }),
};

export const messagesAPI = {
  getMessages: (bookingId) => api.get(`/api/messages/${bookingId}`),
  sendMessage: (messageData) => api.post('/api/messages', messageData),
  markAsRead: (messageId) => api.put(`/api/messages/${messageId}/read`),
};

export const uploadAPI = {
  uploadFile: (fileData) => {
    const formData = new FormData();
    formData.append('file', fileData);
    return api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Verification APIs
export const verificationAPI = {
  submitIdVerification: (verificationData) => api.post('/api/caregiver/submit-id-verification', verificationData),
  getIdVerificationStatus: () => api.get('/api/caregiver/id-verification-status'),
};

// OAuth APIs
export const oauthAPI = {
  emergentLogin: (sessionData) => api.post('/api/auth/oauth/emergent', sessionData),
};

// Location and search APIs
export const locationAPI = {
  searchByLocation: (searchParams) => api.post('/api/search/location', searchParams),
  getNearbyServices: (lat, lng, radius = 10) => api.get(`/api/search/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
};

// Statistics APIs (for dashboard) - NEW
export const statsAPI = {
  getUserStats: () => api.get('/api/stats/user'),
  getCaregiverStats: () => api.get('/api/stats/caregiver'),
  getCaregiverEarnings: () => api.get('/api/stats/caregiver/earnings'),
  getBookingStats: () => api.get('/api/stats/bookings'),
};

// Notification APIs
export const notificationAPI = {
  getNotifications: () => api.get('/api/notifications'),
  markNotificationRead: (notificationId) => api.put(`/api/notifications/${notificationId}/read`),
  markAllNotificationsRead: () => api.put('/api/notifications/mark-all-read'),
  updateNotificationSettings: (settings) => api.put('/api/notifications/settings', settings),
};

// Profile APIs
export const profileAPI = {
  updateProfile: (profileData) => api.put('/api/profile', profileData),
  getCaregiverProfile: (userId) => api.get(`/api/profile/caregiver/${userId}`),
  updateCaregiverProfile: (profileData) => api.put('/api/profile/caregiver', profileData),
  uploadProfileImage: (imageData) => uploadAPI.uploadFile(imageData),
};

// Admin APIs (for future admin panel)
export const adminAPI = {
  getPendingVerifications: () => api.get('/api/admin/verifications/pending'),
  approveVerification: (verificationId) => api.put(`/api/admin/verifications/${verificationId}/approve`),
  rejectVerification: (verificationId, reason) => api.put(`/api/admin/verifications/${verificationId}/reject`, { reason }),
  getUsersList: () => api.get('/api/admin/users'),
  getBookingsList: () => api.get('/api/admin/bookings'),
  getSystemStats: () => api.get('/api/admin/stats'),
};

// Helper functions for common API patterns
export const apiHelpers = {
  // Handle paginated responses
  handlePagination: async (apiCall, page = 1, limit = 20) => {
    try {
      const response = await apiCall({ page, limit });
      return {
        data: response.data.items || response.data,
        pagination: {
          page: response.data.page || page,
          limit: response.data.limit || limit,
          total: response.data.total || response.data.length,
          hasNext: response.data.has_next || false,
          hasPrev: response.data.has_prev || false,
        }
      };
    } catch (error) {
      throw error;
    }
  },

  // Handle file uploads with progress
  uploadWithProgress: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
  },

  // Handle retries for failed requests
  retryRequest: async (apiCall, maxRetries = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  },

  // Handle batch requests
  batchRequests: async (requests) => {
    try {
      const responses = await Promise.allSettled(requests);
      return responses.map((response, index) => ({
        index,
        success: response.status === 'fulfilled',
        data: response.status === 'fulfilled' ? response.value.data : null,
        error: response.status === 'rejected' ? response.reason : null,
      }));
    } catch (error) {
      throw error;
    }
  },
};

// Enhanced error handling
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    switch (status) {
      case 401:
        return 'Authentication required. Please log in again.';
      case 403:
        return 'You don\'t have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 422:
        return data.detail || 'Invalid data provided.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return data.detail || data.message || 'An unexpected error occurred.';
    }
  } else if (error.request) {
    // Network error
    return 'Network error. Please check your connection and try again.';
  } else {
    // Other error
    return error.message || 'An unexpected error occurred.';
  }
};

// Token management utilities
export const tokenManager = {
  // Get stored token
  getToken: async () => {
    try {
      return await AsyncStorage.getItem('token');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  // Set token
  setToken: async (token) => {
    try {
      await AsyncStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      console.error('Error setting token:', error);
    }
  },

  // Remove token
  removeToken: async () => {
    try {
      await AsyncStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Error removing token:', error);
    }
  },

  // Check if token exists
  hasToken: async () => {
    const token = await tokenManager.getToken();
    return !!token;
  },
};

// Initialize token on app start
export const initializeAPI = async () => {
  try {
    const token = await tokenManager.getToken();
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error initializing API:', error);
  }
};

// Export the configured axios instance
export default api;