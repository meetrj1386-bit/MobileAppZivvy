import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleTomorrowOnly } from './notificationHandler';

export const NotificationManager = {
  // Check if vacation mode is active
  isVacationMode: async () => {
    const mode = await AsyncStorage.getItem('vacationMode');
    return mode === 'true';
  },

  // Check if today is skipped
  isTodaySkipped: async () => {
    const skipDate = await AsyncStorage.getItem('skipDate');
    if (skipDate) {
      const today = new Date().toDateString();
      return skipDate === today;
    }
    return false;
  },

  // Skip today's reminders
  skipToday: async () => {
    const today = new Date();
    await AsyncStorage.setItem('skipDate', today.toDateString());
    
    // Cancel all current notifications (safer than trying to filter by day)
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // Reschedule tomorrow's notifications (skipping today)
    const data = await AsyncStorage.getItem('therapyFormData');
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.remindersEnabled && parsed.dailySchedule) {
        // This will schedule tomorrow's notifications, effectively skipping today
        await scheduleTomorrowOnly(parsed.dailySchedule, parsed);
      }
    }
    
    // Auto-clear skip date at midnight
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow.getTime() - today.getTime();
    setTimeout(() => {
      AsyncStorage.removeItem('skipDate');
    }, timeUntilMidnight);

    console.log("Today's reminders skipped, tomorrow's notifications scheduled");
  },

  // Enable/disable vacation mode
  setVacationMode: async (enabled) => {
    await AsyncStorage.setItem('vacationMode', enabled ? 'true' : 'false');
    
    if (enabled) {
      // Cancel all notifications
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Vacation mode enabled - all notifications cancelled');
    } else {
      // Reschedule using your main system
      const data = await AsyncStorage.getItem('therapyFormData');
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.remindersEnabled && parsed.dailySchedule) {
          await scheduleTomorrowOnly(parsed.dailySchedule, parsed);
          console.log('Vacation mode disabled - notifications rescheduled');
        }
      }
    }
  },

  // Check quiet hours
  isQuietHours: async () => {
    const settings = await AsyncStorage.getItem('appSettings');
    if (!settings) return false;
    
    const { quietHoursEnabled, quietHoursStart, quietHoursEnd } = JSON.parse(settings);
    if (!quietHoursEnabled) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = quietHoursStart.split(':').map(Number);
    const [endHour, endMin] = quietHoursEnd.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    // Handle overnight quiet hours
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime < endTime;
    }
    
    return currentTime >= startTime && currentTime < endTime;
  },

  // Test notification
  sendTestNotification: async () => {
    // Check if vacation mode or today is skipped first
    const isVacation = await NotificationManager.isVacationMode();
    const isSkipped = await NotificationManager.isTodaySkipped();
    const isQuiet = await NotificationManager.isQuietHours();
    
    if (isVacation) {
      console.log('Test notification blocked - vacation mode active');
      return false;
    }
    
    if (isSkipped) {
      console.log('Test notification blocked - today is skipped');
      return false;
    }
    
    if (isQuiet) {
      console.log('Test notification blocked - quiet hours active');
      return false;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test Reminder",
        body: "Your reminders are working correctly!",
      },
      trigger: { seconds: 2 },
    });
    
    console.log('Test notification sent');
    return true;
  },

  // Force refresh notifications (useful after settings changes)
  refreshNotifications: async () => {
    const isVacation = await NotificationManager.isVacationMode();
    const isSkipped = await NotificationManager.isTodaySkipped();
    
    if (isVacation || isSkipped) {
      console.log('Refresh blocked - vacation mode or today skipped');
      return;
    }
    
    const data = await AsyncStorage.getItem('therapyFormData');
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.remindersEnabled && parsed.dailySchedule) {
        await scheduleTomorrowOnly(parsed.dailySchedule, parsed);
        console.log('Notifications refreshed');
      }
    }
  },

  // Get notification status summary
  getStatus: async () => {
    const isVacation = await NotificationManager.isVacationMode();
    const isSkipped = await NotificationManager.isTodaySkipped();
    const isQuiet = await NotificationManager.isQuietHours();
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    
    return {
      vacationMode: isVacation,
      todaySkipped: isSkipped,
      quietHours: isQuiet,
      scheduledCount: scheduled.length,
      active: !isVacation && !isSkipped
    };
  }
};