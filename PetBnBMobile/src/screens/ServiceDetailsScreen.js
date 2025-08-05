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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const { width } = Dimensions.get('window');

const ServiceDetailsScreen = ({ route, navigation }) => {
  const { serviceId, service: passedService } = route.params || {};
  const { user } = useAuth();
  const toast = useToast();
  
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Default service structure to prevent errors
  const defaultService = {
    id: serviceId || '1',
    title: 'Pet Care Service',
    price: 50,
    currency: 'MYR',
    duration: '1 hour',
    instantBook: false,
    images: ['https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'],
    features: ['Professional Care', 'Insured', 'Experienced'],
    caregiver: {
      id: 'c1',
      name: 'Professional Caregiver',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      rating: 4.8,
      reviewCount: 50,
      responseTime: '< 1 hour',
      location: 'Petaling Jaya, MY',
      verified: true,
    },
    description: 'Professional pet care service with experienced caregivers.',
  };

  useEffect(() => {
    loadServiceDetails();
  }, [passedService, serviceId]);

  const loadServiceDetails = async () => {
    setLoading(true);
    try {
      // Simulate API loading time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let serviceData;
      
      if (passedService) {
        // Use passed service data and merge with extended details
        serviceData = {
          ...defaultService,
          ...passedService,
          fullDescription: `${passedService.description || defaultService.description}\n\nI provide professional, reliable, and loving care for your pets. With over 5 years of experience in pet care, I understand that every pet is unique and deserves individualized attention. My goal is to ensure your pet feels safe, happy, and loved while you're away.\n\nI'm fully insured, bonded, and have completed pet first aid training. Your pet's safety and well-being are my top priorities.`,
          
          // Ensure arrays exist
          images: passedService.images || defaultService.images,
          features: passedService.features || defaultService.features,
          
          // Extended service details
          amenities: [
            'Fully Insured & Bonded',
            'Pet First Aid Certified',
            'Background Checked',
            '24/7 Emergency Support',
            'Real-time GPS Tracking',
            'Daily Photo/Video Updates',
            'Flexible Scheduling',
            'Medication Administration',
          ],
          
          petPreferences: {
            sizes: ['Small', 'Medium', 'Large'],
            ages: ['Puppy/Kitten', 'Adult', 'Senior'],
            types: ['Dogs', 'Cats', 'Small Animals'],
          },
          
          serviceAreas: [
            'Petaling Jaya',
            'Subang Jaya', 
            'Shah Alam',
            'Kuala Lumpur City Centre',
            'Mont Kiara',
            'Bangsar',
          ],
          
          schedule: {
            monday: { available: true, hours: '7:00 AM - 8:00 PM' },
            tuesday: { available: true, hours: '7:00 AM - 8:00 PM' },
            wednesday: { available: true, hours: '7:00 AM - 8:00 PM' },
            thursday: { available: true, hours: '7:00 AM - 8:00 PM' },
            friday: { available: true, hours: '7:00 AM - 8:00 PM' },
            saturday: { available: true, hours: '8:00 AM - 6:00 PM' },
            sunday: { available: true, hours: '8:00 AM - 6:00 PM' },
          },
          
          reviews: [
            {
              id: 'r1',
              user: {
                name: 'Jennifer Lee',
                avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80',
              },
              rating: 5,
              date: '2024-11-28',
              comment: `${passedService.caregiver?.name || 'The caregiver'} took amazing care of my pet during our vacation. The daily updates with photos were so reassuring! Highly recommend!`,
              petName: 'Max',
              serviceUsed: passedService.title || 'Pet Care',
            },
            {
              id: 'r2',
              user: {
                name: 'David Chen',
                avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80',
              },
              rating: 5,
              date: '2024-11-25',
              comment: `Fantastic service! Very professional and follows instructions perfectly. Will definitely book again.`,
              petName: 'Luna',
              serviceUsed: passedService.title || 'Pet Care',
            },
            {
              id: 'r3',
              user: {
                name: 'Maria Santos',
                avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80',
              },
              rating: 4,
              date: '2024-11-20',
              comment: `Great care and very trustworthy. Followed all instructions perfectly.`,
              petName: 'Whiskers',
              serviceUsed: passedService.title || 'Pet Care',
            },
          ],
          
          policies: {
            cancellation: 'Free cancellation up to 24 hours before service. 50% refund for same-day cancellations.',
            payment: 'Payment processed securely through PetBnB. Full payment required at booking.',
            emergency: '24/7 emergency contact available. Will contact owner immediately for any concerns.',
            additional: 'Additional pets: +50% of base rate. Holiday rates may apply during peak seasons.',
          },
        };
      } else {
        // Fallback to default service
        serviceData = {
          ...defaultService,
          fullDescription: `${defaultService.description}\n\nProfessional pet care service with experienced and certified caregivers.`,
          amenities: ['Professional Care', 'Insured', 'Background Checked'],
          petPreferences: {
            sizes: ['All Sizes'],
            ages: ['All Ages'],
            types: ['Dogs', 'Cats'],
          },
          serviceAreas: ['Petaling Jaya', 'Kuala Lumpur'],
          schedule: {
            monday: { available: true, hours: '9:00 AM - 6:00 PM' },
            tuesday: { available: true, hours: '9:00 AM - 6:00 PM' },
            wednesday: { available: true, hours: '9:00 AM - 6:00 PM' },
            thursday: { available: true, hours: '9:00 AM - 6:00 PM' },
            friday: { available: true, hours: '9:00 AM - 6:00 PM' },
            saturday: { available: true, hours: '9:00 AM - 5:00 PM' },
            sunday: { available: false, hours: 'Closed' },
          },
          reviews: [],
        };
      }
      
      setService(serviceData);
    } catch (error) {
      console.error('Error loading service details:', error);
      toast.error('Failed to load service details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    if (!service) {
      toast.error('Service data not available');
      return;
    }
    
    navigation.navigate('Booking', { 
      serviceId: service.id,
      service: service 
    });
  };

  const handleContactCaregiver = () => {
    Alert.alert(
      'Contact Caregiver',
      'Choose how you\'d like to contact the caregiver:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send Message', onPress: () => toast.info('Messaging feature coming soon!') },
        { text: 'Call', onPress: () => toast.info('Calling feature coming soon!') },
      ]
    );
  };

  const handleSaveService = () => {
    toast.success('Service saved to favorites!');
  };

  const renderRatingStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={16}
          color={i <= rating ? '#F59E0B' : '#D1D5DB'}
        />
      );
    }
    return stars;
  };

  const renderImageCarousel = () => {
    const images = service?.images || [];
    
    if (images.length === 0) {
      return (
        <View style={styles.placeholderImage}>
          <Ionicons name="image-outline" size={48} color="#DDD" />
          <Text style={styles.placeholderText}>No images available</Text>
        </View>
      );
    }

    return (
      <View style={styles.imageCarousel}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentImageIndex(index);
          }}
        >
          {images.map((image, index) => (
            <Image key={index} source={{ uri: image }} style={styles.carouselImage} />
          ))}
        </ScrollView>
        
        {images.length > 1 && (
          <View style={styles.imageIndicators}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  currentImageIndex === index && styles.activeIndicator
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderReview = (review) => (
    <View key={review.id} style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Image source={{ uri: review.user.avatar }} style={styles.reviewerAvatar} />
        <View style={styles.reviewerInfo}>
          <Text style={styles.reviewerName}>{review.user.name}</Text>
          <View style={styles.reviewRating}>
            {renderRatingStars(review.rating)}
            <Text style={styles.reviewDate}>
              {new Date(review.date).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
      <Text style={styles.reviewComment}>{review.comment}</Text>
      <Text style={styles.reviewServiceInfo}>
        Service: {review.serviceUsed} for {review.petName}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading service details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!service) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Service not found</Text>
          <TouchableOpacity 
            style={styles.backToSearchButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backToSearchText}>Back to Search</Text>
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
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Details</Text>
        <TouchableOpacity 
          onPress={handleSaveService}
          style={styles.saveButton}
        >
          <Ionicons name="heart-outline" size={24} color="#FF5A5F" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        {renderImageCarousel()}

        {/* Service Title and Price */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text style={styles.serviceTitle}>{service.title}</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.priceAmount}>{service.currency} {service.price}</Text>
              <Text style={styles.pricePer}>per {service.duration}</Text>
            </View>
          </View>
          
          {service.instantBook && (
            <View style={styles.instantBookBanner}>
              <Ionicons name="flash" size={16} color="#10B981" />
              <Text style={styles.instantBookText}>Instant Book Available</Text>
            </View>
          )}
        </View>

        {/* Caregiver Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About the Caregiver</Text>
          <View style={styles.caregiverCard}>
            <Image source={{ uri: service.caregiver.avatar }} style={styles.caregiverImage} />
            <View style={styles.caregiverDetails}>
              <View style={styles.caregiverNameRow}>
                <Text style={styles.caregiverName}>{service.caregiver.name}</Text>
                {service.caregiver.verified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="white" />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.caregiverStats}>
                <View style={styles.statItem}>
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text style={styles.statText}>
                    {service.caregiver.rating} ({service.caregiver.reviewCount} reviews)
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="location-outline" size={16} color="#666" />
                  <Text style={styles.statText}>{service.caregiver.location}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <Text style={styles.statText}>Responds in {service.caregiver.responseTime}</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.contactButton}
                onPress={handleContactCaregiver}
              >
                <Ionicons name="chatbubble-outline" size={16} color="#FF5A5F" />
                <Text style={styles.contactButtonText}>Contact Caregiver</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Description</Text>
          <Text style={styles.description}>{service.fullDescription || service.description}</Text>
        </View>

        {/* What's Included */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's Included</Text>
          <View style={styles.featuresGrid}>
            {(service.features || []).map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Amenities */}
        {service.amenities && service.amenities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities & Certifications</Text>
            <View style={styles.amenitiesGrid}>
              {service.amenities.map((amenity, index) => (
                <View key={index} style={styles.amenityTag}>
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Pet Preferences */}
        {service.petPreferences && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pet Preferences</Text>
            <View style={styles.preferencesContainer}>
              <View style={styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>Pet Types:</Text>
                <Text style={styles.preferenceValue}>{service.petPreferences.types?.join(', ') || 'All types'}</Text>
              </View>
              <View style={styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>Pet Sizes:</Text>
                <Text style={styles.preferenceValue}>{service.petPreferences.sizes?.join(', ') || 'All sizes'}</Text>
              </View>
              <View style={styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>Pet Ages:</Text>
                <Text style={styles.preferenceValue}>{service.petPreferences.ages?.join(', ') || 'All ages'}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Availability */}
        {service.schedule && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Availability</Text>
            <View style={styles.scheduleContainer}>
              {Object.entries(service.schedule).map(([day, schedule]) => (
                <View key={day} style={styles.scheduleRow}>
                  <Text style={styles.dayText}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
                  <Text style={[
                    styles.hoursText,
                    !schedule.available && styles.unavailableText
                  ]}>
                    {schedule.available ? schedule.hours : 'Unavailable'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Service Areas */}
        {service.serviceAreas && service.serviceAreas.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Areas</Text>
            <View style={styles.serviceAreasContainer}>
              {service.serviceAreas.map((area, index) => (
                <View key={index} style={styles.areaTag}>
                  <Ionicons name="location" size={14} color="#FF5A5F" />
                  <Text style={styles.areaText}>{area}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Reviews */}
        {service.reviews && service.reviews.length > 0 && (
          <View style={styles.section}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>
                Reviews ({service.reviews.length})
              </Text>
              <View style={styles.overallRating}>
                <Ionicons name="star" size={20} color="#F59E0B" />
                <Text style={styles.ratingNumber}>{service.caregiver.rating}</Text>
              </View>
            </View>
            
            {service.reviews
              .slice(0, showAllReviews ? service.reviews.length : 2)
              .map(renderReview)}
            
            {service.reviews.length > 2 && (
              <TouchableOpacity
                style={styles.showMoreReviews}
                onPress={() => setShowAllReviews(!showAllReviews)}
              >
                <Text style={styles.showMoreText}>
                  {showAllReviews ? 'Show Less' : `Show All ${service.reviews.length} Reviews`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Policies */}
        {service.policies && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Policies</Text>
            <View style={styles.policiesContainer}>
              <View style={styles.policyItem}>
                <Text style={styles.policyTitle}>Cancellation Policy</Text>
                <Text style={styles.policyText}>{service.policies.cancellation}</Text>
              </View>
              <View style={styles.policyItem}>
                <Text style={styles.policyTitle}>Payment</Text>
                <Text style={styles.policyText}>{service.policies.payment}</Text>
              </View>
              <View style={styles.policyItem}>
                <Text style={styles.policyTitle}>Emergency Procedures</Text>
                <Text style={styles.policyText}>{service.policies.emergency}</Text>
              </View>
              <View style={styles.policyItem}>
                <Text style={styles.policyTitle}>Additional Information</Text>
                <Text style={styles.policyText}>{service.policies.additional}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceInfo}>
          <Text style={styles.bottomPrice}>{service.currency} {service.price}</Text>
          <Text style={styles.bottomPricePer}>per {service.duration}</Text>
        </View>
        <TouchableOpacity style={styles.bookNowButton} onPress={handleBookNow}>
          <Text style={styles.bookNowText}>Book Now</Text>
        </TouchableOpacity>
      </View>
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  placeholderImage: {
    width: width,
    height: 300,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
  },
  imageCarousel: {
    position: 'relative',
  },
  carouselImage: {
    width: width,
    height: 300,
    backgroundColor: '#F0F0F0',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  activeIndicator: {
    backgroundColor: 'white',
  },
  titleSection: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 16,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF5A5F',
  },
  pricePer: {
    fontSize: 14,
    color: '#666',
  },
  instantBookBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  instantBookText: {
    color: '#16A34A',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  caregiverCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  caregiverImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  caregiverDetails: {
    flex: 1,
  },
  caregiverNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  caregiverName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  caregiverStats: {
    marginBottom: 16,
    gap: 6,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF5A5F20',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  contactButtonText: {
    color: '#FF5A5F',
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  featuresGrid: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
  },
  amenityText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  preferencesContainer: {
    gap: 12,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  preferenceValue: {
    fontSize: 16,
    color: '#666',
    flex: 1,
    textAlign: 'right',
  },
  scheduleContainer: {
    gap: 8,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    textTransform: 'capitalize',
  },
  hoursText: {
    fontSize: 16,
    color: '#666',
  },
  unavailableText: {
    color: '#999',
    fontStyle: 'italic',
  },
  serviceAreasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  areaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF5A5F20',
    borderRadius: 16,
    gap: 4,
  },
  areaText: {
    fontSize: 14,
    color: '#FF5A5F',
    fontWeight: '500',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  overallRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  reviewCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 16,
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewDate: {
    fontSize: 14,
    color: '#666',
  },
  reviewComment: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    marginBottom: 8,
  },
  reviewServiceInfo: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  showMoreReviews: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  showMoreText: {
    fontSize: 16,
    color: '#FF5A5F',
    fontWeight: '600',
  },
  policiesContainer: {
    gap: 16,
  },
  policyItem: {
    gap: 6,
  },
  policyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  policyText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  bottomPadding: {
    height: 100,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  priceInfo: {
    alignItems: 'flex-start',
  },
  bottomPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF5A5F',
  },
  bottomPricePer: {
    fontSize: 14,
    color: '#666',
  },
  bookNowButton: {
    backgroundColor: '#FF5A5F',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: '#FF5A5F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bookNowText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
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
    marginBottom: 16,
  },
  backToSearchButton: {
    backgroundColor: '#FF5A5F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backToSearchText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ServiceDetailsScreen;