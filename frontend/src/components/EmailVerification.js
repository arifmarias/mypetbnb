import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { CheckCircle, XCircle, Mail, RotateCcw } from 'lucide-react';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const [verificationStatus, setVerificationStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');
  const [isResending, setIsResending] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      setVerificationStatus('error');
      setMessage('No verification token provided');
    }
  }, [token]);

  const verifyEmail = async (verificationToken) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: verificationToken
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setVerificationStatus('success');
        setMessage('Your email has been successfully verified! You can now access all features.');
        toast.success('Email verified successfully!');
      } else {
        setVerificationStatus('error');
        setMessage(data.detail || 'Email verification failed');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      setVerificationStatus('error');
      setMessage('An error occurred during email verification');
    }
  };

  const resendVerification = async () => {
    setIsResending(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Please log in to resend verification email');
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Verification email sent! Please check your inbox.', 'success');
      } else {
        showToast(data.detail || 'Failed to resend verification email', 'error');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      showToast('An error occurred while resending verification email', 'error');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {verificationStatus === 'verifying' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Email...</h2>
              <p className="text-gray-600">Please wait while we verify your email address.</p>
            </>
          )}

          {verificationStatus === 'success' && (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Email Verified!</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-3">
                <Link
                  to="/dashboard"
                  className="w-full btn btn-primary py-3 inline-flex items-center justify-center"
                >
                  Go to Dashboard
                </Link>
                <Link
                  to="/"
                  className="w-full btn btn-secondary py-3 inline-flex items-center justify-center"
                >
                  Go to Home
                </Link>
              </div>
            </>
          )}

          {verificationStatus === 'error' && (
            <>
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Verification Failed</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              
              <div className="space-y-3">
                <button
                  onClick={resendVerification}
                  disabled={isResending}
                  className="w-full btn btn-primary py-3 inline-flex items-center justify-center disabled:opacity-50"
                >
                  {isResending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <RotateCcw className="h-4 w-4 mr-2" />
                  )}
                  {isResending ? 'Sending...' : 'Resend Verification Email'}
                </button>
                
                <Link
                  to="/"
                  className="w-full btn btn-secondary py-3 inline-flex items-center justify-center"
                >
                  Go to Home
                </Link>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Having trouble?</p>
                    <p>Check your spam folder or contact support if you continue having issues.</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;