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
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const PetDetailsScreen = ({ route, navigation }) => {
  const { petId } = route.params || {};
  const { user } = useAuth();
  const toast = useToast();
  const [pet, setPet] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // Mock pet data - in real app, fetch from API
  useEffect(() => {
    const mockPet = {
      id: petId || '1',
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
        emergency: {
          contact: 'John Smith',
          phone: '+65 9123 4567',
          altContact: 'Mary Smith',
          altPhone: '+65 9876 5432',
        },
      },
      bookingHistory: [
        {
          id: '1',
          service: 'Pet Boarding',
          caregiver: 'Sarah Johnson',
          date: '2024-11-15',
          duration: '3 days',
          status: 'completed',
          rating: 5,
        },
        {
          id: '2',
          service: 'Dog Walking',
          caregiver: 'Michael Chen',
          date: '2024-10-20',
          duration: '1 hour',
          status: 'completed',
          rating: 4,
        },
      ],
    };
    setPet(mockPet);
  }, [petId]);

  const handleEditPet = () => {
    setEditModalVisible(true);
  };

  const handleDeletePet = () => {
    Alert.alert(
      'Delete Pet',
      `Are you sure you want to delete ${pet?.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            toast.success('Pet deleted successfully');
            navigation.goBack();
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in_progress': return '#3B82F6';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (!pet) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading pet details...</Text>
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
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{pet.name}</Text>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={handleEditPet}
        >
          <Ionicons name="create-outline" size={24} color="#FF5A5F" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Pet Profile */}
        <View style={styles.profileSection}>
          <Image source={{ uri: pet.image }} style={styles.petImage} />
          <View style={styles.petInfo}>
            <Text style={styles.petName}>{pet.name}</Text>
            <Text style={styles.petBreed}>{pet.breed}</Text>
            <View style={styles.petDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Age</Text>
                <Text style={styles.detailValue}>{pet.age} years</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Weight</Text>
                <Text style={styles.detailValue}>{pet.weight} kg</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Gender</Text>
                <Text style={styles.detailValue}>{pet.gender}</Text>
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
                <View style={styles.medicalInfo}>
                  <Text style={styles.medicalName}>{vaccination.name}</Text>
                  <Text style={styles.medicalDate}>Last: {formatDate(vaccination.date)}</Text>
                </View>
                <Text style={styles.medicalNext}>Due: {formatDate(vaccination.nextDue)}</Text>
              </View>
            ))}
          </View>

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

          {pet.medicalInfo.medications.length > 0 && (
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>Current Medications</Text>
              {pet.medicalInfo.medications.map((medication, index) => (
                <View key={index} style={styles.medicationItem}>
                  <View style={styles.medicationInfo}>
                    <Text style={styles.medicationName}>{medication.name}</Text>
                    <Text style={styles.medicationFreq}>{medication.frequency}</Text>
                  </View>
                  <Text style={styles.medicationLast}>Last: {formatDate(medication.lastGiven)}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Veterinarian</Text>
            <View style={styles.vetInfo}>
              <View style={styles.vetDetails}>
                <Text style={styles.vetName}>{pet.medicalInfo.veterinarian.name}</Text>
                <Text style={styles.vetClinic}>{pet.medicalInfo.veterinarian.clinic}</Text>
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
            <Ionicons name="restaurant" size={20} color="#FF5A5F" />
            <View style={styles.careContent}>
              <Text style={styles.careTitle}>Feeding</Text>
              <Text style={styles.careDescription}>{pet.careInstructions.feeding}</Text>
            </View>
          </View>

          <View style={styles.careItem}>
            <Ionicons name="fitness" size={20} color="#FF5A5F" />
            <View style={styles.careContent}>
              <Text style={styles.careTitle}>Exercise</Text>
              <Text style={styles.careDescription}>{pet.careInstructions.exercise}</Text>
            </View>
          </View>

          <View style={styles.careItem}>
            <Ionicons name="sparkles" size={20} color="#FF5A5F" />
            <View style={styles.careContent}>
              <Text style={styles.careTitle}>Grooming</Text>
              <Text style={styles.careDescription}>{pet.careInstructions.grooming}</Text>
            </View>
          </View>
        </View>

        {/* Emergency Contacts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          <View style={styles.contactItem}>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{pet.careInstructions.emergency.contact}</Text>
              <Text style={styles.contactPhone}>{pet.careInstructions.emergency.phone}</Text>
            </View>
            <TouchableOpacity style={styles.callButton}>
              <Ionicons name="call" size={20} color="#FF5A5F" />
            </TouchableOpacity>
          </View>
          {pet.careInstructions.emergency.altContact && (
            <View style={styles.contactItem}>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{pet.careInstructions.emergency.altContact}</Text>
                <Text style={styles.contactPhone}>{pet.careInstructions.emergency.altPhone}</Text>
              </View>
              <TouchableOpacity style={styles.callButton}>
                <Ionicons name="call" size={20} color="#FF5A5F" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Booking History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Bookings</Text>
          {pet.bookingHistory.map((booking) => (
            <View key={booking.id} style={styles.bookingItem}>
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingService}>{booking.service}</Text>
                <Text style={styles.bookingCaregiver}>with {booking.caregiver}</Text>
                <Text style={styles.bookingDate}>{formatDate(booking.date)} • {booking.duration}</Text>
              </View>
              <View style={styles.bookingStatus}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(booking.status) }]} />
                <Text style={styles.statusText}>{booking.status}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.findCareButton}>
            <Ionicons name="search" size={20} color="white" />
            <Text style={styles.findCareButtonText}>Find Care for {pet.name}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDeletePet}
          >
            <Ionicons name="trash" size={20} color="#EF4444" />
            <Text style={styles.deleteButtonText}>Delete Pet</Text>
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
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  profileSection: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
  },
  petImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginRight: 20,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  petBreed: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  petDetails: {
    flexDirection: 'row',
    gap: 20,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  tagGood: {
    backgroundColor: '#10B98120',
  },
  tagTraining: {
    backgroundColor: '#10B98120',
  },
  tagWarning: {
    backgroundColor: '#EF444420',
  },
  tagText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  tagTextGood: {
    color: '#10B981',
  },
  tagTextTraining: {
    color: '#10B981',
  },
  tagTextWarning: {
    color: '#EF4444',
  },
  specialNeeds: {
    fontSize: 16,
    color: '#666',
    backgroundColor: '#FFF7ED',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  medicalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  medicalInfo: {
    flex: 1,
  },
  medicalName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  medicalDate: {
    fontSize: 14,
    color: '#666',
  },
  medicalNext: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  medicationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  medicationFreq: {
    fontSize: 14,
    color: '#666',
  },
  medicationLast: {
    fontSize: 14,
    color: '#999',
  },
  vetInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
  },
  vetDetails: {
    flex: 1,
  },
  vetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  vetClinic: {
    fontSize: 14,
    color: '#666',
  },
  callButton: {
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
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    marginBottom: 8,
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
});

export default PetDetailsScreen;