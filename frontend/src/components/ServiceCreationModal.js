import React, { useState } from 'react';
import { X, Settings, MapPin, DollarSign, Clock, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import axios from 'axios';

const ServiceCreationModal = ({ isOpen, onClose, onServiceCreated }) => {
  const { user } = useAuth();
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    service_type: 'pet_boarding',
    title: '',
    description: '',
    base_price: '',
    duration_minutes: '',
    max_pets: '1',
    service_area_radius: '10'
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const serviceTypes = [
    { value: 'pet_boarding', label: 'Pet Boarding', hasDuration: false },
    { value: 'dog_walking', label: 'Dog Walking', hasuration: true },
    { value: 'pet_grooming', label: 'Pet Grooming', hasDuration: true },
    { value: 'daycare', label: 'Pet Daycare', hasDuration: false },
    { value: 'pet_sitting', label: 'Pet Sitting', hasDuration: false },
    { value: 'vet_transport', label: 'Vet Transport', hasDuration: true },
    { value: 'custom', label: 'Custom Service', hasDuration: true }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleServiceTypeChange = (e) => {
    const newType = e.target.value;
    setFormData(prev => ({
      ...prev,
      service_type: newType,
      duration_minutes: ['pet_boarding', 'daycare', 'pet_sitting'].includes(newType) ? '' : prev.duration_minutes
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Service title is required';
    if (!formData.description.trim()) newErrors.description = 'Service description is required';
    if (!formData.base_price || parseFloat(formData.base_price) <= 0) {
      newErrors.base_price = 'Valid base price is required';
    }
    if (!formData.max_pets || parseInt(formData.max_pets) <= 0) {
      newErrors.max_pets = 'Valid max pets number is required';
    }
    
    const selectedType = serviceTypes.find(type => type.value === formData.service_type);
    if (selectedType?.hasDuration && (!formData.duration_minutes || parseInt(formData.duration_minutes) <= 0)) {
      newErrors.duration_minutes = 'Duration is required for this service type';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }
    
    setLoading(true);
    
    try {
      const serviceData = {
        service_type: formData.service_type,
        title: formData.title.trim(),
        description: formData.description.trim(),
        base_price: parseFloat(formData.base_price),
        max_pets: parseInt(formData.max_pets),
        service_area_radius: parseFloat(formData.service_area_radius),
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        is_active: true
      };
      
      const response = await axios.post('/api/caregiver/services', serviceData);
      
      toast.success('Service created successfully!');
      onServiceCreated(response.data);
      onClose();
      
      // Reset form
      setFormData({
        service_type: 'pet_boarding',
        title: '',
        description: '',
        base_price: '',
        duration_minutes: '',
        max_pets: '1',
        service_area_radius: '10'
      });
      
    } catch (error) {
      console.error('Service creation failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to create service');
    } finally {
      setLoading(false);
    }
  };

  const getServiceTypeLabel = (value) => {
    return serviceTypes.find(type => type.value === value)?.label || value;
  };

  const shouldShowDuration = () => {
    const selectedType = serviceTypes.find(type => type.value === formData.service_type);
    return selectedType?.hasDuration;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Create New Service</h2>
                <p className="text-sm text-gray-600">Offer your pet care service to pet owners</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Service Type */}
          <div className="form-group">
            <label className="form-label">Service Type *</label>
            <select
              name="service_type"
              value={formData.service_type}
              onChange={handleServiceTypeChange}
              className="form-input"
            >
              {serviceTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Service Title & Description */}
          <div className="form-group">
            <label className="form-label">Service Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`form-input ${errors.title ? 'border-red-500' : ''}`}
              placeholder={`e.g., Professional ${getServiceTypeLabel(formData.service_type)} Service`}
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Service Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={`form-input form-textarea ${errors.description ? 'border-red-500' : ''}`}
              placeholder="Describe your service, what's included, your experience..."
              rows="4"
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Pricing & Capacity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="form-label flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                Base Price (SGD) *
              </label>
              <input
                type="number"
                name="base_price"
                value={formData.base_price}
                onChange={handleInputChange}
                className={`form-input ${errors.base_price ? 'border-red-500' : ''}`}
                placeholder="e.g., 50"
                min="0"
                step="0.01"
              />
              {errors.base_price && <p className="text-red-500 text-sm mt-1">{errors.base_price}</p>}
              <p className="text-sm text-gray-500 mt-1">
                {formData.service_type === 'pet_boarding' ? 'Price per night' : 
                 shouldShowDuration() ? 'Price per service' : 'Price per day'}
              </p>
            </div>

            <div className="form-group">
              <label className="form-label flex items-center">
                <Users className="h-4 w-4 mr-1" />
                Max Pets *
              </label>
              <input
                type="number"
                name="max_pets"
                value={formData.max_pets}
                onChange={handleInputChange}
                className={`form-input ${errors.max_pets ? 'border-red-500' : ''}`}
                min="1"
                max="10"
              />
              {errors.max_pets && <p className="text-red-500 text-sm mt-1">{errors.max_pets}</p>}
            </div>

            {/* Duration (conditional) */}
            {shouldShowDuration() && (
              <div className="form-group md:col-span-2">
                <label className="form-label flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  name="duration_minutes"
                  value={formData.duration_minutes}
                  onChange={handleInputChange}
                  className={`form-input ${errors.duration_minutes ? 'border-red-500' : ''}`}
                  placeholder="e.g., 60 for 1 hour"
                  min="15"
                  step="15"
                />
                {errors.duration_minutes && <p className="text-red-500 text-sm mt-1">{errors.duration_minutes}</p>}
              </div>
            )}

            <div className="form-group md:col-span-2">
              <label className="form-label flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                Service Area Radius (km)
              </label>
              <input
                type="number"
                name="service_area_radius"
                value={formData.service_area_radius}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., 10"
                min="1"
                max="50"
                step="0.5"
              />
              <p className="text-sm text-gray-500 mt-1">
                How far are you willing to travel or provide service from your location?
              </p>
            </div>
          </div>

          {/* Service Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Service Guidelines</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Be detailed in your service description to attract the right clients</li>
              <li>• Set competitive pricing based on your experience and local market</li>
              <li>• Start with a smaller service area and expand as you gain reviews</li>
              <li>• Respond promptly to booking requests to maintain high ratings</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating Service...
                </div>
              ) : (
                'Create Service'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceCreationModal;