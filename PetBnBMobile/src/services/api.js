import axios from 'axios';

// Use your existing backend URL
const API_BASE_URL = 'https://7bd2a15a-a27c-42f7-962e-182a18f4d2f6.preview.emergentagent.com';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  getProfile: () => api.get('/api/auth/me'),
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
  searchServices: (searchParams) => api.post('/api/search/location', searchParams),
};

export const bookingsAPI = {
  getBookings: () => api.get('/api/bookings'),
  createBooking: (bookingData) => api.post('/api/bookings', bookingData),
  getBooking: (bookingId) => api.get(`/api/bookings/${bookingId}`),
};

export const messagesAPI = {
  getMessages: (bookingId) => api.get(`/api/messages/${bookingId}`),
  sendMessage: (messageData) => api.post('/api/messages', messageData),
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