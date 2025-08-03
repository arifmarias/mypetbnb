import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const CaregiverDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalServices: 5,
    totalBookings: 48,
    activeBookings: 3,
    totalEarnings: 2400,
    rating: 4.9,
    reviews: 32,
  });

  const activeBookings = [
    {
      id: '1',
      service: 'Pet Boarding',
      date: 'Dec 30, 2024',
      time: '2:00 PM',
      owner: 'Jennifer Smith',
      status: 'confirmed',
      pets: [{ name: 'Buddy', breed: 'Golden Retriever' }],
      duration: '3 days',
      amount: 150,
    },
    {
      id: '2',
      service: 'Dog Walking',
      date: 'Dec 29, 2024',
      time: '3:00 PM',
      owner: 'David Wilson',
      status: 'in_progress',
      pets: [{ name: 'Max', breed: 'Labrador' }],
      duration: '1 hour',
      amount: 25,
    },
    {
      id: '3',
      service: 'Pet Sitting',
      date: 'Dec 28, 2024',
      time: '9:00 AM',
      owner: 'Lisa Chen',
      status: 'pending',
      pets: [{ name: 'Luna', breed: 'Persian Cat' }],
      duration: '4 hours',
      amount: 80,
    },
  ];

  const myServices = [
    {
      id: '1',
      title: 'Premium Pet Boarding',
      price: 50,
      type: 'pet_boarding',
      bookings: 12,
      rating: 4.9,
      active: true,
    },
    {
      id: '2',
      title: 'Dog Walking & Exercise',
      price: 25,
      type: 'dog_walking',
      bookings: 18,
      rating: 4.8,
      active: true,
    },
    {
      id: '3',
      title: 'Pet Sitting at Home',
      price: 20,
      type: 'pet_sitting',
      bookings: 8,
      rating: 5.0,
      active: true,
    },
    {
      id: '4',
      title: 'Pet Grooming',
      price: 40,
      type: 'grooming',
      bookings: 6,
      rating: 4.7,
      active: false,
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'in_progress':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Welcome back, {user?.first_name}! 👋
            </Text>
            <Text style={styles.subGreeting}>
              Ready to provide amazing pet care today?
            </Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Ionicons name="person-circle-outline" size={32} color="#FF5A5F" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="grid" size={24} color="#FF5A5F" />
            </View>
            <Text style={styles.statNumber}>{stats.totalServices}</Text>
            <Text style={styles.statLabel}>Services</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="calendar" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.statNumber}>{stats.totalBookings}</Text>
            <Text style={styles.statLabel}>Total Jobs</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="time" size={24} color="#10B981" />
            </View>
            <Text style={styles.statNumber}>{stats.activeBookings}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="wallet" size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.statNumber}>${stats.totalEarnings}</Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>
        </View>

        {/* Rating Card */}
        <View style={styles.ratingCard}>
          <View style={styles.ratingLeft}>
            <View style={styles.ratingIcon}>
              <Ionicons name="star" size={32} color="#FFD700" />
            </View>
            <View style={styles.ratingInfo}>
              <Text style={styles.ratingValue}>{stats.rating}</Text>
              <Text style={styles.ratingLabel}>Rating</Text>
            </View>
          </View>
          <View style={styles.ratingRight}>
            <Text style={styles.reviewsCount}>{stats.reviews} reviews</Text>
            <TouchableOpacity style={styles.viewReviewsButton}>
              <Text style={styles.viewReviewsText}>View Reviews</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Bookings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Bookings</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {activeBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#E5E5E5" />
              <Text style={styles.emptyStateText}>No active bookings</Text>
              <Text style={styles.emptyStateSubtext}>New booking requests will appear here</Text>
            </View>
          ) : (
            activeBookings.map((booking) => (
              <TouchableOpacity key={booking.id} style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <View style={styles.bookingInfo}>
                    <Text style={styles.bookingService}>{booking.service}</Text>
                    <Text style={styles.bookingOwner}>for {booking.owner}</Text>
                  </View>
                  <View style={styles.bookingAmount}>
                    <Text style={styles.amount}>${booking.amount}</Text>
                    <View 
                      style={[
                        styles.statusBadge, 
                        { backgroundColor: getStatusColor(booking.status) + '20' }
                      ]}
                    >
                      <Text 
                        style={[
                          styles.statusText, 
                          { color: getStatusColor(booking.status) }
                        ]}
                      >
                        {booking.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.bookingDetails}>
                  <View style={styles.bookingDetailItem}>
                    <Ionicons name="calendar-outline" size={16} color="#666" />
                    <Text style={styles.bookingDetailText}>
                      {booking.date} at {booking.time}
                    </Text>
                  </View>
                  <View style={styles.bookingDetailItem}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.bookingDetailText}>
                      {booking.duration}
                    </Text>
                  </View>
                  <View style={styles.bookingDetailItem}>
                    <Ionicons name="heart-outline" size={16} color="#666" />
                    <Text style={styles.bookingDetailText}>
                      {booking.pets.map(pet => `${pet.name} (${pet.breed})`).join(', ')}
                    </Text>
                  </View>
                </View>

                <View style={styles.bookingActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="chatbubble-outline" size={18} color="#FF5A5F" />
                    <Text style={styles.actionButtonText}>Message</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="eye-outline" size={18} color="#666" />
                    <Text style={[styles.actionButtonText, { color: '#666' }]}>
                      View Details
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* My Services */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Services</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Add Service</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.servicesContainer}>
              {myServices.map((service) => (
                <TouchableOpacity key={service.id} style={styles.serviceCard}>
                  <View style={styles.serviceHeader}>
                    <View style={[
                      styles.serviceStatus,
                      { backgroundColor: service.active ? '#10B981' : '#999' }
                    ]}>
                      <Text style={styles.serviceStatusText}>
                        {service.active ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.serviceMenu}>
                      <Ionicons name="ellipsis-vertical" size={16} color="#666" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.serviceTitle}>{service.title}</Text>
                  
                  <View style={styles.serviceStats}>
                    <View style={styles.serviceStat}>
                      <Text style={styles.serviceStatValue}>${service.price}</Text>
                      <Text style={styles.serviceStatLabel}>per day</Text>
                    </View>
                    <View style={styles.serviceStat}>
                      <Text style={styles.serviceStatValue}>{service.bookings}</Text>
                      <Text style={styles.serviceStatLabel}>bookings</Text>
                    </View>
                  </View>

                  <View style={styles.serviceRating}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.serviceRatingText}>{service.rating}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity style={styles.addServiceCard}>
                <View style={styles.addServiceIcon}>
                  <Ionicons name="add" size={32} color="#FF5A5F" />
                </View>
                <Text style={styles.addServiceText}>Add Service</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="calendar" size={24} color="#3B82F6" />
            <Text style={styles.actionCardText}>Schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="bar-chart" size={24} color="#10B981" />
            <Text style={styles.actionCardText}>Analytics</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Messages')}
          >
            <Ionicons name="chatbubbles" size={24} color="#FF5A5F" />
            <Text style={styles.actionCardText}>Messages</Text>
          </TouchableOpacity>
        </View>

        {/* Earnings Summary */}
        <View style={styles.earningsSection}>
          <Text style={styles.sectionTitle}>This Month</Text>
          <View style={styles.earningsCard}>
            <View style={styles.earningsItem}>
              <Text style={styles.earningsLabel}>Completed Jobs</Text>
              <Text style={styles.earningsValue}>8</Text>
            </View>
            <View style={styles.earningsItem}>
              <Text style={styles.earningsLabel}>Hours Worked</Text>
              <Text style={styles.earningsValue}>42h</Text>
            </View>
            <View style={styles.earningsItem}>
              <Text style={styles.earningsLabel}>Earnings</Text>
              <Text style={styles.earningsValue}>$640</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: 'white',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 16,
    color: '#666',
  },
  profileButton: {
    // Profile button styles
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'white',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F9F9F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  ratingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ratingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ratingIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  ratingInfo: {
    flex: 1,
  },
  ratingValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  ratingLabel: {
    fontSize: 14,
    color: '#666',
  },
  ratingRight: {
    alignItems: 'flex-end',
  },
  reviewsCount: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 8,
  },
  viewReviewsButton: {
    backgroundColor: '#FF5A5F10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  viewReviewsText: {
    fontSize: 14,
    color: '#FF5A5F',
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 16,
    color: '#FF5A5F',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
  },
  bookingCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingService: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  bookingOwner: {
    fontSize: 14,
    color: '#666',
  },
  bookingAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bookingDetails: {
    marginBottom: 12,
  },
  bookingDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  bookingDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  bookingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#FF5A5F',
    fontWeight: '500',
    marginLeft: 6,
  },
  servicesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  serviceCard: {
    width: 200,
    marginRight: 16,
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  serviceStatusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  serviceMenu: {
    padding: 4,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  serviceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  serviceStat: {
    flex: 1,
  },
  serviceStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  serviceStatLabel: {
    fontSize: 12,
    color: '#666',
  },
  serviceRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceRatingText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginLeft: 4,
  },
  addServiceCard: {
    width: 200,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF5A5F',
    borderStyle: 'dashed',
  },
  addServiceIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF5A5F20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  addServiceText: {
    fontSize: 16,
    color: '#FF5A5F',
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionCardText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginTop: 8,
  },
  earningsSection: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 32,
  },
  earningsCard: {
    flexDirection: 'row',
    backgroundColor: '#FF5A5F10',
    padding: 20,
    borderRadius: 12,
  },
  earningsItem: {
    flex: 1,
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  earningsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default CaregiverDashboard;