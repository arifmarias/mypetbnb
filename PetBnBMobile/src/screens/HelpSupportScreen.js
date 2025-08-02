import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const HelpSupportScreen = ({ navigation }) => {
  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@petbnb.com?subject=PetBnB Support Request');
  };

  const handlePhoneSupport = () => {
    Linking.openURL('tel:+6512345678');
  };

  const handleWhatsAppSupport = () => {
    Linking.openURL('https://wa.me/6512345678');
  };

  const handleFAQ = (question) => {
    Alert.alert('FAQ', `This will show detailed information about: ${question}`);
  };

  const supportOptions = [
    {
      title: 'Email Support',
      subtitle: 'support@petbnb.com',
      icon: 'mail-outline',
      onPress: handleEmailSupport,
    },
    {
      title: 'Phone Support',
      subtitle: '+65 1234 5678',
      icon: 'call-outline',
      onPress: handlePhoneSupport,
    },
    {
      title: 'WhatsApp Support',
      subtitle: 'Chat with us on WhatsApp',
      icon: 'logo-whatsapp',
      onPress: handleWhatsAppSupport,
    },
  ];

  const faqItems = [
    {
      question: 'How do I book a pet care service?',
      category: 'Booking',
    },
    {
      question: 'What payment methods are accepted?',
      category: 'Payment',
    },
    {
      question: 'How do I become a pet caregiver?',
      category: 'Caregiver',
    },
    {
      question: 'What if my pet has special needs?',
      category: 'Pet Care',
    },
    {
      question: 'How do I cancel a booking?',
      category: 'Booking',
    },
    {
      question: 'How are caregivers verified?',
      category: 'Safety',
    },
    {
      question: 'What happens in an emergency?',
      category: 'Safety',
    },
    {
      question: 'How do I update my profile?',
      category: 'Account',
    },
  ];

  const quickActions = [
    {
      title: 'Report an Issue',
      subtitle: 'Report problems with the app or service',
      icon: 'warning-outline',
      color: '#F59E0B',
      onPress: () => Alert.alert('Report Issue', 'Issue reporting form will be available here.'),
    },
    {
      title: 'Request Feature',
      subtitle: 'Suggest new features or improvements',
      icon: 'bulb-outline',
      color: '#8B5CF6',
      onPress: () => Alert.alert('Feature Request', 'Feature request form will be available here.'),
    },
    {
      title: 'Safety Center',
      subtitle: 'Learn about safety guidelines',
      icon: 'shield-outline',
      color: '#10B981',
      onPress: () => Alert.alert('Safety Center', 'Safety guidelines and resources will be displayed here.'),
    },
  ];

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
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Contact Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          <Text style={styles.sectionSubtitle}>
            Our support team is here to help you 24/7
          </Text>
          
          {supportOptions.map((option, index) => (
            <TouchableOpacity 
              key={index}
              style={styles.supportOption}
              onPress={option.onPress}
            >
              <View style={styles.supportIcon}>
                <Ionicons name={option.icon} size={24} color="#FF5A5F" />
              </View>
              <View style={styles.supportInfo}>
                <Text style={styles.supportTitle}>{option.title}</Text>
                <Text style={styles.supportSubtitle}>{option.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          {quickActions.map((action, index) => (
            <TouchableOpacity 
              key={index}
              style={styles.actionOption}
              onPress={action.onPress}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}>
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          
          {faqItems.map((item, index) => (
            <TouchableOpacity 
              key={index}
              style={styles.faqItem}
              onPress={() => handleFAQ(item.question)}
            >
              <View style={styles.faqContent}>
                <Text style={styles.faqQuestion}>{item.question}</Text>
                <Text style={styles.faqCategory}>{item.category}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity style={styles.viewAllFAQ}>
            <Text style={styles.viewAllText}>View All FAQs</Text>
            <Ionicons name="arrow-forward" size={16} color="#FF5A5F" />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Updated</Text>
            <Text style={styles.infoValue}>December 28, 2024</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Support Hours</Text>
            <Text style={styles.infoValue}>24/7</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Response Time</Text>
            <Text style={styles.infoValue}>Within 2 hours</Text>
          </View>
        </View>

        {/* Emergency Contact */}
        <View style={styles.emergencySection}>
          <View style={styles.emergencyHeader}>
            <Ionicons name="warning" size={24} color="#EF4444" />
            <Text style={styles.emergencyTitle}>Emergency Contact</Text>
          </View>
          <Text style={styles.emergencyText}>
            For pet emergencies during a booking, contact your caregiver immediately. 
            For urgent app issues, call our 24/7 support line.
          </Text>
          <TouchableOpacity style={styles.emergencyButton} onPress={handlePhoneSupport}>
            <Ionicons name="call" size={20} color="white" />
            <Text style={styles.emergencyButtonText}>Call Emergency Support</Text>
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
    marginBottom: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 20,
    marginBottom: 16,
    lineHeight: 20,
  },
  supportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  supportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF5A5F10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  supportInfo: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  supportSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  actionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  faqContent: {
    flex: 1,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  faqCategory: {
    fontSize: 12,
    color: '#FF5A5F',
    fontWeight: '600',
  },
  viewAllFAQ: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 16,
    color: '#FF5A5F',
    fontWeight: '600',
    marginRight: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  emergencySection: {
    backgroundColor: '#FEF2F2',
    marginBottom: 32,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 12,
  },
  emergencyText: {
    fontSize: 14,
    color: '#7F1D1D',
    lineHeight: 20,
    marginBottom: 16,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  emergencyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HelpSupportScreen;