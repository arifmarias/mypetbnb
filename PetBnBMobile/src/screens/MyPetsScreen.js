import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useFocusEffect } from '@react-navigation/native';
import { petsAPI } from '../services/api';

const MyPetsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pets, setPets] = useState([]);
  const [error, setError] = useState(null);

  // Load pets data
  const loadPets = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      console.log('Loading pets for user:', user?.id);
      const response = await petsAPI.getPets();
      const petsData = response.data || [];
      
      console.log('Pets loaded:', petsData);
      setPets(petsData);
    } catch (err) {
      console.error('Load pets error:', err);
      setError('Failed to load pets');
      toast.error('Failed to load pets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (user?.id) {
      loadPets();
    }
  }, [user?.id]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user?.id && !loading) {
        loadPets();
      }
    }, [user?.id])
  );

  // Pull to refresh
  const onRefresh = useCallback(() => {
    loadPets(true);
  }, []);

  // Handle pet deletion
  const handleDeletePet = (petId, petName) => {
    Alert.alert(
      'Delete Pet',
      `Are you sure you want to delete ${petName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await petsAPI.deletePet(petId);
              toast.success('Pet deleted successfully');
              loadPets();
            } catch (error) {
              console.error('Delete pet error:', error);
              toast.error('Failed to delete pet');
            }
          },
        },
      ]
    );
  };

  // Calculate pet age
  const calculateAge = (birthDate) => {
    if (!birthDate) return 'Unknown';
    
    const birth = new Date(birthDate);
    const today = new Date();
    const diffTime = Math.abs(today - birth);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return months > 0 ? `${months} months` : 'Less than 1 month';
    } else {
      const years = Math.floor(diffDays / 365);
      const months = Math.floor((diffDays % 365) / 30);
      return months > 0 ? `${years} years, ${months} months` : `${years} years`;
    }
  };

  // Get vaccination status
  const getVaccinationStatus = (pet) => {
    if (!pet.vaccination_records || pet.vaccination_records.length === 0) {
      return { status: 'incomplete', text: 'No records', color: '#F59E0B' };
    }
    
    // Check if basic vaccines are up to date (simplified logic)
    const hasRecentVaccination = pet.vaccination_records.some(record => {
      const vaccinationDate = new Date(record.date);
      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - 12); // 1 year ago
      return vaccinationDate >= monthsAgo;
    });
    
    return hasRecentVaccination 
      ? { status: 'complete', text: 'Up to date', color: '#10B981' }
      : { status: 'incomplete', text: 'Needs update', color: '#F59E0B' };
  };

  const renderPetCard = (pet) => {
    const vaccination = getVaccinationStatus(pet);
    const age = calculateAge(pet.birth_date);
    
    return (
      <TouchableOpacity
        key={pet.id}
        style={styles.petCard}
        onPress={() => navigation.navigate('PetDetails', { petId: pet.id })}
      >
        <View style={styles.petImageContainer}>
          {pet.images && pet.images.length > 0 ? (
            <Image source={{ uri: pet.images[0] }} style={styles.petImage} />
          ) : (
            <View style={styles.petImagePlaceholder}>
              <Ionicons name="paw" size={40} color="#CCC" />
            </View>
          )}
          
          {/* Edit button */}
          <TouchableOpacity
            style={styles.editPetButton}
            onPress={() => navigation.navigate('AddPet', { petId: pet.id, mode: 'edit' })}
          >
            <Ionicons name="create" size={16} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.petInfo}>
          <View style={styles.petHeader}>
            <Text style={styles.petName}>{pet.name}</Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeletePet(pet.id, pet.name)}
            >
              <Ionicons name="trash-outline" size={20} color="#FF5A5F" />
            </TouchableOpacity>
          </View>

          <Text style={styles.petBreed}>{pet.breed} • {pet.species}</Text>
          <Text style={styles.petAge}>Age: {age}</Text>
          
          {pet.weight && (
            <Text style={styles.petWeight}>Weight: {pet.weight} kg</Text>
          )}

          <View style={styles.petTags}>
            <View style={[styles.tag, { backgroundColor: pet.gender === 'male' ? '#3B82F6' : '#EC4899' }]}>
              <Text style={styles.tagText}>{pet.gender}</Text>
            </View>
            
            <View style={[styles.tag, { backgroundColor: vaccination.color }]}>
              <Text style={styles.tagText}>{vaccination.text}</Text>
            </View>
          </View>

          {pet.special_needs && pet.special_needs.length > 0 && (
            <View style={styles.specialNeeds}>
              <Ionicons name="medical" size={16} color="#F59E0B" />
              <Text style={styles.specialNeedsText}>Special needs</Text>
            </View>
          )}

          {pet.description && (
            <Text style={styles.petDescription} numberOfLines={2}>
              {pet.description}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Pets</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5A5F" />
          <Text style={styles.loadingText}>Loading your pets...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Pets</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddPet', { mode: 'add' })}
        >
          <Ionicons name="add" size={24} color="#FF5A5F" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF5A5F']}
            tintColor="#FF5A5F"
          />
        }
      >
        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color="#FF5A5F" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadPets()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Pets List */}
        {pets.length > 0 ? (
          <View style={styles.petsContainer}>
            {pets.map(renderPetCard)}
          </View>
        ) : !error && (
          /* Empty State */
          <View style={styles.emptyState}>
            <Ionicons name="paw" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>No pets yet</Text>
            <Text style={styles.emptyText}>
              Add your first pet to start booking care services
            </Text>
            <TouchableOpacity
              style={styles.addFirstPetButton}
              onPress={() => navigation.navigate('AddPet', { mode: 'add' })}
            >
              <Text style={styles.addFirstPetButtonText}>Add Your First Pet</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Pet Care Tips */}
        {pets.length > 0 && (
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>Pet Care Tips</Text>
            <View style={styles.tipCard}>
              <Ionicons name="medical" size={20} color="#10B981" />
              <Text style={styles.tipText}>
                Keep vaccination records up to date for the best care service experience
              </Text>
            </View>
            <View style={styles.tipCard}>
              <Ionicons name="camera" size={20} color="#3B82F6" />
              <Text style={styles.tipText}>
                Add photos to help caregivers recognize your pet easily
              </Text>
            </View>
          </View>
        )}

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
  headerRight: {
    width: 40,
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#FFF5F5',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  errorText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#C53030',
  },
  retryButton: {
    backgroundColor: '#FF5A5F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  petsContainer: {
    padding: 20,
  },
  petCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  petImageContainer: {
    position: 'relative',
    height: 200,
  },
  petImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  petImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editPetButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petInfo: {
    padding: 16,
  },
  petHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  petName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  petBreed: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  petAge: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  petWeight: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  petTags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  specialNeeds: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  specialNeedsText: {
    fontSize: 14,
    color: '#F59E0B',
    marginLeft: 6,
    fontWeight: '500',
  },
  petDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  addFirstPetButton: {
    backgroundColor: '#FF5A5F',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  addFirstPetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsContainer: {
    margin: 20,
    marginTop: 0,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  tipCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 40,
  },
});

export default MyPetsScreen;