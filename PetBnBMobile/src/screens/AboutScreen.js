import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AboutScreen = ({ navigation }) => {
  const handleOpenURL = (url) => {
    Linking.openURL(url);
  };

  const teamMembers = [
    {
      name: 'Sarah Johnson',
      role: 'Founder & CEO',
      bio: 'Pet lover with 10+ years in tech',
    },
    {
      name: 'Michael Chen',
      role: 'Head of Operations',
      bio: 'Expert in pet care and safety',
    },
    {
      name: 'Emily Davis',
      role: 'Lead Developer',
      bio: 'Building the future of pet care',
    },
  ];

  const appStats = [
    { label: 'Pet Owners', value: '10,000+' },
    { label: 'Caregivers', value: '5,000+' },
    { label: 'Cities', value: '25+' },
    { label: 'Happy Pets', value: '50,000+' },
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
        <Text style={styles.headerTitle}>About PetBnB</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* App Logo & Title */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="heart" size={48} color="#FF5A5F" />
          </View>
          <Text style={styles.appName}>PetBnB</Text>
          <Text style={styles.appTagline}>Your Pet's Home Away From Home</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>

        {/* Mission Statement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.missionText}>
            At PetBnB, we believe every pet deserves the best care possible. We connect loving pet owners 
            with trusted caregivers in Malaysia and Singapore, creating a community where pets are treated 
            like family, even when you're away.
          </Text>
        </View>

        {/* App Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Community</Text>
          <View style={styles.statsContainer}>
            {appStats.map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What We Offer</Text>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="home" size={24} color="#FF5A5F" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Pet Boarding</Text>
              <Text style={styles.featureDescription}>
                Safe and comfortable overnight stays for your pets
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="walk" size={24} color="#FF5A5F" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Dog Walking</Text>
              <Text style={styles.featureDescription}>
                Regular exercise and outdoor adventures for your dogs
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="cut" size={24} color="#FF5A5F" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Pet Grooming</Text>
              <Text style={styles.featureDescription}>
                Professional grooming services to keep your pets looking great
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="time" size={24} color="#FF5A5F" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Pet Sitting</Text>
              <Text style={styles.featureDescription}>
                In-home care and companionship for your beloved pets
              </Text>
            </View>
          </View>
        </View>

        {/* Team */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meet Our Team</Text>
          
          {teamMembers.map((member, index) => (
            <View key={index} style={styles.teamMember}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberInitial}>
                  {member.name.split(' ').map(n => n.charAt(0)).join('')}
                </Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberRole}>{member.role}</Text>
                <Text style={styles.memberBio}>{member.bio}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Contact & Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connect With Us</Text>
          
          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => handleOpenURL('https://www.petbnb.com')}
          >
            <Ionicons name="globe-outline" size={24} color="#FF5A5F" />
            <Text style={styles.linkText}>www.petbnb.com</Text>
            <Ionicons name="open-outline" size={16} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => handleOpenURL('mailto:hello@petbnb.com')}
          >
            <Ionicons name="mail-outline" size={24} color="#FF5A5F" />
            <Text style={styles.linkText}>hello@petbnb.com</Text>
            <Ionicons name="open-outline" size={16} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => handleOpenURL('https://facebook.com/petbnb')}
          >
            <Ionicons name="logo-facebook" size={24} color="#FF5A5F" />
            <Text style={styles.linkText}>Follow us on Facebook</Text>
            <Ionicons name="open-outline" size={16} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => handleOpenURL('https://instagram.com/petbnb')}
          >
            <Ionicons name="logo-instagram" size={24} color="#FF5A5F" />
            <Text style={styles.linkText}>Follow us on Instagram</Text>
            <Ionicons name="open-outline" size={16} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          
          <TouchableOpacity style={styles.legalItem}>
            <Text style={styles.legalText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={16} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.legalItem}>
            <Text style={styles.legalText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={16} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.legalItem}>
            <Text style={styles.legalText}>Cookie Policy</Text>
            <Ionicons name="chevron-forward" size={16} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Copyright */}
        <View style={styles.copyrightSection}>
          <Text style={styles.copyrightText}>
            © 2024 PetBnB. All rights reserved.
          </Text>
          <Text style={styles.copyrightSubtext}>
            Made with ❤️ for pet lovers everywhere
          </Text>
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
  logoSection: {
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 40,
    marginBottom: 16,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF5A5F10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  appVersion: {
    fontSize: 14,
    color: '#999',
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  missionText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF5A5F',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF5A5F10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  teamMember: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF5A5F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  memberInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 14,
    color: '#FF5A5F',
    fontWeight: '500',
    marginBottom: 4,
  },
  memberBio: {
    fontSize: 14,
    color: '#666',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  linkText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
  },
  legalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  legalText: {
    fontSize: 16,
    color: '#333',
  },
  copyrightSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    marginBottom: 32,
  },
  copyrightText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  copyrightSubtext: {
    fontSize: 12,
    color: '#999',
  },
});

export default AboutScreen;