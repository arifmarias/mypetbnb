import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const services = [
    {
      id: 1,
      title: 'Pet Boarding',
      description: 'Overnight care in loving homes',
      icon: 'home',
      color: '#FF5A5F',
      image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 2,
      title: 'Dog Walking',
      description: 'Daily walks and exercise',
      icon: 'walk',
      color: '#00A699',
      image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 3,
      title: 'Pet Sitting',
      description: 'Care at your home',
      icon: 'heart',
      color: '#FC642D',
      image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 4,
      title: 'Pet Grooming',
      description: 'Professional grooming services',
      icon: 'cut',
      color: '#767676',
      image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    },
  ];

  const featuredCaregivers = [
    {
      id: 1,
      name: 'Sarah Johnson',
      rating: 4.9,
      reviews: 127,
      location: 'Orchard, Singapore',
      specialties: ['Dogs', 'Cats'],
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b923?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80'
    },
    {
      id: 2,
      name: 'Michael Chen',
      rating: 4.8,
      reviews: 89,
      location: 'KLCC, Malaysia',
      specialties: ['Dogs', 'Birds'],
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80'
    },
  ];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigation.navigate('Search', { query: searchQuery });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {user ? `Hello, ${user.full_name.split(' ')[0]}! 👋` : 'Hello! 👋'}
            </Text>
            <Text style={styles.subgreeting}>Find perfect care for your pet</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search location or service..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity onPress={handleSearch}>
              <Ionicons name="options-outline" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Services</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Search')}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.servicesContainer}
          >
            {services.map((service) => (
              <TouchableOpacity 
                key={service.id} 
                style={styles.serviceCard}
                onPress={() => navigation.navigate('Search', { service: service.title })}
              >
                <View style={styles.serviceImageContainer}>
                  <Image source={{ uri: service.image }} style={styles.serviceImage} />
                  <View style={[styles.serviceIconContainer, { backgroundColor: service.color }]}>
                    <Ionicons name={service.icon} size={20} color="white" />
                  </View>
                </View>
                <View style={styles.serviceContent}>
                  <Text style={styles.serviceTitle}>{service.title}</Text>
                  <Text style={styles.serviceDescription}>{service.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Caregivers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Rated Caregivers</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          {featuredCaregivers.map((caregiver) => (
            <TouchableOpacity key={caregiver.id} style={styles.caregiverCard}>
              <Image source={{ uri: caregiver.image }} style={styles.caregiverImage} />
              <View style={styles.caregiverContent}>
                <View style={styles.caregiverHeader}>
                  <Text style={styles.caregiverName}>{caregiver.name}</Text>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={styles.ratingText}>{caregiver.rating}</Text>
                    <Text style={styles.reviewText}>({caregiver.reviews})</Text>
                  </View>
                </View>
                <View style={styles.caregiverLocation}>
                  <Ionicons name="location-outline" size={14} color="#999" />
                  <Text style={styles.locationText}>{caregiver.location}</Text>
                </View>
                <View style={styles.specialtiesContainer}>
                  {caregiver.specialties.map((specialty, index) => (
                    <View key={index} style={styles.specialtyTag}>
                      <Text style={styles.specialtyText}>{specialty}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <TouchableOpacity style={styles.favoriteButton}>
                <Ionicons name="heart-outline" size={20} color="#FF5A5F" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statsCard}>
            <Text style={styles.statsNumber}>10,000+</Text>
            <Text style={styles.statsLabel}>Happy Pet Owners</Text>
          </View>
          <View style={styles.statsCard}>
            <Text style={styles.statsNumber}>5,000+</Text>
            <Text style={styles.statsLabel}>Verified Caregivers</Text>
          </View>
          <View style={styles.statsCard}>
            <Text style={styles.statsNumber}>50,000+</Text>
            <Text style={styles.statsLabel}>Bookings Completed</Text>
          </View>
        </View>

        {/* CTA */}
        <View style={styles.ctaContainer}>
          <Text style={styles.ctaTitle}>Ready to find the perfect care?</Text>
          <Text style={styles.ctaSubtitle}>Join thousands of happy pet owners</Text>
          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={() => navigation.navigate('Search')}
          >
            <Text style={styles.ctaButtonText}>Find Care Now</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subgreeting: {
    fontSize: 16,
    color: '#666',
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    backgroundColor: '#FF5A5F',
    borderRadius: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  section: {
    marginBottom: 32,
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
    fontWeight: '600',
  },
  servicesContainer: {
    paddingLeft: 20,
  },
  serviceCard: {
    width: 200,
    marginRight: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  serviceImageContainer: {
    position: 'relative',
    height: 120,
  },
  serviceImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  serviceIconContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceContent: {
    padding: 16,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
  },
  caregiverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  caregiverImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  caregiverContent: {
    flex: 1,
  },
  caregiverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  caregiverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  reviewText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
  caregiverLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  specialtyTag: {
    backgroundColor: '#FF5A5F20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  specialtyText: {
    fontSize: 12,
    color: '#FF5A5F',
    fontWeight: '500',
  },
  favoriteButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 32,
    gap: 12,
  },
  statsCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 20,
    borderRadius: 16,
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF5A5F',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  ctaContainer: {
    backgroundColor: '#FF5A5F',
    marginHorizontal: 20,
    marginBottom: 32,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF5A5F',
    marginRight: 8,
  },
});

export default HomeScreen;