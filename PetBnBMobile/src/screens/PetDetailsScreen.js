import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const PetDetailsScreen = ({ route, navigation }) => {
  const { petId } = route.params || {};
  const { user } = useAuth();
  const toast = useToast();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock pet data - replace with actual API call later
  const mockPetsData = {
    '1': {
      id: '1',
      name: 'Buddy',
      breed: 'Golden Retriever',
      age: 3,
      weight: 25,
      gender: 'Male',
      color: 'Golden',
      image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      description: 'Buddy is a friendly and energetic Golden Retriever who loves playing fetch and going on long walks. He is well-trained and gets along great with other dogs and children.',
      medicalInfo: {
        vaccinations: [
          { name: 'Rabies', date: '2024-03-15', nextDue: '2025-03-15' },
          { name: 'DHPP', date: '2024-01-20', nextDue: '2025-01-20' },
          { name: 'Lyme Disease', date: '2024-02-10', nextDue: '2025-02-10' },
        ],
        medications: [
          { name: 'Heartworm Prevention', frequency: 'Monthly', lastGiven: '2024-12-01' },
        ],
        allergies: ['Chicken', 'Grain'],
        conditions: [],
        veterinarian: {
          name: 'Dr. Sarah Miller',
          clinic: 'Happy Paws Veterinary Clinic',
          phone: '+65 6123 4567',
        },
      },
      behaviorInfo: {
        personality: ['Friendly', 'Energetic', 'Loyal', 'Playful'],
        goodWith: ['Dogs', 'Children', 'Cats'],
        training: ['House Trained', 'Leash Trained', 'Basic Commands'],
        issues: [],
        specialNeeds: 'Needs regular exercise and mental stimulation',
      },
      careInstructions: {
        feeding: 'Feed twice daily - morning and evening. 1.5 cups of high-quality dry food per meal.',
        exercise: 'Requires at least 1 hour of exercise daily. Loves fetch and swimming.',
        grooming: 'Brush weekly, bath monthly or as needed. Regular nail trims.',
        medications: 'Heartworm prevention on the 1st of each month.',
        emergencyContact: {
          name: 'John Smith',
          phone: '+65 9123 4567',
          relationship: 'Owner',
        },
      },
      recentBookings: [
        {
          id: 'b1',
          service: 'Dog Walking',
          caregiver: 'Sarah Johnson',
          date: '2024-12-05',
          status: 'completed',
        },
        {
          id: 'b2',
          service: 'Pet Boarding',
          caregiver: 'Mike Chen',
          date: '2024-11-20',
          status: 'completed',
        },
      ],
    },
    '2': {
      id: '2',
      name: 'Luna',
      breed: 'Siamese Cat',
      age: 2,
      weight: 4.5,
      gender: 'Female',
      color: 'Cream/Brown',
      image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      description: 'Luna is an elegant Siamese cat with a calm and affectionate personality. She enjoys quiet spaces and gentle petting sessions.',
      medicalInfo: {
        vaccinations: [
          { name: 'FVRCP', date: '2024-02-15', nextDue: '2025-02-15' },
          { name: 'Rabies', date: '2024-03-01', nextDue: '2025-03-01' },
        ],
        medications: [],
        allergies: ['Fish'],
        conditions: [],
        veterinarian: {
          name: 'Dr. Emily Wong',
          clinic: 'City Cat Clinic',
          phone: '+60 3 2123 4567',
        },
      },
      behaviorInfo: {
        personality: ['Calm', 'Affectionate', 'Independent', 'Gentle'],
        goodWith: ['Cats', 'Adults'],
        training: ['Litter Trained', 'Indoor Only'],
        issues: ['Shy with strangers'],
        specialNeeds: 'Prefers quiet environment, needs high perches',
      },
      careInstructions: {
        feeding: 'Feed twice daily with high-quality cat food. Wet food in morning, dry food in evening.',
        exercise: 'Indoor play with interactive toys. Climbing tree essential.',
        grooming: 'Brush twice weekly. Professional grooming monthly.',
        medications: 'None currently',
        emergencyContact: {
          name: 'Jane Doe',
          phone: '+60 12 345 6789',
          relationship: 'Owner',
        },
      },
      recentBookings: [
        {
          id: 'b3',
          service: 'Pet Sitting',
          caregiver: 'Lisa Wang',
          date: '2024-12-01',
          status: 'completed',
        },
      ],
    },
    '3': {
      id: '3',
      name: 'Charlie',
      breed: 'French Bulldog',
      age: 1,
      weight: 12,
      gender: 'Male',
      color: 'Brindle',
      image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      description: 'Charlie is a young and playful French Bulldog with lots of energy. He loves attention and is great with kids.',
      medicalInfo: {
        vaccinations: [
          { name: 'DHPP', date: '2024-03-10', nextDue: '2025-03-10' },
          { name: 'Rabies', date: '2024-03-15', nextDue: '2025-03-15' },
        ],
        medications: [],
        allergies: [],
        conditions: ['Sensitive to heat'],
        veterinarian: {
          name: 'Dr. Robert Lee',
          clinic: 'Pet Care Plus',
          phone: '+65 6789 0123',
        },
      },
      behaviorInfo: {
        personality: ['Playful', 'Energetic', 'Loving', 'Social'],
        goodWith: ['Dogs', 'Children', 'Cats'],
        training: ['House Trained', 'Learning Basic Commands'],
        issues: [],
        specialNeeds: 'Cannot handle extreme heat, needs air conditioning in hot weather',
      },
      careInstructions: {
        feeding: 'Three meals daily (puppy). High-quality puppy food. 1/2 cup per meal.',
        exercise: 'Short walks multiple times daily. Avoid exercise in hot weather.',
        grooming: 'Weekly brushing, face wrinkles need daily cleaning.',
        medications: 'None currently',
        emergencyContact: {
          name: 'Tom Wilson',
          phone: '+65 8901 2345',
          relationship: 'Owner',
        },
      },
      recentBookings: [],
    },
  };

  useEffect(() => {
    loadPetDetails();
  }, [petId]);

  const loadPetDetails = async () => {
    setLoading(true);
    try {
      // Simulate API loading time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get mock data based on petId
      const petData = mockPetsData[petId];
      
      if (petData) {
        setPet(petData);
      } else {
        toast.error('Pet not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Load pet details error:', error);
      toast.error('Failed to load pet details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleEditPet = () => {
    // Navigate to edit pet screen (to be implemented)
    toast.info('Edit pet feature coming soon!');
  };

  const handleDeletePet = () => {
    Alert.alert(
      'Delete Pet',
      `Are you sure you want to remove ${pet.name} from your pets? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Mock delete - replace with actual API call
              toast.success(`${pet.name} has been removed from your pets`);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting pet:', error);
              toast.error('Failed to delete pet');
            }
          },
        },
      ]
    );
  };

  const handleFindCare = () => {
    // Navigate to search with pet filter
    navigation.navigate('MainTabs', { screen: 'Search' });
    toast.info('Search feature coming soon!');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'confirmed': return '#3B82F6';
      case 'pending': return '#F59E0B';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getAgeText = (age) => {
    if (age < 1) return `${Math.round(age * 12)} months`;
    return age === 1 ? '1 year' : `${age} years`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading pet details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!pet) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Pet not found</Text>
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
        <Text style={styles.headerTitle}>{pet.name}</Text>
        <TouchableOpacity 
          onPress={handleEditPet}
          style={styles.editButton}
        >
          <Ionicons name="create-outline" size={24} color="#FF5A5F" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Pet Image and Basic Info */}
        <View style={styles.petImageSection}>
          <Image source={{ uri: pet.image }} style={styles.petImage} />
          <View style={styles.petBasicInfo}>
            <Text style={styles.petName}>{pet.name}</Text>
            <Text style={styles.petBreed}>{pet.breed}</Text>
            
            <View style={styles.basicDetails}>
              <View style={styles.basicDetailItem}>
                <Ionicons name="calendar-outline" size={16} color="#666" />
                <Text style={styles.basicDetailText}>{getAgeText(pet.age)} old</Text>
              </View>
              
              <View style={styles.basicDetailItem}>
                <Ionicons 
                  name={pet.gender === 'Male' ? 'male' : 'female'} 
                  size={16} 
                  color={pet.gender === 'Male' ? '#3B82F6' : '#EC4899'} 
                />
                <Text style={styles.basicDetailText}>{pet.gender}</Text>
              </View>
              
              <View style={styles.basicDetailItem}>
                <Ionicons name="fitness-outline" size={16} color="#666" />
                <Text style={styles.basicDetailText}>{pet.weight} kg</Text>
              </View>
              
              <View style={styles.basicDetailItem}>
                <Ionicons name="color-palette-outline" size={16} color="#666" />
                <Text style={styles.basicDetailText}>{pet.color}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About {pet.name}</Text>
          <Text style={styles.description}>{pet.description}</Text>
        </View>

        {/* Personality & Behavior */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personality & Behavior</Text>
          
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Personality Traits</Text>
            <View style={styles.tagsContainer}>
              {pet.behaviorInfo.personality.map((trait, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{trait}</Text>
                </View>
              ))}
            </View>
          </View>
          
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Good With</Text>
            <View style={styles.tagsContainer}>
              {pet.behaviorInfo.goodWith.map((item, index) => (
                <View key={index} style={[styles.tag, styles.tagGood]}>
                  <Text style={[styles.tagText, styles.tagTextGood]}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Training</Text>
            <View style={styles.tagsContainer}>
              {pet.behaviorInfo.training.map((training, index) => (
                <View key={index} style={[styles.tag, styles.tagTraining]}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={[styles.tagText, styles.tagTextTraining]}>{training}</Text>
                </View>
              ))}
            </View>
          </View>

          {pet.behaviorInfo.specialNeeds && (
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>Special Needs</Text>
              <Text style={styles.specialNeeds}>{pet.behaviorInfo.specialNeeds}</Text>
            </View>
          )}
        </View>

        {/* Medical Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Information</Text>
          
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Vaccinations</Text>
            {pet.medicalInfo.vaccinations.map((vaccination, index) => (
              <View key={index} style={styles.medicalItem}>
                <View style={styles.medicalIcon}>
                  <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                </View>
                <View style={styles.medicalContent}>
                  <Text style={styles.medicalTitle}>{vaccination.name}</Text>
                  <Text style={styles.medicalDate}>
                    Last: {new Date(vaccination.date).toLocaleDateString()}
                  </Text>
                  <Text style={styles.medicalNext}>
                    Next due: {new Date(vaccination.nextDue).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {pet.medicalInfo.medications.length > 0 && (
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>Medications</Text>
              {pet.medicalInfo.medications.map((medication, index) => (
                <View key={index} style={styles.medicalItem}>
                  <View style={styles.medicalIcon}>
                    <Ionicons name="medical" size={20} color="#F59E0B" />
                  </View>
                  <View style={styles.medicalContent}>
                    <Text style={styles.medicalTitle}>{medication.name}</Text>
                    <Text style={styles.medicalDate}>Frequency: {medication.frequency}</Text>
                    <Text style={styles.medicalNext}>
                      Last given: {new Date(medication.lastGiven).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {pet.medicalInfo.allergies.length > 0 && (
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>Allergies</Text>
              <View style={styles.tagsContainer}>
                {pet.medicalInfo.allergies.map((allergy, index) => (
                  <View key={index} style={[styles.tag, styles.tagWarning]}>
                    <Ionicons name="warning" size={16} color="#EF4444" />
                    <Text style={[styles.tagText, styles.tagTextWarning]}>{allergy}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Veterinarian</Text>
            <View style={styles.contactItem}>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{pet.medicalInfo.veterinarian.name}</Text>
                <Text style={styles.contactPhone}>{pet.medicalInfo.veterinarian.clinic}</Text>
                <Text style={styles.contactPhone}>{pet.medicalInfo.veterinarian.phone}</Text>
              </View>
              <TouchableOpacity style={styles.callButton}>
                <Ionicons name="call" size={20} color="#FF5A5F" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Care Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Care Instructions</Text>
          
          <View style={styles.careItem}>
            <View style={styles.careIcon}>
              <Ionicons name="restaurant-outline" size={20} color="#FF5A5F" />
            </View>
            <View style={styles.careContent}>
              <Text style={styles.careTitle}>Feeding</Text>
              <Text style={styles.careDescription}>{pet.careInstructions.feeding}</Text>
            </View>
          </View>

          <View style={styles.careItem}>
            <View style={styles.careIcon}>
              <Ionicons name="walk-outline" size={20} color="#FF5A5F" />
            </View>
            <View style={styles.careContent}>
              <Text style={styles.careTitle}>Exercise</Text>
              <Text style={styles.careDescription}>{pet.careInstructions.exercise}</Text>
            </View>
          </View>

          <View style={styles.careItem}>
            <View style={styles.careIcon}>
              <Ionicons name="cut-outline" size={20} color="#FF5A5F" />
            </View>
            <View style={styles.careContent}>
              <Text style={styles.careTitle}>Grooming</Text>
              <Text style={styles.careDescription}>{pet.careInstructions.grooming}</Text>
            </View>
          </View>

          <View style={styles.careItem}>
            <View style={styles.careIcon}>
              <Ionicons name="call-outline" size={20} color="#FF5A5F" />
            </View>
            <View style={styles.careContent}>
              <Text style={styles.careTitle}>Emergency Contact</Text>
              <Text style={styles.careDescription}>
                {pet.careInstructions.emergencyContact.name} - {pet.careInstructions.emergencyContact.phone}
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Bookings */}
        {pet.recentBookings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
            {pet.recentBookings.map((booking, index) => (
              <View key={index} style={styles.bookingItem}>
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingService}>{booking.service}</Text>
                  <Text style={styles.bookingCaregiver}>with {booking.caregiver}</Text>
                  <Text style={styles.bookingDate}>
                    {new Date(booking.date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.bookingStatus}>
                  <View 
                    style={[
                      styles.statusDot, 
                      { backgroundColor: getStatusColor(booking.status) }
                    ]} 
                  />
                  <Text style={styles.statusText}>{booking.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.findCareButton} onPress={handleFindCare}>
            <Ionicons name="search" size={20} color="white" />
            <Text style={styles.findCareButtonText}>Find Care for {pet.name}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePet}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
            <Text style={styles.deleteButtonText}>Remove Pet</Text>
          </TouchableOpacity>
        </View>

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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  petImageSection: {
    backgroundColor: 'white',
    marginBottom: 12,
  },
  petImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#F0F0F0',
  },
  petBasicInfo: {
    padding: 20,
  },
  petName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  petBreed: {
    fontSize: 18,
    color: '#666',
    marginBottom: 16,
  },
  basicDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  basicDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  basicDetailText: {
    fontSize: 14,
    color: '#666',
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
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  subsection: {
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagGood: {
    backgroundColor: '#DCFCE7',
  },
  tagTraining: {
    backgroundColor: '#DBEAFE',
  },
  tagWarning: {
    backgroundColor: '#FEE2E2',
  },
  tagText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  tagTextGood: {
    color: '#16A34A',
  },
  tagTextTraining: {
    color: '#2563EB',
  },
  tagTextWarning: {
    color: '#EF4444',
  },
  specialNeeds: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  medicalItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  medicalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  medicalContent: {
    flex: 1,
  },
  medicalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  medicalDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  medicalNext: {
    fontSize: 12,
    color: '#999',
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  callButton: {
    padding: 8,
  },
  careIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF5A5F20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  careItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  careContent: {
    flex: 1,
    marginLeft: 16,
  },
  careTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  careDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  bookingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingService: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  bookingCaregiver: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  bookingDate: {
    fontSize: 12,
    color: '#999',
  },
  bookingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  actionsSection: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 32,
    gap: 12,
  },
  findCareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF5A5F',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  findCareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  bottomPadding: {
    height: 40,
  },
});

export default PetDetailsScreen;