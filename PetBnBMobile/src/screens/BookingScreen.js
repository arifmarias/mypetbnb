import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const BookingScreen = ({ route, navigation }) => {
  const { serviceId, service } = route.params || {};
  const { user } = useAuth();
  const toast = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userPets, setUserPets] = useState([]);

  const [bookingData, setBookingData] = useState({
    selectedPets: [],
    serviceDate: null,
    serviceTime: null,
    duration: service?.duration || '',
    specialRequirements: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
    },
    paymentMethod: '',
    agreedToTerms: false,
  });

  // Mock user pets - same as in MyPetsScreen
  const mockPets = [
    {
      id: '1',
      name: 'Buddy',
      breed: 'Golden Retriever',
      age: 3,
      weight: 25,
      gender: 'Male',
      image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
    },
    {
      id: '2',
      name: 'Luna',
      breed: 'Siamese Cat',
      age: 2,
      weight: 4.5,
      gender: 'Female',
      image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
    },
    {
      id: '3',
      name: 'Charlie',
      breed: 'French Bulldog',
      age: 1,
      weight: 12,
      gender: 'Male',
      image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
    },
  ];

  // Available time slots
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  // Payment methods
  const paymentMethods = [
    { id: 'credit_card', name: 'Credit/Debit Card', icon: 'card-outline' },
    { id: 'grabpay', name: 'GrabPay', icon: 'wallet-outline' },
    { id: 'boost', name: 'Boost', icon: 'phone-portrait-outline' },
    { id: 'tng', name: 'Touch \'n Go eWallet', icon: 'phone-portrait-outline' },
  ];

  useEffect(() => {
    loadUserPets();
  }, []);

  const loadUserPets = async () => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setUserPets(mockPets);
    } catch (error) {
      console.error('Error loading pets:', error);
      toast.error('Failed to load pets');
    }
  };

  const handlePetSelection = (petId) => {
    setBookingData(prev => ({
      ...prev,
      selectedPets: prev.selectedPets.includes(petId)
        ? prev.selectedPets.filter(id => id !== petId)
        : [...prev.selectedPets, petId]
    }));
  };

  const handleDateSelection = (date) => {
    setBookingData(prev => ({ ...prev, serviceDate: date }));
  };

  const handleTimeSelection = (time) => {
    setBookingData(prev => ({ ...prev, serviceTime: time }));
  };

  const calculateTotal = () => {
    let basePrice = service?.price || 0;
    let total = basePrice;
    
    // Additional pet charges (50% for each additional pet)
    if (bookingData.selectedPets.length > 1) {
      total += basePrice * 0.5 * (bookingData.selectedPets.length - 1);
    }
    
    // Platform fee (10%)
    const platformFee = total * 0.1;
    
    return {
      basePrice,
      additionalPetFee: bookingData.selectedPets.length > 1 ? basePrice * 0.5 * (bookingData.selectedPets.length - 1) : 0,
      platformFee,
      total: total + platformFee
    };
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (bookingData.selectedPets.length === 0) {
          toast.error('Please select at least one pet');
          return false;
        }
        return true;
      case 2:
        if (!bookingData.serviceDate || !bookingData.serviceTime) {
          toast.error('Please select date and time');
          return false;
        }
        return true;
      case 3:
        if (!bookingData.emergencyContact.name || !bookingData.emergencyContact.phone) {
          toast.error('Please provide emergency contact information');
          return false;
        }
        return true;
      case 4:
        if (!bookingData.paymentMethod) {
          toast.error('Please select a payment method');
          return false;
        }
        if (!bookingData.agreedToTerms) {
          toast.error('Please agree to terms and conditions');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBookingSubmit = async () => {
    if (!validateStep(4)) return;

    setLoading(true);
    try {
      // Mock API call for booking creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const bookingId = 'BK' + Date.now();
      
      setCurrentStep(5); // Move to success step
      
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getNextAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4, 5].map((step) => (
        <View key={step} style={styles.stepContainer}>
          <View style={[
            styles.stepCircle,
            currentStep >= step && styles.stepCircleActive,
            currentStep > step && styles.stepCircleCompleted
          ]}>
            {currentStep > step ? (
              <Ionicons name="checkmark" size={16} color="white" />
            ) : (
              <Text style={[
                styles.stepNumber,
                currentStep >= step && styles.stepNumberActive
              ]}>
                {step}
              </Text>
            )}
          </View>
          {step < 5 && (
            <View style={[
              styles.stepLine,
              currentStep > step && styles.stepLineCompleted
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select Your Pets</Text>
      <Text style={styles.stepDescription}>
        Choose which pets need this service
      </Text>

      {userPets.length === 0 ? (
        <View style={styles.noPetsContainer}>
          <Ionicons name="paw-outline" size={64} color="#DDD" />
          <Text style={styles.noPetsTitle}>No pets found</Text>
          <Text style={styles.noPetsMessage}>
            Please add your pets first before booking services
          </Text>
          <TouchableOpacity
            style={styles.addPetButton}
            onPress={() => navigation.navigate('AddPet')}
          >
            <Text style={styles.addPetButtonText}>Add Pet</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.petsContainer} showsVerticalScrollIndicator={false}>
          {userPets.map((pet) => (
            <TouchableOpacity
              key={pet.id}
              style={[
                styles.petCard,
                bookingData.selectedPets.includes(pet.id) && styles.petCardSelected
              ]}
              onPress={() => handlePetSelection(pet.id)}
            >
              <Image source={{ uri: pet.image }} style={styles.petImage} />
              <View style={styles.petInfo}>
                <Text style={styles.petName}>{pet.name}</Text>
                <Text style={styles.petDetails}>
                  {pet.breed} • {pet.age} years • {pet.weight} kg
                </Text>
              </View>
              <View style={[
                styles.checkbox,
                bookingData.selectedPets.includes(pet.id) && styles.checkboxSelected
              ]}>
                {bookingData.selectedPets.includes(pet.id) && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {bookingData.selectedPets.length > 1 && (
        <View style={styles.additionalPetNotice}>
          <Ionicons name="information-circle" size={20} color="#F59E0B" />
          <Text style={styles.additionalPetText}>
            Additional pets: +50% charge per pet
          </Text>
        </View>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select Date & Time</Text>
      <Text style={styles.stepDescription}>
        Choose when you need the service
      </Text>

      {/* Date Selection */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionLabel}>Select Date</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.dateScroller}
        >
          {getNextAvailableDates().map((date, index) => {
            const isSelected = bookingData.serviceDate?.toDateString() === date.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dateCard,
                  isSelected && styles.dateCardSelected
                ]}
                onPress={() => handleDateSelection(date)}
              >
                <Text style={[
                  styles.dayName,
                  isSelected && styles.dayNameSelected
                ]}>
                  {isToday ? 'Today' : date.toLocaleDateString('en', { weekday: 'short' })}
                </Text>
                <Text style={[
                  styles.dateNumber,
                  isSelected && styles.dateNumberSelected
                ]}>
                  {date.getDate()}
                </Text>
                <Text style={[
                  styles.monthName,
                  isSelected && styles.monthNameSelected
                ]}>
                  {date.toLocaleDateString('en', { month: 'short' })}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Time Selection */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionLabel}>Select Time</Text>
        <View style={styles.timeGrid}>
          {timeSlots.map((time) => {
            const isSelected = bookingData.serviceTime === time;
            
            return (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeSlot,
                  isSelected && styles.timeSlotSelected
                ]}
                onPress={() => handleTimeSelection(time)}
              >
                <Text style={[
                  styles.timeText,
                  isSelected && styles.timeTextSelected
                ]}>
                  {time}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Duration Info */}
      <View style={styles.durationInfo}>
        <Ionicons name="time-outline" size={20} color="#666" />
        <Text style={styles.durationText}>
          Service Duration: {service?.duration || 'Not specified'}
        </Text>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Additional Information</Text>
      <Text style={styles.stepDescription}>
        Help us provide the best care for your pets
      </Text>

      {/* Special Requirements */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Special Requirements or Instructions</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Any special care instructions, feeding requirements, medications, behavioral notes, etc."
          value={bookingData.specialRequirements}
          onChangeText={(text) => setBookingData(prev => ({ ...prev, specialRequirements: text }))}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>

      {/* Emergency Contact */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Emergency Contact Information</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.fieldLabel}>Contact Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Emergency contact name"
            value={bookingData.emergencyContact.name}
            onChangeText={(text) => setBookingData(prev => ({
              ...prev,
              emergencyContact: { ...prev.emergencyContact, name: text }
            }))}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.fieldLabel}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="+60 12 345 6789"
            value={bookingData.emergencyContact.phone}
            onChangeText={(text) => setBookingData(prev => ({
              ...prev,
              emergencyContact: { ...prev.emergencyContact, phone: text }
            }))}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.fieldLabel}>Relationship</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Spouse, Parent, Friend"
            value={bookingData.emergencyContact.relationship}
            onChangeText={(text) => setBookingData(prev => ({
              ...prev,
              emergencyContact: { ...prev.emergencyContact, relationship: text }
            }))}
          />
        </View>
      </View>
    </View>
  );

  const renderStep4 = () => {
    const pricing = calculateTotal();
    
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Payment & Confirmation</Text>
        <Text style={styles.stepDescription}>
          Review your booking and select payment method
        </Text>

        {/* Booking Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Service:</Text>
            <Text style={styles.summaryValue}>{service?.title}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Caregiver:</Text>
            <Text style={styles.summaryValue}>{service?.caregiver?.name}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Date & Time:</Text>
            <Text style={styles.summaryValue}>
              {bookingData.serviceDate?.toLocaleDateString()} at {bookingData.serviceTime}
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Pets:</Text>
            <Text style={styles.summaryValue}>
              {bookingData.selectedPets.map(petId => {
                const pet = userPets.find(p => p.id === petId);
                return pet?.name;
              }).join(', ')}
            </Text>
          </View>
        </View>

        {/* Price Breakdown */}
        <View style={styles.pricingSection}>
          <Text style={styles.summaryTitle}>Price Breakdown</Text>
          
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Base Service Fee</Text>
            <Text style={styles.priceValue}>{service?.currency} {pricing.basePrice}</Text>
          </View>
          
          {pricing.additionalPetFee > 0 && (
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Additional Pets ({bookingData.selectedPets.length - 1})</Text>
              <Text style={styles.priceValue}>{service?.currency} {pricing.additionalPetFee}</Text>
            </View>
          )}
          
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Platform Fee (10%)</Text>
            <Text style={styles.priceValue}>{service?.currency} {pricing.platformFee.toFixed(2)}</Text>
          </View>
          
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{service?.currency} {pricing.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.paymentSection}>
          <Text style={styles.summaryTitle}>Payment Method</Text>
          
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentMethod,
                bookingData.paymentMethod === method.id && styles.paymentMethodSelected
              ]}
              onPress={() => setBookingData(prev => ({ ...prev, paymentMethod: method.id }))}
            >
              <Ionicons name={method.icon} size={24} color="#666" />
              <Text style={styles.paymentMethodText}>{method.name}</Text>
              <View style={[
                styles.radio,
                bookingData.paymentMethod === method.id && styles.radioSelected
              ]}>
                {bookingData.paymentMethod === method.id && (
                  <View style={styles.radioDot} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Terms and Conditions */}
        <TouchableOpacity
          style={styles.termsContainer}
          onPress={() => setBookingData(prev => ({ ...prev, agreedToTerms: !prev.agreedToTerms }))}
        >
          <View style={[
            styles.checkbox,
            bookingData.agreedToTerms && styles.checkboxSelected
          ]}>
            {bookingData.agreedToTerms && (
              <Ionicons name="checkmark" size={16} color="white" />
            )}
          </View>
          <Text style={styles.termsText}>
            I agree to the{' '}
            <Text style={styles.termsLink}>Terms and Conditions</Text>
            {' '}and{' '}
            <Text style={styles.termsLink}>Cancellation Policy</Text>
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderStep5 = () => (
    <View style={styles.stepContent}>
      <View style={styles.successContainer}>
        <Ionicons name="checkmark-circle" size={80} color="#10B981" />
        <Text style={styles.successTitle}>Booking Submitted!</Text>
        <Text style={styles.successMessage}>
          Your booking request has been sent to the caregiver. You'll receive a confirmation once it's approved.
        </Text>
        
        <View style={styles.nextStepsContainer}>
          <Text style={styles.nextStepsTitle}>What happens next?</Text>
          <View style={styles.nextStep}>
            <Ionicons name="mail-outline" size={20} color="#666" />
            <Text style={styles.nextStepText}>You'll receive a confirmation email</Text>
          </View>
          <View style={styles.nextStep}>
            <Ionicons name="chatbubble-outline" size={20} color="#666" />
            <Text style={styles.nextStepText}>Caregiver will review and respond within 24 hours</Text>
          </View>
          <View style={styles.nextStep}>
            <Ionicons name="notifications-outline" size={20} color="#666" />
            <Text style={styles.nextStepText}>You'll get push notifications for updates</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Dashboard' })}
        >
          <Text style={styles.doneButtonText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return renderStep1();
    }
  };

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
        <Text style={styles.headerTitle}>Book Service</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Step Indicator */}
      {currentStep < 5 && renderStepIndicator()}

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentStep()}
      </ScrollView>

      {/* Bottom Navigation */}
      {currentStep < 5 && (
        <View style={styles.bottomNavigation}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={styles.previousButton}
              onPress={handlePrevious}
            >
              <Text style={styles.previousButtonText}>Previous</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[
              styles.nextButton,
              currentStep === 1 && styles.nextButtonFull,
              loading && styles.nextButtonDisabled
            ]}
            onPress={currentStep === 4 ? handleBookingSubmit : handleNext}
            disabled={loading}
          >
            <Text style={styles.nextButtonText}>
              {loading ? 'Processing...' : currentStep === 4 ? 'Confirm Booking' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
  placeholder: {
    width: 40,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#FF5A5F',
  },
  stepCircleCompleted: {
    backgroundColor: '#10B981',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  stepNumberActive: {
    color: 'white',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 8,
  },
  stepLineCompleted: {
    backgroundColor: '#10B981',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  noPetsContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noPetsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  noPetsMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  addPetButton: {
    backgroundColor: '#FF5A5F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  addPetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  petsContainer: {
    maxHeight: 400,
  },
  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  petCardSelected: {
    borderColor: '#FF5A5F',
    backgroundColor: '#FF5A5F10',
  },
  petImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  petDetails: {
    fontSize: 14,
    color: '#666',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#FF5A5F',
    borderColor: '#FF5A5F',
  },
  additionalPetNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  additionalPetText: {
    fontSize: 14,
    color: '#92400E',
    flex: 1,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  dateScroller: {
    flexDirection: 'row',
  },
  dateCard: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 80,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dateCardSelected: {
    borderColor: '#FF5A5F',
    backgroundColor: '#FF5A5F10',
  },
  dayName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dayNameSelected: {
    color: '#FF5A5F',
    fontWeight: '600',
  },
  dateNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  dateNumberSelected: {
    color: '#FF5A5F',
  },
  monthName: {
    fontSize: 12,
    color: '#666',
  },
  monthNameSelected: {
    color: '#FF5A5F',
    fontWeight: '600',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlot: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  timeSlotSelected: {
    borderColor: '#FF5A5F',
    backgroundColor: '#FF5A5F',
  },
  timeText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  timeTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  durationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  durationText: {
    fontSize: 16,
    color: '#666',
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  textArea: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  inputContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  summarySection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  pricingSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  priceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
  },
  priceValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  totalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  totalLabel: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    color: '#FF5A5F',
    fontWeight: 'bold',
  },
  paymentSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentMethodSelected: {
    borderColor: '#FF5A5F',
    backgroundColor: '#FF5A5F10',
  },
  paymentMethodText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    marginLeft: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#DDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#FF5A5F',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF5A5F',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    gap: 12,
  },
  termsText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  termsLink: {
    color: '#FF5A5F',
    fontWeight: '500',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 16,
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  nextStepsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  nextStepsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  nextStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  nextStepText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  doneButton: {
    backgroundColor: '#FF5A5F',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: '#FF5A5F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  doneButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  previousButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 25,
    flex: 1,
    marginRight: 12,
  },
  previousButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  nextButton: {
    backgroundColor: '#FF5A5F',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 25,
    flex: 1,
    marginLeft: 12,
    shadowColor: '#FF5A5F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextButtonFull: {
    marginLeft: 0,
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default BookingScreen;