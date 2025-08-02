import React, { useState } from 'react';
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

const AddPetScreen = ({ navigation }) => {
  const { user } = useAuth();
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    age: '',
    weight: '',
    gender: '',
    color: '',
    image: null,
    description: '',
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
    if (!formData.breed.trim()) {
      toast.error('Pet breed is required');
      return false;
    }
    if (!formData.age || isNaN(formData.age)) {
      toast.error('Valid age is required');
      return false;
    }
    if (!formData.gender) {
      toast.error('Gender is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const petData = {
        ...formData,
        owner_id: user?.id,
        age: parseInt(formData.age),
        weight: formData.weight ? parseFloat(formData.weight) : null,
      };

      // In real app, make API call
      // const response = await petsAPI.createPet(petData);
      
      // Mock success
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Pet added successfully!');
      navigation.goBack();
      
    } catch (error) {
      console.error('Failed to add pet:', error);
      toast.error('Failed to add pet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Pet</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Pet Photo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pet Photo</Text>
          <ImagePicker
            onImageSelected={handleImageSelected}
            currentImage={formData.image}
            style={styles.imagePicker}
          />
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
            <Text style={styles.label}>Breed *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter breed"
              value={formData.breed}
              onChangeText={(value) => handleInputChange('breed', value)}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Age (years) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Age"
                value={formData.age}
                onChangeText={(value) => handleInputChange('age', value)}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="Weight"
                value={formData.weight}
                onChangeText={(value) => handleInputChange('weight', value)}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Gender Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Gender *</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  formData.gender === 'Male' && styles.genderButtonSelected
                ]}
                onPress={() => handleInputChange('gender', 'Male')}
              >
                <Text style={[
                  styles.genderButtonText,
                  formData.gender === 'Male' && styles.genderButtonTextSelected
                ]}>
                  Male
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  formData.gender === 'Female' && styles.genderButtonSelected
                ]}
                onPress={() => handleInputChange('gender', 'Female')}
              >
                <Text style={[
                  styles.genderButtonText,
                  formData.gender === 'Female' && styles.genderButtonTextSelected
                ]}>
                  Female
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Color</Text>
            <TextInput
              style={styles.input}
              placeholder="Pet color"
              value={formData.color}
              onChangeText={(value) => handleInputChange('color', value)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us about your pet's personality and habits..."
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
              placeholder="Exercise needs, walking schedule..."
              value={formData.care_instructions.exercise}
              onChangeText={(value) => handleInputChange('exercise', value, 'care_instructions')}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Grooming Instructions</Text>
            <TextInput
              style={styles.input}
              placeholder="Grooming requirements"
              value={formData.care_instructions.grooming}
              onChangeText={(value) => handleInputChange('grooming', value, 'care_instructions')}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Emergency Contact Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Emergency contact person"
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
              {loading ? 'Adding Pet...' : 'Add Pet'}
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