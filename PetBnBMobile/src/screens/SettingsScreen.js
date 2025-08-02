import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SettingsScreen = ({ navigation }) => {
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    locationServices: true,
    marketingEmails: false,
    bookingReminders: true,
  });

  const handleToggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Account Deletion', 'Account deletion feature will be implemented.');
          }
        }
      ]
    );
  };

  const settingSections = [
    {
      title: 'Notifications',
      items: [
        {
          key: 'pushNotifications',
          title: 'Push Notifications',
          subtitle: 'Receive notifications on your device',
          icon: 'notifications-outline',
        },
        {
          key: 'emailNotifications',
          title: 'Email Notifications',
          subtitle: 'Receive updates via email',
          icon: 'mail-outline',
        },
        {
          key: 'smsNotifications',
          title: 'SMS Notifications',
          subtitle: 'Receive text message updates',
          icon: 'chatbubble-outline',
        },
        {
          key: 'bookingReminders',
          title: 'Booking Reminders',
          subtitle: 'Get reminded about upcoming bookings',
          icon: 'alarm-outline',
        },
      ],
    },
    {
      title: 'Privacy & Location',
      items: [
        {
          key: 'locationServices',
          title: 'Location Services',
          subtitle: 'Allow app to access your location',
          icon: 'location-outline',
        },
        {
          key: 'marketingEmails',
          title: 'Marketing Emails',
          subtitle: 'Receive promotional offers and updates',
          icon: 'megaphone-outline',
        },
      ],
    },
  ];

  const accountActions = [
    {
      title: 'Privacy Policy',
      icon: 'shield-outline',
      onPress: () => Alert.alert('Privacy Policy', 'Privacy policy will be displayed here.'),
    },
    {
      title: 'Terms of Service',
      icon: 'document-text-outline',
      onPress: () => Alert.alert('Terms of Service', 'Terms of service will be displayed here.'),
    },
    {
      title: 'Contact Support',
      icon: 'help-circle-outline',
      onPress: () => Alert.alert('Contact Support', 'Support contact options will be available here.'),
    },
    {
      title: 'Rate the App',
      icon: 'star-outline',
      onPress: () => Alert.alert('Rate the App', 'App store rating feature will be implemented.'),
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
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Settings Sections */}
        {settingSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            
            {section.items.map((item) => (
              <View key={item.key} style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <View style={styles.settingIcon}>
                    <Ionicons name={item.icon} size={20} color="#FF5A5F" />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>{item.title}</Text>
                    <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
                
                <Switch
                  value={settings[item.key]}
                  onValueChange={() => handleToggleSetting(item.key)}
                  trackColor={{ false: '#E5E5E5', true: '#FF5A5F' }}
                  thumbColor={settings[item.key] ? 'white' : '#f4f3f4'}
                />
              </View>
            ))}
          </View>
        ))}

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account & Legal</Text>
          
          {accountActions.map((action, index) => (
            <TouchableOpacity 
              key={index}
              style={styles.actionItem}
              onPress={action.onPress}
            >
              <View style={styles.actionLeft}>
                <View style={styles.actionIcon}>
                  <Ionicons name={action.icon} size={20} color="#666" />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerSection}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          
          <TouchableOpacity 
            style={styles.dangerItem}
            onPress={handleDeleteAccount}
          >
            <View style={styles.dangerLeft}>
              <View style={styles.dangerIcon}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </View>
              <View style={styles.dangerInfo}>
                <Text style={styles.dangerTitle}>Delete Account</Text>
                <Text style={styles.dangerSubtitle}>
                  Permanently delete your account and all data
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>PetBnB v1.0.0</Text>
          <Text style={styles.buildText}>Build 2024.12.28</Text>
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
    marginBottom: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF5A5F10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9F9F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  dangerSection: {
    backgroundColor: 'white',
    marginBottom: 20,
    paddingVertical: 16,
  },
  dangerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  dangerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dangerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EF444410',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  dangerInfo: {
    flex: 1,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#EF4444',
    marginBottom: 4,
  },
  dangerSubtitle: {
    fontSize: 14,
    color: '#999',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 40,
  },
  versionText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  buildText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});

export default SettingsScreen;