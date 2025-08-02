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
import { bookingsAPI } from '../services/api';

const BookingScreen = ({ route, navigation }) => {
  const { service } = route.params || {};
  const { user } = useAuth();
  const toast = useToast();
  
  const [selectedPets, setSelectedPets] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Mock user pets - in real app, fetch from API
  const [userPets, setUserPets] = useState([
    {
      id: '1',
      name: 'Buddy',
      breed: 'Golden Retriever',
      age: 3,
      image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
    },
    {
      id: '2',
      name: 'Luna',
      breed: 'Persian Cat',
      age: 2,
      image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
    },
  ]);
  
  const availableDates = [
    { date: '2024-12-29', day: 'Fri', available: true },
    { date: '2024-12-30', day: 'Sat', available: true },
    { date: '2024-12-31', day: 'Sun', available: false },
    { date: '2025-01-01', day: 'Mon', available: true },
    { date: '2025-01-02', day: 'Tue', available: true },
  ];
  
  const availableTimes = [
    '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
  ];

  const togglePetSelection = (petId) => {
    setSelectedPets(prev => 
      prev.includes(petId) 
        ? prev.filter(id => id !== petId)
        : [...prev, petId]
    );
  };

  const calculateTotal = () => {
    if (!service || selectedPets.length === 0) return 0;
    const basePrice = service.service?.price || 50;
    const petMultiplier = selectedPets.length;
    const subtotal = basePrice * petMultiplier;
    const serviceFee = subtotal * 0.1; // 10% service fee
    return subtotal + serviceFee;
  };

  const handleBooking = async () => {
    if (selectedPets.length === 0) {
      toast.error('Please select at least one pet');
      return;
    }
    
    if (!selectedDate || !selectedTime) {
      toast.error('Please select date and time');
      return;
    }

    setLoading(true);
    
    try {
      const bookingData = {
        service_id: service?.id,
        caregiver_id: service?.caregiver?.id,
        pet_ids: selectedPets,
        booking_date: selectedDate,
        booking_time: selectedTime,
        special_requirements: specialRequirements,
        total_amount: calculateTotal(),
        status: 'pending'
      };

      // In real app, make API call
      // const response = await bookingsAPI.createBooking(bookingData);
      
      // Mock success
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Booking request sent successfully!');
      navigation.navigate('Dashboard');
      
    } catch (error) {
      console.error('Booking failed:', error);
      toast.error('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (!service) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Service not found</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
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
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Service</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Service Info */}
        <View style={styles.serviceInfo}>
          <Image 
            source={{ uri: service.caregiver?.image }} 
            style={styles.caregiverImage} 
          />
          <View style={styles.serviceDetails}>
            <Text style={styles.serviceTitle}>{service.service?.title}</Text>
            <Text style={styles.caregiverName}>by {service.caregiver?.name}</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>${service.service?.price}</Text>
              <Text style={styles.priceUnit}>/day</Text>
            </View>
          </View>
        </View>

        {/* Select Pets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Pets</Text>
          <View style={styles.petsContainer}>
            {userPets.map((pet) => (
              <TouchableOpacity 
                key={pet.id}
                style={[
                  styles.petCard, 
                  selectedPets.includes(pet.id) && styles.petCardSelected
                ]}
                onPress={() => togglePetSelection(pet.id)}
              >
                <Image source={{ uri: pet.image }} style={styles.petImage} />
                <View style={styles.petInfo}>
                  <Text style={styles.petName}>{pet.name}</Text>
                  <Text style={styles.petBreed}>{pet.breed}, {pet.age} years</Text>
                </View>
                <View style={[
                  styles.checkbox,
                  selectedPets.includes(pet.id) && styles.checkboxSelected
                ]}>
                  {selectedPets.includes(pet.id) && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Select Date */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.datesContainer}>
              {availableDates.map((dateItem) => (
                <TouchableOpacity 
                  key={dateItem.date}
                  style={[
                    styles.dateCard,
                    !dateItem.available && styles.dateCardDisabled,
                    selectedDate === dateItem.date && styles.dateCardSelected
                  ]}
                  onPress={() => dateItem.available && setSelectedDate(dateItem.date)}
                  disabled={!dateItem.available}
                >
                  <Text style={[
                    styles.dateDay,
                    !dateItem.available && styles.dateTextDisabled,
                    selectedDate === dateItem.date && styles.dateTextSelected
                  ]}>
                    {dateItem.day}
                  </Text>
                  <Text style={[
                    styles.dateNumber,
                    !dateItem.available && styles.dateTextDisabled,
                    selectedDate === dateItem.date && styles.dateTextSelected
                  ]}>
                    {new Date(dateItem.date).getDate()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Select Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time</Text>
          <View style={styles.timesContainer}>
            {availableTimes.map((time) => (
              <TouchableOpacity 
                key={time}
                style={[
                  styles.timeCard,
                  selectedTime === time && styles.timeCardSelected
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Text style={[
                  styles.timeText,
                  selectedTime === time && styles.timeTextSelected
                ]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Special Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Requirements</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Any special instructions for your pet..."
            value={specialRequirements}
            onChangeText={setSpecialRequirements}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Booking Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Booking Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service</Text>
            <Text style={styles.summaryValue}>{service.service?.title}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pets</Text>
            <Text style={styles.summaryValue}>
              {selectedPets.length} pet{selectedPets.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date & Time</Text>
            <Text style={styles.summaryValue}>
              {selectedDate ? formatDate(selectedDate) : 'Not selected'} {selectedTime || ''}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>${calculateTotal().toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Book Button */}
      <View style={styles.bookingButton}>
        <TouchableOpacity 
          style={[
            styles.bookButton,
            (!selectedDate || !selectedTime || selectedPets.length === 0 || loading) && styles.bookButtonDisabled
          ]}
          onPress={handleBooking}
          disabled={!selectedDate || !selectedTime || selectedPets.length === 0 || loading}
        >
          <Text style={styles.bookButtonText}>
            {loading ? 'Booking...' : `Book for $${calculateTotal().toFixed(2)}`}
          </Text>
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
  headerBackButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  serviceInfo: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
  },
  caregiverImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  serviceDetails: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  caregiverName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
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
  section: {
    backgroundColor: 'white',
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  petsContainer: {
    gap: 12,
  },
  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    backgroundColor: '#F9F9F9',
  },
  petCardSelected: {
    borderColor: '#FF5A5F',
    backgroundColor: '#FFF5F5',
  },
  petImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  petBreed: {
    fontSize: 14,
    color: '#666',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#FF5A5F',
    borderColor: '#FF5A5F',
  },
  datesContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 20,
  },
  dateCard: {
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    backgroundColor: '#F9F9F9',
    minWidth: 70,
  },
  dateCardSelected: {
    borderColor: '#FF5A5F',
    backgroundColor: '#FF5A5F',
  },
  dateCardDisabled: {
    opacity: 0.5,
  },
  dateDay: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dateNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  dateTextSelected: {
    color: 'white',
  },
  dateTextDisabled: {
    color: '#999',
  },
  timesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderRadius: 20,
    backgroundColor: '#F9F9F9',
  },
  timeCardSelected: {
    borderColor: '#FF5A5F',
    backgroundColor: '#FF5A5F',
  },
  timeText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  timeTextSelected: {
    color: 'white',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#F9F9F9',
    minHeight: 100,
  },
  summarySection: {
    backgroundColor: 'white',
    marginBottom: 100,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    marginTop: 12,
    paddingTop: 16,
  },
  summaryTotalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF5A5F',
  },
  bookingButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  bookButton: {
    backgroundColor: '#FF5A5F',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    opacity: 0.5,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#FF5A5F',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default BookingScreen;