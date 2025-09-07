import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export const handleCheckInResponse = async (response) => {
  const { actionIdentifier } = response;
  const today = new Date().toISOString().split('T')[0];
  
  let activityData = {
    date: today,
    timestamp: new Date().toISOString(),
  };
  
  let encouragementMessage = '';
  
  switch(actionIdentifier) {
    case 'COMPLETED_ALL':
      activityData.status = 'complete';
      activityData.percentage = 100;
      encouragementMessage = '🌟 Amazing! Full therapy session completed!';
      break;
      
    case 'COMPLETED_SOME':
      activityData.status = 'partial';
      activityData.percentage = 50;
      encouragementMessage = '💪 Great effort! Every bit counts!';
      break;
      
    case 'MISSED':
      activityData.status = 'missed';
      activityData.percentage = 0;
      encouragementMessage = '💜 Tomorrow is a fresh start. You\'ve got this!';
      break;
      
    default:
      return; // User tapped notification body, not button
  }
  
  // Save activity data
  await AsyncStorage.setItem(`activity_${today}`, JSON.stringify(activityData));
  
  // Update weekly data
  await updateWeeklyData(activityData);
  
  // Send encouragement
  await Notifications.scheduleNotificationAsync({
    content: {
      title: encouragementMessage,
      body: getMotivationalQuote(),
    },
    trigger: { seconds: 1 },
  });
};

export const handleReflectionResponse = async (response) => {
  const { actionIdentifier } = response;
  const today = new Date().toISOString().split('T')[0];
  
  let reflectionData = {
    date: today,
    timestamp: new Date().toISOString(),
  };
  
  switch(actionIdentifier) {
    case 'FELT_GOOD':
      reflectionData.mood = 'positive';
      reflectionData.score = 3;
      break;
    case 'FELT_OKAY':
      reflectionData.mood = 'neutral';
      reflectionData.score = 2;
      break;
    case 'FELT_HARD':
      reflectionData.mood = 'challenging';
      reflectionData.score = 1;
      break;
    default:
      return; // User tapped notification body, not button
  }
  
  // Save reflection data for progress tracking
  await AsyncStorage.setItem(`reflection_${today}`, JSON.stringify(reflectionData));
  
  // Update weekly reflection data
  const weekData = await AsyncStorage.getItem('weeklyReflections') || '{}';
  const parsed = JSON.parse(weekData);
  const dayIndex = new Date().getDay();
  parsed[dayIndex] = reflectionData;
  await AsyncStorage.setItem('weeklyReflections', JSON.stringify(parsed));
  
  console.log('Reflection saved:', reflectionData);
};

export const setupNotificationCategories = async () => {
  await Notifications.setNotificationCategoryAsync('DAILY_REFLECTION', [
    {
      identifier: 'FELT_GOOD',
      buttonTitle: '😊 Felt good',
      options: { 
        opensAppToForeground: false,
        isDestructive: false 
      }
    },
    {
      identifier: 'FELT_OKAY',
      buttonTitle: '😐 Just okay',
      options: { 
        opensAppToForeground: false,
        isDestructive: false 
      }
    },
    {
      identifier: 'FELT_HARD',
      buttonTitle: '😔 Was challenging',
      options: { 
        opensAppToForeground: false,
        isDestructive: false 
      }
    }
  ]);
};

export const scheduleTomorrowOnly = async (schedule, formData) => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][tomorrow.getDay()];
    
    console.log(`Scheduling notifications for tomorrow: ${tomorrowDay}`);
    
    const tomorrowExercises = schedule[tomorrowDay] || [];
    
    if (tomorrowExercises.length > 0) {
      // Set up notification categories first
      await setupNotificationCategories();
      
      // 1. Morning briefing
      if (formData.morningBriefingTime) {
        const [hour, minute] = formData.morningBriefingTime.split(':');
        const morningTime = new Date(now);
        morningTime.setDate(now.getDate() + 1);
        morningTime.setHours(parseInt(hour), parseInt(minute), 0, 0);
        
        if (morningTime <= now) {
          morningTime.setDate(morningTime.getDate() + 1);
        }
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Good morning!",
            body: `Today brings ${tomorrowExercises.length} chances to connect and play with ${formData.childFirstName}. Start when you're ready!`,
            data: { type: 'morning_briefing' }
          },
          trigger: morningTime
        });
        
        console.log(`Morning briefing scheduled for ${hour}:${minute}`);
      }

      // 2. Time slot reminders
      await scheduleTimeSlotReminders(schedule, formData, tomorrowDay);
      
      // 3. Evening reflection
      if (formData.eveningReflectionEnabled) {
        await scheduleEveningReflection(schedule, formData, tomorrowDay);
      }
    }
  } catch (error) {
    console.error('Error scheduling tomorrow notifications:', error);
  }
};

