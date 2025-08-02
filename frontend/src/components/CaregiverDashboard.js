import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Star, 
  MessageSquare, 
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  Eye,
  Settings
} from 'lucide-react';

const CaregiverDashboard = () => {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showServiceModal, setShowServiceModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [servicesResponse, bookingsResponse] = await Promise.all([
        axios.get('/api/caregiver/services'),
        axios.get('/api/bookings')
      ]);
      setServices(servicesResponse.data || []);
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

  const getTotalEarnings = () => {
    return bookings
      .filter(booking => booking.status === 'completed')
      .reduce((total, booking) => total + (booking.total_amount * 0.85), 0); // 15% commission
  };

  const getPendingBookings = () => {
    return bookings.filter(booking => booking.status === 'pending').length;
  };

  const getUpcomingBookings = () => {
    return bookings.filter(booking => 
      ['confirmed', 'in_progress'].includes(booking.status) &&
      new Date(booking.start_datetime) >= new Date()
    ).slice(0, 5);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
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
            Welcome back, {user?.full_name?.split(' ')[0]}! 🐾
          </h1>
          <p className="text-gray-600">
            Manage your services and bookings from your caregiver dashboard
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
                <p className="text-3xl font-bold text-green-600">${getTotalEarnings().toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Services</p>
                <p className="text-3xl font-bold text-gray-800">{services.filter(s => s.is_active).length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Requests</p>
                <p className="text-3xl font-bold text-yellow-600">{getPendingBookings()}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-800">{bookings.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600" />
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
                { id: 'services', label: 'My Services', icon: Settings },
                { id: 'bookings', label: 'Bookings', icon: Calendar },
                { id: 'earnings', label: 'Earnings', icon: DollarSign },
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
            {/* Pending Requests */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-xl font-semibold text-gray-800">Pending Requests</h3>
              </div>
              <div className="card-body">
                {bookings.filter(b => b.status === 'pending').length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No pending requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.filter(b => b.status === 'pending').map(booking => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">Pet Boarding Request</p>
                          <p className="text-sm text-gray-600">
                            {new Date(booking.start_datetime).toLocaleDateString()}
                          </p>
                          <p className="text-sm font-medium text-gray-800">${booking.total_amount}</p>
                        </div>
                        <div className="space-x-2">
                          <button className="btn btn-success btn-sm">Accept</button>
                          <button className="btn btn-danger btn-sm">Decline</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Bookings */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-xl font-semibold text-gray-800">Upcoming Bookings</h3>
              </div>
              <div className="card-body">
                {getUpcomingBookings().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No upcoming bookings</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getUpcomingBookings().map(booking => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">Pet Boarding</p>
                          <p className="text-sm text-gray-600">
                            {new Date(booking.start_datetime).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`badge ${getStatusColor(booking.status)}`}>
                            {booking.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <button className="btn btn-secondary btn-sm">
                            <MessageSquare className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">My Services</h2>
              <button 
                onClick={() => setShowServiceModal(true)}
                className="btn btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Service
              </button>
            </div>

            {services.length === 0 ? (
              <div className="card text-center py-12">
                <Settings className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No services created yet</h3>
                <p className="text-gray-600 mb-6">Create your first service to start receiving bookings</p>
                <button 
                  onClick={() => setShowServiceModal(true)}
                  className="btn btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Service
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map(service => (
                  <div key={service.id} className="card group">
                    <div className="card-body">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-800">{service.title}</h3>
                            {service.is_active ? (
                              <span className="badge badge-success">Active</span>
                            ) : (
                              <span className="badge badge-warning">Inactive</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{getServiceTypeLabel(service.service_type)}</p>
                          <p className="text-sm text-gray-600 line-clamp-2">{service.description}</p>
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
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Base Price:</span>
                          <span className="font-semibold text-green-600">${service.base_price}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Max Pets:</span>
                          <span className="text-gray-800">{service.max_pets}</span>
                        </div>
                        {service.duration_minutes && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Duration:</span>
                            <span className="text-gray-800">{service.duration_minutes} mins</span>
                          </div>
                        )}
                      </div>
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
              <h2 className="text-2xl font-bold text-gray-800">All Bookings</h2>
            </div>

            {bookings.length === 0 ? (
              <div className="card text-center py-12">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No bookings yet</h3>
                <p className="text-gray-600">Bookings will appear here once customers start booking your services</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map(booking => (
                  <div key={booking.id} className="card">
                    <div className="card-body">
                      <div className="flex items-center justify-between">
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
                          {booking.special_requirements && (
                            <p className="text-sm text-gray-600 mt-2">
                              <span className="font-medium">Special requirements:</span> {booking.special_requirements}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`badge ${getStatusColor(booking.status)}`}>
                            {booking.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="font-semibold text-gray-800">
                            ${booking.total_amount}
                          </span>
                          <div className="space-x-2">
                            <button className="btn btn-secondary btn-sm">
                              <MessageSquare className="h-4 w-4" />
                            </button>
                            <button className="btn btn-secondary btn-sm">
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'earnings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Earnings Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Earnings</span>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-green-600">${getTotalEarnings().toFixed(2)}</p>
                <p className="text-sm text-gray-500 mt-1">After 15% commission</p>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Completed Bookings</span>
                  <Calendar className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-gray-800">
                  {bookings.filter(b => b.status === 'completed').length}
                </p>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Average Rating</span>
                  <Star className="h-5 w-5 text-yellow-500" />
                </div>
                <p className="text-3xl font-bold text-gray-800">4.8</p>
                <p className="text-sm text-gray-500 mt-1">Based on reviews</p>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="text-xl font-semibold text-gray-800">Recent Earnings</h3>
              </div>
              <div className="card-body">
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Earnings breakdown coming soon</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Service Modal */}
      {showServiceModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Add New Service</h3>
              <p className="text-gray-600">Service creation form coming soon...</p>
              <button
                onClick={() => setShowServiceModal(false)}
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

export default CaregiverDashboard;