import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const OAuthCallback = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get session ID from URL fragment
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const sessionId = hashParams.get('session_id');
        
        if (!sessionId) {
          throw new Error('No session ID received from OAuth provider');
        }

        // Get stored user type from localStorage
        const userType = localStorage.getItem('oauth_user_type') || 'pet_owner';
        const mode = localStorage.getItem('oauth_mode') || 'login';

        // Clean up localStorage
        localStorage.removeItem('oauth_user_type');
        localStorage.removeItem('oauth_mode');

        // Send session ID to backend
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/oauth/emergent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: sessionId,
            user_type: userType
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'OAuth authentication failed');
        }

        // Store tokens
        localStorage.setItem('access_token', data.access_token);
        if (data.session_token) {
          localStorage.setItem('session_token', data.session_token);
          // Set cookie for session token (7 day expiry)
          document.cookie = `session_token=${data.session_token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;
        }

        // Show success message
        showToast(
          data.email_verified 
            ? 'Successfully signed in with Google!' 
            : 'Signed in with Google! Please verify your email to access all features.',
          data.email_verified ? 'success' : 'info'
        );

        // Redirect to appropriate dashboard or home
        window.location.href = '/dashboard';

      } catch (error) {
        console.error('OAuth callback error:', error);
        setError(error.message);
        setProcessing(false);
        
        showToast('OAuth authentication failed: ' + error.message, 'error');
        
        // Redirect to home after error with timeout
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }
    };

    handleOAuthCallback();
  }, [login, showToast]);

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Completing Sign In...</h2>
          <p className="text-gray-600">Please wait while we verify your Google account.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Authentication Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
          <p className="text-gray-600 mb-4">You will be redirected to the home page shortly.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="btn btn-primary"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default OAuthCallback;