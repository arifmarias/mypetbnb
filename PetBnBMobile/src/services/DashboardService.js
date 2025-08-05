// src/services/DashboardService.js
import { bookingsAPI, petsAPI, statsAPI, servicesAPI } from './api';
import { handleApiError } from './api';

class DashboardService {
  
  // Pet Owner Dashboard Data
  async getPetOwnerDashboardData(userId) {
    try {
      console.log('Loading Pet Owner Dashboard Data for user:', userId);
      
      const [stats, upcomingBookings, recentBookings, pets] = await Promise.allSettled([
        this.getPetOwnerStats(userId),
        bookingsAPI.getUpcomingBookings(),
        bookingsAPI.getBookingHistory({ limit: 5 }),
        petsAPI.getPets()
      ]);

      // Handle each promise result safely
      const statsData = stats.status === 'fulfilled' ? stats.value : this.getDefaultPetOwnerStats();
      const upcomingData = upcomingBookings.status === 'fulfilled' ? (upcomingBookings.value?.data || []) : [];
      const recentData = recentBookings.status === 'fulfilled' ? (recentBookings.value?.data || []) : [];
      const petsData = pets.status === 'fulfilled' ? (pets.value?.data || []) : [];

      // Log for debugging
      console.log('Stats result:', stats);
      console.log('Upcoming bookings result:', upcomingBookings);
      console.log('Recent bookings result:', recentBookings);

      return {
        stats: statsData,
        upcomingBookings: upcomingData.map(booking => this.formatBookingForDisplay(booking, 'pet_owner')),
        recentBookings: recentData.slice(0, 5).map(booking => this.formatBookingForDisplay(booking, 'pet_owner')),
        pets: petsData,
        error: null
      };
    } catch (error) {
      console.error('Pet Owner Dashboard Data Error:', error);
      return {
        stats: this.getDefaultPetOwnerStats(),
        upcomingBookings: [],
        recentBookings: [],
        pets: [],
        error: handleApiError(error)
      };
    }
  }

  // Caregiver Dashboard Data
  async getCaregiverDashboardData(userId) {
    try {
      console.log('Loading Caregiver Dashboard Data for user:', userId);
      
      const [stats, earnings, todayBookings, upcomingBookings, services] = await Promise.allSettled([
        this.getCaregiverStats(userId),
        this.getCaregiverEarnings(userId),
        bookingsAPI.getTodayBookings(),
        bookingsAPI.getUpcomingBookings(),
        servicesAPI.getServices()
      ]);

      // Handle each promise result safely
      const statsData = stats.status === 'fulfilled' ? stats.value : this.getDefaultCaregiverStats();
      const earningsData = earnings.status === 'fulfilled' ? earnings.value : this.getDefaultEarnings();
      const todayData = todayBookings.status === 'fulfilled' ? (todayBookings.value?.data || []) : [];
      const upcomingData = upcomingBookings.status === 'fulfilled' ? (upcomingBookings.value?.data || []) : [];
      const servicesData = services.status === 'fulfilled' ? (services.value?.data || []) : [];

      return {
        stats: statsData,
        earnings: earningsData,
        todayBookings: todayData.map(booking => this.formatBookingForDisplay(booking, 'caregiver')),
        upcomingBookings: upcomingData.map(booking => this.formatBookingForDisplay(booking, 'caregiver')),
        services: servicesData,
        error: null
      };
    } catch (error) {
      console.error('Caregiver Dashboard Data Error:', error);
      return {
        stats: this.getDefaultCaregiverStats(),
        earnings: this.getDefaultEarnings(),
        todayBookings: [],
        upcomingBookings: [],
        services: [],
        error: handleApiError(error)
      };
    }
  }

  // Pet Owner Statistics
  async getPetOwnerStats(userId) {
    try {
      console.log('Fetching pet owner stats...');
      const response = await statsAPI.getUserStats();
      console.log('Pet owner stats response:', response.data);
      
      return {
        totalBookings: response.data.total_bookings || 0,
        activePets: response.data.active_pets || 0,
        upcomingServices: response.data.upcoming_services || 0,
        totalSpent: response.data.total_spent || 0,
        averageRating: response.data.average_rating || 0,
        completedBookings: response.data.completed_bookings || 0,
        favoriteCount: response.data.favorite_caregivers || 0
      };
    } catch (error) {
      console.error('Pet Owner Stats Error:', error);
      throw error;
    }
  }

  // Caregiver Statistics
  async getCaregiverStats(userId) {
    try {
      console.log('Fetching caregiver stats...');
      const response = await statsAPI.getCaregiverStats();
      console.log('Caregiver stats response:', response.data);
      
      return {
        rating: response.data.average_rating || 0,
        totalBookings: response.data.total_bookings || 0,
        completedBookings: response.data.completed_bookings || 0,
        totalReviews: response.data.total_reviews || 0,
        responseRate: response.data.response_rate || 0,
        acceptanceRate: response.data.acceptance_rate || 0,
        activeServices: response.data.active_services || 0
      };
    } catch (error) {
      console.error('Caregiver Stats Error:', error);
      throw error;
    }
  }

