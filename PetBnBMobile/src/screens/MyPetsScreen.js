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

const MyPetsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - replace with actual API call
  const mockPets = [
    {
      id: '1',
      name: 'Buddy',
      breed: 'Golden Retriever',
      age: 3,
      weight: 25,
      gender: 'Male',
      color: 'Golden',
      image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      lastCheckup: '2024-01-15',
      isActive: true,
    },
    {
      id: '2',
      name: 'Luna',
      breed: 'Siamese Cat',
      age: 2,
      weight: 4.5,
      gender: 'Female',
      color: 'Cream/Brown',
      image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      lastCheckup: '2024-02-20',
      isActive: true,
    },
    {
      id: '3',
      name: 'Charlie',
      breed: 'French Bulldog',
      age: 1,
      weight: 12,
      gender: 'Male',
      color: 'Brindle',
      image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      lastCheckup: '2024-03-10',
      isActive: true,
    },
  ];

  const loadPets = async () => {
    setLoading(true);
    try {
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPets(mockPets);
    } catch (error) {
      console.error('Error loading pets:', error);
      toast.error('Failed to load pets');
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
              // Mock delete - replace with actual API call
              setPets(prev => prev.filter(pet => pet.id !== petId));
              toast.success(`${petName} has been removed from your pets`);
            } catch (error) {
              console.error('Error deleting pet:', error);
              toast.error('Failed to delete pet');
            }
          },
        },
      ]
    );
  };

  const getAgeText = (age) => {
    if (age < 1) return `${Math.round(age * 12)} months`;
    return age === 1 ? '1 year' : `${age} years`;
  };

  const renderPetCard = (pet) => (
    <TouchableOpacity
      key={pet.id}
      style={styles.petCard}
      onPress={() => navigation.navigate('PetDetails', { petId: pet.id })}
    >
      <Image source={{ uri: pet.image }} style={styles.petImage} />
      
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
        
        <Text style={styles.petBreed}>{pet.breed}</Text>
        
        <View style={styles.petDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{getAgeText(pet.age)} old</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons 
              name={pet.gender === 'Male' ? 'male' : 'female'} 
              size={16} 
              color={pet.gender === 'Male' ? '#3B82F6' : '#EC4899'} 
            />
            <Text style={styles.detailText}>{pet.gender}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="fitness-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{pet.weight} kg</Text>
          </View>
        </View>
        
        <View style={styles.petFooter}>
          <Text style={styles.lastCheckup}>
            Last checkup: {new Date(pet.lastCheckup).toLocaleDateString()}
          </Text>
          <View style={[styles.statusBadge, pet.isActive && styles.statusActive]}>
            <Text style={[styles.statusText, pet.isActive && styles.statusActiveText]}>
              {pet.isActive ? 'Active' : 'Inactive'}
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
            <Text style={styles.statNumber}>{pets.length}</Text>
            <Text style={styles.statLabel}>Total Pets</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{pets.filter(p => p.isActive).length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {pets.filter(p => {
                const lastCheckup = new Date(p.lastCheckup);
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                return lastCheckup < sixMonthsAgo;
              }).length}
            </Text>
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
  },
  petDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
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