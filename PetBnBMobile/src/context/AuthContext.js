import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        // Set the token in API headers
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Verify token is still valid
        const response = await api.get('/api/auth/me');
        setUser(response.data);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user_id');
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format error messages
  const formatErrorMessage = (error) => {
    if (error.response?.data?.detail) {
      const detail = error.response.data.detail;
      
      // Handle Pydantic validation errors (array of error objects)
      if (Array.isArray(detail)) {
        return detail.map(err => {
          const field = err.loc?.slice(-1)[0] || 'field';
          const message = err.msg || 'Invalid input';
          return `${field}: ${message}`;
        }).join(', ');
      }
      
      // Handle simple string errors
      return typeof detail === 'string' ? detail : 'Registration failed';
    }
    
    return error.message || 'Registration failed';
  };

  const login = async (credentials) => {
    try {
      const response = await api.post('/api/auth/login', credentials);
      const { access_token, user_id } = response.data;
      
      // Store token and user ID
      await AsyncStorage.setItem('token', access_token);
      await AsyncStorage.setItem('user_id', user_id);
      
      // Set API header
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Get user details
      await checkAuthStatus();
      
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: formatErrorMessage(error)
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      const { access_token, user_id } = response.data;
      
      // Store token and user ID
      await AsyncStorage.setItem('token', access_token);
      await AsyncStorage.setItem('user_id', user_id);
      
      // Set API header
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Get user details
      await checkAuthStatus();
      
      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      return { 
        success: false, 
        error: formatErrorMessage(error)
      };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user_id');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};