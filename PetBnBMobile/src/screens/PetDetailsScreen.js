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
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { petsAPI } from '../services/api';

const { width } = Dimensions.get('window');

const PetDetailsScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const toast = useToast();
  const { petId } = route.params;

  const [loading, setLoading] = useState(true);
  const [pet, setPet] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadPetDetails();
  }, [petId]);

  const loadPetDetails = async () => {
    try {
      setLoading(true);
      const response = await petsAPI.getPet(petId);
      setPet(response.data);
    } catch (error) {
      console.error('Load pet details error:', error);
      toast.error('Failed to load pet details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Pet',
      `Are you sure you want to delete ${pet.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await petsAPI.deletePet(petId);
              toast.success('Pet deleted successfully');
              navigation.goBack();
            } catch (error) {
              console.error('Delete pet error:', error);
              toast.error('Failed to delete pet');
            }
          },
        },
      ]
    );
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return 'Unknown';
    
    const birth = new Date(birthDate);
    const today = new Date();
    const diffTime = Math.abs(today - birth);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return months > 0 ? `${months} months old` : 'Less than 1 month old';
    } else {
      const years = Math.floor(diffDays / 365);
      const months = Math.floor((diffDays % 365) / 30);
      return months > 0 ? `${years} years, ${months} months old` : `${years} years old`;
    }
  };

  const getVaccinationStatus = () => {
    if (!pet.vaccination_records || pet.vaccination_records.length === 0) {
      return { status: 'incomplete', text: 'No vaccination records', color: '#F59E0B' };
    }
    
    const hasRecentVaccination = pet.vaccination_records.some(record => {
      const vaccinationDate = new Date(record.date);
      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - 12);
      return vaccinationDate >= monthsAgo;
    });
    
    return hasRecentVaccination 
      ? { status: 'complete', text: 'Up to date', color: '#10B981' }
      : { status: 'incomplete', text: 'Needs update', color: '#F59E0B' };
  };

  const renderImageGallery = () => {
    if (!pet.images || pet.images.length === 0) {
      return (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="paw" size={60} color="#CCC" />
          <Text style={styles.placeholderText}>No photos added</Text>
        </View>
      );
    }

    return (
      <View style={styles.imageGallery}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(event) => {
            const slideSize = event.nativeEvent.layoutMeasurement.width;
            const index = Math.floor(event.nativeEvent.contentOffset.x / slideSize);
            setCurrentImageIndex(index);
          }}
          scrollEventThrottle={10}
        >
          {pet.images.map((image, index) => (
            <Image key={index} source={{ uri: image }} style={styles.petImage} />
          ))}
        </ScrollView>
        
        {pet.images.length > 1 && (
          <View style={styles.imageIndicators}>
            {pet.images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentImageIndex && styles.activeIndicator
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderInfoSection = (title, children) => (
    <View style={styles.infoSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderInfoItem = (label, value, icon) => (
    <View style={styles.infoItem}>
      {icon && <Ionicons name={icon} size={20} color="#666" style={styles.infoIcon} />}
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'Not specified'}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5A5F" />
          <Text style={styles.loadingText}>Loading pet details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!pet) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Pet not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const vaccination = getVaccinationStatus();
  const age = calculateAge(pet.birth_date);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pet Details</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('AddPet', { petId: pet.id, mode: 'edit' })}
        >
          <Ionicons name="create" size={24} color="#FF5A5F" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        {renderImageGallery()}

        {/* Pet Name and Basic Info */}
        <View style={styles.petHeader}>
          <View style={styles.petNameSection}>
            <Text style={styles.petName}>{pet.name}</Text>
            <Text style={styles.petBreed}>{pet.breed} • {pet.species}</Text>
            <Text style={styles.petAge}>{age}</Text>
          </View>
          
          <View style={styles.petTags}>
            <View style={[styles.tag, { backgroundColor: pet.gender === 'male' ? '#3B82F6' : '#EC4899' }]}>
              <Text style={styles.tagText}>{pet.gender}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: vaccination.color }]}>
              <Text style={styles.tagText}>{vaccination.text}</Text>
            </View>
          </View>
        </View>

        {/* Basic Information */}
        {renderInfoSection('Basic Information', (
          <>
            {renderInfoItem('Species', pet.species, 'paw')}
            {renderInfoItem('Breed', pet.breed, 'information-circle')}
            {renderInfoItem('Gender', pet.gender, 'transgender')}
            {renderInfoItem('Weight', pet.weight ? `${pet.weight} kg` : null, 'scale')}
            {renderInfoItem('Birth Date', pet.birth_date ? new Date(pet.birth_date).toLocaleDateString() : null, 'calendar')}
          </>
        ))}

        {/* Description */}
        {pet.description && renderInfoSection('About ' + pet.name, (
          <Text style={styles.description}>{pet.description}</Text>
        ))}

        {/* Medical Information */}
        {(pet.medical_info || (pet.special_needs && pet.special_needs.length > 0)) && 
         renderInfoSection('Medical Information', (
          <>
            {pet.medical_info && (
              <View style={styles.medicalInfo}>
                <Text style={styles.medicalTitle}>Medical Notes</Text>
                <Text style={styles.medicalText}>{pet.medical_info}</Text>
              </View>
            )}
            
            {pet.special_needs && pet.special_needs.length > 0 && (
              <View style={styles.specialNeeds}>
                <Text style={styles.medicalTitle}>Special Needs</Text>
                {pet.special_needs.map((need, index) => (
                  <View key={index} style={styles.needItem}>
                    <Ionicons name="medical" size={16} color="#F59E0B" />
                    <Text style={styles.needText}>{need}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        ))}

        {/* Vaccination Records */}
        {pet.vaccination_records && pet.vaccination_records.length > 0 && 
         renderInfoSection('Vaccination Records', (
          <View style={styles.vaccinationRecords}>
            {pet.vaccination_records.map((record, index) => (
              <View key={index} style={styles.vaccinationItem}>
                <View style={styles.vaccinationHeader}>
                  <Text style={styles.vaccineName}>{record.vaccine}</Text>
                  <Text style={styles.vaccinationDate}>
                    {new Date(record.date).toLocaleDateString()}
                  </Text>
                </View>
                {record.veterinarian && (
                  <Text style={styles.veterinarian}>Vet: {record.veterinarian}</Text>
                )}
                {record.notes && (
                  <Text style={styles.vaccinationNotes}>{record.notes}</Text>
                )}
              </View>
            ))}
          </View>
        ))}

        {/* Behavioral Information */}
        {(pet.behavioral_notes || pet.emergency_contact) && 
         renderInfoSection('Behavioral & Emergency Information', (
          <>
            {pet.behavioral_notes && (
              <View style={styles.behavioralInfo}>
                <Text style={styles.medicalTitle}>Behavioral Notes</Text>
                <Text style={styles.medicalText}>{pet.behavioral_notes}</Text>
              </View>
            )}
            
            {pet.emergency_contact && 
             renderInfoItem('Emergency Contact', pet.emergency_contact, 'call')}
          </>
        ))}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editActionButton}
            onPress={() => navigation.navigate('AddPet', { petId: pet.id, mode: 'edit' })}
          >
            <Ionicons name="create" size={20} color="white" />
            <Text style={styles.actionButtonText}>Edit Pet</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.deleteActionButton}
            onPress={handleDelete}
          >
            <Ionicons name="trash" size={20} color="white" />
            <Text style={styles.actionButtonText}>Delete Pet</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  imageGallery: {
    height: 300,
    backgroundColor: 'white',
  },
  petImage: {
    width: width,
    height: 300,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    height: 300,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 20,
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
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeIndicator: {
    backgroundColor: 'white',
  },
  petHeader: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  petNameSection: {
    marginBottom: 16,
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
    marginBottom: 4,
  },
  petAge: {
    fontSize: 16,
    color: '#666',
  },
  petTags: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  infoSection: {
    backgroundColor: 'white',
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoIcon: {
    marginRight: 12,
    width: 20,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  medicalInfo: {
    marginBottom: 20,
  },
  medicalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  medicalText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  specialNeeds: {
    marginBottom: 20,
  },
  needItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    marginBottom: 8,
  },
  needText: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
  },
  vaccinationRecords: {
    gap: 12,
  },
  vaccinationItem: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  vaccinationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  vaccineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  vaccinationDate: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  veterinarian: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  vaccinationNotes: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  behavioralInfo: {
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  editActionButton: {
    flex: 1,
    backgroundColor: '#FF5A5F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  deleteActionButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomPadding: {
    height: 40,
  },
});

export default PetDetailsScreen;