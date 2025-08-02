import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  PawPrint, 
  MapPin, 
  Star,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  CreditCard
} from 'lucide-react';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const BookingFlow = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [service, setService] = useState(null);
  const [caregiver, setCaregiver] = useState(null);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);

  const [bookingData, setBookingData] = useState({
    selectedPets: [],
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    specialRequirements: '',
    totalAmount: 0
  });

  const steps = [
    { number: 1, title: 'Select Pets', icon: PawPrint },
    { number: 2, title: 'Choose Dates', icon: Calendar },
    { number: 3, title: 'Review & Pay', icon: CreditCard }
  ];

  useEffect(() => {
    fetchBookingData();
  }, [serviceId]);

  useEffect(() => {
    calculateTotal();
  }, [bookingData.selectedPets, bookingData.startDate, bookingData.endDate]);

  const fetchBookingData = async () => {
    try {
      const [petsResponse] = await Promise.all([
        axios.get('/api/pets')
      ]);
      
      setPets(petsResponse.data || []);
      
      // Mock service and caregiver data for demo
      setService({
        id: serviceId,
        title: 'Premium Pet Boarding',
        description: 'Loving care for your pets in a safe, comfortable environment with daily updates and photos.',
        base_price: 50,
        service_type: 'pet_boarding',
        max_pets: 3,
        duration_minutes: null
      });

      setCaregiver({
        id: 'caregiver1',
        full_name: 'Sarah Johnson',
        profile_image_url: null,
        address: 'Orchard Road, Singapore',
        rating: 4.8,
        total_reviews: 127,
        experience_years: 5,
        is_background_verified: true
      });
      
    } catch (error) {
      console.error('Failed to fetch booking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!service || !bookingData.selectedPets.length || !bookingData.startDate || !bookingData.endDate) {
      return;
    }

    const startDateTime = new Date(`${bookingData.startDate}T${bookingData.startTime}`);
    const endDateTime = new Date(`${bookingData.endDate}T${bookingData.endTime}`);
    const hours = Math.ceil((endDateTime - startDateTime) / (1000 * 60 * 60));
    
    let baseAmount = service.base_price;
    
    // Calculate based on service type
    if (service.service_type === 'pet_boarding') {
      const days = Math.ceil(hours / 24);
      baseAmount = service.base_price * days;
    } else {
      baseAmount = service.base_price * hours;
    }
    
    // Additional pets pricing (50% of base price for each additional pet)
    const additionalPets = Math.max(0, bookingData.selectedPets.length - 1);
    const additionalPetsCost = additionalPets * (service.base_price * 0.5);
    
    // Platform fee (15%)
    const subtotal = baseAmount + additionalPetsCost;
    const platformFee = subtotal * 0.15;
    const total = subtotal + platformFee;
    
    setBookingData(prev => ({
      ...prev,
      totalAmount: Math.round(total * 100) / 100
    }));
  };

  const handlePetSelection = (petId) => {
    const isSelected = bookingData.selectedPets.includes(petId);
    let newSelectedPets;
    
    if (isSelected) {
      newSelectedPets = bookingData.selectedPets.filter(id => id !== petId);
    } else {
      if (bookingData.selectedPets.length >= service?.max_pets) {
        alert(`You can only select up to ${service.max_pets} pets for this service.`);
        return;
      }
      newSelectedPets = [...bookingData.selectedPets, petId];
    }
    
    setBookingData(prev => ({
      ...prev,
      selectedPets: newSelectedPets
    }));
  };

  const handleNextStep = () => {
    if (currentStep === 1 && bookingData.selectedPets.length === 0) {
      alert('Please select at least one pet.');
      return;
    }
    
    if (currentStep === 2) {
      if (!bookingData.startDate || !bookingData.startTime || !bookingData.endDate || !bookingData.endTime) {
        alert('Please fill in all date and time fields.');
        return;
      }
      
      const startDateTime = new Date(`${bookingData.startDate}T${bookingData.startTime}`);
      const endDateTime = new Date(`${bookingData.endDate}T${bookingData.endTime}`);
      
      if (startDateTime >= endDateTime) {
        alert('End date/time must be after start date/time.');
        return;
      }
      
      if (startDateTime < new Date()) {
        alert('Start date/time cannot be in the past.');
        return;
      }
    }
    
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBookingSubmit = async () => {
    setProcessingPayment(true);
    
    try {
      // Create booking
      const bookingResponse = await axios.post('/api/bookings', {
        pet_ids: bookingData.selectedPets,
        service_id: serviceId,
        start_datetime: new Date(`${bookingData.startDate}T${bookingData.startTime}`).toISOString(),
        end_datetime: new Date(`${bookingData.endDate}T${bookingData.endTime}`).toISOString(),
        total_amount: bookingData.totalAmount,
        special_requirements: bookingData.specialRequirements
      });

      const bookingId = bookingResponse.data.id;

      // Create payment intent
      const paymentResponse = await axios.post('/api/payments/create-intent', null, {
        params: { booking_id: bookingId }
      });

      const { client_secret } = paymentResponse.data;
      const stripe = await stripePromise;

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: {
            // This would be from Stripe Elements in a real implementation
            number: '4242424242424242',
            exp_month: 12,
            exp_year: 2025,
            cvc: '123'
          },
          billing_details: {
            name: user.full_name,
            email: user.email
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent.status === 'succeeded') {
        navigate('/dashboard', { 
          state: { 
            message: 'Booking confirmed! Your payment has been processed successfully.',
            type: 'success'
          }
        });
      }
      
    } catch (error) {
      console.error('Booking failed:', error);
      alert('Booking failed: ' + (error.response?.data?.detail || error.message));
    } finally {
      setProcessingPayment(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  const getServiceTypeLabel = (type) => {
    const labels = {
      'pet_boarding': 'Pet Boarding',
      'dog_walking': 'Dog Walking',
      'pet_grooming': 'Pet Grooming',
      'daycare': 'Daycare',
      'pet_sitting': 'Pet Sitting'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="card h-96 bg-gray-200"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </button>
          
          <h1 className="text-3xl font-bold text-gray-800">Book Pet Care Service</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Booking Form */}
          <div className="lg:col-span-2">
            {/* Steps Indicator */}
            <div className="card mb-8 p-6">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      currentStep >= step.number
                        ? 'bg-purple-600 border-purple-600 text-white'
                        : 'border-gray-300 text-gray-400'
                    }`}>
                      <step.icon className="h-5 w-5" />
                    </div>
                    <div className="ml-3 hidden sm:block">
                      <p className={`text-sm font-medium ${
                        currentStep >= step.number ? 'text-purple-600' : 'text-gray-500'
                      }`}>
                        Step {step.number}
                      </p>
                      <p className={`text-xs ${
                        currentStep >= step.number ? 'text-purple-600' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`hidden sm:block w-12 h-0.5 ml-4 ${
                        currentStep > step.number ? 'bg-purple-600' : 'bg-gray-300'
                      }`}></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="card">
              {/* Step 1: Select Pets */}
              {currentStep === 1 && (
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Select Your Pets</h2>
                  
                  {pets.length === 0 ? (
                    <div className="text-center py-12">
                      <PawPrint className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">No pets found</h3>
                      <p className="text-gray-600 mb-6">You need to add pets to your profile before booking.</p>
                      <button
                        onClick={() => navigate('/dashboard')}
                        className="btn btn-primary"
                      >
                        Add Pets to Profile
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-gray-600 mb-4">
                        You can select up to {service?.max_pets} pet{service?.max_pets !== 1 ? 's' : ''} for this service.
                      </p>
                      
                      {pets.map(pet => (
                        <div
                          key={pet.id}
                          onClick={() => handlePetSelection(pet.id)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            bookingData.selectedPets.includes(pet.id)
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold">
                                {pet.name.charAt(0)}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-800">{pet.name}</h3>
                                <p className="text-gray-600">{pet.breed} • {pet.age} years old</p>
                                <p className="text-sm text-gray-500">{pet.weight} kg • {pet.gender}</p>
                              </div>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              bookingData.selectedPets.includes(pet.id)
                                ? 'bg-purple-600 border-purple-600'
                                : 'border-gray-300'
                            }`}>
                              {bookingData.selectedPets.includes(pet.id) && (
                                <CheckCircle className="h-4 w-4 text-white" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Choose Dates */}
              {currentStep === 2 && (
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Choose Dates & Times</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="form-label">Start Date</label>
                      <input
                        type="date"
                        value={bookingData.startDate}
                        onChange={(e) => setBookingData(prev => ({ ...prev, startDate: e.target.value }))}
                        className="form-input"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    
                    <div>
                      <label className="form-label">Start Time</label>
                      <input
                        type="time"
                        value={bookingData.startTime}
                        onChange={(e) => setBookingData(prev => ({ ...prev, startTime: e.target.value }))}
                        className="form-input"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label">End Date</label>
                      <input
                        type="date"
                        value={bookingData.endDate}
                        onChange={(e) => setBookingData(prev => ({ ...prev, endDate: e.target.value }))}
                        className="form-input"
                        min={bookingData.startDate || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    
                    <div>
                      <label className="form-label">End Time</label>
                      <input
                        type="time"
                        value={bookingData.endTime}
                        onChange={(e) => setBookingData(prev => ({ ...prev, endTime: e.target.value }))}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="form-label">Special Requirements (Optional)</label>
                    <textarea
                      value={bookingData.specialRequirements}
                      onChange={(e) => setBookingData(prev => ({ ...prev, specialRequirements: e.target.value }))}
                      placeholder="Any special care instructions, medications, behavioral notes, etc."
                      className="form-textarea"
                      rows="4"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Review & Pay */}
              {currentStep === 3 && (
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Review & Payment</h2>
                  
                  <div className="space-y-6">
                    {/* Booking Summary */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-3">Booking Summary</h3>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Service:</span>
                          <span className="font-medium">{service?.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Dates:</span>
                          <span>{bookingData.startDate} to {bookingData.endDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Time:</span>
                          <span>{bookingData.startTime} - {bookingData.endTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pets:</span>
                          <span>{bookingData.selectedPets.length} pet{bookingData.selectedPets.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-3">Price Breakdown</h3>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Base Service Cost:</span>
                          <span>${service?.base_price}</span>
                        </div>
                        {bookingData.selectedPets.length > 1 && (
                          <div className="flex justify-between">
                            <span>Additional Pets ({bookingData.selectedPets.length - 1}):</span>
                            <span>${((bookingData.selectedPets.length - 1) * service?.base_price * 0.5).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Platform Fee (15%):</span>
                          <span>${(bookingData.totalAmount * 0.15 / 1.15).toFixed(2)}</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between font-semibold text-base">
                          <span>Total:</span>
                          <span>${bookingData.totalAmount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-3">Payment Method</h3>
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-5 w-5 text-gray-600" />
                        <span className="text-sm text-gray-600">Secure payment via Stripe</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Your payment will be securely processed. No payment information is stored on our servers.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
                <button
                  onClick={handlePreviousStep}
                  disabled={currentStep === 1}
                  className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </button>
                
                {currentStep < steps.length ? (
                  <button
                    onClick={handleNextStep}
                    className="btn btn-primary"
                    disabled={currentStep === 1 && bookingData.selectedPets.length === 0}
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </button>
                ) : (
                  <button
                    onClick={handleBookingSubmit}
                    disabled={processingPayment}
                    className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingPayment ? (
                      <>
                        <div className="spinner w-4 h-4 mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        Confirm & Pay
                        <DollarSign className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Service & Caregiver Info */}
          <div className="lg:col-span-1">
            {/* Service Info */}
            <div className="card mb-6">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Service Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium mb-2">
                      {getServiceTypeLabel(service?.service_type)}
                    </span>
                    <h4 className="font-semibold text-gray-800">{service?.title}</h4>
                    <p className="text-gray-600 text-sm mt-1">{service?.description}</p>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Price:</span>
                      <span className="font-semibold text-green-600">${service?.base_price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Pets:</span>
                      <span className="text-gray-800">{service?.max_pets}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Caregiver Info */}
            <div className="card">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Caregiver</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold">
                      {caregiver?.full_name?.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{caregiver?.full_name}</h4>
                      <div className="flex items-center space-x-1">
                        {renderStars(caregiver?.rating)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {caregiver?.address}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Experience:</span>
                      <span className="text-gray-800">{caregiver?.experience_years} years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reviews:</span>
                      <span className="text-gray-800">{caregiver?.total_reviews} reviews</span>
                    </div>
                    {caregiver?.is_background_verified && (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Background Verified
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingFlow;