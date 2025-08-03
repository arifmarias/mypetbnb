import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import AuthModal from './components/AuthModal';
import PetOwnerDashboard from './components/PetOwnerDashboard';
import CaregiverDashboard from './components/CaregiverDashboard';
import SearchResults from './components/SearchResults';
import BookingFlow from './components/BookingFlow';
import MessagingCenter from './components/MessagingCenter';
import UserProfile from './components/UserProfile';
import OAuthCallback from './components/OAuthCallback';
import EmailVerification from './components/EmailVerification';

// Context
import { AuthContext } from './context/AuthContext';
import { ToastProvider } from './components/Toast';

// Configure axios defaults
axios.defaults.baseURL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await axios.get('/api/auth/me');
        setUser(response.data);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await axios.post('/api/auth/login', credentials);
      const { access_token, user_id } = response.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user_id', user_id);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      await checkAuthStatus();
      setShowAuthModal(false);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      const { access_token, user_id } = response.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user_id', user_id);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      await checkAuthStatus();
      setShowAuthModal(false);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const openAuth = (mode = 'login') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, openAuth }}>
      <ToastProvider>
        <Router>
          <div className="App min-h-screen flex flex-col bg-gray-50">
            <Header />
            
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/search" element={<SearchResults />} />
                
                {/* Protected Routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    user ? (
                      user.role === 'pet_owner' ? <PetOwnerDashboard /> : <CaregiverDashboard />
                    ) : (
                      <Navigate to="/" />
                    )
                  } 
                />
                <Route 
                  path="/booking/:serviceId" 
                  element={user ? <BookingFlow /> : <Navigate to="/" />} 
                />
                <Route 
                  path="/messages" 
                  element={user ? <MessagingCenter /> : <Navigate to="/" />} 
                />
                <Route 
                  path="/profile" 
                  element={user ? <UserProfile /> : <Navigate to="/" />} 
                />
                <Route 
                  path="/oauth-callback" 
                  element={<OAuthCallback />} 
                />
                <Route 
                  path="/verify-email" 
                  element={<EmailVerification />} 
                />
              </Routes>
            </main>

            <Footer />

            {/* Auth Modal */}
            {showAuthModal && (
              <AuthModal 
                mode={authMode}
                onClose={() => setShowAuthModal(false)}
                onSwitchMode={(mode) => setAuthMode(mode)}
              />
            )}
          </div>
        </Router>
      </ToastProvider>
    </AuthContext.Provider>
  );
}

export default App;