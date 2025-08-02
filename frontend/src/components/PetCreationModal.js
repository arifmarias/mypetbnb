import React, { useState } from 'react';
import { X, Upload, Camera, PawPrint } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import axios from 'axios';

const PetCreationModal = ({ isOpen, onClose, onPetCreated }) => {
  const { user } = useAuth();
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    age: '',
    weight: '',
    gender: 'Male',
    description: '',
    medical_info: '',
    behavioral_notes: '',
    emergency_contact: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Pet name is required';
    if (!formData.breed.trim()) newErrors.breed = 'Breed is required';
    if (!formData.age || formData.age < 0) newErrors.age = 'Valid age is required';
    if (!formData.weight || formData.weight < 0) newErrors.weight = 'Valid weight is required';
    
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
      // Upload image first if provided
      let imageUrl = '';
      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append('file', imageFile);
        
        const uploadResponse = await axios.post('/api/upload', imageFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        imageUrl = uploadResponse.data.url;
      }
      
      // Create pet
      const petData = {
        ...formData,
        age: parseInt(formData.age),
        weight: parseFloat(formData.weight),
        photo_urls: imageUrl ? [imageUrl] : []
      };
      
      const response = await axios.post('/api/pets', petData);
      
      toast.success(`${formData.name} has been added successfully!`);
      onPetCreated(response.data);
      onClose();
      
      // Reset form
      setFormData({
        name: '', breed: '', age: '', weight: '', gender: 'Male',
        description: '', medical_info: '', behavioral_notes: '', emergency_contact: ''
      });
      setImageFile(null);
      setImagePreview(null);
      
    } catch (error) {
      console.error('Pet creation failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to create pet');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                <PawPrint className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Add Your Pet</h2>
                <p className="text-sm text-gray-600">Tell us about your furry friend</p>
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
          {/* Pet Photo Upload */}
          <div className="text-center">
            <div className="relative inline-block">
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Pet preview"
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                />
              ) : (
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300">
                  <Camera className="h-8 w-8 text-gray-400" />
                </div>
              )}
              
              <label className="absolute bottom-0 right-0 bg-red-500 text-white p-2 rounded-full cursor-pointer hover:bg-red-600 transition-colors">
                <Upload className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-2">Add a photo of your pet</p>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="form-label">Pet Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`form-input ${errors.name ? 'border-red-500' : ''}`}
                placeholder="e.g., Buddy, Luna, Max"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Breed *</label>
              <input
                type="text"
                name="breed"
                value={formData.breed}
                onChange={handleInputChange}
                className={`form-input ${errors.breed ? 'border-red-500' : ''}`}
                placeholder="e.g., Golden Retriever, Persian Cat"
              />
              {errors.breed && <p className="text-red-500 text-sm mt-1">{errors.breed}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Age (years) *</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                className={`form-input ${errors.age ? 'border-red-500' : ''}`}
                placeholder="e.g., 3"
                min="0"
                step="1"
              />
              {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Weight (kg) *</label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                className={`form-input ${errors.weight ? 'border-red-500' : ''}`}
                placeholder="e.g., 25.5"
                min="0"
                step="0.1"
              />
              {errors.weight && <p className="text-red-500 text-sm mt-1">{errors.weight}</p>}
            </div>

            <div className="form-group md:col-span-2">
              <label className="form-label">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="form-input form-textarea"
                placeholder="Tell us about your pet's personality, likes, dislikes..."
                rows="3"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Medical Information</label>
              <textarea
                name="medical_info"
                value={formData.medical_info}
                onChange={handleInputChange}
                className="form-input form-textarea"
                placeholder="Vaccinations, medications, allergies, special medical needs..."
                rows="3"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Behavioral Notes</label>
              <textarea
                name="behavioral_notes"
                value={formData.behavioral_notes}
                onChange={handleInputChange}
                className="form-input form-textarea"
                placeholder="How does your pet behave with strangers, other pets, children..."
                rows="3"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Emergency Contact</label>
              <input
                type="text"
                name="emergency_contact"
                value={formData.emergency_contact}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Emergency contact person and phone number"
              />
            </div>
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
                  Creating...
                </div>
              ) : (
                'Add Pet'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PetCreationModal;