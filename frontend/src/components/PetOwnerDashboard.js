import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import LoadingSpinner, { PageSkeleton } from './LoadingSpinner';
import PetCreationModal from './PetCreationModal';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  MapPin, 
  Star, 
  MessageSquare, 
  Clock,
  Heart,
  PawPrint,
  Filter,
  Search,
  Eye
} from 'lucide-react';

const PetOwnerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [petsResponse, bookingsResponse] = await Promise.all([
        axios.get('/api/pets'),
        axios.get('/api/bookings')
      ]);
      setPets(petsResponse.data || []);
      setBookings(bookingsResponse.data || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUpcomingBookings = () => {
    return bookings.filter(booking => 
      ['confirmed', 'in_progress'].includes(booking.status) &&
      new Date(booking.start_datetime) >= new Date()
    ).slice(0, 3);
  };

  const getRecentBookings = () => {
    return bookings
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome back, {user?.full_name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-600">
            Manage your pets and bookings from your dashboard
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">My Pets</p>
                <p className="text-3xl font-bold text-gray-800">{pets.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <PawPrint className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-800">{bookings.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Upcoming</p>
                <p className="text-3xl font-bold text-gray-800">{getUpcomingBookings().length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Messages</p>
                <p className="text-3xl font-bold text-gray-800">0</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: Eye },
                { id: 'pets', label: 'My Pets', icon: PawPrint },
                { id: 'bookings', label: 'Bookings', icon: Calendar },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upcoming Bookings */}
            <div className="card">
              <div className="card-header flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800">Upcoming Bookings</h3>
                <Link to="/search" className="btn btn-primary">
                  <Plus className="h-4 w-4 mr-1" />
                  Book Care
                </Link>
              </div>
              <div className="card-body">
                {getUpcomingBookings().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No upcoming bookings</p>
                    <Link to="/search" className="text-purple-600 hover:underline">
                      Find a caregiver
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getUpcomingBookings().map(booking => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <PawPrint className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">Pet Boarding</p>
                            <p className="text-sm text-gray-600">
                              {new Date(booking.start_datetime).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={`badge ${getStatusColor(booking.status)}`}>
                          {booking.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* My Pets */}
            <div className="card">
              <div className="card-header flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800">My Pets</h3>
                <button 
                  onClick={() => setShowAddPetModal(true)}
                  className="btn btn-primary"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Pet
                </button>
              </div>
              <div className="card-body">
                {pets.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Heart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No pets added yet</p>
                    <button 
                      onClick={() => setShowAddPetModal(true)}
                      className="text-purple-600 hover:underline"
                    >
                      Add your first pet
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {pets.slice(0, 4).map(pet => (
                      <div key={pet.id} className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold">
                            {pet.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800">{pet.name}</h4>
                            <p className="text-sm text-gray-600">{pet.breed}</p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>Age: {pet.age} years</p>
                          <p>Weight: {pet.weight} kg</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pets' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">My Pets</h2>
              <button 
                onClick={() => setShowAddPetModal(true)}
                className="btn btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Pet
              </button>
            </div>

            {pets.length === 0 ? (
              <div className="card text-center py-12">
                <Heart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No pets added yet</h3>
                <p className="text-gray-600 mb-6">Add your pets to start booking care services</p>
                <button 
                  onClick={() => setShowAddPetModal(true)}
                  className="btn btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Pet
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pets.map(pet => (
                  <div key={pet.id} className="card group">
                    <div className="card-body">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center text-white text-xl font-bold">
                            {pet.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">{pet.name}</h3>
                            <p className="text-gray-600">{pet.breed}</p>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity space-x-1">
                          <button className="p-1 text-gray-400 hover:text-blue-600">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Age:</span>
                          <span>{pet.age} years</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Weight:</span>
                          <span>{pet.weight} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Gender:</span>
                          <span>{pet.gender}</span>
                        </div>
                      </div>
                      
                      {pet.description && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-sm text-gray-600 line-clamp-2">{pet.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">My Bookings</h2>
              <div className="flex space-x-2">
                <button className="btn btn-secondary">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </button>
                <Link to="/search" className="btn btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  New Booking
                </Link>
              </div>
            </div>

            {bookings.length === 0 ? (
              <div className="card text-center py-12">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No bookings yet</h3>
                <p className="text-gray-600 mb-6">Start by finding a caregiver for your pets</p>
                <Link to="/search" className="btn btn-primary">
                  <Search className="h-4 w-4 mr-2" />
                  Find Caregivers
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {getRecentBookings().map(booking => (
                  <div key={booking.id} className="card">
                    <div className="card-body">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <PawPrint className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">Pet Boarding Service</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                              <span className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {new Date(booking.start_datetime).toLocaleDateString()}
                              </span>
                              <span className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {new Date(booking.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`badge ${getStatusColor(booking.status)}`}>
                            {booking.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="font-semibold text-gray-800">
                            ${booking.total_amount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Pet Modal would go here */}
      {showAddPetModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Add New Pet</h3>
              <p className="text-gray-600">Pet creation form coming soon...</p>
              <button
                onClick={() => setShowAddPetModal(false)}
                className="btn btn-secondary mt-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetOwnerDashboard;