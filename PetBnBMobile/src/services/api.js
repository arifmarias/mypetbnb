// PetBnBMobile/src/services/api.js - Add Pets API Integration

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Use your server's IP address - replace with your actual IP
const BASE_URL = 'http://192.168.68.105:8000';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Log request for debugging
      console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
      if (config.data && Object.keys(config.data).length > 0) {
        console.log('Request data:', JSON.stringify(config.data, null, 2));
      }
      
      return config;
    } catch (error) {
      console.error('Error adding auth token:', error);
      return config;
    }
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await api.post('/api/auth/refresh', {
            refresh_token: refreshToken
          });
          
          const { access_token } = response.data;
          await AsyncStorage.setItem('access_token', access_token);
          
          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Clear stored tokens
        await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user_data']);
        // Redirect to login would be handled by auth context
      }
    }

    // Log error details
    console.error(`❌ API Error: ${error.response?.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    if (error.response?.data) {
      console.error('Error response:', error.response.data);
    }

    return Promise.reject(error);
  }
);

// Initialize API (call this in App.js)
export const initializeAPI = async () => {
  try {
    // Test API connection
    const response = await api.get('/health');
    console.log('✅ API connection established:', response.data);
    return true;
  } catch (error) {
    console.error('❌ API connection failed:', error.message);
    return false;
  }
};

// Auth API
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.warn('Logout API call failed:', error);
    }
    // Clear local storage regardless
    await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user_data']);
  },

  verifyEmail: async (token) => {
    const response = await api.post('/api/auth/verify-email', { token });
    return response.data;
  },

  requestPasswordReset: async (email) => {
    const response = await api.post('/api/auth/request-password-reset', { email });
    return response.data;
  },

  resetPassword: async (token, newPassword) => {
    const response = await api.post('/api/auth/reset-password', {
      token,
      new_password: newPassword,
    });
    return response.data;
  },
};

// Pets API - Updated to use real backend
export const petsAPI = {
  // Get all pets for current user
  getAllPets: async () => {
    const response = await api.get('/api/pets');
    return response.data;
  },

  // Get pet by ID
  getPetById: async (petId) => {
    const response = await api.get(`/api/pets/${petId}`);
    return response.data;
  },

  // Create new pet
  createPet: async (petData) => {
    console.log('Original pet data from form:', petData);
    
    // Transform frontend data to match backend PetCreate model exactly
    const backendPetData = {
      // Basic required fields
      name: petData.name?.trim() || '',
      species: petData.species || 'dog',
      breed: petData.breed?.trim() || null,
      age: petData.age ? parseInt(petData.age) : null,
      weight: petData.weight ? parseFloat(petData.weight) : null,
      gender: petData.gender || 'unknown',
      description: petData.description?.trim() || null,
      
      // Images array
      images: petData.image ? [petData.image] : [],
      
      // Complex JSON fields - send as objects, not strings
      medical_info: {
        vaccinations: petData.medical_info?.vaccinations?.trim() || '',
        medications: petData.medical_info?.medications?.trim() || '',
        allergies: petData.medical_info?.allergies?.trim() || '',
        conditions: petData.medical_info?.conditions?.trim() || '',
        veterinarian_name: petData.medical_info?.veterinarian_name?.trim() || '',
        veterinarian_phone: petData.medical_info?.veterinarian_phone?.trim() || '',
      },
      
      behavioral_notes: {
        personality: petData.behavior_info?.personality?.trim() || '',
        good_with: petData.behavior_info?.good_with?.trim() || '',
        training: petData.behavior_info?.training?.trim() || '',
        special_needs: petData.behavior_info?.special_needs?.trim() || '',
      },
      
      emergency_contact: {
        name: petData.care_instructions?.emergency_contact_name?.trim() || '',
        phone: petData.care_instructions?.emergency_contact_phone?.trim() || '',
        feeding: petData.care_instructions?.feeding?.trim() || '',
        exercise: petData.care_instructions?.exercise?.trim() || '',
        grooming: petData.care_instructions?.grooming?.trim() || '',
      },
      
      // Additional fields
      vaccination_records: {},
      special_needs: {},
      is_active: true,
    };

    console.log('Transformed data for backend:', JSON.stringify(backendPetData, null, 2));

    const response = await api.post('/api/pets', backendPetData);
    return response.data;
  },

  // Update pet
  updatePet: async (petId, petData) => {
    console.log('Updating pet with data:', petData);
    
    // Transform data similar to createPet but only include changed fields
    const backendPetData = {};
    
    // Only include fields that have values
    if (petData.name !== undefined) backendPetData.name = petData.name?.trim();
    if (petData.species !== undefined) backendPetData.species = petData.species;
    if (petData.breed !== undefined) backendPetData.breed = petData.breed?.trim() || null;
    if (petData.age !== undefined) backendPetData.age = petData.age ? parseInt(petData.age) : null;
    if (petData.weight !== undefined) backendPetData.weight = petData.weight ? parseFloat(petData.weight) : null;
    if (petData.gender !== undefined) backendPetData.gender = petData.gender;
    if (petData.description !== undefined) backendPetData.description = petData.description?.trim() || null;
    if (petData.images !== undefined) backendPetData.images = petData.images;
    
    // Handle complex objects
    if (petData.medical_info) {
      backendPetData.medical_info = {
        vaccinations: petData.medical_info.vaccinations?.trim() || '',
        medications: petData.medical_info.medications?.trim() || '',
        allergies: petData.medical_info.allergies?.trim() || '',
        conditions: petData.medical_info.conditions?.trim() || '',
        veterinarian_name: petData.medical_info.veterinarian_name?.trim() || '',
        veterinarian_phone: petData.medical_info.veterinarian_phone?.trim() || '',
      };
    }
    
    if (petData.behavior_info) {
      backendPetData.behavioral_notes = {
        personality: petData.behavior_info.personality?.trim() || '',
        good_with: petData.behavior_info.good_with?.trim() || '',
        training: petData.behavior_info.training?.trim() || '',
        special_needs: petData.behavior_info.special_needs?.trim() || '',
      };
    }
    
    if (petData.care_instructions) {
      backendPetData.emergency_contact = {
        name: petData.care_instructions.emergency_contact_name?.trim() || '',
        phone: petData.care_instructions.emergency_contact_phone?.trim() || '',
        feeding: petData.care_instructions.feeding?.trim() || '',
        exercise: petData.care_instructions.exercise?.trim() || '',
        grooming: petData.care_instructions.grooming?.trim() || '',
      };
    }

    console.log('Transformed update data for backend:', JSON.stringify(backendPetData, null, 2));

    const response = await api.put(`/api/pets/${petId}`, backendPetData);
    return response.data;
  },

  // Delete pet
  deletePet: async (petId) => {
    const response = await api.delete(`/api/pets/${petId}`);
    return response.data;
  },

  // Upload pet image
  uploadPetImage: async (petId, imageUri) => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `pet_${petId}_${Date.now()}.jpg`,
      });

      const response = await api.post(`/api/pets/${petId}/upload-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Pet image upload error:', error);
      throw error;
    }
  },
};

