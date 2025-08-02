import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const PetOwnerDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPets: 3,
    totalBookings: 12,
    upcomingBookings: 2,
    totalSpent: 650,
  });

  const upcomingBookings = [
    {
      id: '1',
      service: 'Pet Boarding',
      date: 'Dec 30, 2024',
      time: '2:00 PM',
      caregiver: 'Sarah Johnson',
      status: 'confirmed',
      pets: ['Buddy', 'Luna'],
    },
    {
      id: '2',
      service: 'Dog Walking',
      date: 'Dec 29, 2024',
      time: '3:00 PM',
      caregiver: 'Michael Chen',
      status: 'pending',
      pets: ['Max'],
    },
  ];

  const myPets = [
    {
      id: '1',
      name: 'Buddy',
      breed: 'Golden Retriever',
      age: 3,
    },
    {
      id: '2',
      name: 'Luna',
      breed: 'Persian Cat',
      age: 2,
    },
    {
      id: '3',
      name: 'Max',
      breed: 'Labrador',
      age: 5,
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
              Welcome back, {user?.full_name?.split(' ')[0]}! 👋
            </Text>
            <Text style={styles.subGreeting}>
              Manage your pets and bookings
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
              <Ionicons name="heart" size={24} color="#FF5A5F" />
            </View>
            <Text style={styles.statNumber}>{stats.totalPets}</Text>
            <Text style={styles.statLabel}>My Pets</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="calendar" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.statNumber}>{stats.totalBookings}</Text>
            <Text style={styles.statLabel}>Total Bookings</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="time" size={24} color="#10B981" />
            </View>
            <Text style={styles.statNumber}>{stats.upcomingBookings}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="wallet" size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.statNumber}>${stats.totalSpent}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
        </View>

        {/* Upcoming Bookings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Search')}>
              <Text style={styles.seeAllText}>Book Care</Text>
            </TouchableOpacity>
          </View>

          {upcomingBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#E5E5E5" />
              <Text style={styles.emptyStateText}>No upcoming bookings</Text>
              <TouchableOpacity 
                style={styles.emptyStateButton}
                onPress={() => navigation.navigate('Search')}
              >
                <Text style={styles.emptyStateButtonText}>Find a Caregiver</Text>
              </TouchableOpacity>
            </View>
          ) : (
            upcomingBookings.map((booking) => (
              <TouchableOpacity key={booking.id} style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <View style={styles.bookingInfo}>
                    <Text style={styles.bookingService}>{booking.service}</Text>
                    <Text style={styles.bookingCaregiver}>by {booking.caregiver}</Text>
                  </View>
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
                      {booking.status.toUpperCase()}
                    </Text>
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
                    <Ionicons name="heart-outline" size={16} color="#666" />
                    <Text style={styles.bookingDetailText}>
                      {booking.pets.join(', ')}
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

        {/* My Pets */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Pets</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AddPet')}>
              <Text style={styles.seeAllText}>Add Pet</Text>
            </TouchableOpacity>
          </View>

          {myPets.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={48} color="#E5E5E5" />
              <Text style={styles.emptyStateText}>No pets added yet</Text>
              <TouchableOpacity style={styles.emptyStateButton}>
                <Text style={styles.emptyStateButtonText}>Add Your First Pet</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.petsContainer}>
                {myPets.map((pet) => (
                  <TouchableOpacity key={pet.id} style={styles.petCard}>
                    <View style={styles.petAvatar}>
                      <Text style={styles.petAvatarText}>{pet.name.charAt(0)}</Text>
                    </View>
                    <Text style={styles.petName}>{pet.name}</Text>
                    <Text style={styles.petBreed}>{pet.breed}</Text>
                    <Text style={styles.petAge}>{pet.age} years old</Text>
                  </TouchableOpacity>
                ))}
                
                <TouchableOpacity style={styles.addPetCard}>
                  <View style={styles.addPetIcon}>
                    <Ionicons name="add" size={32} color="#FF5A5F" />
                  </View>
                  <Text style={styles.addPetText}>Add Pet</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Search')}
          >
            <Ionicons name="search" size={24} color="#FF5A5F" />
            <Text style={styles.actionCardText}>Find Care</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="calendar" size={24} color="#3B82F6" />
            <Text style={styles.actionCardText}>My Bookings</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Messages')}
          >
            <Ionicons name="chatbubbles" size={24} color="#10B981" />
            <Text style={styles.actionCardText}>Messages</Text>
          </TouchableOpacity>
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
    marginBottom: 16,
  },
  emptyStateButton: {
    backgroundColor: '#FF5A5F',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  emptyStateButtonText: {
    color: 'white',
    fontWeight: '600',
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
  bookingCaregiver: {
    fontSize: 14,
    color: '#666',
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
  petsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  petCard: {
    alignItems: 'center',
    marginRight: 16,
    width: 100,
  },
  petAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF5A5F',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  petAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  petName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  petBreed: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    textAlign: 'center',
  },
  petAge: {
    fontSize: 11,
    color: '#999',
  },
  addPetCard: {
    alignItems: 'center',
    width: 100,
  },
  addPetIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF5A5F20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#FF5A5F',
    borderStyle: 'dashed',
  },
  addPetText: {
    fontSize: 14,
    color: '#FF5A5F',
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 32,
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
});

export default PetOwnerDashboard;