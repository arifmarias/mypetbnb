import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  async initialize() {
    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }

    // Get the token for push notifications
    if (Device.isDevice) {
      try {
        const token = await Notifications.getExpoPushTokenAsync();
        this.expoPushToken = token.data;
        console.log('Expo Push Token:', this.expoPushToken);
        
        // In a real app, you would send this token to your backend
        // to store it for the current user
        
        return this.expoPushToken;
      } catch (error) {
        console.error('Error getting push token:', error);
        return false;
      }
    } else {
      console.log('Must use physical device for Push Notifications');
      return false;
    }
  }

  setupListeners(navigation) {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // Handle notification received while app is open
    });

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      
      // Handle notification tap - navigate to appropriate screen
      const { data } = response.notification.request.content;
      
      switch (data?.type) {
        case 'booking_confirmed':
          navigation.navigate('Dashboard');
          break;
        case 'new_message':
          navigation.navigate('Messages', { conversationId: data.conversationId });
          break;
        case 'booking_reminder':
          navigation.navigate('Booking', { bookingId: data.bookingId });
          break;
        default:
          // Navigate to home or relevant screen
          navigation.navigate('Home');
      }
    });
  }

  removeListeners() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  // Schedule a local notification
  async scheduleLocalNotification(title, body, data = {}, scheduledTime = null) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: scheduledTime ? { date: scheduledTime } : null,
      });
      
      console.log('Local notification scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  // Cancel a scheduled notification
  async cancelNotification(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('Notification cancelled:', notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  // Cancel all scheduled notifications
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }

  // Send push notification to another user (would be done via your backend)
  async sendPushNotification(expoPushToken, title, body, data = {}) {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data,
    };

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      console.log('Push notification sent:', result);
      return result;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return null;
    }
  }

  // Helper methods for different types of notifications
  async notifyBookingConfirmed(bookingId, serviceName, caregiverName) {
    return await this.scheduleLocalNotification(
      'Booking Confirmed! 🎉',
      `Your ${serviceName} booking with ${caregiverName} has been confirmed.`,
      { type: 'booking_confirmed', bookingId }
    );
  }

  async notifyNewMessage(senderName, messagePreview, conversationId) {
    return await this.scheduleLocalNotification(
      `New message from ${senderName}`,
      messagePreview,
      { type: 'new_message', conversationId }
    );
  }

  async notifyBookingReminder(serviceName, caregiverName, scheduledTime) {
    const reminderTime = new Date(scheduledTime);
    reminderTime.setMinutes(reminderTime.getMinutes() - 30); // 30 minutes before

    return await this.scheduleLocalNotification(
      'Booking Reminder 📅',
      `Your ${serviceName} appointment with ${caregiverName} is starting in 30 minutes.`,
      { type: 'booking_reminder' },
      reminderTime
    );
  }

  async notifyPaymentReceived(amount, serviceName) {
    return await this.scheduleLocalNotification(
      'Payment Received 💰',
      `You received $${amount} for ${serviceName} service.`,
      { type: 'payment_received' }
    );
  }

  async notifyReviewRequest(serviceName, petOwnerName) {
    return await this.scheduleLocalNotification(
      'Rate Your Experience ⭐',
      `How was your ${serviceName} experience with ${petOwnerName}?`,
      { type: 'review_request' }
    );
  }
}

// Export a singleton instance
const notificationService = new NotificationService();
export default notificationService;