  // Caregiver Earnings
  async getCaregiverEarnings(userId) {
    try {
      console.log('Fetching caregiver earnings...');
      const response = await statsAPI.getCaregiverEarnings();
      console.log('Caregiver earnings response:', response.data);
      
      return {
        thisMonth: response.data.current_month_earnings || 0,
        totalEarnings: response.data.total_earnings || 0,
        lastMonth: response.data.last_month_earnings || 0,
        thisWeek: response.data.current_week_earnings || 0,
        pendingPayouts: response.data.pending_payouts || 0,
        completedPayouts: response.data.completed_payouts || 0
      };
    } catch (error) {
      console.error('Caregiver Earnings Error:', error);
      throw error;
    }
  }

  // Format booking data for display
  formatBookingForDisplay(booking, userType) {
    if (!booking) return null;
    
    const isOwner = userType === 'pet_owner';
    
    return {
      id: booking.id,
      service: booking.caregiver_services?.title || booking.service_name || 'Unknown Service',
      date: this.formatDate(booking.start_datetime),
      time: this.formatTime(booking.start_datetime),
      status: booking.booking_status,
      amount: parseFloat(booking.total_amount || booking.amount || 0),
      duration: this.calculateDuration(booking.start_datetime, booking.end_datetime),
      location: booking.location || 'Not specified',
      
      // Owner-specific data
      caregiver: isOwner && booking.caregiver_profiles ? {
        name: `${booking.caregiver_profiles.users?.first_name || ''} ${booking.caregiver_profiles.users?.last_name || ''}`.trim(),
        rating: booking.caregiver_profiles.rating || 0,
        image: booking.caregiver_profiles.users?.profile_image_url
      } : null,
      
      // Caregiver-specific data
      owner: !isOwner && booking.users ? {
        name: `${booking.users.first_name || ''} ${booking.users.last_name || ''}`.trim(),
        image: booking.users.profile_image_url
      } : null,
      
      // Pet information - handle both array and single pet
      pets: this.formatPetsData(booking.pets),
      
      // Additional details
      specialRequests: booking.special_requirements,
      emergencyContact: booking.emergency_contact,
      paymentStatus: booking.payment_status,
      rating: booking.rating,
      review: booking.review_text
    };
  }

  // Helper to format pets data safely
  formatPetsData(pets) {
    if (!pets) return [];
    
    // Handle single pet object
    if (pets && typeof pets === 'object' && !Array.isArray(pets)) {
      return [pets];
    }
    
    // Handle array of pets
    if (Array.isArray(pets)) {
      return pets.filter(pet => pet != null);
    }
    
    return [];
  }

  // Helper methods
  formatDate(dateString) {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }

  formatTime(dateString) {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  }

  calculateDuration(startDateTime, endDateTime) {
    if (!startDateTime || !endDateTime) return '';
    try {
      const start = new Date(startDateTime);
      const end = new Date(endDateTime);
      const diffHours = Math.abs(end - start) / 36e5; // Convert milliseconds to hours
      
      if (diffHours < 1) {
        return `${Math.round(diffHours * 60)} minutes`;
      } else if (diffHours < 24) {
        return `${Math.round(diffHours)} hours`;
      } else {
        const days = Math.round(diffHours / 24);
        return `${days} day${days > 1 ? 's' : ''}`;
      }
    } catch (error) {
      console.error('Error calculating duration:', error);
      return '';
    }
  }

  // Default fallback data
  getDefaultPetOwnerStats() {
    return {
      totalBookings: 0,
      activePets: 0,
      upcomingServices: 0,
      totalSpent: 0,
      averageRating: 0,
      completedBookings: 0,
      favoriteCount: 0
    };
  }

  getDefaultCaregiverStats() {
    return {
      rating: 0,
      totalBookings: 0,
      completedBookings: 0,
      totalReviews: 0,
      responseRate: 0,
      acceptanceRate: 0,
      activeServices: 0
    };
  }

  getDefaultEarnings() {
    return {
      thisMonth: 0,
      totalEarnings: 0,
      lastMonth: 0,
      thisWeek: 0,
      pendingPayouts: 0,
      completedPayouts: 0
    };
  }

  // Booking actions
  async acceptBooking(bookingId) {
    try {
      const response = await bookingsAPI.updateBookingStatus(bookingId, 'confirmed');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Accept Booking Error:', error);
      return { success: false, error: handleApiError(error) };
    }
  }

  async declineBooking(bookingId, reason = '') {
    try {
      const response = await bookingsAPI.updateBookingStatus(bookingId, 'rejected', { reason });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Decline Booking Error:', error);
      return { success: false, error: handleApiError(error) };
    }
  }

  async startService(bookingId) {
    try {
      const response = await bookingsAPI.updateBookingStatus(bookingId, 'in_progress');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Start Service Error:', error);
      return { success: false, error: handleApiError(error) };
    }
  }

  async completeService(bookingId) {
    try {
      const response = await bookingsAPI.updateBookingStatus(bookingId, 'completed');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Complete Service Error:', error);
      return { success: false, error: handleApiError(error) };
    }
  }

  async cancelBooking(bookingId, reason = '') {
    try {
      const response = await bookingsAPI.updateBookingStatus(bookingId, 'cancelled', { reason });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Cancel Booking Error:', error);
      return { success: false, error: handleApiError(error) };
    }
  }

  // Cache management
  clearCache() {
    console.log('Dashboard cache cleared');
  }

  // Real-time updates (for future WebSocket integration)
  onBookingUpdate(callback) {
    console.log('Booking update listener registered');
    return () => console.log('Booking update listener removed');
  }
}

// Export singleton instance
export default new DashboardService();