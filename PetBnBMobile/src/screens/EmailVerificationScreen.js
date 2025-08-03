import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

const EmailVerificationScreen = ({ navigation }) => {
  const { user, checkAuthStatus } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const response = await api.get('/api/auth/verification-status');
      setVerificationStatus(response.data.verification_status);
      
      // If already verified, navigate to main app
      if (response.data.verification_status.email_verified) {
        toast.success('Email already verified!');
        navigation.replace('MainTabs');
      }
    } catch (error) {
      console.error('Failed to check verification status:', error);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      const response = await api.post('/api/auth/resend-verification');
      
      if (response.data.already_verified) {
        toast.success('Email already verified!');
        navigation.replace('MainTabs');
      } else if (response.data.sent) {
        toast.success('Verification email sent! Check your inbox.');
      }
    } catch (error) {
      console.error('Failed to resend verification:', error);
      toast.error('Failed to send verification email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setLoading(true);
    try {
      await checkAuthStatus(); // Refresh user data
      await checkVerificationStatus();
    } catch (error) {
      console.error('Failed to check verification:', error);
      toast.error('Failed to check verification status');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipForNow = () => {
    Alert.alert(
      'Skip Email Verification?',
      'You can verify your email later, but some features will be limited until verification is complete.',
      [
        { text: 'Continue Verification', style: 'cancel' },
        { 
          text: 'Skip for Now', 
          onPress: () => navigation.replace('MainTabs'),
          style: 'destructive'
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="mail" size={64} color="#FF5A5F" />
          </View>
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a verification link to{'\n'}
            <Text style={styles.email}>{user?.email}</Text>
          </Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>Check your email inbox</Text>
          </View>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>Click the verification link</Text>
          </View>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>Return to the app</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.checkButton}
            onPress={handleCheckVerification}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="refresh" size={20} color="white" />
                <Text style={styles.checkButtonText}>I've Verified My Email</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.resendButton}
            onPress={handleResendVerification}
            disabled={resendLoading}
          >
            {resendLoading ? (
              <ActivityIndicator color="#FF5A5F" />
            ) : (
              <Text style={styles.resendButtonText}>Resend Verification Email</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Help */}
        <View style={styles.help}>
          <Text style={styles.helpText}>
            Didn't receive the email? Check your spam folder or try resending.
          </Text>
          
          <TouchableOpacity onPress={handleSkipForNow}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FF5A5F20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  email: {
    color: '#FF5A5F',
    fontWeight: '600',
  },
  instructions: {
    marginBottom: 48,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF5A5F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  actions: {
    marginBottom: 32,
  },
  checkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF5A5F',
    paddingVertical: 16,
    borderRadius: 25,
    marginBottom: 16,
    gap: 8,
  },
  checkButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  resendButtonText: {
    color: '#FF5A5F',
    fontSize: 16,
    fontWeight: '600',
  },
  help: {
    alignItems: 'center',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  skipText: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'underline',
  },
});

export default EmailVerificationScreen;