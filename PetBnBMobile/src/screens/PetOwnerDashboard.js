import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useFocusEffect } from '@react-navigation/native';
import DashboardService from '../services/DashboardService';

const PetOwnerDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalBookings: 0,
      activePets: 0,
      upcomingServices: 0,
      totalSpent: 0,
    },
    upcomingBookings: [],
    recentBookings: [],
    pets: [],
  });
  const [error, setError] = useState(null);

  // Load dashboard data
  const loadDashboardData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await DashboardService.getPetOwnerDashboardData(user?.id);
      
      if (data.error) {
        setError(data.error);
        toast.error('Failed to load dashboard data');
      } else {
        setDashboardData(data);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError('Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user?.id && !loading) {
        loadDashboardData();
      }
    }, [user?.id])
  );

  // Pull to refresh
  const onRefresh = useCallback(() => {
    loadDashboardData(true);
  }, []);

  // Handle booking actions
  const handleBookingAction = async (bookingId, action) => {
    try {
      let result;
      switch (action) {
        case 'cancel':
          Alert.alert(
            'Cancel Booking',
            'Are you sure you want to cancel this booking?',
            [
              { text: 'No', style: 'cancel' },
              {
                text: 'Yes, Cancel',
                style: 'destructive',
                onPress: async () => {
                  result = await DashboardService.cancelBooking(bookingId);
                  if (result.success) {
                    toast.success('Booking cancelled successfully');
                    loadDashboardData();
                  } else {
                    toast.error(result.error || 'Failed to cancel booking');
                  }
                },
              },
            ]
          );
          break;
        default:
          console.log(`Action ${action} not implemented for pet owners`);
      }
    } catch (error) {
      console.error('Booking action error:', error);
      toast.error('Failed to perform action');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'in_progress':
        return '#3B82F6';
      case 'completed':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const renderUpcomingBookings = () => {
    if (!dashboardData.upcomingBookings.length) {
      return null;
    }

    return dashboardData.upcomingBookings.map((booking) => (
      <TouchableOpacity 
        key={booking.id}
        style={styles.bookingCard}
        onPress={() => navigation.navigate('BookingDetails', { bookingId: booking.id })}
      >
        <View style={styles.bookingHeader}>
          <View style={styles.bookingInfo}>
            <Text style={styles.serviceName}>{booking.service}</Text>
            <Text style={styles.bookingDate}>{booking.date} at {booking.time}</Text>
            <Text style={styles.caregiverName}>
              {booking.caregiver?.name || 'Caregiver not assigned'}
            </Text>
            <Text style={styles.location}>{booking.location}</Text>
          </View>
          <View style={styles.bookingRight}>
            <Text style={styles.amount}>RM{booking.amount}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
              <Text style={styles.statusText}>{booking.status}</Text>
            </View>
          </View>
        </View>
        <View style={styles.petsInfo}>
          <Text style={styles.petsLabel}>
            Pets: {booking.pets?.map(pet => pet.name).join(', ') || 'No pets specified'}
          </Text>
        </View>
        {booking.status === 'pending' && (
          <View style={styles.bookingActions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleBookingAction(booking.id, 'cancel')}
            >
              <Text style={[styles.actionButtonText, { color: '#FF5A5F' }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Chat', { bookingId: booking.id })}
            >
              <Ionicons name="chatbubble-outline" size={16} color="#FF5A5F" />
              <Text style={styles.actionButtonText}>Message</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    ));
  };

  const renderRecentBookings = () => {
    if (!dashboardData.recentBookings.length) {
      return null;
    }

    return dashboardData.recentBookings.map((booking) => (
      <TouchableOpacity 
        key={booking.id}
        style={styles.recentBookingCard}
        onPress={() => navigation.navigate('BookingDetails', { bookingId: booking.id })}
      >
        <View style={styles.recentBookingInfo}>
          <Text style={styles.recentServiceName}>{booking.service}</Text>
          <Text style={styles.recentDate}>{booking.date}</Text>
          <Text style={styles.recentCaregiver}>
            by {booking.caregiver?.name || 'Unknown'}
          </Text>
        </View>
        <View style={styles.recentBookingRight}>
          <Text style={styles.recentAmount}>RM{booking.amount}</Text>
          {booking.rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.ratingText}>{booking.rating}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    ));
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5A5F" />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF5A5F']}
            tintColor="#FF5A5F"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hi, {user?.first_name}! 👋</Text>
            <Text style={styles.subGreeting}>Find the perfect care for your pets</Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color="#333" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color="#FF5A5F" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadDashboardData()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{dashboardData.stats.totalBookings}</Text>
              <Text style={styles.statLabel}>Total Bookings</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{dashboardData.stats.activePets}</Text>
              <Text style={styles.statLabel}>My Pets</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{dashboardData.stats.upcomingServices}</Text>
              <Text style={styles.statLabel}>Upcoming</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>RM{dashboardData.stats.totalSpent}</Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Search')}
          >
            <Ionicons name="search" size={24} color="#FF5A5F" />
            <Text style={styles.actionText}>Find Services</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('AddPet')}
          >
            <Ionicons name="add-circle" size={24} color="#FF5A5F" />
            <Text style={styles.actionText}>Add Pet</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('BookingManagement')}
          >
            <Ionicons name="calendar" size={24} color="#FF5A5F" />
            <Text style={styles.actionText}>My Bookings</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming Bookings */}
        {dashboardData.upcomingBookings.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Services</Text>
              <TouchableOpacity onPress={() => navigation.navigate('BookingManagement')}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            {renderUpcomingBookings()}
          </View>
        )}

        {/* Recent Bookings */}
        {dashboardData.recentBookings.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity onPress={() => navigation.navigate('BookingHistory')}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            {renderRecentBookings()}
          </View>
        )}

        {/* Empty State */}
        {dashboardData.upcomingBookings.length === 0 && dashboardData.recentBookings.length === 0 && !error && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>No bookings yet</Text>
            <Text style={styles.emptyText}>Start by finding amazing pet care services near you</Text>
            <TouchableOpacity 
              style={styles.exploreButton}
              onPress={() => navigation.navigate('Search')}
            >
              <Text style={styles.exploreButtonText}>Explore Services</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#FFF5F5',
    marginHorizontal: 20,
    marginTop: 10,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  errorText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#C53030',
  },
  retryButton: {
    backgroundColor: '#FF5A5F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'white',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subGreeting: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    backgroundColor: '#FF5A5F',
    borderRadius: 4,
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginTop: 8,
  },
  section: {
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 16,
    color: '#FF5A5F',
    fontWeight: '500',
  },
  bookingCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bookingInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  bookingDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  caregiverName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 2,
  },
  location: {
    fontSize: 14,
    color: '#666',
  },
  bookingRight: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  petsInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  petsLabel: {
    fontSize: 14,
    color: '#666',
  },
  bookingActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderColor: '#FF5A5F',
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF5A5F',
    marginLeft: 4,
  },
  recentBookingCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  recentBookingInfo: {
    flex: 1,
  },
  recentServiceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  recentDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  recentCaregiver: {
    fontSize: 14,
    color: '#666',
  },
  recentBookingRight: {
    alignItems: 'flex-end',
  },
  recentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: '#FF5A5F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  exploreButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 20,
  },
});

export default PetOwnerDashboard;