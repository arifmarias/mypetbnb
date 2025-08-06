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
import { petsAPI } from '../services/api';

const PetDetailsScreen = ({ route, navigation }) => {
  const { petId } = route.params || {};
  const { user } = useAuth();
  const toast = useToast();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (petId) {
      loadPetDetails();
    } else {
      setLoading(false);
      toast.error('Pet ID not provided');
      navigation.goBack();
    }
  }, [petId]);

  const loadPetDetails = async () => {
    setLoading(true);
    try {
      console.log(`Loading pet details for ID: ${petId}`);
      const petData = await petsAPI.getPetById(petId);
      console.log('Pet details loaded:', petData);
      setPet(petData);
    } catch (error) {
      console.error('Load pet details error:', error);
      
      if (error.response?.status === 404) {
        toast.error('Pet not found');
      } else if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else if (error.response?.status === 403) {
        toast.error('Access denied');
      } else {
        toast.error('Failed to load pet details');
      }
      
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleEditPet = () => {
    // Navigate to edit pet screen (to be implemented)
    navigation.navigate('AddPet', { 
      petId: pet.id, 
      editMode: true, 
      petData: pet 
    });
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
              console.log(`Deleting pet ${pet.id}...`);
              await petsAPI.deletePet(pet.id);
              console.log('Pet deleted successfully');
              
              toast.success(`${pet.name} has been removed from your pets`);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting pet:', error);
              
              if (error.response?.status === 400) {
                toast.error(error.response.data.detail || 'Cannot delete pet with active bookings');
              } else {
                toast.error('Failed to delete pet. Please try again.');
              }
            }
          },
        },
      ]
    );
  };

  const handleFindCare = () => {
    // Navigate to search with pet filter
    navigation.navigate('MainTabs', { 
      screen: 'Search',
      params: { petId: pet.id, petName: pet.name }
    });
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
    if (!age) return 'Age unknown';
    if (age < 1) return `${Math.round(age * 12)} months`;
    return age === 1 ? '1 year' : `${age} years`;
  };

  const getPetImage = (pet) => {
    if (pet.images && pet.images.length > 0) {
      return pet.images[0];
    }
    
    // Default images based on species
    const defaultImages = {
      dog: 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      cat: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      bird: 'https://images.unsplash.com/photo-1571752726703-5e7d1f6a986d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      rabbit: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    };
    
    return defaultImages[pet.species?.toLowerCase()] || defaultImages.dog;
  };

  const renderMedicalInfo = () => {
    if (!pet.medical_info || Object.keys(pet.medical_info).length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Ionicons name="medical-outline" size={32} color="#DDD" />
          <Text style={styles.noDataText}>No medical information available</Text>
        </View>
      );
    }

    return (
      <View style={styles.medicalContainer}>
        {pet.medical_info.vaccinations && (
          <View style={styles.medicalItem}>
            <View style={styles.medicalIcon}>
              <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            </View>
            <View style={styles.medicalContent}>
              <Text style={styles.medicalTitle}>Vaccinations</Text>
              <Text style={styles.medicalText}>{pet.medical_info.vaccinations}</Text>
            </View>
          </View>
        )}

        {pet.medical_info.medications && (
          <View style={styles.medicalItem}>
            <View style={styles.medicalIcon}>
              <Ionicons name="medical" size={20} color="#F59E0B" />
            </View>
            <View style={styles.medicalContent}>
              <Text style={styles.medicalTitle}>Medications</Text>
              <Text style={styles.medicalText}>{pet.medical_info.medications}</Text>
            </View>
          </View>
        )}

        {pet.medical_info.allergies && (
          <View style={styles.medicalItem}>
            <View style={styles.medicalIcon}>
              <Ionicons name="warning" size={20} color="#EF4444" />
            </View>
            <View style={styles.medicalContent}>
              <Text style={styles.medicalTitle}>Allergies</Text>
              <Text style={styles.medicalText}>{pet.medical_info.allergies}</Text>
            </View>
          </View>
        )}

        {pet.medical_info.conditions && (
          <View style={styles.medicalItem}>
            <View style={styles.medicalIcon}>
              <Ionicons name="fitness" size={20} color="#6366F1" />
            </View>
            <View style={styles.medicalContent}>
              <Text style={styles.medicalTitle}>Medical Conditions</Text>
              <Text style={styles.medicalText}>{pet.medical_info.conditions}</Text>
            </View>
          </View>
        )}

        {(pet.medical_info.veterinarian_name || pet.medical_info.veterinarian_phone) && (
          <View style={styles.medicalItem}>
            <View style={styles.medicalIcon}>
              <Ionicons name="person-circle" size={20} color="#8B5CF6" />
            </View>
            <View style={styles.medicalContent}>
              <Text style={styles.medicalTitle}>Veterinarian</Text>
              {pet.medical_info.veterinarian_name && (
                <Text style={styles.medicalText}>{pet.medical_info.veterinarian_name}</Text>
              )}
              {pet.medical_info.veterinarian_phone && (
                <Text style={styles.medicalText}>{pet.medical_info.veterinarian_phone}</Text>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderBehavioralInfo = () => {
    if (!pet.behavioral_notes || Object.keys(pet.behavioral_notes).length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Ionicons name="happy-outline" size={32} color="#DDD" />
          <Text style={styles.noDataText}>No behavioral information available</Text>
        </View>
      );
    }

    return (
      <View style={styles.behaviorContainer}>
        {pet.behavioral_notes.personality && (
          <View style={styles.behaviorItem}>
            <Text style={styles.behaviorTitle}>Personality</Text>
            <Text style={styles.behaviorText}>{pet.behavioral_notes.personality}</Text>
          </View>
        )}

        {pet.behavioral_notes.good_with && (
          <View style={styles.behaviorItem}>
            <Text style={styles.behaviorTitle}>Good With</Text>
            <Text style={styles.behaviorText}>{pet.behavioral_notes.good_with}</Text>
          </View>
        )}

        {pet.behavioral_notes.training && (
          <View style={styles.behaviorItem}>
            <Text style={styles.behaviorTitle}>Training</Text>
            <Text style={styles.behaviorText}>{pet.behavioral_notes.training}</Text>
          </View>
        )}

        {pet.behavioral_notes.special_needs && (
          <View style={styles.behaviorItem}>
            <Text style={styles.behaviorTitle}>Special Needs</Text>
            <Text style={styles.behaviorText}>{pet.behavioral_notes.special_needs}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderEmergencyContact = () => {
    if (!pet.emergency_contact || Object.keys(pet.emergency_contact).length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Ionicons name="call-outline" size={32} color="#DDD" />
          <Text style={styles.noDataText}>No emergency contact information</Text>
        </View>
      );
    }

    return (
      <View style={styles.emergencyContainer}>
        {pet.emergency_contact.name && (
          <View style={styles.emergencyItem}>
            <Ionicons name="person" size={20} color="#FF5A5F" />
            <View style={styles.emergencyContent}>
              <Text style={styles.emergencyTitle}>Emergency Contact</Text>
              <Text style={styles.emergencyText}>{pet.emergency_contact.name}</Text>
              {pet.emergency_contact.phone && (
                <Text style={styles.emergencyText}>{pet.emergency_contact.phone}</Text>
              )}
            </View>
          </View>
        )}

        {pet.emergency_contact.feeding && (
          <View style={styles.emergencyItem}>
            <Ionicons name="restaurant" size={20} color="#FF5A5F" />
            <View style={styles.emergencyContent}>
              <Text style={styles.emergencyTitle}>Feeding Instructions</Text>
              <Text style={styles.emergencyText}>{pet.emergency_contact.feeding}</Text>
            </View>
          </View>
        )}

        {pet.emergency_contact.exercise && (
          <View style={styles.emergencyItem}>
            <Ionicons name="walk" size={20} color="#FF5A5F" />
            <View style={styles.emergencyContent}>
              <Text style={styles.emergencyTitle}>Exercise Needs</Text>
              <Text style={styles.emergencyText}>{pet.emergency_contact.exercise}</Text>
            </View>
          </View>
        )}

        {pet.emergency_contact.grooming && (
          <View style={styles.emergencyItem}>
            <Ionicons name="cut" size={20} color="#FF5A5F" />
            <View style={styles.emergencyContent}>
              <Text style={styles.emergencyTitle}>Grooming</Text>
              <Text style={styles.emergencyText}>{pet.emergency_contact.grooming}</Text>
            </View>
          </View>
        )}
      </View>
    );
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
          <Image source={{ uri: getPetImage(pet) }} style={styles.petImage} />
          <View style={styles.petBasicInfo}>
            <Text style={styles.petName}>{pet.name}</Text>
            <Text style={styles.petBreed}>{pet.breed || `${pet.species} (Mixed breed)`}</Text>
            
            <View style={styles.basicDetails}>
              <View style={styles.basicDetailItem}>
                <Ionicons name="calendar-outline" size={16} color="#666" />
                <Text style={styles.basicDetailText}>{getAgeText(pet.age)}</Text>
              </View>
              
              <View style={styles.basicDetailItem}>
                <Ionicons 
                  name={pet.gender === 'male' ? 'male' : pet.gender === 'female' ? 'female' : 'help'} 
                  size={16} 
                  color={pet.gender === 'male' ? '#3B82F6' : pet.gender === 'female' ? '#EC4899' : '#666'} 
                />
                <Text style={styles.basicDetailText}>{pet.gender || 'Unknown'}</Text>
              </View>
              
              {pet.weight && (
                <View style={styles.basicDetailItem}>
                  <Ionicons name="fitness-outline" size={16} color="#666" />
                  <Text style={styles.basicDetailText}>{pet.weight} kg</Text>
                </View>
              )}

              <View style={styles.basicDetailItem}>
                <Ionicons name="paw" size={16} color="#666" />
                <Text style={styles.basicDetailText}>{pet.species}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Description */}
        {pet.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About {pet.name}</Text>
            <Text style={styles.description}>{pet.description}</Text>
          </View>
        )}

        {/* Medical Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Information</Text>
          {renderMedicalInfo()}
        </View>

        {/* Behavioral Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Behavior & Personality</Text>
          {renderBehavioralInfo()}
        </View>

        {/* Care Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Care Instructions</Text>
          {renderEmergencyContact()}
        </View>

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
    textTransform: 'capitalize',
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
    textTransform: 'capitalize',
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
  noDataContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  medicalContainer: {
    gap: 16,
  },
  medicalItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  medicalText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  behaviorContainer: {
    gap: 16,
  },
  behaviorItem: {
    gap: 8,
  },
  behaviorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  behaviorText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emergencyContainer: {
    gap: 16,
  },
  emergencyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  emergencyContent: {
    flex: 1,
    marginLeft: 16,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  emergencyText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 2,
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