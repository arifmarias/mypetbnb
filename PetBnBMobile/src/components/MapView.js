import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Alert,
  TouchableOpacity,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const MapView = ({ 
  services = [], 
  onServiceSelect, 
  showUserLocation = true, 
  style,
  initialRegion = null 
}) => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    if (showUserLocation) {
      getCurrentLocation();
    }
  }, [showUserLocation]);

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        Alert.alert(
          'Location Permission',
          'We need location access to show nearby pet care services.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => {
              // In a real app, you would open settings
              console.log('Open settings');
            }},
          ]
        );
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    } catch (error) {
      console.error('Error getting location:', error);
      setErrorMsg('Failed to get location');
    }
  };

  const handleServicePress = (service) => {
    setSelectedService(service);
    if (onServiceSelect) {
      onServiceSelect(service);
    }
  };

  const renderService = (service, index) => {
    const isSelected = selectedService?.id === service.id;
    
    return (
      <TouchableOpacity
        key={service.id || index}
        style={[
          styles.serviceMarker,
          isSelected && styles.serviceMarkerSelected
        ]}
        onPress={() => handleServicePress(service)}
      >
        <Ionicons 
          name="location" 
          size={24} 
          color={isSelected ? '#FF5A5F' : '#3B82F6'} 
        />
      </TouchableOpacity>
    );
  };

  if (errorMsg) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Ionicons name="location-outline" size={48} color="#999" />
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={getCurrentLocation}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Map Placeholder - In a real app, you would use react-native-maps */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapTitle}>Service Locations</Text>
        
        {/* User Location Indicator */}
        {location && showUserLocation && (
          <View style={styles.userLocation}>
            <Ionicons name="radio-button-on" size={20} color="#10B981" />
            <Text style={styles.userLocationText}>Your Location</Text>
          </View>
        )}

        {/* Service Markers */}
        <View style={styles.servicesContainer}>
          {services.map((service, index) => renderService(service, index))}
        </View>

        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => {
              Alert.alert('Map Feature', 'Zoom in functionality would be implemented here');
            }}
          >
            <Ionicons name="add" size={20} color="#333" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => {
              Alert.alert('Map Feature', 'Zoom out functionality would be implemented here');
            }}
          >
            <Ionicons name="remove" size={20} color="#333" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={getCurrentLocation}
          >
            <Ionicons name="locate" size={20} color="#FF5A5F" />
          </TouchableOpacity>
        </View>

        {/* Map Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <Ionicons name="radio-button-on" size={16} color="#10B981" />
            <Text style={styles.legendText}>Your Location</Text>
          </View>
          <View style={styles.legendItem}>
            <Ionicons name="location" size={16} color="#3B82F6" />
            <Text style={styles.legendText}>Pet Care Services</Text>
          </View>
        </View>
      </View>

      {/* Selected Service Info */}
      {selectedService && (
        <View style={styles.selectedServiceInfo}>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>
              {selectedService.service?.title || selectedService.title}
            </Text>
            <Text style={styles.caregiverName}>
              by {selectedService.caregiver?.name || selectedService.name}
            </Text>
            <Text style={styles.serviceDistance}>
              {selectedService.distance} km away
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.viewServiceButton}
            onPress={() => {
              if (onServiceSelect) {
                onServiceSelect(selectedService);
              }
            }}
          >
            <Text style={styles.viewServiceText}>View</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF5A5F',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#E8F4FD',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderRadius: 12,
    margin: 16,
    overflow: 'hidden',
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  userLocation: {
    position: 'absolute',
    top: 60,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userLocationText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 6,
    fontWeight: '500',
  },
  servicesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  serviceMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  serviceMarkerSelected: {
    backgroundColor: '#FFF5F5',
    borderWidth: 2,
    borderColor: '#FF5A5F',
  },
  mapControls: {
    position: 'absolute',
    top: 20,
    right: 20,
    gap: 8,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legend: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  selectedServiceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  caregiverName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  serviceDistance: {
    fontSize: 12,
    color: '#999',
  },
  viewServiceButton: {
    backgroundColor: '#FF5A5F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  viewServiceText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MapView;