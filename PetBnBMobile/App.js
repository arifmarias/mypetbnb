import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View, Text, Alert, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EmailVerificationScreen from './src/screens/EmailVerificationScreen';

// Context
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ToastProvider } from './src/context/ToastContext';

// Services
import notificationService from './src/components/NotificationService';

// Screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import PetOwnerDashboard from './src/screens/PetOwnerDashboard';
import CaregiverDashboard from './src/screens/CaregiverDashboard';
import BookingScreen from './src/screens/BookingScreen';
import PetDetailsScreen from './src/screens/PetDetailsScreen';
import ServiceDetailsScreen from './src/screens/ServiceDetailsScreen';
import AddPetScreen from './src/screens/AddPetScreen';
import ChatScreen from './src/screens/ChatScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import PaymentMethodsScreen from './src/screens/PaymentMethodsScreen';
import MyServicesScreen from './src/screens/MyServicesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';
import AboutScreen from './src/screens/AboutScreen';

// NEW: Booking Management Screens
import BookingDetailsScreen from './src/screens/BookingDetailsScreen';
import BookingManagementScreen from './src/screens/BookingManagementScreen';

// Suppress specific warnings
LogBox.ignoreLogs([
  'Warning: AsyncStorage has been extracted from react-native core',
]);

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator for authenticated users
function TabNavigator() {
  const { user } = useAuth();
  
  // Fix: Get user role properly - check both possible field names
  const userRole = user?.user_type || user?.role;
  
  // Debug logging
  console.log('TabNavigator - User object:', user);
  console.log('TabNavigator - User role:', userRole);
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Dashboard') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF5A5F',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen 
        name="Dashboard" 
        component={userRole === 'pet_owner' ? PetOwnerDashboard : CaregiverDashboard} 
      />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Auth Navigator for non-authenticated users
function AuthNavigator() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// Main App Navigator
function AppNavigator() {
  const { user, loading } = useAuth();
  
  // Initialize notifications when app starts
  useEffect(() => {
    if (!loading) {
      initializeNotifications();
    }
  }, [loading]);

  const initializeNotifications = async () => {
    try {
      const pushToken = await notificationService.initialize();
      if (pushToken) {
        console.log('Push notifications initialized with token:', pushToken);
      }
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  };
  
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FF5A5F' }}>
        <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>PetBnB</Text>
      </View>
    );
  }
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          {/* Check if email is verified */}
          {!user.email_verified ? (
            <Stack.Screen 
              name="EmailVerification" 
              component={EmailVerificationScreen}
              options={{ gestureEnabled: false }}
            />
          ) : (
            <>
              {/* Main App Screens */}
              <Stack.Screen name="MainTabs" component={TabNavigator} />
              
              {/* Modal/Detail Screens */}
              <Stack.Screen 
                name="BookingDetails" 
                component={BookingDetailsScreen}
                options={{
                  presentation: 'modal',
                  headerShown: true,
                  title: 'Booking Details'
                }}
              />
              <Stack.Screen 
                name="BookingManagement" 
                component={BookingManagementScreen}
                options={{
                  headerShown: true,
                  title: 'My Bookings'
                }}
              />
              <Stack.Screen 
                name="Booking" 
                component={BookingScreen}
                options={{
                  headerShown: true,
                  title: 'Create Booking'
                }}
              />
              <Stack.Screen 
                name="PetDetails" 
                component={PetDetailsScreen}
                options={{
                  headerShown: true,
                  title: 'Pet Details'
                }}
              />
              <Stack.Screen 
                name="ServiceDetails" 
                component={ServiceDetailsScreen}
                options={{
                  headerShown: true,
                  title: 'Service Details'
                }}
              />
              <Stack.Screen 
                name="AddPet" 
                component={AddPetScreen}
                options={{
                  headerShown: true,
                  title: 'Add Pet'
                }}
              />
              <Stack.Screen 
                name="Chat" 
                component={ChatScreen}
                options={{
                  headerShown: true,
                  title: 'Chat'
                }}
              />
              <Stack.Screen 
                name="EditProfile" 
                component={EditProfileScreen}
                options={{
                  headerShown: true,
                  title: 'Edit Profile'
                }}
              />
              <Stack.Screen 
                name="PaymentMethods" 
                component={PaymentMethodsScreen}
                options={{
                  headerShown: true,
                  title: 'Payment Methods'
                }}
              />
              <Stack.Screen 
                name="MyServices" 
                component={MyServicesScreen}
                options={{
                  headerShown: true,
                  title: 'My Services'
                }}
              />
              <Stack.Screen 
                name="Settings" 
                component={SettingsScreen}
                options={{
                  headerShown: true,
                  title: 'Settings'
                }}
              />
              <Stack.Screen 
                name="HelpSupport" 
                component={HelpSupportScreen}
                options={{
                  headerShown: true,
                  title: 'Help & Support'
                }}
              />
              <Stack.Screen 
                name="About" 
                component={AboutScreen}
                options={{
                  headerShown: true,
                  title: 'About PetBnB'
                }}
              />
            </>
          )}
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Keep the splash screen visible while we fetch resources
        await SplashScreen.preventAutoHideAsync();
        
        // Pre-load fonts, make any API calls you need to do here
        // For now, we'll just simulate some loading time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AuthProvider>
          <ToastProvider>
            <AppNavigator />
            <StatusBar style="auto" />
          </ToastProvider>
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}