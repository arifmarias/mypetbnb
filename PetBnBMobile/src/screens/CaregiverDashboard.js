import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const CaregiverDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [todayBookings, setTodayBookings] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [stats, setStats] = useState({
    thisMonth: 0,
    totalEarnings: 0,
    rating: 0,
    totalBookings: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    // Mock data - replace with API calls
    setStats({
      thisMonth: 580,
      totalEarnings: 2400,
      rating: 4.9,
      totalBookings: 48,
    });

    setTodayBookings([
      {
        id: '1',
        service: 'Dog Walking',
        time: '3:00 PM',
        owner: {
          name: 'Jennifer Smith',
          image: null,
        },
        pets: [{ name: 'Buddy', breed: 'Golden Retriever' }],
        status: 'confirmed',
        amount: 30,
        duration: '1 hour',
        location: 'Petaling Jaya',
      },
    ]);

    setUpcomingBookings([
      {
        id: '2',
        service: 'Pet Boarding',
        date: 'Dec 30, 2024',
        time: '2:00 PM',
        owner: {
          name: 'David Wilson',
          image: null,
        },
        pets: [{ name: 'Max', breed: 'Labrador' }, { name: 'Luna', breed: 'Persian Cat' }],
        status: 'confirmed',
        amount: 150,
        duration: '3 days',
        location: 'Kuala Lumpur',
      },
      {
        id: '3',
        service: 'Pet Grooming',
        date: 'Jan 2, 2025',
        time: '10:00 AM',
        owner: {
          name: 'Lisa Chen',
          image: null,
        },
        pets: [{ name: 'Mochi', breed: 'Shih Tzu' }],
        status: 'pending',
        amount: 80,
        duration: '2 hours',
        location: 'Mont Kiara',
      },
    ]);
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

  const handleBookingAction = (bookingId, action) => {
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${action} this booking?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            toast.success(`Booking ${action}d successfully`);
            // Here you would make API call
          },
        },
      ]
    );
  };

  const renderTodayBooking = ({ item }) => (
    <TouchableOpacity 
      style={styles.todayBookingCard}
      onPress={() => navigation.navigate('BookingDetails', { bookingId: item.id })}
    >
      <View style={styles.bookingHeader}>
        <View style={styles.bookingInfo}>
          <Text style={styles.serviceName}>{item.service}</Text>
          <Text style={styles.bookingTime}>{item.time}</Text>
          <Text style={styles.ownerName}>{item.owner.name}</Text>
          <Text style={styles.petsInfo}>
            {item.pets.map(pet => `${pet.name} (${pet.breed})`).join(', ')}
          </Text>
        </View>
        <View style={styles.bookingRight}>
          <Text style={styles.amount}>RM{item.amount}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      </View>
      <View style={styles.bookingActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Chat', { bookingId: item.id })}
        >
          <Ionicons name="chatbubble-outline" size={16} color="#FF5A5F" />
          <Text style={styles.actionButtonText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryActionButton]}
          onPress={() => handleBookingAction(item.id, 'start')}
        >
          <Ionicons name="play-outline" size={16} color="white" />
          <Text style={[styles.actionButtonText, { color: 'white' }]}>Start</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderUpcomingBooking = ({ item }) => (
    <TouchableOpacity 
      style={styles.upcomingBookingCard}
      onPress={() => navigation.navigate('BookingDetails', { bookingId: item.id })}
    >
      <View style={styles.bookingHeader}>
        <View style={styles.bookingInfo}>
          <Text style={styles.serviceName}>{item.service}</Text>
          <Text style={styles.bookingDate}>{item.date} at {item.time}</Text>
          <Text style={styles.ownerName}>{item.owner.name}</Text>
          <Text style={styles.location}>{item.location}</Text>
        </View>
        <View style={styles.bookingRight}>
          <Text style={styles.amount}>RM{item.amount}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      </View>
      <View style={styles.petsSection}>
        <Text style={styles.petsLabel}>
          Pets: {item.pets.map(pet => pet.name).join(', ')}
        </Text>
      </View>
      {item.status === 'pending' && (
        <View style={styles.pendingActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.declineButton]}
            onPress={() => handleBookingAction(item.id, 'decline')}
          >
            <Text style={[styles.actionButtonText, { color: '#FF5A5F' }]}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleBookingAction(item.id, 'accept')}
          >
            <Text style={[styles.actionButtonText, { color: 'white' }]}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back, {user?.first_name}!</Text>
            <Text style={styles.subGreeting}>Ready to provide amazing pet care?</Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color="#333" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {/* Earnings Overview */}
        <View style={styles.earningsSection}>
          <Text style={styles.sectionTitle}>Your Earnings</Text>
          <View style={styles.earningsCard}>
            <View style={styles.earningsItem}>
              <Text style={styles.earningsLabel}>This Month</Text>
              <Text style={styles.earningsValue}>RM{stats.thisMonth}</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsItem}>
              <Text style={styles.earningsLabel}>Total Earned</Text>
              <Text style={styles.earningsValue}>RM{stats.totalEarnings}</Text>
            </View>
          </View>
        </View>

        {/* Performance Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="star" size={24} color="#FFD700" />
              <Text style={styles.statNumber}>{stats.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="calendar" size={24} color="#FF5A5F" />
              <Text style={styles.statNumber}>{stats.totalBookings}</Text>
              <Text style={styles.statLabel}>Total Bookings</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('MyServices')}
          >
            <Ionicons name="grid-outline" size={24} color="#FF5A5F" />
            <Text style={styles.quickActionText}>My Services</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Calendar')}
          >
            <Ionicons name="calendar-outline" size={24} color="#FF5A5F" />
            <Text style={styles.quickActionText}>Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Earnings')}
          >
            <Ionicons name="card-outline" size={24} color="#FF5A5F" />
            <Text style={styles.quickActionText}>Earnings</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Schedule */}
        {todayBookings.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Schedule</Text>
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </Text>
            </View>
            <FlatList
              data={todayBookings}
              renderItem={renderTodayBooking}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* Upcoming Bookings */}
        {upcomingBookings.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
              <TouchableOpacity onPress={() => navigation.navigate('BookingManagement')}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={upcomingBookings}
              renderItem={renderUpcomingBooking}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* Empty State */}
        {todayBookings.length === 0 && upcomingBookings.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-clear-outline" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>No bookings scheduled</Text>
            <Text style={styles.emptyText}>
              Your calendar is clear. Make sure your services are active and available for booking.
            </Text>
            <TouchableOpacity 
              style={styles.manageServicesButton}
              onPress={() => navigation.navigate('MyServices')}
            >
              <Text style={styles.manageServicesButtonText}>Manage Services</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Account Setup Reminder */}
        <View style={styles.reminderCard}>
          <View style={styles.reminderHeader}>
            <Ionicons name="information-circle" size={24} color="#FF5A5F" />
            <Text style={styles.reminderTitle}>Complete your profile</Text>
          </View>
          <Text style={styles.reminderText}>
            Add more details to attract more pet owners and increase your bookings.
          </Text>
          <TouchableOpacity 
            style={styles.reminderButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.reminderButtonText}>Update Profile</Text>
          </TouchableOpacity>
        </View>

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
  earningsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  earningsCard: {
    backgroundColor: 'white',
    flexDirection: 'row',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  earningsItem: {
    flex: 1,
    alignItems: 'center',
  },
  earningsDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
  },
  earningsLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  earningsValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10B981',
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
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
  quickActionButton: {
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
  quickActionText: {
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
  dateText: {
    fontSize: 16,
    color: '#666',
  },
  seeAllText: {
    fontSize: 16,
    color: '#FF5A5F',
    fontWeight: '500',
  },
  todayBookingCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  upcomingBookingCard: {
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
    marginBottom: 12,
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
  bookingTime: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 4,
  },
  bookingDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  ownerName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 2,
  },
  location: {
    fontSize: 14,
    color: '#666',
  },
  petsInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
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
  petsSection: {
    marginTop: 8,
    paddingTop: 8,
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
  pendingActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF5A5F',
  },
  primaryActionButton: {
    backgroundColor: '#FF5A5F',
    borderColor: '#FF5A5F',
  },
  acceptButton: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  declineButton: {
    backgroundColor: 'transparent',
    borderColor: '#FF5A5F',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF5A5F',
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
  manageServicesButton: {
    backgroundColor: '#FF5A5F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  manageServicesButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  reminderCard: {
    backgroundColor: '#FFF5F5',
    marginHorizontal: 20,
    marginTop: 24,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  reminderText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  reminderButton: {
    backgroundColor: '#FF5A5F',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  reminderButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 20,
  },
});

export default CaregiverDashboard;