export const scheduleTimeSlotReminders = async (schedule, formData, dayName) => {
  const dayExercises = schedule[dayName] || [];
  if (dayExercises.length === 0) return;

  const reminderSettings = await AsyncStorage.getItem('reminderSettings');
  const settings = reminderSettings ? JSON.parse(reminderSettings) : { minutesBefore: 15 };

  for (const exercise of dayExercises) {
    const [hour, minute] = exercise.time.split(':').map(Number);
    
    // Calculate reminder time properly
    let totalMinutes = (hour * 60 + minute) - settings.minutesBefore;
    
    // Handle negative time (goes to previous day)
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60;
    }
    
    const reminderHour = Math.floor(totalMinutes / 60);
    const reminderMin = totalMinutes % 60;
    
    const reminderTime = new Date();
    reminderTime.setDate(reminderTime.getDate() + 1); // Tomorrow
    reminderTime.setHours(reminderHour, reminderMin, 0, 0);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Reminder: ${exercise.exercise}`,
        body: `Starting in ${settings.minutesBefore} minutes at ${exercise.time}`,
        data: { 
          type: 'exercise_reminder',
          exercise: exercise.exercise,
          time: exercise.time
        }
      },
      trigger: reminderTime
    });
    
    console.log(`Scheduled reminder for ${exercise.exercise} at ${reminderHour}:${reminderMin}`);
  }
};

export const scheduleEveningReflection = async (schedule, formData, dayName) => {
  const dayExercises = schedule[dayName] || [];
  if (dayExercises.length === 0) return;

  // First, set up the category with buttons
  await Notifications.setNotificationCategoryAsync('DAILY_CHECKIN', [
    {
      identifier: 'COMPLETED_ALL',
      buttonTitle: '✅ Did all!',
      options: { 
        opensAppToForeground: false,
        isDestructive: false,
        isAuthenticationRequired: false 
      }
    },
    {
      identifier: 'COMPLETED_SOME', 
      buttonTitle: '💪 Did some',
      options: { 
        opensAppToForeground: false,
        isDestructive: false,
        isAuthenticationRequired: false
      }
    },
    {
      identifier: 'MISSED',
      buttonTitle: '❌ Missed today',
      options: { 
        opensAppToForeground: false,
        isDestructive: true,
        isAuthenticationRequired: false
      }
    }
  ]);

  const lastExercise = dayExercises[dayExercises.length - 1];
  const [lastHour, lastMin] = lastExercise.time.split(':').map(Number);
  
  // Schedule 1 hour after last exercise, cap at 9 PM
  let reflectionHour = lastHour + 1;
  let reflectionMin = lastMin;
  
  if (reflectionHour > 21) {
    reflectionHour = 21;
    reflectionMin = 0;
  }
  
  const reflectionTime = new Date();
  reflectionTime.setDate(reflectionTime.getDate() + 1);
  reflectionTime.setHours(reflectionHour, reflectionMin, 0, 0);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `How did therapy go with ${formData.childFirstName}?`,
      body: "Quick check-in on today's progress",
      categoryIdentifier: 'DAILY_CHECKIN',
      data: { 
        type: 'evening_checkin',
        day: dayName
      }
    },
    trigger: reflectionTime
  });
  
  console.log(`Evening reflection scheduled for ${reflectionHour}:${reflectionMin}`);
};

const updateWeeklyData = async (todayData) => {
  const weekData = await AsyncStorage.getItem('currentWeekData') || '{}';
  const parsed = JSON.parse(weekData);
  const dayIndex = new Date().getDay();
  
  parsed[dayIndex] = todayData;
  
  await AsyncStorage.setItem('currentWeekData', JSON.stringify(parsed));
};

const getMotivationalQuote = () => {
  const quotes = [
    "Consistency builds confidence",
    "Small steps lead to big changes",
    "You're building something amazing",
    "Every session is progress",
    "Your dedication is inspiring"
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
};