// Services API - Updated to use real backend
export const servicesAPI = {
  // Search services with filters
  searchServices: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.service_type) params.append('service_type', filters.service_type);
    if (filters.location) params.append('location', filters.location);
    if (filters.min_price) params.append('min_price', filters.min_price);
    if (filters.max_price) params.append('max_price', filters.max_price);
    if (filters.rating) params.append('min_rating', filters.rating);
    if (filters.latitude && filters.longitude) {
      params.append('latitude', filters.latitude);
      params.append('longitude', filters.longitude);
      params.append('radius', filters.radius || 10);
    }

    const response = await api.get(`/api/services/search?${params.toString()}`);
    return response.data;
  },

  // Get service by ID
  getServiceById: async (serviceId) => {
    const response = await api.get(`/api/services/${serviceId}`);
    return response.data;
  },

  // Get services by caregiver
  getServicesByCaregiver: async (caregiverId) => {
    const response = await api.get(`/api/services/caregiver/${caregiverId}`);
    return response.data;
  },

  // Create service (for caregivers)
  createService: async (serviceData) => {
    const response = await api.post('/api/services', serviceData);
    return response.data;
  },

  // Update service
  updateService: async (serviceId, serviceData) => {
    const response = await api.put(`/api/services/${serviceId}`, serviceData);
    return response.data;
  },

  // Delete service
  deleteService: async (serviceId) => {
    const response = await api.delete(`/api/services/${serviceId}`);
    return response.data;
  },
};

