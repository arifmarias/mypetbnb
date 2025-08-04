import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const PetOwnerDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    activePets: 0,
    upcomingServices: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    // Mock data - replace with API calls
    setStats({
      totalBookings: 12,
      activePets: 3,
      upcomingServices: 2,
      totalSpent: 650,
    });

    setUpcomingBookings([
      {
        id: '1',
        service: 'Pet Boarding',
        date: 'Dec 30, 2024',
        time: '2:00 PM',
        caregiver: {
          name: 'Sarah Johnson',
          rating: 4.9,
          image: null,
        },
        location: 'Petaling Jaya',
        status: 'confirmed',
        pets: ['Buddy', 'Luna'],
        amount: 150,
      },
      {
        id: '2',
        service: 'Dog Walking',
        date: 'Dec 29, 2024',
        time: '3:00 PM',
        caregiver: {
          name: 'Michael Chen',
          rating: 4.8,
          image: null,
        },
        location: 'Kuala Lumpur',
        status: 'pending',
        pets: ['Max'],
        amount: 25,
      },
    ]);

    setRecentBookings([
      {
        id: '3',
        service: 'Pet Grooming',
        date: 'Dec 20, 2024',
        caregiver: 'Lisa Wong',
        status: 'completed',
        rating: 5,
        amount: 80,
      },
      {
        id: '4',
        service: 'Pet Sitting',
        date: 'Dec 15, 2024',
        caregiver: 'Ahmad Rahman',
        status: 'completed',
        rating: 4,
        amount: 60,
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

  // Fix: Render items without VirtualizedList
  const renderUpcomingBookings = () => {
    return upcomingBookings.map((item) => (
      <TouchableOpacity 
        key={item.id}
        style={styles.bookingCard}
        onPress={() => navigation.navigate('BookingDetails', { bookingId: item.id })}
      >
        <View style={styles.bookingHeader}>
          <View style={styles.bookingInfo}>
            <Text style={styles.serviceName}>{item.service}</Text>
            <Text style={styles.bookingDate}>{item.date} at {item.time}</Text>
            <Text style={styles.caregiverName}>{item.caregiver.name}</Text>
            <Text style={styles.location}>{item.location}</Text>
          </View>
          <View style={styles.bookingRight}>
            <Text style={styles.amount}>RM{item.amount}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>
        </View>
        <View style={styles.petsInfo}>
          <Text style={styles.petsLabel}>Pets: {item.pets.join(', ')}</Text>
        </View>
      </TouchableOpacity>
    ));
  };

  const renderRecentBookings = () => {
    return recentBookings.map((item) => (
      <TouchableOpacity 
        key={item.id}
        style={styles.recentBookingCard}
        onPress={() => navigation.navigate('BookingDetails', { bookingId: item.id })}
      >
        <View style={styles.recentBookingInfo}>
          <Text style={styles.recentServiceName}>{item.service}</Text>
          <Text style={styles.recentDate}>{item.date}</Text>
          <Text style={styles.recentCaregiver}>by {item.caregiver}</Text>
        </View>
        <View style={styles.recentBookingRight}>
          <Text style={styles.recentAmount}>RM{item.amount}</Text>
          {item.rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
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

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalBookings}</Text>
              <Text style={styles.statLabel}>Total Bookings</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.activePets}</Text>
              <Text style={styles.statLabel}>My Pets</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.upcomingServices}</Text>
              <Text style={styles.statLabel}>Upcoming</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>RM{stats.totalSpent}</Text>
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
        {upcomingBookings.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Services</Text>
              <TouchableOpacity onPress={() => navigation.navigate('BookingManagement')}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            {/* Fixed: No more FlatList, just render directly */}
            {renderUpcomingBookings()}
          </View>
        )}

        {/* Recent Bookings */}
        {recentBookings.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity onPress={() => navigation.navigate('BookingHistory')}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            {/* Fixed: No more FlatList, just render directly */}
            {renderRecentBookings()}
          </View>
        )}

        {/* Empty State */}
        {upcomingBookings.length === 0 && recentBookings.length === 0 && (
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