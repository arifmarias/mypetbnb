import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  Edit, 
  Save, 
  X,
  Shield,
  Award,
  Star,
  Settings,
  Lock,
  Bell,
  CreditCard,
  Heart,
  PawPrint,
  Calendar,
  MessageSquare
} from 'lucide-react';

const UserProfile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    profile_image_url: ''
  });

  const [stats, setStats] = useState({
    total_bookings: 0,
    total_pets: 0,
    total_spent: 0,
    member_since: new Date().toISOString().split('T')[0]
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'payment', label: 'Payment', icon: CreditCard }
  ];

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        profile_image_url: user.profile_image_url || ''
      });
      setStats({
        total_bookings: 12,
        total_pets: 3,
        total_spent: 650.00,
        member_since: user.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // In production: await axios.put('/api/users/profile', profileData);
      console.log('Saving profile:', profileData);
      setIsEditing(false);
      // Show success message
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const response = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setProfileData(prev => ({
        ...prev,
        profile_image_url: response.data.url
      }));
    } catch (error) {
      console.error('Failed to upload image:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMemberSince = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Profile Settings</h1>
          <p className="text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6 mb-6">
              {/* Profile Picture */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  {profileData.profile_image_url ? (
                    <img 
                      src={profileData.profile_image_url}
                      alt={profileData.full_name}
                      className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto text-white text-2xl font-bold shadow-lg">
                      {profileData.full_name.charAt(0) || 'U'}
                    </div>
                  )}
                  
                  <label className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full cursor-pointer hover:bg-purple-700 transition-colors shadow-lg">
                    <Camera className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-800 mt-3">
                  {profileData.full_name || 'User'}
                </h3>
                <p className="text-gray-600">{user?.role === 'pet_owner' ? 'Pet Owner' : 'Pet Caregiver'}</p>
                
                {user?.is_verified && (
                  <div className="flex items-center justify-center mt-2">
                    <Shield className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">Verified</span>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Member since</span>
                  <span className="font-medium">{formatMemberSince(stats.member_since)}</span>
                </div>
                
                {user?.role === 'pet_owner' && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Total bookings</span>
                      <span className="font-medium">{stats.total_bookings}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">My pets</span>
                      <span className="font-medium">{stats.total_pets}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Total spent</span>
                      <span className="font-medium">${stats.total_spent}</span>
                    </div>
                  </>
                )}
                
                {user?.role === 'caregiver' && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Rating</span>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                        <span className="font-medium">4.8</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Completed jobs</span>
                      <span className="font-medium">45</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Total earned</span>
                      <span className="font-medium">$2,340</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-purple-100 text-purple-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="h-5 w-5 mr-3" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="card">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Personal Information</h2>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="btn btn-secondary"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </button>
                    ) : (
                      <div className="space-x-2">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="btn btn-secondary"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          disabled={loading}
                          className="btn btn-primary"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {loading ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                          type="text"
                          name="full_name"
                          value={profileData.full_name}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className={`form-input pl-10 ${!isEditing ? 'bg-gray-50' : ''}`}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                          type="email"
                          name="email"
                          value={profileData.email}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className={`form-input pl-10 ${!isEditing ? 'bg-gray-50' : ''}`}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                          type="tel"
                          name="phone"
                          value={profileData.phone}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className={`form-input pl-10 ${!isEditing ? 'bg-gray-50' : ''}`}
                          placeholder="+65 or +60 phone number"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                          type="text"
                          name="address"
                          value={profileData.address}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className={`form-input pl-10 ${!isEditing ? 'bg-gray-50' : ''}`}
                          placeholder="Enter your address"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Account Status */}
                  <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Status</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Mail className="h-5 w-5 text-green-500 mr-2" />
                          <span className="text-gray-700">Email Verified</span>
                        </div>
                        <span className="badge badge-success">Verified</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Phone className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-gray-700">Phone Verified</span>
                        </div>
                        <span className="badge badge-warning">Pending</span>
                      </div>
                      
                      {user?.role === 'caregiver' && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Shield className="h-5 w-5 text-green-500 mr-2" />
                            <span className="text-gray-700">Background Check</span>
                          </div>
                          <span className="badge badge-success">Completed</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Security Settings</h2>

                  <div className="space-y-6">
                    {/* Password */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800">Password</h3>
                          <p className="text-gray-600 text-sm">Last updated 3 months ago</p>
                        </div>
                        <button className="btn btn-secondary">
                          Change Password
                        </button>
                      </div>
                    </div>

                    {/* Two-Factor Authentication */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800">Two-Factor Authentication</h3>
                          <p className="text-gray-600 text-sm">Add an extra layer of security to your account</p>
                        </div>
                        <button className="btn btn-primary">
                          Enable 2FA
                        </button>
                      </div>
                    </div>

                    {/* Login Activity */}
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-4">Recent Login Activity</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-800">Current Session</p>
                            <p className="text-sm text-gray-600">Singapore • Chrome on macOS</p>
                          </div>
                          <span className="badge badge-success">Active</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-800">Mobile App</p>
                            <p className="text-sm text-gray-600">Malaysia • iPhone • 2 days ago</p>
                          </div>
                          <button className="text-sm text-red-600 hover:underline">
                            Revoke
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Notification Preferences</h2>

                  <div className="space-y-6">
                    {/* Email Notifications */}
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-4">Email Notifications</h3>
                      <div className="space-y-3">
                        {[
                          { id: 'booking_updates', label: 'Booking confirmations and updates', enabled: true },
                          { id: 'messages', label: 'New messages from caregivers', enabled: true },
                          { id: 'promotions', label: 'Promotional offers and discounts', enabled: false },
                          { id: 'newsletter', label: 'Weekly newsletter', enabled: true },
                        ].map(notification => (
                          <div key={notification.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-700">{notification.label}</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                defaultChecked={notification.enabled}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Push Notifications */}
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-4">Push Notifications</h3>
                      <div className="space-y-3">
                        {[
                          { id: 'booking_reminders', label: 'Booking reminders', enabled: true },
                          { id: 'instant_messages', label: 'Instant messages', enabled: true },
                          { id: 'payment_alerts', label: 'Payment alerts', enabled: true },
                        ].map(notification => (
                          <div key={notification.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-700">{notification.label}</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                defaultChecked={notification.enabled}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Tab */}
              {activeTab === 'payment' && (
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Payment Methods</h2>

                  <div className="space-y-6">
                    {/* Payment Methods */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-800">Saved Payment Methods</h3>
                        <button className="btn btn-primary">
                          Add Payment Method
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-white border-2 border-purple-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                              VISA
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">**** **** **** 4242</p>
                              <p className="text-sm text-gray-600">Expires 12/25</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="badge badge-success">Default</span>
                            <button className="text-sm text-gray-600 hover:text-gray-800">Edit</button>
                            <button className="text-sm text-red-600 hover:text-red-800">Remove</button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Billing Address */}
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-4">Billing Address</h3>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-700">
                          123 Orchard Road<br />
                          Singapore 238873<br />
                          Singapore
                        </p>
                        <button className="text-sm text-purple-600 hover:underline mt-2">
                          Update Address
                        </button>
                      </div>
                    </div>

                    {/* Payment History */}
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-4">Recent Payments</h3>
                      <div className="space-y-3">
                        {[
                          { date: '2024-12-25', amount: 65.00, service: 'Pet Boarding Service', status: 'Completed' },
                          { date: '2024-12-20', amount: 35.00, service: 'Dog Walking Service', status: 'Completed' },
                          { date: '2024-12-15', amount: 120.00, service: 'Pet Grooming Service', status: 'Completed' },
                        ].map((payment, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-800">${payment.amount}</p>
                              <p className="text-sm text-gray-600">{payment.service}</p>
                              <p className="text-xs text-gray-500">{payment.date}</p>
                            </div>
                            <span className="badge badge-success">{payment.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;