import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [notifications, setNotifications] = useState(true);
  const [profileStats, setProfileStats] = useState({
    completedBookings: 0,
    totalReviews: 0,
    averageRating: 0,
    memberSince: '2024',
    totalEarnings: 0,
    activeServices: 0,
  });

  useEffect(() => {
    if (user) {
      // Mock profile stats - replace with API calls
      if (user.role === 'pet_owner') {
        setProfileStats({
          completedBookings: 12,
          totalReviews: 8,
          averageRating: 4.8,
          memberSince: '2024',
        });
      } else {
        setProfileStats({
          completedBookings: 48,
          totalReviews: 32,
          averageRating: 4.9,
          memberSince: '2024',
          totalEarnings: 2400,
          activeServices: 5,
        });
      }
    }
  }, [user]);

  // Pet Owner Menu Items
  const petOwnerMenuItems = [
    {
      id: 'edit_profile',
      title: 'Edit Profile',
      icon: 'person-outline',
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      id: 'my_pets',
      title: 'My Pets',
      icon: 'heart-outline',
      onPress: () => navigation.navigate('MyPets'),
    },
    {
      id: 'booking_management',
      title: 'My Bookings',
      icon: 'calendar-outline',
      onPress: () => navigation.navigate('BookingManagement'),
    },
    {
      id: 'booking_history',
      title: 'Booking History',
      icon: 'time-outline',
      onPress: () => navigation.navigate('BookingHistory'),
    },
    {
      id: 'favorites',
      title: 'Favorite Caregivers',
      icon: 'bookmark-outline',
      onPress: () => navigation.navigate('Favorites'),
    },
    {
      id: 'reviews_given',
      title: 'My Reviews',
      icon: 'star-outline',
      onPress: () => navigation.navigate('MyReviews'),
    },
    {
      id: 'payment_methods',
      title: 'Payment Methods',
      icon: 'card-outline',
      onPress: () => navigation.navigate('PaymentMethods'),
    },
    {
      id: 'emergency_contacts',
      title: 'Emergency Contacts',
      icon: 'call-outline',
      onPress: () => navigation.navigate('EmergencyContacts'),
    },
  ];

  // Caregiver Menu Items
  const caregiverMenuItems = [
    {
      id: 'edit_profile',
      title: 'Edit Profile',
      icon: 'person-outline',
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      id: 'my_services',
      title: 'My Services',
      icon: 'grid-outline',
      onPress: () => navigation.navigate('MyServices'),
    },
    {
      id: 'calendar',
      title: 'Calendar & Availability',
      icon: 'calendar-outline',
      onPress: () => navigation.navigate('Calendar'),
    },
    {
      id: 'booking_management',
      title: 'Booking Management',
      icon: 'clipboard-outline',
      onPress: () => navigation.navigate('BookingManagement'),
    },
    {
      id: 'earnings',
      title: 'Earnings & Payouts',
      icon: 'wallet-outline',
      onPress: () => navigation.navigate('Earnings'),
    },
    {
      id: 'reviews_received',
      title: 'Reviews & Ratings',
      icon: 'star-outline',
      onPress: () => navigation.navigate('Reviews'),
    },
    {
      id: 'certifications',
      title: 'Certifications',
      icon: 'ribbon-outline',
      onPress: () => navigation.navigate('Certifications'),
    },
    {
      id: 'background_check',
      title: 'Background Verification',
      icon: 'shield-checkmark-outline',
      onPress: () => navigation.navigate('BackgroundCheck'),
    },
  ];

  // Common Menu Items
  const commonMenuItems = [
    {
      id: 'settings',
      title: 'Settings',
      icon: 'settings-outline',
      onPress: () => navigation.navigate('Settings'),
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: 'help-circle-outline',
      onPress: () => navigation.navigate('HelpSupport'),
    },
    {
      id: 'about',
      title: 'About PetBnB',
      icon: 'information-circle-outline',
      onPress: () => navigation.navigate('About'),
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              toast.success('Signed out successfully');
            } catch (error) {
              toast.error('Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const handleRoleSwitch = () => {
    Alert.alert(
      'Switch Role',
      user?.role === 'pet_owner' 
        ? 'Become a Pet Caregiver and start earning by providing pet care services.'
        : 'Switch back to Pet Owner mode to book services for your pets.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: user?.role === 'pet_owner' ? 'Become Caregiver' : 'Switch to Pet Owner',
          onPress: () => {
            // This would make an API call to switch roles
            toast.success('Role switch request submitted for review');
          },
        },
      ]
    );
  };

  const menuItems = user?.role === 'pet_owner' ? petOwnerMenuItems : caregiverMenuItems;
  const allMenuItems = [...menuItems, ...commonMenuItems];

  const renderStatsSection = () => {
    if (user?.role === 'pet_owner') {
      return (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profileStats.completedBookings}</Text>
            <Text style={styles.statLabel}>Services Used</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profileStats.totalReviews}</Text>
            <Text style={styles.statLabel}>Reviews Given</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.statNumber}>{profileStats.averageRating}</Text>
            </View>
            <Text style={styles.statLabel}>My Rating</Text>
          </View>
        </View>
      );
    } else {
      return (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>RM{profileStats.totalEarnings}</Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profileStats.completedBookings}</Text>
            <Text style={styles.statLabel}>Services Provided</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.statNumber}>{profileStats.averageRating}</Text>
            </View>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>
      );
    }
  };

  const renderMenuItem = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={item.onPress}
    >
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIconContainer}>
          <Ionicons name={item.icon} size={22} color="#666" />
        </View>
        <Text style={styles.menuItemText}>{item.title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="create-outline" size={24} color="#FF5A5F" />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user?.first_name?.charAt(0) || '') + (user?.last_name?.charAt(0) || '') || 'U'}
                </Text>
              </View>
              <TouchableOpacity style={styles.avatarEditButton}>
                <Ionicons name="camera" size={16} color="white" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>
                {user ? `${user.first_name} ${user.last_name}` : 'User'}
              </Text>
              <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
              <View style={styles.roleContainer}>
                <Ionicons 
                  name={user?.role === 'pet_owner' ? 'heart' : 'shield-checkmark'} 
                  size={16} 
                  color="#FF5A5F" 
                />
                <Text style={styles.roleText}>
                  {user?.role === 'pet_owner' ? 'Pet Owner' : 'Pet Caregiver'}
                </Text>
                {user?.role === 'caregiver' && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </View>
              <Text style={styles.memberSince}>
                Member since {profileStats.memberSince}
              </Text>
            </View>
          </View>

          {/* Stats */}
          {renderStatsSection()}
        </View>

        {/* Role Switch Card */}
        <View style={styles.roleSwitchCard}>
          <View style={styles.roleSwitchHeader}>
            <Ionicons 
              name={user?.role === 'pet_owner' ? 'business-outline' : 'home-outline'} 
              size={24} 
              color="#FF5A5F" 
            />
            <View style={styles.roleSwitchInfo}>
              <Text style={styles.roleSwitchTitle}>
                {user?.role === 'pet_owner' ? 'Become a Pet Caregiver' : 'Switch to Pet Owner'}
              </Text>
              <Text style={styles.roleSwitchSubtitle}>
                {user?.role === 'pet_owner' 
                  ? 'Start earning by providing pet care services'
                  : 'Book services for your pets'
                }
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.roleSwitchButton} onPress={handleRoleSwitch}>
            <Text style={styles.roleSwitchButtonText}>
              {user?.role === 'pet_owner' ? 'Get Started' : 'Switch Mode'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {allMenuItems.map(renderMenuItem)}
        </View>

        {/* Notification Settings */}
        <View style={styles.settingsSection}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={22} color="#666" />
              <Text style={styles.settingText}>Push Notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#E5E7EB', true: '#FF5A5F40' }}
              thumbColor={notifications ? '#FF5A5F' : '#9CA3AF'}
            />
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#FF5A5F" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    padding: 8,
  },
  profileSection: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF5A5F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  roleText: {
    fontSize: 16,
    color: '#FF5A5F',
    fontWeight: '600',
    marginLeft: 6,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  verifiedText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
    marginLeft: 4,
  },
  memberSince: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    marginTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleSwitchCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  roleSwitchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  roleSwitchInfo: {
    flex: 1,
    marginLeft: 12,
  },
  roleSwitchTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  roleSwitchSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  roleSwitchButton: {
    backgroundColor: '#FF5A5F',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  roleSwitchButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  menuSection: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  settingsSection: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginLeft: 16,
  },
  logoutSection: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF5A5F20',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF5A5F',
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomPadding: {
    height: 40,
  },
});

export default ProfileScreen;