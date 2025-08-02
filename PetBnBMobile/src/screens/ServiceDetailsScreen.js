import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const ServiceDetailsScreen = ({ route, navigation }) => {
  const { service } = route.params || {};
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);

  // Mock additional service data
  const [serviceDetails, setServiceDetails] = useState({
    images: [
      'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ],
    amenities: [
      'Air Conditioning',
      'Pet-Safe Environment',
      'Daily Updates',
      'Professional Equipment',
      'Emergency Care',
      'Multiple Play Areas',
    ],
    availability: [
      'Monday - Friday: 7:00 AM - 8:00 PM',
      'Saturday - Sunday: 8:00 AM - 6:00 PM',
    ],
    policies: [
      'Vaccination records required',
      '24-hour cancellation policy',
      'Additional pet discount available',
      'Special dietary needs accommodated',
    ],
  });

  const [reviews, setReviews] = useState([
    {
      id: '1',
      user: 'Jennifer Smith',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b923?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      rating: 5,
      date: '2 weeks ago',
      comment: 'Sarah took amazing care of my Golden Retriever, Max. He came home happy and well-exercised. Highly recommend!',
    },
    {
      id: '2',
      user: 'David Wilson',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      rating: 5,
      date: '1 month ago',
      comment: 'Excellent service! Very professional and my cats were comfortable the entire time.',
    },
    {
      id: '3',
      user: 'Lisa Chen',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      rating: 4,
      date: '2 months ago',
      comment: 'Great experience overall. Very reliable and caring. Will definitely book again.',
    },
  ]);

  const handleBookNow = () => {
    navigation.navigate('Booking', { service });
  };

  const handleContact = () => {
    navigation.navigate('Messages', { 
      contactId: service?.caregiver?.id,
      contactName: service?.caregiver?.name,
      serviceType: service?.service?.title
    });
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Ionicons
        key={index}
        name={index < rating ? 'star' : 'star-outline'}
        size={16}
        color="#FFD700"
      />
    ));
  };

  if (!service) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Service not found</Text>
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
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={toggleFavorite}
        >
          <Ionicons 
            name={isFavorite ? 'heart' : 'heart-outline'} 
            size={24} 
            color={isFavorite ? '#FF5A5F' : 'white'} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <ScrollView 
          horizontal 
          pagingEnabled 
          showsHorizontalScrollIndicator={false}
          style={styles.imageGallery}
        >
          {serviceDetails.images.map((image, index) => (
            <Image key={index} source={{ uri: image }} style={styles.serviceImage} />
          ))}
        </ScrollView>

        <View style={styles.content}>
          {/* Service Header */}
          <View style={styles.serviceHeader}>
            <View style={styles.serviceTitle}>
              <Text style={styles.serviceText}>{service.service?.title}</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>${service.service?.price}</Text>
                <Text style={styles.priceUnit}>/day</Text>
              </View>
            </View>
            
            <Text style={styles.serviceDescription}>
              {service.service?.description}
            </Text>

            <View style={styles.ratingRow}>
              <View style={styles.ratingContainer}>
                {renderStars(Math.floor(service.caregiver?.rating || 5))}
                <Text style={styles.ratingText}>
                  {service.caregiver?.rating} ({service.caregiver?.reviews} reviews)
                </Text>
              </View>
              <View style={styles.distanceContainer}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.distanceText}>{service.distance} km away</Text>
              </View>
            </View>
          </View>

          {/* Caregiver Info */}
          <View style={styles.caregiverSection}>
            <Text style={styles.sectionTitle}>About the Caregiver</Text>
            <View style={styles.caregiverInfo}>
              <Image 
                source={{ uri: service.caregiver?.image }} 
                style={styles.caregiverAvatar} 
              />
              <View style={styles.caregiverDetails}>
                <Text style={styles.caregiverName}>{service.caregiver?.name}</Text>
                <Text style={styles.caregiverLocation}>{service.caregiver?.location}</Text>
                <Text style={styles.caregiverBio}>
                  Experienced pet caregiver with over 5 years of providing loving care for pets. 
                  I understand that every pet is unique and deserves personalized attention.
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.viewProfileButton}>
              <Text style={styles.viewProfileText}>View Full Profile</Text>
              <Ionicons name="chevron-forward" size={16} color="#FF5A5F" />
            </TouchableOpacity>
          </View>

          {/* Amenities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What's Included</Text>
            <View style={styles.amenitiesGrid}>
              {serviceDetails.amenities.map((amenity, index) => (
                <View key={index} style={styles.amenityItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Availability */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Availability</Text>
            {serviceDetails.availability.map((time, index) => (
              <View key={index} style={styles.availabilityItem}>
                <Ionicons name="time-outline" size={20} color="#666" />
                <Text style={styles.availabilityText}>{time}</Text>
              </View>
            ))}
          </View>

          {/* Policies */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Policies</Text>
            {serviceDetails.policies.map((policy, index) => (
              <View key={index} style={styles.policyItem}>
                <Ionicons name="information-circle-outline" size={20} color="#666" />
                <Text style={styles.policyText}>{policy}</Text>
              </View>
            ))}
          </View>

          {/* Reviews */}
          <View style={styles.section}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See all {service.caregiver?.reviews}</Text>
              </TouchableOpacity>
            </View>
            
            {reviews.slice(0, 3).map((review) => (
              <View key={review.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Image source={{ uri: review.avatar }} style={styles.reviewAvatar} />
                  <View style={styles.reviewInfo}>
                    <Text style={styles.reviewUser}>{review.user}</Text>
                    <View style={styles.reviewRating}>
                      {renderStars(review.rating)}
                      <Text style={styles.reviewDate}>{review.date}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={styles.contactButton}
          onPress={handleContact}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#FF5A5F" />
          <Text style={styles.contactButtonText}>Contact</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.bookButton}
          onPress={handleBookNow}
        >
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageGallery: {
    height: 300,
  },
  serviceImage: {
    width: width,
    height: 300,
    resizeMode: 'cover',
  },
  content: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    paddingTop: 20,
  },
  serviceHeader: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  serviceTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 16,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF5A5F',
  },
  priceUnit: {
    fontSize: 16,
    color: '#666',
  },
  serviceDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    fontWeight: '500',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  caregiverSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  caregiverInfo: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  caregiverAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  caregiverDetails: {
    flex: 1,
  },
  caregiverName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  caregiverLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  caregiverBio: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  viewProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#FF5A5F',
    borderRadius: 8,
  },
  viewProfileText: {
    fontSize: 16,
    color: '#FF5A5F',
    fontWeight: '600',
    marginRight: 8,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  amenitiesGrid: {
    gap: 12,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amenityText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  availabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  availabilityText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  policyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  policyText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
    lineHeight: 22,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 16,
    color: '#FF5A5F',
    fontWeight: '600',
  },
  reviewItem: {
    marginBottom: 20,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewUser: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewDate: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  reviewComment: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#FF5A5F',
    borderRadius: 25,
    backgroundColor: 'white',
  },
  contactButtonText: {
    fontSize: 16,
    color: '#FF5A5F',
    fontWeight: '600',
    marginLeft: 8,
  },
  bookButton: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#FF5A5F',
    borderRadius: 25,
  },
  bookButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
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
});

export default ServiceDetailsScreen;