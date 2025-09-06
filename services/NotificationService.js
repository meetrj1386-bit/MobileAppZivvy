import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const setupNotifications = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    alert('Please enable notifications for reminders');
    return false;
  }
  return true;
};

export const scheduleTherapyReminders = async (schedule) => {
  // Cancel existing notifications
  await Notifications.cancelAllScheduledNotificationsAsync();
  
  Object.keys(schedule).forEach(day => {
    schedule[day].exercises.forEach(exercise => {
      const [hour, minute] = exercise.time.split(':');
      
      // Schedule 15 min before
      Notifications.scheduleNotificationAsync({
        content: {
          title: `Therapy Reminder 🔔`,
          body: `${exercise.type} therapy in 15 minutes`,
          data: { type: exercise.type },
        },
        trigger: {
          weekday: getDayNumber(day),
          hour: parseInt(hour),
          minute: parseInt(minute) - 15,
          repeats: true,
        },
      });
    });
  });
};