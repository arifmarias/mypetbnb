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
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { petsAPI } from '../services/api';
import * as ImagePicker from 'expo-image-picker';

const AddPetScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const toast = useToast();
  const { petId, mode = 'add' } = route.params || {};
  const isEditMode = mode === 'edit' && petId;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    species: 'Dog',
    breed: '',
    gender: 'male',
    birth_date: '',
    weight: '',
    description: '',
    special_needs: [],
    vaccination_records: [],
    images: [],
    medical_info: '',
    behavioral_notes: '',
    emergency_contact: '',
  });

  const [errors, setErrors] = useState({});

  // Pet species options
  const speciesOptions = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Hamster', 'Fish', 'Other'];

  // Common dog breeds for quick selection
  const dogBreeds = [
    'Golden Retriever', 'Labrador', 'German Shepherd', 'Bulldog', 'Poodle',
    'Siberian Husky', 'Shih Tzu', 'Chihuahua', 'Beagle', 'Mixed Breed'
  ];

  // Common cat breeds
  const catBreeds = [
    'Persian', 'Siamese', 'Maine Coon', 'British Shorthair', 'Ragdoll',
    'Russian Blue', 'Bengal', 'Abyssinian', 'Scottish Fold', 'Mixed Breed'
  ];

  // Load pet data if editing
  useEffect(() => {
    if (isEditMode) {
      loadPetData();
    }
  }, [isEditMode, petId]);

  const loadPetData = async () => {
    try {
      setLoading(true);
      const response = await petsAPI.getPet(petId);
      const petData = response.data;
      
      setFormData({
        name: petData.name || '',
        species: petData.species || 'Dog',
        breed: petData.breed || '',
        gender: petData.gender || 'male',
        birth_date: petData.birth_date ? petData.birth_date.split('T')[0] : '',
        weight: petData.weight ? petData.weight.toString() : '',
        description: petData.description || '',
        special_needs: petData.special_needs || [],
        vaccination_records: petData.vaccination_records || [],
        images: petData.images || [],
        medical_info: petData.medical_info || '',
        behavioral_notes: petData.behavioral_notes || '',
        emergency_contact: petData.emergency_contact || '',
      });
    } catch (error) {
      console.error('Load pet error:', error);
      toast.error('Failed to load pet data');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Pet name is required';
    }

    if (!formData.breed.trim()) {
      newErrors.breed = 'Breed is required';
    }

    if (formData.weight && (isNaN(formData.weight) || parseFloat(formData.weight) <= 0)) {
      newErrors.weight = 'Please enter a valid weight';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImagePick = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission required', 'Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setUploadingImage(true);
        
        // In a real app, you would upload to your image service
        // For now, we'll just add the local URI
        const newImages = [...formData.images, result.assets[0].uri];
        updateFormData('images', newImages);
        
        setUploadingImage(false);
        toast.success('Image added successfully');
      }
    } catch (error) {
      console.error('Image pick error:', error);
      setUploadingImage(false);
      toast.error('Failed to add image');
    }
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    updateFormData('images', newImages);
  };

  const addSpecialNeed = () => {
    Alert.prompt(
      'Add Special Need',
      'Enter a special need or medical condition:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: (text) => {
            if (text && text.trim()) {
              const newSpecialNeeds = [...formData.special_needs, text.trim()];
              updateFormData('special_needs', newSpecialNeeds);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const removeSpecialNeed = (index) => {
    const newSpecialNeeds = formData.special_needs.filter((_, i) => i !== index);
    updateFormData('special_needs', newSpecialNeeds);
  };

  const addVaccinationRecord = () => {
    Alert.alert(
      'Add Vaccination Record',
      'Choose an option:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add Basic Vaccination',
          onPress: () => {
            const newRecord = {
              vaccine: 'Basic Vaccination',
              date: new Date().toISOString().split('T')[0],
              veterinarian: '',
              notes: ''
            };
            const newRecords = [...formData.vaccination_records, newRecord];
            updateFormData('vaccination_records', newRecords);
          },
        },
      ]
    );
  };

  const removeVaccinationRecord = (index) => {
    const newRecords = formData.vaccination_records.filter((_, i) => i !== index);
    updateFormData('vaccination_records', newRecords);
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    try {
      setSaving(true);

      const petData = {
        ...formData,
        owner_id: user.id,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        birth_date: formData.birth_date || null,
      };

      if (isEditMode) {
        await petsAPI.updatePet(petId, petData);
        toast.success('Pet updated successfully');
      } else {
        await petsAPI.createPet(petData);
        toast.success('Pet added successfully');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Save pet error:', error);
      toast.error(isEditMode ? 'Failed to update pet' : 'Failed to add pet');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5A5F" />
          <Text style={styles.loadingText}>Loading pet data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Edit Pet' : 'Add Pet'}
        </Text>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Pet Name *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={formData.name}
              onChangeText={(text) => updateFormData('name', text)}
              placeholder="Enter your pet's name"
              placeholderTextColor="#999"
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Species</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
              {speciesOptions.map((species) => (
                <TouchableOpacity
                  key={species}
                  style={[
                    styles.optionButton,
                    formData.species === species && styles.optionButtonActive
                  ]}
                  onPress={() => updateFormData('species', species)}
                >
                  <Text style={[
                    styles.optionText,
                    formData.species === species && styles.optionTextActive
                  ]}>
                    {species}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Breed *</Text>
            <TextInput
              style={[styles.input, errors.breed && styles.inputError]}
              value={formData.breed}
              onChangeText={(text) => updateFormData('breed', text)}
              placeholder="Enter breed"
              placeholderTextColor="#999"
            />
            {errors.breed && <Text style={styles.errorText}>{errors.breed}</Text>}
            
            {/* Quick breed selection */}
            {(formData.species === 'Dog' || formData.species === 'Cat') && (
              <View style={styles.quickBreeds}>
                <Text style={styles.quickBreedsLabel}>Quick select:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {(formData.species === 'Dog' ? dogBreeds : catBreeds).map((breed) => (
                    <TouchableOpacity
                      key={breed}
                      style={styles.quickBreedButton}
                      onPress={() => updateFormData('breed', breed)}
                    >
                      <Text style={styles.quickBreedText}>{breed}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.formRow}>
            <View style={styles.formGroupHalf}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderSelector}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    formData.gender === 'male' && styles.genderButtonActive
                  ]}
                  onPress={() => updateFormData('gender', 'male')}
                >
                  <Text style={[
                    styles.genderText,
                    formData.gender === 'male' && styles.genderTextActive
                  ]}>
                    Male
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    formData.gender === 'female' && styles.genderButtonActive
                  ]}
                  onPress={() => updateFormData('gender', 'female')}
                >
                  <Text style={[
                    styles.genderText,
                    formData.gender === 'female' && styles.genderTextActive
                  ]}>
                    Female
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroupHalf}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={[styles.input, errors.weight && styles.inputError]}
                value={formData.weight}
                onChangeText={(text) => updateFormData('weight', text)}
                placeholder="0.0"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
              />
              {errors.weight && <Text style={styles.errorText}>{errors.weight}</Text>}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Birth Date</Text>
            <TextInput
              style={styles.input}
              value={formData.birth_date}
              onChangeText={(text) => updateFormData('birth_date', text)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => updateFormData('description', text)}
              placeholder="Tell us about your pet's personality, likes, dislikes..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
            {formData.images.map((image, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image source={{ uri: image }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close" size={16} color="white" />
                </TouchableOpacity>
              </View>
            ))}
            
            <TouchableOpacity
              style={styles.addPhotoButton}
              onPress={handleImagePick}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <ActivityIndicator size="small" color="#FF5A5F" />
              ) : (
                <>
                  <Ionicons name="camera" size={24} color="#FF5A5F" />
                  <Text style={styles.addPhotoText}>Add Photo</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Medical Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Information</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Medical Information</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.medical_info}
              onChangeText={(text) => updateFormData('medical_info', text)}
              placeholder="Any medical conditions, allergies, medications..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formGroup}>
            <View style={styles.listHeader}>
              <Text style={styles.label}>Special Needs</Text>
              <TouchableOpacity style={styles.addButton} onPress={addSpecialNeed}>
                <Ionicons name="add" size={20} color="#FF5A5F" />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            
            {formData.special_needs.map((need, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listItemText}>{need}</Text>
                <TouchableOpacity onPress={() => removeSpecialNeed(index)}>
                  <Ionicons name="remove-circle" size={20} color="#FF5A5F" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.formGroup}>
            <View style={styles.listHeader}>
              <Text style={styles.label}>Vaccination Records</Text>
              <TouchableOpacity style={styles.addButton} onPress={addVaccinationRecord}>
                <Ionicons name="add" size={20} color="#FF5A5F" />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            
            {formData.vaccination_records.map((record, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.vaccinationInfo}>
                  <Text style={styles.listItemText}>{record.vaccine}</Text>
                  <Text style={styles.listItemSubtext}>{record.date}</Text>
                </View>
                <TouchableOpacity onPress={() => removeVaccinationRecord(index)}>
                  <Ionicons name="remove-circle" size={20} color="#FF5A5F" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Behavioral Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Behavioral Information</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Behavioral Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.behavioral_notes}
              onChangeText={(text) => updateFormData('behavioral_notes', text)}
              placeholder="How does your pet behave around strangers, other pets, children..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Emergency Contact</Text>
            <TextInput
              style={styles.input}
              value={formData.emergency_contact}
              onChangeText={(text) => updateFormData('emergency_contact', text)}
              placeholder="Emergency contact name and phone number"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#FF5A5F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
  },
  formGroupHalf: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: 'white',
  },
  inputError: {
    borderColor: '#FF5A5F',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: '#FF5A5F',
    marginTop: 4,
  },
  optionsScroll: {
    marginTop: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  optionButtonActive: {
    backgroundColor: '#FF5A5F',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  optionTextActive: {
    color: 'white',
  },
  quickBreeds: {
    marginTop: 8,
  },
  quickBreedsLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  quickBreedButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginRight: 6,
  },
  quickBreedText: {
    fontSize: 12,
    color: '#666',
  },
  genderSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  genderButtonActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  genderText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  genderTextActive: {
    color: '#333',
  },
  photosScroll: {
    marginTop: 8,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 12,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF5A5F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  addPhotoText: {
    fontSize: 12,
    color: '#FF5A5F',
    marginTop: 4,
    textAlign: 'center',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
  },
  addButtonText: {
    fontSize: 14,
    color: '#FF5A5F',
    marginLeft: 4,
    fontWeight: '500',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  listItemText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  listItemSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  vaccinationInfo: {
    flex: 1,
  },
  bottomPadding: {
    height: 40,
  },
});

export default AddPetScreen;