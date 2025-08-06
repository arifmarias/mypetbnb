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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ImagePicker from '../components/ImagePicker';
import { petsAPI } from '../services/api';

const AddPetScreen = ({ route, navigation }) => {
  const { petId, editMode, petData } = route.params || {};
  const { user } = useAuth();
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    species: 'dog',
    breed: '',
    age: '',
    weight: '',
    gender: '',
    description: '',
    image: null,
    medical_info: {
      vaccinations: '',
      medications: '',
      allergies: '',
      conditions: '',
      veterinarian_name: '',
      veterinarian_phone: '',
    },
    behavior_info: {
      personality: '',
      good_with: '',
      training: '',
      special_needs: '',
    },
    care_instructions: {
      feeding: '',
      exercise: '',
      grooming: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
    },
  });
  
  const [loading, setLoading] = useState(false);

  // Species options
  const speciesOptions = [
    { id: 'dog', name: 'Dog' },
    { id: 'cat', name: 'Cat' },
    { id: 'bird', name: 'Bird' },
    { id: 'rabbit', name: 'Rabbit' },
    { id: 'hamster', name: 'Hamster' },
    { id: 'fish', name: 'Fish' },
    { id: 'other', name: 'Other' },
  ];

  // Load existing pet data if in edit mode
  useEffect(() => {
    if (editMode && petData) {
      console.log('Loading pet data for editing:', petData);
      
      setFormData({
        name: petData.name || '',
        species: petData.species || 'dog',
        breed: petData.breed || '',
        age: petData.age ? petData.age.toString() : '',
        weight: petData.weight ? petData.weight.toString() : '',
        gender: petData.gender || '',
        description: petData.description || '',
        image: petData.images && petData.images.length > 0 ? petData.images[0] : null,
        medical_info: {
          vaccinations: petData.medical_info?.vaccinations || '',
          medications: petData.medical_info?.medications || '',
          allergies: petData.medical_info?.allergies || '',
          conditions: petData.medical_info?.conditions || '',
          veterinarian_name: petData.medical_info?.veterinarian_name || '',
          veterinarian_phone: petData.medical_info?.veterinarian_phone || '',
        },
        behavior_info: {
          personality: petData.behavioral_notes?.personality || '',
          good_with: petData.behavioral_notes?.good_with || '',
          training: petData.behavioral_notes?.training || '',
          special_needs: petData.behavioral_notes?.special_needs || '',
        },
        care_instructions: {
          feeding: petData.emergency_contact?.feeding || '',
          exercise: petData.emergency_contact?.exercise || '',
          grooming: petData.emergency_contact?.grooming || '',
          emergency_contact_name: petData.emergency_contact?.name || '',
          emergency_contact_phone: petData.emergency_contact?.phone || '',
        },
      });
    }
  }, [editMode, petData]);

  const handleInputChange = (field, value, section = null) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleImageSelected = (imageUri) => {
    setFormData(prev => ({ ...prev, image: imageUri }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Pet name is required');
      return false;
    }
    if (!formData.species) {
      toast.error('Pet species is required');
      return false;
    }
    if (formData.age && isNaN(formData.age)) {
      toast.error('Age must be a valid number');
      return false;
    }
    if (formData.weight && isNaN(formData.weight)) {
      toast.error('Weight must be a valid number');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      console.log('Submitting pet data:', formData);
      
      if (editMode && petId) {
        // Update existing pet
        const response = await petsAPI.updatePet(petId, formData);
        console.log('Pet updated:', response);
        toast.success(`${formData.name} updated successfully!`);
      } else {
        // Create new pet
        const response = await petsAPI.createPet(formData);
        console.log('Pet created:', response);
        toast.success(`${formData.name} added successfully!`);
      }
      
      navigation.goBack();
      
    } catch (error) {
      console.error('Failed to save pet:', error);
      
      if (error.response?.status === 400) {
        const errorDetail = error.response.data?.detail;
        if (typeof errorDetail === 'string') {
          toast.error(errorDetail);
        } else {
          toast.error('Please check your input and try again');
        }
      } else if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else if (error.response?.status === 403) {
        toast.error('Access denied');
      } else if (error.response?.status >= 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error(editMode ? 'Failed to update pet' : 'Failed to add pet');
      }
    } finally {
      setLoading(false);
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
        <Text style={styles.headerTitle}>
          {editMode ? `Edit ${petData?.name || 'Pet'}` : 'Add Pet'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Pet Image */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pet Photo</Text>
          <View style={styles.imagePicker}>
            <ImagePicker
              onImageSelected={handleImageSelected}
              currentImage={formData.image}
              style={styles.imagePickerContainer}
            />
          </View>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Pet Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter pet name"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Species *</Text>
            <View style={styles.speciesContainer}>
              {speciesOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.speciesButton,
                    formData.species === option.id && styles.speciesButtonSelected
                  ]}
                  onPress={() => handleInputChange('species', option.id)}
                >
                  <Text style={[
                    styles.speciesButtonText,
                    formData.species === option.id && styles.speciesButtonTextSelected
                  ]}>
                    {option.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Breed</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter breed (e.g., Golden Retriever)"
              value={formData.breed}
              onChangeText={(value) => handleInputChange('breed', value)}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Age (years)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                value={formData.age}
                onChangeText={(value) => handleInputChange('age', value)}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.0"
                value={formData.weight}
                onChangeText={(value) => handleInputChange('weight', value)}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderContainer}>
              {['male', 'female', 'unknown'].map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.genderButton,
                    formData.gender === gender && styles.genderButtonSelected
                  ]}
                  onPress={() => handleInputChange('gender', gender)}
                >
                  <Text style={[
                    styles.genderButtonText,
                    formData.gender === gender && styles.genderButtonTextSelected
                  ]}>
                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us about your pet's personality, habits, and any other important details..."
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Medical Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Vaccinations</Text>
            <TextInput
              style={styles.input}
              placeholder="List current vaccinations"
              value={formData.medical_info.vaccinations}
              onChangeText={(value) => handleInputChange('vaccinations', value, 'medical_info')}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Current Medications</Text>
            <TextInput
              style={styles.input}
              placeholder="List any medications"
              value={formData.medical_info.medications}
              onChangeText={(value) => handleInputChange('medications', value, 'medical_info')}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Allergies</Text>
            <TextInput
              style={styles.input}
              placeholder="List any known allergies"
              value={formData.medical_info.allergies}
              onChangeText={(value) => handleInputChange('allergies', value, 'medical_info')}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Medical Conditions</Text>
            <TextInput
              style={styles.input}
              placeholder="Any ongoing medical conditions"
              value={formData.medical_info.conditions}
              onChangeText={(value) => handleInputChange('conditions', value, 'medical_info')}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Veterinarian Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your vet's name"
              value={formData.medical_info.veterinarian_name}
              onChangeText={(value) => handleInputChange('veterinarian_name', value, 'medical_info')}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Veterinarian Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="Vet's phone number"
              value={formData.medical_info.veterinarian_phone}
              onChangeText={(value) => handleInputChange('veterinarian_phone', value, 'medical_info')}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Behavior & Personality */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Behavior & Personality</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Personality Traits</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Friendly, Energetic, Shy"
              value={formData.behavior_info.personality}
              onChangeText={(value) => handleInputChange('personality', value, 'behavior_info')}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Good With</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Dogs, Cats, Children"
              value={formData.behavior_info.good_with}
              onChangeText={(value) => handleInputChange('good_with', value, 'behavior_info')}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Training Level</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., House trained, Basic commands"
              value={formData.behavior_info.training}
              onChangeText={(value) => handleInputChange('training', value, 'behavior_info')}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Special Needs</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any special care requirements..."
              value={formData.behavior_info.special_needs}
              onChangeText={(value) => handleInputChange('special_needs', value, 'behavior_info')}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Care Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Care Instructions</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Feeding Instructions</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Feeding schedule, food type, amount..."
              value={formData.care_instructions.feeding}
              onChangeText={(value) => handleInputChange('feeding', value, 'care_instructions')}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Exercise Requirements</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Exercise needs, favorite activities..."
              value={formData.care_instructions.exercise}
              onChangeText={(value) => handleInputChange('exercise', value, 'care_instructions')}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Grooming Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Grooming schedule, preferences..."
              value={formData.care_instructions.grooming}
              onChangeText={(value) => handleInputChange('grooming', value, 'care_instructions')}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Emergency Contact Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Emergency contact name"
              value={formData.care_instructions.emergency_contact_name}
              onChangeText={(value) => handleInputChange('emergency_contact_name', value, 'care_instructions')}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Emergency Contact Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="Emergency contact phone"
              value={formData.care_instructions.emergency_contact_phone}
              onChangeText={(value) => handleInputChange('emergency_contact_phone', value, 'care_instructions')}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? (editMode ? 'Updating Pet...' : 'Adding Pet...') : (editMode ? 'Update Pet' : 'Add Pet')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
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
  imagePicker: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  imagePickerContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#F9F9F9',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speciesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  speciesButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 20,
    backgroundColor: '#F9F9F9',
  },
  speciesButtonSelected: {
    borderColor: '#FF5A5F',
    backgroundColor: '#FF5A5F20',
  },
  speciesButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  speciesButtonTextSelected: {
    color: '#FF5A5F',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  genderButtonSelected: {
    borderColor: '#FF5A5F',
    backgroundColor: '#FFF5F5',
  },
  genderButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  genderButtonTextSelected: {
    color: '#FF5A5F',
  },
  submitSection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  submitButton: {
    backgroundColor: '#FF5A5F',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#FF5A5F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AddPetScreen;