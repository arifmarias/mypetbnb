import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Google Maps integration removed for now - to be implemented later
import { 
  Search, 
  MapPin, 
  Filter, 
  Star, 
  Heart, 
  Clock, 
  Users, 
  DollarSign, 
  MessageSquare,
  Grid,
  Map as MapIcon,
  ArrowRight,
  Award,
  Shield
} from 'lucide-react';
import axios from 'axios';

const SearchResults = () => {
  const navigate = useNavigate();
  const { user, openAuth } = useAuth();
  const [searchParams] = useSearchParams();
  
  const [caregivers, setCaregivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'map'
  const [filters, setFilters] = useState({
    location: searchParams.get('location') || '',
    serviceType: '',
    minRating: '',
    maxPrice: '',
    radius: 10
  });
  const [selectedCaregiver, setSelectedCaregiver] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const mapContainerStyle = {
    width: '100%',
    height: '600px'
  };

  const center = {
    lat: 1.3521, // Singapore default
    lng: 103.8198
  };

  useEffect(() => {
    if (filters.location) {
      searchCaregivers();
    }
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const searchCaregivers = async () => {
    if (!filters.location) return;
    
    setLoading(true);
    try {
      // For demo purposes, using Singapore coordinates
      // In production, you'd geocode the location first
      const searchParams = {
        latitude: userLocation?.lat || 1.3521,
        longitude: userLocation?.lng || 103.8198,
        radius: filters.radius,
        service_type: filters.serviceType || undefined,
        min_rating: filters.minRating || undefined,
        max_price: filters.maxPrice || undefined
      };

      const response = await axios.post('/api/search/location', searchParams);
      setCaregivers(response.data || []);
    } catch (error) {
      console.error('Search failed:', error);
      // Demo data for display
      setCaregivers([
        {
          caregiver: {
            id: '1',
            full_name: 'Sarah Johnson',
            profile_image_url: null,
            address: 'Orchard Road, Singapore',
            latitude: 1.3048,
            longitude: 103.8318
          },
          service: {
            id: 's1',
            title: 'Premium Pet Boarding',
            service_type: 'pet_boarding',
            description: 'Loving care for your pets in a safe, comfortable environment',
            base_price: 50,
            max_pets: 3
          },
          profile: {
            rating: 4.8,
            total_reviews: 127,
            experience_years: 5,
            is_background_verified: true
          },
          distance: 2.5
        },
        {
          caregiver: {
            id: '2',
            full_name: 'Michael Chen',
            profile_image_url: null,
            address: 'Marina Bay, Singapore',
            latitude: 1.2830,
            longitude: 103.8607
          },
          service: {
            id: 's2',
            title: 'Dog Walking & Exercise',
            service_type: 'dog_walking',
            description: 'Daily walks and exercise for active dogs',
            base_price: 25,
            max_pets: 2
          },
          profile: {
            rating: 4.9,
            total_reviews: 89,
            experience_years: 3,
            is_background_verified: true
          },
          distance: 1.8
        },
        {
          caregiver: {
            id: '3',
            full_name: 'Lisa Wong',
            profile_image_url: null,
            address: 'Sentosa Island, Singapore',
            latitude: 1.2494,
            longitude: 103.8303
          },
          service: {
            id: 's3',
            title: 'Pet Grooming Services',
            service_type: 'pet_grooming',
            description: 'Professional grooming and spa treatments',
            base_price: 80,
            max_pets: 1
          },
          profile: {
            rating: 4.7,
            total_reviews: 156,
            experience_years: 7,
            is_background_verified: true
          },
          distance: 3.2
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleBookNow = (service) => {
    if (!user) {
      openAuth('login');
      return;
    }
    navigate(`/booking/${service.id}`);
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
      'pet_sitting': 'Pet Sitting',
      'vet_transport': 'Vet Transport',
      'custom': 'Custom Service'
    };
    return labels[type] || type;
  };

  const getServiceColor = (type) => {
    const colors = {
      'pet_boarding': 'bg-purple-100 text-purple-800',
      'dog_walking': 'bg-blue-100 text-blue-800',
      'pet_grooming': 'bg-pink-100 text-pink-800',
      'daycare': 'bg-green-100 text-green-800',
      'pet_sitting': 'bg-orange-100 text-orange-800',
      'vet_transport': 'bg-red-100 text-red-800',
      'custom': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Find Pet Care Near You
          </h1>
          
          {/* Search Bar */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Enter location..."
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="form-input pl-10"
                onKeyPress={(e) => e.key === 'Enter' && searchCaregivers()}
              />
            </div>
            <button
              onClick={searchCaregivers}
              disabled={loading}
              className="btn btn-primary px-8"
            >
              <Search className="h-4 w-4 mr-2" />
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Filters and View Toggle */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-secondary"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">View:</span>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-2 rounded-lg ${viewMode === 'map' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <MapIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="card mt-4 p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="form-label">Service Type</label>
                  <select
                    value={filters.serviceType}
                    onChange={(e) => handleFilterChange('serviceType', e.target.value)}
                    className="form-input"
                  >
                    <option value="">All Services</option>
                    <option value="pet_boarding">Pet Boarding</option>
                    <option value="dog_walking">Dog Walking</option>
                    <option value="pet_grooming">Pet Grooming</option>
                    <option value="daycare">Daycare</option>
                    <option value="pet_sitting">Pet Sitting</option>
                  </select>
                </div>
                
                <div>
                  <label className="form-label">Min Rating</label>
                  <select
                    value={filters.minRating}
                    onChange={(e) => handleFilterChange('minRating', e.target.value)}
                    className="form-input"
                  >
                    <option value="">Any Rating</option>
                    <option value="4.5">4.5+ Stars</option>
                    <option value="4.0">4.0+ Stars</option>
                    <option value="3.5">3.5+ Stars</option>
                  </select>
                </div>
                
                <div>
                  <label className="form-label">Max Price ($)</label>
                  <input
                    type="number"
                    placeholder="Max price"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="form-input"
                  />
                </div>
                
                <div>
                  <label className="form-label">Radius (km)</label>
                  <select
                    value={filters.radius}
                    onChange={(e) => handleFilterChange('radius', parseInt(e.target.value))}
                    className="form-input"
                  >
                    <option value={5}>5 km</option>
                    <option value={10}>10 km</option>
                    <option value={20}>20 km</option>
                    <option value={50}>50 km</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === 'grid' ? (
          <>
            {caregivers.length > 0 && (
              <div className="mb-4 text-gray-600">
                Found {caregivers.length} caregiver{caregivers.length !== 1 ? 's' : ''} near you
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {caregivers.map((result, index) => (
                <div key={index} className="card group hover:shadow-xl transition-all duration-300">
                  {/* Caregiver Image */}
                  <div className="relative overflow-hidden rounded-t-lg h-48 bg-gradient-to-br from-purple-400 to-blue-500">
                    {result.caregiver.profile_image_url ? (
                      <img 
                        src={result.caregiver.profile_image_url}
                        alt={result.caregiver.full_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Users className="h-8 w-8" />
                          </div>
                          <p className="font-semibold">{result.caregiver.full_name}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Verification Badge */}
                    {result.profile?.is_background_verified && (
                      <div className="absolute top-3 right-3">
                        <div className="bg-green-500 text-white p-1 rounded-full">
                          <Shield className="h-4 w-4" />
                        </div>
                      </div>
                    )}
                    
                    {/* Distance Badge */}
                    <div className="absolute bottom-3 left-3">
                      <span className="bg-black/50 text-white px-2 py-1 rounded-full text-xs">
                        {result.distance} km away
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Service Badge */}
                    <div className="mb-3">
                      <span className={`badge ${getServiceColor(result.service.service_type)}`}>
                        {getServiceTypeLabel(result.service.service_type)}
                      </span>
                    </div>

                    {/* Service Title & Description */}
                    <h3 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors">
                      {result.service.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {result.service.description}
                    </p>

                    {/* Caregiver Info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Caregiver:</span>
                        <span className="font-medium text-gray-800">{result.caregiver.full_name}</span>
                      </div>
                      
                      {result.profile && (
                        <>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Experience:</span>
                            <span className="text-gray-800">{result.profile.experience_years} years</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 text-sm">Rating:</span>
                            {renderStars(result.profile.rating)}
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Reviews:</span>
                            <span className="text-gray-800">{result.profile.total_reviews} reviews</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Service Details */}
                    <div className="space-y-2 mb-6 pb-4 border-b border-gray-100">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Max Pets:</span>
                        <span className="text-gray-800">{result.service.max_pets}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm">Starting at:</span>
                        <span className="text-2xl font-bold text-green-600">${result.service.base_price}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <button
                        onClick={() => handleBookNow(result.service)}
                        className="w-full btn btn-primary group-hover:shadow-lg"
                      >
                        Book Now
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                      
                      <div className="flex space-x-2">
                        <button className="flex-1 btn btn-secondary text-sm">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Message
                        </button>
                        <button className="btn btn-secondary">
                          <Heart className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Map View - Placeholder */
          <div className="card">
            <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
              <div className="text-center">
                <MapIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Map View Coming Soon</h3>
                <p className="text-gray-500">Interactive map with caregiver locations will be available shortly</p>
              </div>
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && caregivers.length === 0 && filters.location && (
          <div className="card text-center py-12">
            <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No caregivers found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your filters or search in a different location
            </p>
            <button
              onClick={() => setShowFilters(true)}
              className="btn btn-primary"
            >
              Adjust Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;