// Bookings API - Updated to use real backend
export const bookingsAPI = {
  // Get all bookings for current user
  getAllBookings: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);

    const response = await api.get(`/api/bookings?${params.toString()}`);
    return response.data;
  },

  // Get booking by ID
  getBookingById: async (bookingId) => {
    const response = await api.get(`/api/bookings/${bookingId}`);
    return response.data;
  },

  // Create new booking
  createBooking: async (bookingData) => {
    // Transform frontend booking data to backend format
    const backendBookingData = {
      service_id: bookingData.serviceId,
      pet_ids: bookingData.selectedPets, // Array of pet IDs
      start_datetime: new Date(`${bookingData.serviceDate.toDateString()} ${bookingData.serviceTime}`).toISOString(),
      end_datetime: new Date(`${bookingData.serviceDate.toDateString()} ${bookingData.serviceTime}`).toISOString(), // Will be calculated by backend
      special_requirements: bookingData.specialRequirements,
      emergency_contact: JSON.stringify(bookingData.emergencyContact),
      payment_method: bookingData.paymentMethod,
    };

    const response = await api.post('/api/bookings', backendBookingData);
    return response.data;
  },

  // Update booking
  updateBooking: async (bookingId, updateData) => {
    const response = await api.put(`/api/bookings/${bookingId}`, updateData);
    return response.data;
  },

  // Cancel booking
  cancelBooking: async (bookingId, reason) => {
    const response = await api.post(`/api/bookings/${bookingId}/cancel`, {
      cancellation_reason: reason,
    });
    return response.data;
  },

  // Confirm booking (for caregivers)
  confirmBooking: async (bookingId) => {
    const response = await api.post(`/api/bookings/${bookingId}/confirm`);
    return response.data;
  },

  // Complete booking
  completeBooking: async (bookingId) => {
    const response = await api.post(`/api/bookings/${bookingId}/complete`);
    return response.data;
  },

  // Get filtered bookings
  getFilteredBookings: async (filterType) => {
    const response = await api.get(`/api/bookings/filter/${filterType}`);
    return response.data;
  },
};

// Reviews API
export const reviewsAPI = {
  // Get reviews for a service
  getServiceReviews: async (serviceId) => {
    const response = await api.get(`/api/reviews/service/${serviceId}`);
    return response.data;
  },

  // Get reviews by user
  getUserReviews: async (userId) => {
    const response = await api.get(`/api/reviews/user/${userId}`);
    return response.data;
  },

  // Create review
  createReview: async (reviewData) => {
    const response = await api.post('/api/reviews', reviewData);
    return response.data;
  },

  // Update review
  updateReview: async (reviewId, reviewData) => {
    const response = await api.put(`/api/reviews/${reviewId}`, reviewData);
    return response.data;
  },

  // Delete review
  deleteReview: async (reviewId) => {
    const response = await api.delete(`/api/reviews/${reviewId}`);
    return response.data;
  },
};

// User Profile API
export const userAPI = {
  // Update profile
  updateProfile: async (userData) => {
    const response = await api.put('/api/users/profile', userData);
    return response.data;
  },

  // Upload profile image
  uploadProfileImage: async (imageUri) => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `profile_${Date.now()}.jpg`,
      });

      const response = await api.post('/api/users/upload-profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Profile image upload error:', error);
      throw error;
    }
  },

  // Get user stats
  getUserStats: async () => {
    const response = await api.get('/api/stats/user');
    return response.data;
  },
};

// Messages API
export const messagesAPI = {
  // Get conversation messages
  getMessages: async (conversationId) => {
    const response = await api.get(`/api/messages/conversation/${conversationId}`);
    return response.data;
  },

  // Send message
  sendMessage: async (messageData) => {
    const response = await api.post('/api/messages', messageData);
    return response.data;
  },

  // Mark message as read
  markAsRead: async (messageId) => {
    const response = await api.put(`/api/messages/${messageId}/read`);
    return response.data;
  },
};

// Payment API
export const paymentAPI = {
  // Create payment intent
  createPaymentIntent: async (bookingId, amount) => {
    const response = await api.post('/api/payments/create-intent', {
      booking_id: bookingId,
      amount: amount,
    });
    return response.data;
  },

  // Confirm payment
  confirmPayment: async (paymentIntentId) => {
    const response = await api.post('/api/payments/confirm', {
      payment_intent_id: paymentIntentId,
    });
    return response.data;
  },
};

// File upload helper
export const uploadFile = async (fileUri, endpoint, fieldName = 'file') => {
  try {
    const formData = new FormData();
    formData.append(fieldName, {
      uri: fileUri,
      type: 'image/jpeg',
      name: `upload_${Date.now()}.jpg`,
    });

    const response = await api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};

// Export the configured axios instance for custom requests
export { api };
export default api;