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

  // Group exercises by time windows (within 2 hours = same slot)
  const timeSlots = [];
  let currentSlot = null;

  dayExercises.forEach(exercise => {
    const exerciseTime = parseInt(exercise.time.replace(':', ''));
    
    if (!currentSlot || exerciseTime - currentSlot.endTime > 200) { // 2+ hour gap
      // Start new time slot
      currentSlot = {
        startTime: exercise.time,
        endTime: exercise.time,
        exercises: [exercise]
      };
      timeSlots.push(currentSlot);
    } else {
      // Add to current slot
      currentSlot.endTime = exercise.time;
      currentSlot.exercises.push(exercise);
    }
  });

  // Schedule reminder for each time slot
  const reminderSettings = await AsyncStorage.getItem('reminderSettings');
  const settings = reminderSettings ? JSON.parse(reminderSettings) : { minutesBefore: 15 };

  for (const slot of timeSlots) {
    const [hour, minute] = slot.startTime.split(':');
    const slotTime = new Date();
    slotTime.setDate(slotTime.getDate() + 1); // Tomorrow
    slotTime.setHours(parseInt(hour), parseInt(minute) - settings.minutesBefore, 0, 0);

    const slotMessage = settings.gentleMode ? 
      `Time to connect with ${formData.childFirstName}! ${slot.exercises.length} activities starting at ${slot.startTime}` :
      `Therapy session at ${slot.startTime} - ${slot.exercises.length} exercises scheduled`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: settings.gentleMode ? "Connection time approaching" : "Therapy reminder",
        body: slotMessage,
        data: { 
          type: 'time_slot_reminder',
          startTime: slot.startTime,
          exerciseCount: slot.exercises.length
        }
      },
      trigger: {
        type: 'date',
        date: slotTime
      }
    });

    console.log(`Time slot reminder scheduled: ${settings.minutesBefore} min before ${slot.startTime}`);
  }
};

export const scheduleEveningReflection = async (schedule, formData, dayName) => {
  const dayExercises = schedule[dayName] || [];
  if (dayExercises.length === 0) return;

  // Find the last exercise of the day
  const lastExercise = dayExercises[dayExercises.length - 1];
  const [lastHour, lastMin] = lastExercise.time.split(':');
  
  // Schedule reflection 1 hour after last exercise, but cap at 9 PM
  let reflectionHour = parseInt(lastHour) + 1;
  let reflectionMin = parseInt(lastMin);
  
  if (reflectionHour > 21) {
    reflectionHour = 21;
    reflectionMin = 0;
  }
  
  const reflectionTime = new Date();
  reflectionTime.setDate(reflectionTime.getDate() + 1); // Tomorrow
  reflectionTime.setHours(reflectionHour, reflectionMin, 0, 0);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "How did today feel?",
      body: `Reflecting on therapy time with ${formData.childFirstName}`,
      categoryIdentifier: 'DAILY_REFLECTION',
      data: { 
        type: 'evening_reflection',
        day: dayName,
        exerciseCount: dayExercises.length
      }
    },
    trigger: {
      type: 'date',
      date: reflectionTime
    }
  });

  console.log(`Evening reflection scheduled for ${reflectionHour}:${String(reflectionMin).padStart(2, '0')}`);
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