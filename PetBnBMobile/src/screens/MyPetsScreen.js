import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useFocusEffect } from '@react-navigation/native';
import { petsAPI } from '../services/api';

const MyPetsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadPets = async () => {
    setLoading(true);
    try {
      console.log('Loading pets from API...');
      const petsData = await petsAPI.getAllPets();
      console.log('Pets loaded:', petsData.length);
      setPets(petsData);
    } catch (error) {
      console.error('Error loading pets:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else if (error.response?.status === 403) {
        toast.error('Access denied. Please check your permissions.');
      } else if (error.response?.status >= 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('Failed to load pets. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPets();
    setRefreshing(false);
  };

  const handleDeletePet = (petId, petName) => {
    Alert.alert(
      'Delete Pet',
      `Are you sure you want to remove ${petName} from your pets? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log(`Deleting pet ${petId}...`);
              await petsAPI.deletePet(petId);
              console.log('Pet deleted successfully');
              
              // Remove pet from local state
              setPets(prev => prev.filter(pet => pet.id !== petId));
              toast.success(`${petName} has been removed from your pets`);
            } catch (error) {
              console.error('Error deleting pet:', error);
              
              if (error.response?.status === 400) {
                toast.error(error.response.data.detail || 'Cannot delete pet with active bookings');
              } else if (error.response?.status === 404) {
                toast.error('Pet not found');
                // Remove from local state anyway
                setPets(prev => prev.filter(pet => pet.id !== petId));
              } else {
                toast.error('Failed to delete pet. Please try again.');
              }
            }
          },
        },
      ]
    );
  };

  const getAgeText = (age) => {
    if (!age) return 'Age unknown';
    if (age < 1) return `${Math.round(age * 12)} months`;
    return age === 1 ? '1 year' : `${age} years`;
  };

  const getPetImage = (pet) => {
    // Use the first image from the images array, or a default image
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

  const getLastCheckupDate = (pet) => {
    // Try to parse medical info for last checkup
    try {
      if (pet.medical_info && typeof pet.medical_info === 'object') {
        return pet.medical_info.last_checkup || null;
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const renderPetCard = (pet) => (
    <TouchableOpacity
      key={pet.id}
      style={styles.petCard}
      onPress={() => navigation.navigate('PetDetails', { petId: pet.id })}
    >
      <Image source={{ uri: getPetImage(pet) }} style={styles.petImage} />
      
      <View style={styles.petInfo}>
        <View style={styles.petHeader}>
          <Text style={styles.petName}>{pet.name}</Text>
          <TouchableOpacity
            onPress={() => handleDeletePet(pet.id, pet.name)}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.petBreed}>{pet.breed || `${pet.species} (Mixed breed)`}</Text>
        
        <View style={styles.petDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{getAgeText(pet.age)}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons 
              name={pet.gender === 'male' ? 'male' : pet.gender === 'female' ? 'female' : 'help'} 
              size={16} 
              color={pet.gender === 'male' ? '#3B82F6' : pet.gender === 'female' ? '#EC4899' : '#666'} 
            />
            <Text style={styles.detailText}>{pet.gender || 'Unknown'}</Text>
          </View>
          
          {pet.weight && (
            <View style={styles.detailItem}>
              <Ionicons name="fitness-outline" size={16} color="#666" />
              <Text style={styles.detailText}>{pet.weight} kg</Text>
            </View>
          )}
        </View>
        
        <View style={styles.petFooter}>
          <Text style={styles.lastCheckup}>
            {pet.updated_at ? 
              `Updated: ${new Date(pet.updated_at).toLocaleDateString()}` :
              'Recently added'
            }
          </Text>
          <View style={[styles.statusBadge, pet.is_active && styles.statusActive]}>
            <Text style={[styles.statusText, pet.is_active && styles.statusActiveText]}>
              {pet.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Reload pets when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadPets();
    }, [])
  );

  const getStats = () => {
    const activePets = pets.filter(p => p.is_active).length;
    const totalPets = pets.length;
    const needsCheckup = pets.filter(p => {
      const lastCheckup = getLastCheckupDate(p);
      if (!lastCheckup) return true; // No checkup data
      
      const checkupDate = new Date(lastCheckup);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return checkupDate < sixMonthsAgo;
    }).length;
    
    return { totalPets, activePets, needsCheckup };
  };

  const stats = getStats();

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
        <Text style={styles.headerTitle}>My Pets</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('AddPet')}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color="#FF5A5F" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalPets}</Text>
            <Text style={styles.statLabel}>Total Pets</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.activePets}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.needsCheckup}</Text>
            <Text style={styles.statLabel}>Need Checkup</Text>
          </View>
        </View>

        {/* Pets List */}
        <View style={styles.petsSection}>
          <Text style={styles.sectionTitle}>Your Pets</Text>
          
          {loading && pets.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading your pets...</Text>
            </View>
          ) : pets.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="paw-outline" size={64} color="#DDD" />
              <Text style={styles.emptyTitle}>No pets yet</Text>
              <Text style={styles.emptyMessage}>
                Add your first pet to start using PetBnB services
              </Text>
              <TouchableOpacity
                style={styles.addFirstPetButton}
                onPress={() => navigation.navigate('AddPet')}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.addFirstPetText}>Add Your First Pet</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {pets.map(renderPetCard)}
              
              {/* Add More Pets */}
              <TouchableOpacity
                style={styles.addMoreButton}
                onPress={() => navigation.navigate('AddPet')}
              >
                <Ionicons name="add-circle-outline" size={24} color="#FF5A5F" />
                <Text style={styles.addMoreText}>Add Another Pet</Text>
              </TouchableOpacity>
            </>
          )}
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
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF5A5F',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  petsSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  petCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  petImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F0F0F0',
  },
  petInfo: {
    padding: 16,
  },
  petHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  petName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  deleteButton: {
    padding: 4,
  },
  petBreed: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  petDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  petFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastCheckup: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusActiveText: {
    color: '#16A34A',
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
  addFirstPetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5A5F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  addFirstPetText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#FF5A5F',
    borderStyle: 'dashed',
    paddingVertical: 20,
    borderRadius: 16,
    marginBottom: 16,
    gap: 8,
  },
  addMoreText: {
    fontSize: 16,
    color: '#FF5A5F',
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
});

export default MyPetsScreen;