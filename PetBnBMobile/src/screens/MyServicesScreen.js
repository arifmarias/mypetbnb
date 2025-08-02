import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MyServicesScreen = ({ navigation }) => {
  const [services, setServices] = useState([
    {
      id: '1',
      title: 'Premium Pet Boarding',
      description: 'Professional pet boarding with 24/7 care',
      price: 50,
      active: true,
      bookings: 12,
      rating: 4.9,
    },
    {
      id: '2',
      title: 'Dog Walking & Exercise',
      description: 'Daily walks and exercise for your dogs',
      price: 25,
      active: true,
      bookings: 18,
      rating: 4.8,
    },
    {
      id: '3',
      title: 'Pet Grooming',
      description: 'Complete grooming services for all pets',
      price: 40,
      active: false,
      bookings: 6,
      rating: 4.7,
    },
  ]);

  const handleAddService = () => {
    Alert.alert(
      'Add New Service',
      'Create a new pet care service offering.',
      [{ text: 'OK' }]
    );
  };

  const handleEditService = (service) => {
    Alert.alert(
      'Edit Service',
      `Edit ${service.title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: () => console.log('Edit service') }
      ]
    );
  };

  const toggleServiceStatus = (serviceId) => {
    setServices(prev => prev.map(service => 
      service.id === serviceId 
        ? { ...service, active: !service.active }
        : service
    ));
  };

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
        <Text style={styles.headerTitle}>My Services</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddService}
        >
          <Ionicons name="add" size={24} color="#FF5A5F" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{services.length}</Text>
            <Text style={styles.statLabel}>Total Services</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {services.filter(s => s.active).length}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {services.reduce((sum, s) => sum + s.bookings, 0)}
            </Text>
            <Text style={styles.statLabel}>Total Bookings</Text>
          </View>
        </View>

        {/* Services List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Services</Text>
          
          {services.map((service) => (
            <View key={service.id} style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceTitle}>{service.title}</Text>
                  <Text style={styles.serviceDescription}>{service.description}</Text>
                </View>
                
                <View style={styles.serviceActions}>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => handleEditService(service)}
                  >
                    <Ionicons name="create-outline" size={20} color="#666" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.toggleButton}
                    onPress={() => toggleServiceStatus(service.id)}
                  >
                    <Ionicons 
                      name={service.active ? 'eye' : 'eye-off'} 
                      size={20} 
                      color={service.active ? '#10B981' : '#999'} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.serviceDetails}>
                <View style={styles.priceContainer}>
                  <Text style={styles.price}>${service.price}</Text>
                  <Text style={styles.priceUnit}>per day</Text>
                </View>
                
                <View style={styles.serviceStats}>
                  <View style={styles.statItem}>
                    <Ionicons name="calendar" size={16} color="#666" />
                    <Text style={styles.statText}>{service.bookings} bookings</Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={styles.statText}>{service.rating}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.serviceStatus}>
                <View style={[
                  styles.statusIndicator,
                  { backgroundColor: service.active ? '#10B981' : '#999' }
                ]}>
                  <Text style={styles.statusText}>
                    {service.active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            </View>
          ))}
          
          {/* Add Service Card */}
          <TouchableOpacity 
            style={styles.addServiceCard}
            onPress={handleAddService}
          >
            <View style={styles.addIcon}>
              <Ionicons name="add" size={32} color="#FF5A5F" />
            </View>
            <Text style={styles.addServiceText}>Add New Service</Text>
            <Text style={styles.addServiceSubtext}>
              Expand your offerings to attract more clients
            </Text>
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'white',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  serviceCard: {
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    marginBottom: 16,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
    marginRight: 16,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  serviceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
  },
  toggleButton: {
    padding: 8,
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF5A5F',
  },
  priceUnit: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  serviceStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  serviceStatus: {
    alignItems: 'flex-start',
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  addServiceCard: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF5A5F',
    borderStyle: 'dashed',
  },
  addIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF5A5F20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  addServiceText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  addServiceSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default MyServicesScreen;