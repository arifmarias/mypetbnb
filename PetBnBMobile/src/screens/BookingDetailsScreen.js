import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { bookingsAPI } from '../services/api';

const BookingDetailsScreen = ({ route, navigation }) => {
  const { bookingId } = route.params || {};
  const { user } = useAuth();
  const toast = useToast();
  
  const [booking, setBooking] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await bookingsAPI.getBookingDetails(bookingId);
      
      if (response.data) {
        setBooking(response.data.booking);
        setMessages(response.data.messages || []);
        setUserRole(response.data.user_role);
      }
    } catch (error) {
      console.error('Failed to fetch booking details:', error);
      toast.error('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookingDetails();
    setRefreshing(false);
  };

  const updateBookingStatus = async (newStatus) => {
    try {
      setUpdating(true);
      const response = await bookingsAPI.updateBookingStatus(bookingId, { status: newStatus });
      
      if (response.data) {
        toast.success(`Booking ${newStatus.replace('_', ' ')}`);
        await fetchBookingDetails(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to update booking status:', error);
      toast.error('Failed to update booking status');
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusUpdate = (newStatus) => {
    const statusMessages = {
      confirmed: 'Are you sure you want to confirm this booking?',
      rejected: 'Are you sure you want to reject this booking?',
      cancelled: 'Are you sure you want to cancel this booking?',
      in_progress: 'Mark this booking as in progress?',
      completed: 'Mark this booking as completed?'
    };

    Alert.alert(
      'Update Booking Status',
      statusMessages[newStatus],
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: () => updateBookingStatus(newStatus),
          style: newStatus === 'rejected' || newStatus === 'cancelled' ? 'destructive' : 'default'
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'in_progress': return '#3B82F6';
      case 'completed': return '#059669';
      case 'cancelled': return '#EF4444';
      case 'rejected': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return 'checkmark-circle';
      case 'pending': return 'time';
      case 'in_progress': return 'play-circle';
      case 'completed': return 'checkmark-done-circle';
      case 'cancelled': return 'close-circle';
      case 'rejected': return 'ban';
      default: return 'help-circle';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderActionButtons = () => {
    if (!booking || updating) return null;

    const status = booking.booking_status;
    const isPetOwner = userRole === 'pet_owner';
    const isCaregiver = userRole === 'caregiver';

    if (status === 'pending') {
      if (isCaregiver) {
        return (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleStatusUpdate('rejected')}
              disabled={updating}
            >
              <Ionicons name="close" size={20} color="white" />
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.confirmButton]}
              onPress={() => handleStatusUpdate('confirmed')}
              disabled={updating}
            >
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={styles.actionButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        );
      } else if (isPetOwner) {
        return (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleStatusUpdate('cancelled')}
              disabled={updating}
            >
              <Ionicons name="close" size={20} color="white" />
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        );
      }
    }

    if (status === 'confirmed' && isCaregiver) {
      return (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.progressButton]}
            onPress={() => handleStatusUpdate('in_progress')}
            disabled={updating}
          >
            <Ionicons name="play" size={20} color="white" />
            <Text style={styles.actionButtonText}>Start Service</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (status === 'in_progress' && isCaregiver) {
      return (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => handleStatusUpdate('completed')}
            disabled={updating}
          >
            <Ionicons name="checkmark-done" size={20} color="white" />
            <Text style={styles.actionButtonText}>Complete Service</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5A5F" />
          <Text style={styles.loadingText}>Loading booking details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
          <Text style={styles.errorText}>Booking not found</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.navigate('ChatScreen', {
            conversationId: bookingId,
            contactName: userRole === 'pet_owner' 
              ? `${booking.caregiver_profiles?.users?.first_name} ${booking.caregiver_profiles?.users?.last_name}`
              : `${booking.users?.first_name} ${booking.users?.last_name}`,
            bookingId: bookingId,
            serviceType: booking.caregiver_services?.title
          })}
        >
          <Ionicons name="chatbubble-outline" size={24} color="#FF5A5F" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIcon, { backgroundColor: getStatusColor(booking.booking_status) + '20' }]}>
              <Ionicons 
                name={getStatusIcon(booking.booking_status)} 
                size={24} 
                color={getStatusColor(booking.booking_status)} 
              />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>
                {booking.booking_status.replace('_', ' ').toUpperCase()}
              </Text>
              <Text style={styles.statusSubtitle}>
                {booking.booking_status === 'pending' && 'Waiting for confirmation'}
                {booking.booking_status === 'confirmed' && 'Ready to start'}
                {booking.booking_status === 'in_progress' && 'Service in progress'}
                {booking.booking_status === 'completed' && 'Service completed'}
                {booking.booking_status === 'cancelled' && 'Booking cancelled'}
                {booking.booking_status === 'rejected' && 'Booking rejected'}
              </Text>
            </View>
          </View>
        </View>

        {/* Service Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Details</Text>
          <View style={styles.serviceCard}>
            <View style={styles.serviceHeader}>
              <Text style={styles.serviceName}>{booking.caregiver_services?.title}</Text>
              <Text style={styles.servicePrice}>${booking.total_amount}</Text>
            </View>
            <Text style={styles.serviceDescription}>
              {booking.caregiver_services?.description}
            </Text>
          </View>
        </View>

        {/* Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <View style={styles.scheduleCard}>
            <View style={styles.scheduleItem}>
              <Ionicons name="calendar" size={20} color="#666" />
              <View style={styles.scheduleInfo}>
                <Text style={styles.scheduleLabel}>Start Time</Text>
                <Text style={styles.scheduleValue}>
                  {formatDate(booking.start_datetime)}
                </Text>
              </View>
            </View>
            <View style={styles.scheduleDivider} />
            <View style={styles.scheduleItem}>
              <Ionicons name="time" size={20} color="#666" />
              <View style={styles.scheduleInfo}>
                <Text style={styles.scheduleLabel}>End Time</Text>
                <Text style={styles.scheduleValue}>
                  {formatDate(booking.end_datetime)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Participants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {userRole === 'pet_owner' ? 'Caregiver' : 'Pet Owner'}
          </Text>
          <View style={styles.participantCard}>
            <View style={styles.participantAvatar}>
              <Text style={styles.participantInitial}>
                {userRole === 'pet_owner' 
                  ? (booking.caregiver_profiles?.users?.first_name?.charAt(0) || 'C')
                  : (booking.users?.first_name?.charAt(0) || 'P')
                }
              </Text>
            </View>
            <View style={styles.participantInfo}>
              <Text style={styles.participantName}>
                {userRole === 'pet_owner' 
                  ? `${booking.caregiver_profiles?.users?.first_name} ${booking.caregiver_profiles?.users?.last_name}`
                  : `${booking.users?.first_name} ${booking.users?.last_name}`
                }
              </Text>
              <Text style={styles.participantEmail}>
                {userRole === 'pet_owner' 
                  ? booking.caregiver_profiles?.users?.email
                  : booking.users?.email
                }
              </Text>
            </View>
            <TouchableOpacity style={styles.contactButton}>
              <Ionicons name="call" size={20} color="#FF5A5F" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Pet Information */}
        {booking.pets && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pet Information</Text>
            <View style={styles.petCard}>
              <View style={styles.petInfo}>
                <Text style={styles.petName}>{booking.pets.name}</Text>
                <Text style={styles.petDetails}>
                  {booking.pets.species} • {booking.pets.breed}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Special Requirements */}
        {booking.special_requirements && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Requirements</Text>
            <View style={styles.requirementsCard}>
              <Text style={styles.requirementsText}>
                {booking.special_requirements}
              </Text>
            </View>
          </View>
        )}

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Total Amount</Text>
              <Text style={styles.paymentAmount}>${booking.total_amount}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Payment Status</Text>
              <View style={[styles.paymentStatus, { 
                backgroundColor: booking.payment_status === 'completed' ? '#10B981' : '#F59E0B'
              }]}>
                <Text style={styles.paymentStatusText}>
                  {booking.payment_status.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {renderActionButtons()}
      </ScrollView>

      {updating && (
        <View style={styles.updatingOverlay}>
          <ActivityIndicator size="large" color="#FF5A5F" />
          <Text style={styles.updatingText}>Updating booking...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerBackButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  serviceCard: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 8,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF5A5F',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  scheduleCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    overflow: 'hidden',
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  scheduleInfo: {
    marginLeft: 12,
    flex: 1,
  },
  scheduleLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  scheduleValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  scheduleDivider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 16,
  },
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 8,
  },
  participantAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF5A5F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  participantInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  participantEmail: {
    fontSize: 14,
    color: '#666',
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF5A5F20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petCard: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 8,
  },
  petInfo: {
    alignItems: 'center',
  },
  petName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  petDetails: {
    fontSize: 14,
    color: '#666',
  },
  requirementsCard: {
    backgroundColor: '#FFF7ED',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  requirementsText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  paymentCard: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  confirmButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
  },
  progressButton: {
    backgroundColor: '#3B82F6',
  },
  completeButton: {
    backgroundColor: '#059669',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: '#FF5A5F',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  updatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updatingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 16,
  },
});

export default BookingDetailsScreen;