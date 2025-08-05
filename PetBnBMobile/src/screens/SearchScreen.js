import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const SearchScreen = ({ navigation }) => {
  const { user } = useAuth();
  const toast = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('nearby');
  const [priceRange, setPriceRange] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mock services data
  const mockServices = [
    {
      id: '1',
      title: 'Premium Dog Walking & Exercise',
      caregiver: {
        id: 'c1',
        name: 'Sarah Johnson',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
        rating: 4.9,
        reviewCount: 127,
        responseTime: '< 1 hour',
        location: 'Petaling Jaya, MY',
        distance: '2.3 km',
        verified: true,
      },
      serviceType: 'dog_walking',
      description: 'Professional dog walking service with 5+ years experience. Specialized in high-energy breeds and behavioral training during walks.',
      duration: '60 minutes',
      price: 45,
      currency: 'MYR',
      availability: 'Available Today',
      features: ['GPS Tracking', 'Photo Updates', 'Flexible Schedule', 'Emergency Trained'],
      images: [
        'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      ],
      instantBook: true,
      tags: ['Dogs', 'Exercise', 'Training'],
    },
    {
      id: '2',
      title: 'Overnight Pet Boarding - Home Away From Home',
      caregiver: {
        id: 'c2',
        name: 'Mike Chen',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
        rating: 4.8,
        reviewCount: 89,
        responseTime: '< 2 hours',
        location: 'Kuala Lumpur, MY',
        distance: '5.7 km',
        verified: true,
      },
      serviceType: 'pet_boarding',
      description: 'Cozy home boarding with personalized care. Large fenced yard, climate-controlled environment, and 24/7 supervision.',
      duration: 'Per night',
      price: 120,
      currency: 'MYR',
      availability: 'Available This Week',
      features: ['24/7 Supervision', 'Large Yard', 'Daily Updates', 'Medication Admin'],
      images: [
        'https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      ],
      instantBook: false,
      tags: ['Boarding', 'Overnight', 'Yard'],
    },
    {
      id: '3',
      title: 'Professional Pet Grooming & Spa',
      caregiver: {
        id: 'c3',
        name: 'Lisa Wang',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
        rating: 4.9,
        reviewCount: 156,
        responseTime: '< 30 min',
        location: 'Subang Jaya, MY',
        distance: '3.1 km',
        verified: true,
      },
      serviceType: 'pet_grooming',
      description: 'Full-service grooming with premium products. Nail trimming, ear cleaning, dental care, and relaxing spa treatments.',
      duration: '2-3 hours',
      price: 80,
      currency: 'MYR',
      availability: 'Available Tomorrow',
      features: ['Premium Products', 'Nail Trimming', 'Ear Cleaning', 'Spa Treatment'],
      images: [
        'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1581888227599-779811939961?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      ],
      instantBook: true,
      tags: ['Grooming', 'Spa', 'Premium'],
    },
    {
      id: '4',
      title: 'Cat Sitting & Home Visits',
      caregiver: {
        id: 'c4',
        name: 'Emma Thompson',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
        rating: 4.7,
        reviewCount: 94,
        responseTime: '< 1 hour',
        location: 'Mont Kiara, MY',
        distance: '4.2 km',
        verified: true,
      },
      serviceType: 'pet_sitting',
      description: 'Specialized cat care in your home. Feeding, litter maintenance, playtime, and companionship while you\'re away.',
      duration: 'Per visit',
      price: 35,
      currency: 'MYR',
      availability: 'Available Today',
      features: ['In-Home Care', 'Litter Maintenance', 'Playtime', 'Photo Updates'],
      images: [
        'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1573865526739-10659fec78a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      ],
      instantBook: true,
      tags: ['Cats', 'Home Visits', 'Sitting'],
    },
  ];

  const serviceTypes = [
    { id: 'all', name: 'All Services', icon: 'grid-outline' },
    { id: 'dog_walking', name: 'Dog Walking', icon: 'walk-outline' },
    { id: 'pet_boarding', name: 'Pet Boarding', icon: 'home-outline' },
    { id: 'pet_grooming', name: 'Pet Grooming', icon: 'cut-outline' },
    { id: 'pet_sitting', name: 'Pet Sitting', icon: 'heart-outline' },
    { id: 'daycare', name: 'Pet Daycare', icon: 'sunny-outline' },
  ];

  useEffect(() => {
    loadServices();
  }, [selectedService, selectedLocation, priceRange]);

  const loadServices = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      let filteredServices = [...mockServices];
      
      // Filter by service type
      if (selectedService !== 'all') {
        filteredServices = filteredServices.filter(service => 
          service.serviceType === selectedService
        );
      }
      
      // Filter by price range
      if (priceRange !== 'all') {
        switch (priceRange) {
          case 'budget':
            filteredServices = filteredServices.filter(service => service.price <= 50);
            break;
          case 'mid':
            filteredServices = filteredServices.filter(service => 
              service.price > 50 && service.price <= 100
            );
            break;
          case 'premium':
            filteredServices = filteredServices.filter(service => service.price > 100);
            break;
        }
      }
      
      // Filter by search query
      if (searchQuery.trim()) {
        filteredServices = filteredServices.filter(service =>
          service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.caregiver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
      
      setServices(filteredServices);
    } catch (error) {
      console.error('Error loading services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleServicePress = (service) => {
    navigation.navigate('ServiceDetails', { 
      serviceId: service.id,
      service: service 
    });
  };

  const handleBookNow = (service) => {
    navigation.navigate('Booking', { 
      serviceId: service.id,
      service: service 
    });
  };

  const renderServiceCard = (service) => (
    <TouchableOpacity
      key={service.id}
      style={styles.serviceCard}
      onPress={() => handleServicePress(service)}
    >
      {/* Service Images */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: service.images[0] }} style={styles.serviceImage} />
        {service.instantBook && (
          <View style={styles.instantBookBadge}>
            <Ionicons name="flash" size={12} color="white" />
            <Text style={styles.instantBookText}>Instant Book</Text>
          </View>
        )}
        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>{service.currency} {service.price}</Text>
        </View>
      </View>

      {/* Service Info */}
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceTitle} numberOfLines={2}>
          {service.title}
        </Text>
        
        {/* Caregiver Info */}
        <View style={styles.caregiverInfo}>
          <Image 
            source={{ uri: service.caregiver.avatar }} 
            style={styles.caregiverAvatar} 
          />
          <View style={styles.caregiverDetails}>
            <View style={styles.caregiverNameRow}>
              <Text style={styles.caregiverName}>{service.caregiver.name}</Text>
              {service.caregiver.verified && (
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              )}
            </View>
            <Text style={styles.caregiverLocation}>{service.caregiver.location}</Text>
          </View>
        </View>

        {/* Rating and Stats */}
        <View style={styles.statsRow}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text style={styles.ratingText}>
              {service.caregiver.rating} ({service.caregiver.reviewCount})
            </Text>
          </View>
          <Text style={styles.distanceText}>{service.caregiver.distance}</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          {service.features.slice(0, 3).map((feature, index) => (
            <View key={index} style={styles.featureTag}>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
          {service.features.length > 3 && (
            <Text style={styles.moreFeatures}>+{service.features.length - 3} more</Text>
          )}
        </View>

        {/* Availability and Book Button */}
        <View style={styles.cardFooter}>
          <View style={styles.availabilityContainer}>
            <Ionicons name="time-outline" size={16} color="#10B981" />
            <Text style={styles.availabilityText}>{service.availability}</Text>
          </View>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => handleBookNow(service)}
          >
            <Text style={styles.bookButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Pet Care</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="options-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services, caregivers, or locations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={loadServices}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Service Type Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.serviceTypeContainer}
        contentContainerStyle={styles.serviceTypeContent}
      >
        {serviceTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.serviceTypeButton,
              selectedService === type.id && styles.serviceTypeButtonActive
            ]}
            onPress={() => setSelectedService(type.id)}
          >
            <Ionicons 
              name={type.icon} 
              size={20} 
              color={selectedService === type.id ? '#FF5A5F' : '#666'} 
            />
            <Text style={[
              styles.serviceTypeText,
              selectedService === type.id && styles.serviceTypeTextActive
            ]}>
              {type.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Filters Panel */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Location:</Text>
            <View style={styles.filterOptions}>
              {['nearby', 'city', 'all'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.filterOption,
                    selectedLocation === option && styles.filterOptionActive
                  ]}
                  onPress={() => setSelectedLocation(option)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    selectedLocation === option && styles.filterOptionTextActive
                  ]}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Price Range:</Text>
            <View style={styles.filterOptions}>
              {[
                { id: 'all', name: 'All' },
                { id: 'budget', name: '< RM50' },
                { id: 'mid', name: 'RM50-100' },
                { id: 'premium', name: '> RM100' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.filterOption,
                    priceRange === option.id && styles.filterOptionActive
                  ]}
                  onPress={() => setPriceRange(option.id)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    priceRange === option.id && styles.filterOptionTextActive
                  ]}>
                    {option.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Results */}
      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {loading ? 'Searching...' : `${services.length} services found`}
          </Text>
          <TouchableOpacity style={styles.sortButton}>
            <Text style={styles.sortText}>Sort by: Rating</Text>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Services List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Finding the best pet care services...</Text>
          </View>
        ) : services.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color="#DDD" />
            <Text style={styles.emptyTitle}>No services found</Text>
            <Text style={styles.emptyMessage}>
              Try adjusting your filters or search terms
            </Text>
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => {
                setSearchQuery('');
                setSelectedService('all');
                setPriceRange('all');
                setSelectedLocation('nearby');
              }}
            >
              <Text style={styles.clearFiltersText}>Clear All Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          services.map(renderServiceCard)
        )}

        <View style={styles.bottomPadding} />
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
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  filterButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  serviceTypeContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  serviceTypeContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  serviceTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    gap: 8,
  },
  serviceTypeButtonActive: {
    backgroundColor: '#FF5A5F20',
  },
  serviceTypeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  serviceTypeTextActive: {
    color: '#FF5A5F',
  },
  filtersPanel: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterRow: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  filterOptionActive: {
    backgroundColor: '#FF5A5F',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: 'white',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortText: {
    fontSize: 14,
    color: '#666',
  },
  serviceCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  serviceImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F0F0F0',
  },
  instantBookBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  instantBookText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  priceBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  serviceInfo: {
    padding: 16,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  caregiverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  caregiverAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  caregiverDetails: {
    flex: 1,
  },
  caregiverNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  caregiverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  caregiverLocation: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  distanceText: {
    fontSize: 14,
    color: '#666',
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  featureTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  featureText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  moreFeatures: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  availabilityText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  bookButton: {
    backgroundColor: '#FF5A5F',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  clearFiltersButton: {
    backgroundColor: '#FF5A5F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  clearFiltersText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
});

export default SearchScreen;