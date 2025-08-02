import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView from '../components/MapView';

const SearchScreen = ({ route, navigation }) => {
  const [searchQuery, setSearchQuery] = useState(route?.params?.query || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  const mockResults = [
    {
      id: '1',
      caregiver: {
        name: 'Sarah Johnson',
        image: 'https://images.unsplash.com/photo-1494790108755-2616b612b923?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
        location: 'Orchard, Singapore',
        rating: 4.9,
        reviews: 127,
      },
      service: {
        title: 'Premium Pet Boarding',
        type: 'pet_boarding',
        price: 50,
        description: 'Loving care in a safe environment',
      },
      distance: 2.5,
    },
    {
      id: '2',
      caregiver: {
        name: 'Michael Chen',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
        location: 'Marina Bay, Singapore',
        rating: 4.8,
        reviews: 89,
      },
      service: {
        title: 'Dog Walking & Exercise',
        type: 'dog_walking',
        price: 25,
        description: 'Daily walks and exercise',
      },
      distance: 1.8,
    },
  ];

  useEffect(() => {
    setResults(mockResults);
  }, []);

  const renderResultItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.resultCard}
      onPress={() => navigation.navigate('ServiceDetails', { service: item })}
    >
      <Image source={{ uri: item.caregiver.image }} style={styles.caregiverImage} />
      <View style={styles.resultContent}>
        <View style={styles.resultHeader}>
          <Text style={styles.serviceTitle}>{item.service.title}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>${item.service.price}</Text>
            <Text style={styles.priceUnit}>/day</Text>
          </View>
        </View>
        
        <Text style={styles.serviceDescription}>{item.service.description}</Text>
        
        <View style={styles.caregiverInfo}>
          <Text style={styles.caregiverName}>by {item.caregiver.name}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{item.caregiver.rating}</Text>
            <Text style={styles.reviewText}>({item.caregiver.reviews})</Text>
          </View>
        </View>
        
        <View style={styles.locationInfo}>
          <Ionicons name="location-outline" size={14} color="#666" />
          <Text style={styles.locationText}>{item.caregiver.location}</Text>
          <Text style={styles.distanceText}>• {item.distance} km away</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search location or service..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Results */}
      <View style={styles.content}>
        <View style={styles.resultsSummary}>
          <Text style={styles.resultsCount}>{results.length} caregivers found</Text>
          <TouchableOpacity style={styles.mapToggle}>
            <Ionicons name="map-outline" size={20} color="#FF5A5F" />
            <Text style={styles.mapToggleText}>Map</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderResultItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.resultsList}
        />
      </View>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    marginRight: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  filterButton: {
    // Filter button styles
  },
  content: {
    flex: 1,
  },
  resultsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  resultsCount: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  mapToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5A5F10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  mapToggleText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#FF5A5F',
    fontWeight: '500',
  },
  resultsList: {
    paddingHorizontal: 20,
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  caregiverImage: {
    width: 120,
    height: 120,
    backgroundColor: '#F0F0F0',
  },
  resultContent: {
    flex: 1,
    padding: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF5A5F',
  },
  priceUnit: {
    fontSize: 12,
    color: '#666',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  caregiverInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  caregiverName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
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
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  distanceText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
});

export default SearchScreen;