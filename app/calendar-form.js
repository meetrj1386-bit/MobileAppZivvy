console.log('====== CALENDAR FORM LOADING ======');
import React, {  useRef } from 'react';

import { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Switch,
  Alert, 
  ActivityIndicator,
  Animated,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scheduleTomorrowOnly } from './utils/notificationHandler';

import { ValidationModal } from './components/ValidationModal';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { exerciseLibrary } from '../data/exerciseLibrary';
import { supabase } from './supabaseClient';
import * as Localization from 'expo-localization';
import * as Notifications from 'expo-notifications';

const captureUserEnvironment = async () => {
  const timezone = Localization.timezone; // "America/Chicago"
  const { data } = await Notifications.getExpoPushTokenAsync();
  const pushToken = data;
  
  return {
    timezone,
    pushToken,
    utcOffset: new Date().getTimezoneOffset()
  };
};


// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Helper functions for time calculations
const addHour = (timeStr) => {
  if (!timeStr) return '08:00';
  const [h, m] = timeStr.split(':');
  const newHour = (parseInt(h) + 1) % 24;
  return `${newHour.toString().padStart(2, '0')}:${m}`;
};



const subtractMinutes = (timeStr, minutes) => {
  if (!timeStr) return '08:00';
  const [h, m] = timeStr.split(':');
  let totalMinutes = parseInt(h) * 60 + parseInt(m) - minutes;
  if (totalMinutes < 0) totalMinutes += 24 * 60;
  const newHour = Math.floor(totalMinutes / 60);
  const newMin = totalMinutes % 60;
  return `${newHour.toString().padStart(2, '0')}:${newMin.toString().padStart(2, '0')}`;
};

const calculateWindow = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  const [startH, startM] = startTime.split(':');
  const [endH, endM] = endTime.split(':');
  const startMinutes = parseInt(startH) * 60 + parseInt(startM);
  const endMinutes = parseInt(endH) * 60 + parseInt(endM);
  return Math.max(0, endMinutes - startMinutes);
};

// Get the start of the week
const getWeekStart = () => {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day;
  const weekStart = new Date(today.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart.toISOString();
};

// Enhanced Input Component
const LuxuryInput = ({ 
  value, 
  onChangeText, 
  placeholder, 
  error, 
  icon, 
  keyboardType, 
  multiline,
  numberOfLines,
  autoCapitalize,
  onBlur
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const borderColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: error ? ['#FF6B6B', '#FF6B6B'] : ['rgba(107, 91, 149, 0.4)', '#6b5b95']
  });

  return (
    <View style={styles.luxuryInputContainer}>
      {icon && (
        <View style={styles.inputIcon}>
          {React.cloneElement(icon, { color: '#6b5b95' })}
        </View>
      )}
      <Animated.View style={[styles.inputWrapper, { borderColor }]}>
        <TextInput
          style={[
            styles.luxuryInput,
            multiline && styles.luxuryTextArea,
            icon && styles.inputWithIcon
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#AAB8C2"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            onBlur && onBlur();
          }}
        />
      </Animated.View>
      {error && (
        <Animated.View style={styles.errorContainer}>
          <MaterialIcons name="error" size={14} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      )}
    </View>
  );
};

// Time Picker Component
const TimePicker = ({ value, onChange, label }) => {
  const [showPicker, setShowPicker] = useState(false);
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = ['00', '15', '30', '45'];
  const periods = ['AM', 'PM'];
  
  const parseTime = (timeStr) => {
    if (!timeStr) return { hour: 9, minute: '00', period: 'AM' };
    const [h, m] = timeStr.split(':');
    const hour24 = parseInt(h);
    return {
      hour: hour24 > 12 ? hour24 - 12 : (hour24 === 0 ? 12 : hour24),
      minute: m || '00',
      period: hour24 >= 12 ? 'PM' : 'AM'
    };
  };
  
  const currentTime = parseTime(value);
  
  const formatTime = (hour, minute, period) => {
    let hour24 = hour;
    if (period === 'PM' && hour !== 12) hour24 += 12;
    if (period === 'AM' && hour === 12) hour24 = 0;
    return `${hour24.toString().padStart(2, '0')}:${minute}`;
  };
  
  return (
    <View style={styles.timePickerContainer}>
      <Text style={styles.timePickerLabel}>{label}</Text>
      <TouchableOpacity 
        style={styles.luxuryTimePickerButton}
        onPress={() => setShowPicker(!showPicker)}
      >
        <Ionicons name="time-outline" size={20} color="#6b5b95" />
        <Text style={styles.timePickerText}>
          {currentTime.hour}:{currentTime.minute} {currentTime.period}
        </Text>
      </TouchableOpacity>
      
      {showPicker && (
        <View style={styles.luxuryTimePickerModal}>
          <View style={styles.timePickerRow}>
            <ScrollView style={styles.timePickerColumn} showsVerticalScrollIndicator={false}>
              {hours.map(h => (
                <TouchableOpacity
                  key={h}
                  style={[styles.timeOption, currentTime.hour === h && styles.timeOptionActive]}
                  onPress={() => {
                    onChange(formatTime(h, currentTime.minute, currentTime.period));
                  }}
                >
                  <Text style={[styles.timeOptionText, currentTime.hour === h && styles.timeOptionTextActive]}>
                    {h}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <ScrollView style={styles.timePickerColumn} showsVerticalScrollIndicator={false}>
              {minutes.map(m => (
                <TouchableOpacity
                  key={m}
                  style={[styles.timeOption, currentTime.minute === m && styles.timeOptionActive]}
                  onPress={() => {
                    onChange(formatTime(currentTime.hour, m, currentTime.period));
                  }}
                >
                  <Text style={[styles.timeOptionText, currentTime.minute === m && styles.timeOptionTextActive]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.timePickerColumn}>
              {periods.map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.timeOption, currentTime.period === p && styles.timeOptionActive]}
                  onPress={() => {
                    onChange(formatTime(currentTime.hour, currentTime.minute, p));
                  }}
                >
                  <Text style={[styles.timeOptionText, currentTime.period === p && styles.timeOptionTextActive]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TouchableOpacity 
            style={styles.luxuryDoneButton}
            onPress={() => setShowPicker(false)}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};



// Disclaimer Component
const DisclaimerSection = () => (
  <View style={styles.luxuryDisclaimerContainer}>
    <LinearGradient
      colors={['#f5f0e8', '#faf8f5']}
      style={styles.disclaimerGradient}
    >
      <View style={styles.disclaimerHeader}>
        <MaterialIcons name="info" size={20} color="#D97706" />
        <Text style={styles.disclaimerTitle}>Important Information</Text>
      </View>
      
      <Text style={styles.disclaimerText}>
        This app provides exercise suggestions based on therapeutic principles and parent experiences.
      </Text>
      
      <View style={styles.disclaimerPoints}>
        <Text style={styles.disclaimerPoint}>• NOT a medical device or FDA-approved treatment</Text>
        <Text style={styles.disclaimerPoint}>• NOT a substitute for professional therapy</Text>
        <Text style={styles.disclaimerPoint}>• Always consult your child's healthcare providers</Text>
        <Text style={styles.disclaimerPoint}>• This is a scheduling tool to help organize therapy homework</Text>
      </View>
      
      <Text style={styles.disclaimerAck}>
        By using this app, you acknowledge it's for informational and organizational purposes only.
      </Text>
    </LinearGradient>
  </View>
);

// Parent Availability Validator
const validateParentAvailability = (formData) => {
  const issues = [];
  const warnings = [];
  
  let totalTherapyHours = 0;
  const therapies = ['speechTherapy', 'otTherapy', 'physicalTherapy', 'abaTherapy'];
  
  therapies.forEach(therapy => {
    if (formData[therapy]?.enabled) {
      const hours = parseFloat(formData[therapy].sessionHours || 0);
      const daysPerWeek = formData[therapy].sessionDays?.length || 0;
      totalTherapyHours += hours * daysPerWeek;
    }
  });
  
  const weekdayHours = parseFloat(formData.parentAvailability?.weekdayHours || 0);
  const weekendHours = parseFloat(formData.parentAvailability?.weekendHours || 0);
  const totalParentHours = (weekdayHours * 5) + (weekendHours * 2);
  
  if (totalParentHours === 0) {
    issues.push({
      type: 'critical',
      message: 'No Parent Hours Set',
      detail: 'You must allocate some time for home exercises',
      fix: 'Set at least 30 minutes on weekdays or weekends'
    });
  }
  
  const hasEarlyIntervention = formData.childAge && parseInt(formData.childAge) < 5;
  const noMorningSelected = !formData.parentAvailability?.weekdayTimeBlocks?.earlyMorning && 
                           !formData.parentAvailability?.weekdayTimeBlocks?.morning;
  
  if (hasEarlyIntervention && noMorningSelected) {
    warnings.push({
      type: 'warning',
      message: 'Morning Sessions Recommended',
      detail: 'Young children often respond better to morning therapy',
      fix: 'Consider selecting morning time blocks'
    });
  }
  
  if (totalParentHours > 20) {
    warnings.push({
      type: 'warning',
      message: 'High Time Commitment',
      detail: `You've committed ${totalParentHours} hours/week. This may be challenging to maintain.`,
      fix: 'Consider starting with fewer hours and increasing gradually'
    });
  }
  
  const weekdayBlocks = Object.values(formData.parentAvailability?.weekdayTimeBlocks || {})
    .filter(v => v === true).length;
  const weekendBlocks = Object.values(formData.parentAvailability?.weekendTimeBlocks || {})
    .filter(v => v === true).length;
  
  if (weekdayHours > 0 && weekdayBlocks === 0) {
    issues.push({
      type: 'critical',
      message: 'No Weekday Time Blocks Selected',
      detail: `You set ${weekdayHours} hours but didn't select when`,
      fix: 'Select specific time blocks for weekdays'
    });
  }
  
  if (weekendHours > 0 && weekendBlocks === 0) {
    issues.push({
      type: 'critical',
      message: 'No Weekend Time Blocks Selected',
      detail: `You set ${weekendHours} hours but didn't select when`,
      fix: 'Select specific time blocks for weekends'
    });
  }
  
  if (totalTherapyHours > 30) {
    warnings.push({
      type: 'info',
      message: 'Intensive Therapy Schedule',
      detail: `Child receives ${totalTherapyHours} hours of professional therapy weekly`,
      fix: 'Home exercises should complement, not overwhelm'
    });
  }
  
  return { issues, warnings, isValid: issues.length === 0 };
};

export default function CalendarForm() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isDemoMode = params?.demoMode === 'true' || params?.demoMode === true;
  
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedDay, setSelectedDay] = useState('Monday');
  
  // Validation states
  const [errors, setErrors] = useState({});
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  const [showAddPriority, setShowAddPriority] = useState(false);
  const [newPriority, setNewPriority] = useState({
    name: '',
    duration: '30',
    importance: 'high'
  });
  

  const [aggregatedFindings, setAggregatedFindings] = useState({
    conditions: [],
    therapyRecommendations: [],
    keyPoints: []
  });

  const [formData, setFormData] = useState({
    parentPriorities: [],
    // Parent Info
    parentName: '',
    email: '',
    phone: '',
    
  eveningReflectionEnabled: true,
  exerciseNotes: {},
  notificationPermissionGranted: false,

    // Child Info
    childFirstName: '',
    childLastName: '',
    childAge: '',
    gender: '',
    tellUsAboutChild: '',
    mainConcerns: '',
    parentGoals: '',
    
    // Fixed Activities
    disclaimerAccepted: false,
    
    // School Schedule
    hasSchool: 'yes',
    schoolStartTime: '08:30',
    schoolEndTime: '14:30',
    schoolDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    
    // Professional Therapy Services
    speechTherapy: { 
      enabled: false,
      sessionTime: '',
      sessionHours: '1',
      sessionDays: []
    },
    otTherapy: { 
      enabled: false,
      sessionTime: '',
      sessionHours: '1',
      sessionDays: []
    },
    physicalTherapy: { 
      enabled: false,
      sessionTime: '',
      sessionHours: '1',
      sessionDays: []
    },
    abaTherapy: { 
      enabled: false,
      sessionTime: '',
      sessionHours: '1',
      sessionDays: []
    },

      additionalTherapies: [], // For laser, swimming, massage, etc.

    
    // Daily Routine Times
    wakeUpTime: '07:00',
    breakfastTime: '08:00',
    lunchTime: '12:30',
    dinnerTime: '19:00',
    bedtime: '21:00',

    selectedConcerns: {
      speech: false,
      feeding: false,
      behavior: false,
      physical: false,
      balance: false,
      school: false,
      daily: false
    },
    
    // Parent Availability
    parentAvailability: {
      weekdayHours: '0',
      weekendHours: '0',
      weekdayTimeBlocks: {
        earlyMorning: false,
        morning: false,
        afternoon: false,
        evening: false,
        night: false
      },
      weekendTimeBlocks: {
        earlyMorning: false,
        morning: false,
        afternoon: false,
        evening: false,
        night: false
      }
    },
    
    // Reminder Settings
     remindersEnabled: false,
  morningBriefingTime: '07:00',  // New field
  eveningReflectionEnabled: true,  // New field
  exerciseNotes: {},  // New field for custom notes
  notificationPermissionGranted: false,
  });


  const steps = [
  'Parent Info',
  'Child Info',
  'Professional Therapies',
  'Your Therapy Priorities', 
  'School Schedule',
  'Daily Routine',
  'Your Availability'
];


  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const savedName = await AsyncStorage.getItem('userName');
      
      setFormData(prev => ({
        ...prev,
        email: user.email,
        parentName: savedName || user.user_metadata?.parent_name || ''
      }));
    }
  };

  useEffect(() => {
    if (!isDemoMode) {
      checkDisclaimer();
      getCurrentUser();
    }
    loadUserData();
    loadSavedData();
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(async response => {
      const data = response.notification.request.content.data;
      await trackNotificationAcknowledgment(data);
    });
    
    return () => subscription.remove();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const loadSavedData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('therapyFormData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (parsedData.parentName || parsedData.childFirstName) {
          setFormData(parsedData);
          if (parsedData.aiDetectedNeeds) {
            setAiAnalysis(parsedData.aiDetectedNeeds);
          }
        }
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  const checkDisclaimer = async () => {
    const accepted = await AsyncStorage.getItem('disclaimerAccepted');
    if (!accepted) {
      Alert.alert(
        'Important Notice',
        'This app provides exercise suggestions based on therapeutic principles. It is NOT medical advice or FDA-approved treatment. Always consult your child\'s healthcare providers.',
        [
          { 
            text: 'I Understand', 
            onPress: async () => {
              await AsyncStorage.setItem('disclaimerAccepted', 'true');
              setFormData(prev => ({ ...prev, disclaimerAccepted: true }));
            }
          }
        ],
        { cancelable: false }
      );
    }
  };

  const requestNotificationPermissions = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please enable notifications in settings to receive exercise reminders.',
        [{ text: 'OK' }]
      );
      setFormData(prev => ({ ...prev, remindersEnabled: false }));
      return false;
    }
    
    setFormData(prev => ({ ...prev, notificationPermissionGranted: true }));
    return true;
  };
  

const scheduleNotifications = async (schedule, formData) => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Check vacation mode first
    const vacationMode = await AsyncStorage.getItem('vacationMode');
    if (vacationMode === 'true') {
      console.log('Vacation mode active - skipping notifications');
      return;
    }

    // Check if today is skipped
    const skipDate = await AsyncStorage.getItem('skipDate');
    const today = new Date().toDateString();
    if (skipDate === today) {
      console.log('Today is skipped - no notifications');
      return;
    }

    // Load app settings
    const settings = await AsyncStorage.getItem('appSettings');
    const appSettings = settings ? JSON.parse(settings) : {
      weekendReminders: true,
      quietHoursEnabled: false,
      quietHoursStart: '21:00',
      quietHoursEnd: '07:00'
    };

    // Load reminder settings (from Reminders tab)
    const reminderSettings = await AsyncStorage.getItem('reminderSettings');
    const remSettings = reminderSettings ? JSON.parse(reminderSettings) : {
      exerciseReminders: true,
      morningPreview: true,
      eveningCheckIn: true,
      gentleMode: true,
      minutesBefore: 15
    };

    const childName = formData.childFirstName || 'your child';
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDayIndex = tomorrow.getDay();
    const tomorrowDayName = days[tomorrowDayIndex];

    // Skip weekend if weekend reminders are disabled
    if (!appSettings.weekendReminders && (tomorrowDayIndex === 0 || tomorrowDayIndex === 6)) {
      console.log('Weekend reminders disabled - skipping');
      return;
    }

    let notificationCount = 0;
    
    // 1. Schedule morning briefing if enabled
    if (remSettings.morningPreview && formData.morningBriefingTime) {
      const [mHour, mMin] = formData.morningBriefingTime.split(':');
      
      // Check if morning briefing is within quiet hours
      if (!isInQuietHours(parseInt(mHour), parseInt(mMin), appSettings)) {
        const morningTime = new Date(tomorrow);
        morningTime.setHours(parseInt(mHour), parseInt(mMin), 0, 0);
        
        const morningMessage = remSettings.gentleMode ?
          `Good morning! ${childName} has some therapy opportunities today. Start when you're ready! 💜` :
          `Morning briefing: ${childName} has therapy sessions scheduled today.`;
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: remSettings.gentleMode ? "🌞 Good Morning!" : "Morning Briefing",
            body: morningMessage,
            data: { type: 'morning_briefing' },
          },
          trigger: morningTime
        });
        notificationCount++;
      }
    }
    
    // 2. Schedule tomorrow's exercise reminders if enabled
    if (remSettings.exerciseReminders) {
      const tomorrowExercises = schedule[tomorrowDayName] || [];
      
      for (const exercise of tomorrowExercises) {
        const [hour, minute] = exercise.time.split(':');
        
        // Calculate reminder time based on user preference
        let reminderHour = parseInt(hour);
        let reminderMinute = parseInt(minute) - remSettings.minutesBefore;
        
        if (reminderMinute < 0) {
          reminderMinute = 60 + reminderMinute;
          reminderHour = reminderHour - 1;
        }
        
        // Check if this time is within quiet hours
        if (isInQuietHours(reminderHour, reminderMinute, appSettings)) {
          continue; // Skip this notification
        }
        
        const exerciseTime = new Date(tomorrow);
        exerciseTime.setHours(reminderHour, reminderMinute, 0, 0);
        
        // Determine therapy type for better messaging
        let therapyType = 'Therapy';
        if (exercise.therapy_type?.includes('ST')) {
          therapyType = 'Speech';
        } else if (exercise.therapy_type?.includes('OT')) {
          therapyType = 'OT';
        } else if (exercise.therapy_type?.includes('PT')) {
          therapyType = 'Physical';
        }
        
        // Create message based on gentle mode setting
        const reminderMessage = remSettings.gentleMode ?
          `Ready for ${exercise.duration} minutes of ${therapyType} practice? Follow your therapist's guidance.` :
          `${therapyType} therapy with ${childName} in ${remSettings.minutesBefore} minutes - ${exercise.duration} min session`;
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: remSettings.gentleMode ? 
              `${therapyType} time opportunity 💜` : 
              "Therapy Reminder",
            body: reminderMessage,
            data: { 
              type: 'exercise_reminder',
              exercise: exercise.exercise,
              therapyType: therapyType
            },
          },
          trigger: exerciseTime
        });
        notificationCount++;
      }
    }
    
    // 3. Schedule evening check-in if enabled
    if (remSettings.eveningCheckIn && formData.eveningReflectionEnabled) {
      // Find the last exercise of the day
      const tomorrowExercises = schedule[tomorrowDayName] || [];
      if (tomorrowExercises.length > 0) {
        const lastExercise = tomorrowExercises[tomorrowExercises.length - 1];
        const [lastHour, lastMin] = lastExercise.time.split(':');
        
        // Schedule check-in 1 hour after last exercise
        let checkInHour = parseInt(lastHour) + 1;
        let checkInMin = parseInt(lastMin);
        
        // Cap at 9 PM
        if (checkInHour > 21) {
          checkInHour = 21;
          checkInMin = 0;
        }
        
        // Check quiet hours
        if (!isInQuietHours(checkInHour, checkInMin, appSettings)) {
          const checkInTime = new Date(tomorrow);
          checkInTime.setHours(checkInHour, checkInMin, 0, 0);
          
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "How did therapy go today? 💜",
              body: "Tap to record today's progress!",
              categoryIdentifier: 'DAILY_CHECKIN',
              data: { 
                type: 'evening_checkin',
                day: tomorrowDayName
              },
            },
            trigger: checkInTime
          });
          notificationCount++;
        }
      }
    }
    
    console.log(`✅ Scheduled ${notificationCount} notifications for tomorrow (${tomorrowDayName})`);
    
  } catch (error) {
    console.error('Error scheduling notifications:', error);
  }
};

// Helper function to check if time is within quiet hours
const isInQuietHours = (hour, minute, settings) => {
  if (!settings.quietHoursEnabled) return false;
  
  const [startHour, startMin] = settings.quietHoursStart.split(':').map(Number);
  const [endHour, endMin] = settings.quietHoursEnd.split(':').map(Number);
  
  const currentMinutes = hour * 60 + minute;
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  // Handle overnight quiet hours (e.g., 21:00 to 07:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
  
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
};


// Add to calendar-form.js (around line 500, after your existing functions)

const handleVacationMode = async (enabled) => {
  if (enabled) {
    // Cancel all notifications
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.setItem('vacationMode', 'true');
  } else {
    // Reschedule notifications
    const formData = await AsyncStorage.getItem('therapyFormData');
    if (formData) {
      const parsed = JSON.parse(formData);
      await scheduleNotifications(parsed.dailySchedule, parsed);
      await setupEveningCheckIns(parsed.dailySchedule, parsed.childFirstName);
    }
    await AsyncStorage.setItem('vacationMode', 'false');
  }
};

const skipTodayReminders = async () => {
  const today = new Date().getDay();
  const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
  
  // Cancel only today's notifications
  for (const notification of allNotifications) {
    if (notification.trigger.weekday === today + 1) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
  
  // Reschedule them for next week
  setTimeout(async () => {
    const formData = await AsyncStorage.getItem('therapyFormData');
    if (formData) {
      const parsed = JSON.parse(formData);
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today];
      const todayExercises = parsed.dailySchedule[dayName];
      if (todayExercises) {
        await scheduleNotificationsForDay(dayName, todayExercises, parsed);
      }
    }
  }, 24 * 60 * 60 * 1000); // Reschedule after 24 hours
};


const calculateEveningReflectionTime = (dinnerTime) => {
  if (!dinnerTime) return '20:00';
  const [h, m] = dinnerTime.split(':');
  const hour = parseInt(h) + 1;  // 1 hour after dinner
  if (hour >= 22) return '21:30';  // Cap at 9:30 PM
  return `${hour.toString().padStart(2, '0')}:${m}`;
};

const getMotivationalMessage = (type, data) => {
  const morningTemplates = [
    `Good morning! ${data.childName} has ${data.exerciseCount} therapy sessions today, starting at ${data.firstTime}. You've got this!`,
    `Rise and shine! Today's therapy journey with ${data.childName} begins at ${data.firstTime}. ${data.exerciseCount} opportunities to make progress!`,
    `New day, new possibilities! ${data.childName}'s ${data.exerciseCount} sessions start at ${data.firstTime}. Every small step counts!`,
    `Morning! ${data.childName} is ready for ${data.exerciseCount} therapy activities today. First one at ${data.firstTime}. You're amazing for doing this!`,
    `Hello sunshine! ${data.exerciseCount} growth moments planned with ${data.childName} today, kicking off at ${data.firstTime}!`
  ];
  
  const eveningTemplates = [
    `What a day! ${data.childName} worked hard today. Tomorrow brings new opportunities for growth. Rest well!`,
    `Evening reflection: Every minute you spent with ${data.childName} today planted seeds for tomorrow. You're incredible!`,
    `Day complete! ${data.childName}'s progress is built on your consistency. Sweet dreams to you both!`,
    `Tonight, rest knowing you're changing ${data.childName}'s life one session at a time. See you tomorrow!`,
    `Another day of dedication done! ${data.childName} is lucky to have you. Recharge for tomorrow's adventures!`
  ];
  
  if (type === 'morning') {
    return morningTemplates[Math.floor(Math.random() * morningTemplates.length)];
  } else if (type === 'evening') {
    return eveningTemplates[Math.floor(Math.random() * eveningTemplates.length)];
  }
  
  // Exercise reminder
  if (data.customNote) {
    return `Therapy time in 5 minutes: ${data.customNote}`;
  }
  return `Therapy time with ${data.childName} in 5 minutes. Continue with your therapist's exercises!`;
};

  const trackNotificationAcknowledgment = async (notificationData) => {
    if (!isDemoMode) {
      const { error } = await supabase
        .from('reminder_logs')
        .update({ 
          was_acknowledged: true,
          acknowledged_at: new Date().toISOString()
        })
        .match({
          user_email: formData.email,
          exercise_name: notificationData.exercise,
          scheduled_time: notificationData.scheduledTime
        });
      
      if (!error) {
        const today = new Date().toDateString();
        const tracking = await AsyncStorage.getItem(`tracking_${today}`);
        const data = tracking ? JSON.parse(tracking) : { acknowledged: [] };
        data.acknowledged.push({
          exercise: notificationData.exercise,
          time: new Date().toISOString()
        });
        await AsyncStorage.setItem(`tracking_${today}`, JSON.stringify(data));
      }
    }
  };

  const updateWeeklyAnalytics = async () => {
    if (!isDemoMode && formData.email) {
      try {
        const { data, error } = await supabase
          .from('reminder_logs')
          .select('*')
          .eq('user_email', formData.email)
          .gte('created_at', getWeekStart());
        
        if (data && !error) {
          const stats = {
            totalScheduled: data.length,
            totalAcknowledged: data.filter(d => d.was_acknowledged).length,
            totalCompleted: data.filter(d => d.completed).length
          };
          
          const engagementRate = stats.totalScheduled > 0 
            ? Math.round((stats.totalAcknowledged / stats.totalScheduled) * 100)
            : 0;
          
          const completionRate = stats.totalScheduled > 0
            ? Math.round((stats.totalCompleted / stats.totalScheduled) * 100)
            : 0;
          
          await supabase
            .from('reminder_analytics')
            .upsert({
              user_email: formData.email,
              week_start: getWeekStart(),
              total_scheduled: stats.totalScheduled,
              total_acknowledged: stats.totalAcknowledged,
              total_completed: stats.totalCompleted,
              engagement_rate: engagementRate,
              completion_rate: completionRate,
              updated_at: new Date().toISOString()
            });
        }
      } catch (error) {
        console.error('Error updating analytics:', error);
      }
    }
  };

  const markExerciseComplete = async (exercise, dayToMark = selectedDay) => {
    if (!isDemoMode) {
      await supabase
        .from('reminder_logs')
        .update({ 
          completed: true,
          completed_at: new Date().toISOString()
        })
        .match({
          user_email: formData.email,
          exercise_name: exercise.exercise,
          scheduled_time: `${dayToMark} ${exercise.time}`
        });
      
      await updateWeeklyAnalytics();
    }
  };

  const ReminderAnalytics = () => {
    const [analytics, setAnalytics] = useState(null);
    
    useEffect(() => {
      if (!isDemoMode) {
        fetchAnalytics();
      }
    }, []);
    
    const fetchAnalytics = async () => {
      const { data, error } = await supabase
        .from('reminder_logs')
        .select('*')
        .eq('user_email', formData.email)
        .gte('created_at', getWeekStart())
        .order('scheduled_time', { ascending: false });
      
      if (data) {
        const stats = {
          totalScheduled: data.length,
          totalAcknowledged: data.filter(d => d.was_acknowledged).length,
          totalCompleted: data.filter(d => d.completed).length,
          engagementRate: 0,
          completionRate: 0
        };
        
        stats.engagementRate = stats.totalScheduled > 0 
          ? Math.round((stats.totalAcknowledged / stats.totalScheduled) * 100)
          : 0;
        
        stats.completionRate = stats.totalScheduled > 0
          ? Math.round((stats.totalCompleted / stats.totalScheduled) * 100)
          : 0;
        
        setAnalytics(stats);
      }
    };
    
    return (
      <View style={styles.analyticsBox}>
        <Text style={styles.analyticsTitle}>📊 This Week's Progress</Text>
        {analytics && (
          <>
            <Text>Reminders Sent: {analytics.totalScheduled}</Text>
            <Text>Opened: {analytics.totalAcknowledged} ({analytics.engagementRate}%)</Text>
            <Text>Completed: {analytics.totalCompleted} ({analytics.completionRate}%)</Text>
          </>
        )}
      </View>
    );
  };

  const getHistoricalProgress = async (weeks = 4) => {
    if (!isDemoMode) {
      const { data, error } = await supabase
        .from('reminder_analytics')
        .select('*')
        .eq('user_email', formData.email)
        .order('week_start', { ascending: false })
        .limit(weeks);
      
      return data || [];
    }
    return [];
  };

  const analyzeScheduleFeasibility = (formData) => {
    const weekdayHours = parseFloat(formData.parentAvailability?.weekdayHours || 0);
    const weekendHours = parseFloat(formData.parentAvailability?.weekendHours || 0);
    
    let actualAvailableWindows = 0;
    
    const morningWindow = formData.breakfastTime ? 
      calculateWindow('06:00', subtractMinutes(formData.breakfastTime, 30)) : 120;
    
    const afternoonWindow = formData.hasSchool === 'yes' && formData.schoolEndTime && formData.dinnerTime ?
      calculateWindow(formData.schoolEndTime, subtractMinutes(formData.dinnerTime, 45)) : 180;
    
    const eveningWindow = formData.dinnerTime && formData.bedtime ?
      calculateWindow(addHour(formData.dinnerTime), subtractMinutes(formData.bedtime, 30)) : 90;
    
    actualAvailableWindows = morningWindow + afternoonWindow + eveningWindow;
    
    const recommendations = [];
    
    if (weekdayHours * 60 > actualAvailableWindows) {
      recommendations.push({
        type: 'warning',
        message: `You selected ${weekdayHours} hours but only ${Math.floor(actualAvailableWindows/60)} hours realistically available`,
        suggestion: `Consider reducing to ${Math.floor(actualAvailableWindows/60)} hours for sustainability`
      });
    }
    
    if (parseInt(formData.childAge) < 5 && !formData.parentAvailability?.weekdayTimeBlocks?.earlyMorning) {
      recommendations.push({
        type: 'tip',
        message: 'Young children respond best to morning exercises',
        suggestion: 'But your morning routine seems packed - consider weekend mornings instead'
      });
    }
    
    if (weekdayHours > 2) {
      recommendations.push({
        type: 'warning',
        message: 'More than 2 hours daily may lead to burnout',
        suggestion: 'Start with 1 hour and increase gradually'
      });
    }
    
    return recommendations;
  };



  

  const analyzeReportWithAI = async (fileUri, fileName) => {
    try {
      if (fileName.match(/\.(jpg|jpeg|png)$/i)) {
        const base64 = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4-vision-preview',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'Extract from this therapy report: 1) Main diagnosis 2) Recommended therapies 3) Key concerns. Be brief.'
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:image/jpeg;base64,${base64}`
                    }
                  }
                ]
              }
            ],
            max_tokens: 200
          })
        });
        
        const data = await response.json();
        return data.choices[0].message.content;
      }
      
      return 'Please upload an image of the report';
      
    } catch (error) {
      console.error('AI Error:', error);
      return 'Could not analyze file';
    }
  };

  const extractKeyFindings = (aiAnalysis) => {
    const lines = aiAnalysis.split('\n').filter(line => line.trim());
    return {
      keyPoints: lines.slice(0, 3),
      fullAnalysis: aiAnalysis
    };
  };

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        multiple: false
      });
      
      if (!result.canceled) {
        const file = result.assets[0];
        
        Alert.alert('Analyzing', 'Reading your report...');
        
        const analysis = await analyzeReportWithAI(file.uri, file.name);
        const findings = extractKeyFindings(analysis);
        
        setAggregatedFindings(prev => ({
          ...prev,
          keyPoints: [...prev.keyPoints, ...findings.keyPoints].slice(0, 10)
        }));
        
        setUploadedFiles([...uploadedFiles, {
          ...file,
          aiAnalysis: analysis
        }]);
        
        Alert.alert('Analysis Complete', findings.keyPoints.join('\n'));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload');
    }
  };

  const removeFile = (index) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
  };



  const validateField = (fieldName, value) => {
    const newErrors = { ...errors };
    
    switch (fieldName) {
      case 'parentName':
        if (!value || value.trim() === '') {
          newErrors.parentName = 'Parent name is required';
        } else {
          delete newErrors.parentName;
        }
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value || !emailRegex.test(value)) {
          newErrors.email = 'Please enter a valid email';
        } else {
          delete newErrors.email;
        }
        break;
      case 'childFirstName':
        if (!value || value.trim() === '') {
          newErrors.childFirstName = 'Child\'s name is required';
        } else {
          delete newErrors.childFirstName;
        }
        break;
      case 'childAge':
        if (!value || parseInt(value) < 1 || parseInt(value) > 18) {
          newErrors.childAge = 'Please enter age between 1-18';
        } else {
          delete newErrors.childAge;
        }
        break;
    }
    
    setErrors(newErrors);
  };

 const validateStep = () => {
  const validationErrors = {};
  
  switch(currentStep) {
    case 0:
      if (!formData.parentName?.trim()) {
        validationErrors.parentName = 'Parent name is required';
      }
      if (!formData.email?.trim()) {
        validationErrors.email = 'Email is required';
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (formData.email && !emailRegex.test(formData.email)) {
        validationErrors.email = 'Please enter a valid email';
      }
      break;
      
    case 1:
      if (!formData.childFirstName?.trim()) {
        validationErrors.childFirstName = 'Child\'s name is required';
      }
      if (!formData.childAge?.trim()) {
        validationErrors.childAge = 'Child\'s age is required';
      }
      if (parseInt(formData.childAge) < 1 || parseInt(formData.childAge) > 18) {
        validationErrors.childAge = 'Please enter age between 1-18';
      }
      if (!formData.tellUsAboutChild?.trim() || formData.tellUsAboutChild.length < 20) {
        validationErrors.tellUsAboutChild = 'Please describe your child\'s needs (minimum 20 characters)';
      }
      break;

    case 6:  // CHANGED FROM 7 TO 6
      const weekdayHours = parseFloat(formData.parentAvailability?.weekdayHours) || 0;
      const weekendHours = parseFloat(formData.parentAvailability?.weekendHours) || 0;
      
      if (weekdayHours === 0 && weekendHours === 0) {
        validationErrors.availability = 'Please set at least some hours for exercises';
      }
      
      const hasWeekdayBlocks = Object.values(formData.parentAvailability?.weekdayTimeBlocks || {}).some(v => v);
      const hasWeekendBlocks = Object.values(formData.parentAvailability?.weekendTimeBlocks || {}).some(v => v);
      
      if (weekdayHours > 0 && !hasWeekdayBlocks) {
        validationErrors.weekdayBlocks = 'Please select when you\'re available on weekdays';
      }
      
      if (weekendHours > 0 && !hasWeekendBlocks) {
        validationErrors.weekendBlocks = 'Please select when you\'re available on weekends';
      }
      break;
  }
  
  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    const firstError = Object.values(validationErrors)[0];
    setValidationMessage(firstError);
    setShowValidationModal(true);
    return false;
  }
  
  setErrors({});
  return true;
};

  const handleNext = () => {
    if (!validateStep()) {
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    console.log('Generate Schedule button pressed!');
    
    if (!validateStep()) {
      return;
    }
    
    setIsGenerating(true);
    setLoadingMessage('Validating your inputs...');
    
    const validation = validateParentAvailability(formData);
    
    if (!validation.isValid) {
      setIsGenerating(false);
      Alert.alert(
        'Setup Incomplete',
        validation.issues.map(i => i.detail).join('\n'),
        [{ text: 'Fix Issues', onPress: () => setCurrentStep(6) }]
      );
      return;
    }
    
    if (validation.warnings.length > 0) {
      setIsGenerating(false);
      Alert.alert(
        'Recommendations',
        validation.warnings[0].detail,
        [
          { text: 'Continue Anyway', onPress: async () => {
            setIsGenerating(true);
            await generateScheduleAfterValidation();
          }},
          { text: 'Adjust', onPress: () => setCurrentStep(6) }
        ]
      );
      return;
    }
    
    await generateScheduleAfterValidation();
  };

  const queueNotificationsInBackend = async (schedule, formData, environment) => {
  const notifications = [];
  const { timezone, pushToken } = environment;
  
  // Helper to convert local time to UTC for a specific day
  const getNextUTCOccurrence = (localTime, dayOfWeek) => {
    const [hour, minute] = localTime.split(':').map(Number);
    const now = new Date();
    const currentDay = now.getDay();
    
    let daysUntil = (dayOfWeek - currentDay + 7) % 7;
    if (daysUntil === 0 && (now.getHours() > hour || (now.getHours() === hour && now.getMinutes() >= minute))) {
      daysUntil = 7; // Next week if time passed today
    }
    
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + daysUntil);
    nextDate.setHours(hour, minute, 0, 0);
    
    return nextDate.toISOString();
  };
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  for (const [day, exercises] of Object.entries(schedule)) {
    const dayIndex = days.indexOf(day);
    
    // Morning briefing
    if (formData.remindersEnabled && formData.morningBriefingTime) {
      notifications.push({
        user_id: formData.user_id || formData.email,


        notification_type: 'morning_briefing',
        title: '🌞 Good Morning!',
        body: `${formData.childFirstName} has ${exercises.length} therapy sessions today`,
        scheduled_for_utc: getNextUTCOccurrence(formData.morningBriefingTime, dayIndex),
        scheduled_for_local: formData.morningBriefingTime,
        day_of_week: dayIndex,
        push_token: pushToken
      });
    }
    
    // Exercise reminders
    for (const exercise of exercises) {
      const [hour, minute] = exercise.time.split(':').map(Number);
      const reminderTime = `${String(hour).padStart(2, '0')}:${String(Math.max(0, minute - 5)).padStart(2, '0')}`;
      
      notifications.push({
        user_id: formData.user_id,
        notification_type: 'exercise_reminder',
        title: '⏰ Therapy Time Soon!',
        body: `${exercise.exercise} in 5 minutes`,
        scheduled_for_utc: getNextUTCOccurrence(reminderTime, dayIndex),
        scheduled_for_local: reminderTime,
        day_of_week: dayIndex,
        push_token: pushToken
      });
    }
  }
  
  // Insert all notifications
  const { error } = await supabase
    .from('notification_queue')
    .insert(notifications);
    
  if (error) console.error('Error queuing notifications:', error);
  else console.log(`Queued ${notifications.length} notifications`);
};



// Add this function inside the CalendarForm component, around line 1000-1100

const setupEveningCheckIns = async (schedule, childName) => {
  try {
    // First set up actionable categories (iOS/Android)
    await Notifications.setNotificationCategoryAsync('DAILY_CHECKIN', [
      {
        identifier: 'COMPLETED_ALL',
        buttonTitle: '✅ Did all!',
        options: { 
          opensAppToForeground: false,
          isDestructive: false,
          isAuthenticationRequired: false 
        },
      },
      {
        identifier: 'COMPLETED_SOME',
        buttonTitle: '💪 Did some',
        options: { 
          opensAppToForeground: false,
          isDestructive: false,
          isAuthenticationRequired: false
        },
      },
      {
        identifier: 'MISSED',
        buttonTitle: '❌ Missed today',
        options: { 
          opensAppToForeground: false,
          isDestructive: true,
          isAuthenticationRequired: false
        },
      },
    ]);
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Schedule check-in for each day with exercises
    for (const [day, exercises] of Object.entries(schedule)) {
      if (exercises && exercises.length > 0) {
        const lastExercise = exercises[exercises.length - 1];
        const [hour, minute] = lastExercise.time.split(':').map(Number);
        
        // Calculate check-in time (1 hour after last exercise)
        let checkInHour = hour + 1;
        let checkInMinute = minute;
        
        // Cap at 9 PM
        if (checkInHour > 21) {
          checkInHour = 21;
          checkInMinute = 0;
        }
        
        const dayIndex = days.indexOf(day);
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `How did therapy time go with ${childName}? 💜`,
            body: "Tap to record today's progress!",
            categoryIdentifier: 'DAILY_CHECKIN',
            data: { 
              type: 'evening_checkin',
              day: day,
              exerciseCount: exercises.length
            },
          },
          trigger: {
            weekday: dayIndex + 1,
            hour: checkInHour,
            minute: checkInMinute,
            repeats: true,
          },
        });
      }
    }
    
    console.log('✅ Evening check-ins scheduled');
  } catch (error) {
    console.error('Error setting up check-ins:', error);
  }
};


  const generateScheduleAfterValidation = async () => {

    try {


      const { data: { user }, error: authError } = await supabase.auth.getUser();

          if (!user) {
        console.error('❌ No user found!', authError);
        Alert.alert('Error', 'You must be signed in to save a schedule');
        return;
      }
      
      // NOW you can set user_id
      formData.user_id = user.id;
      
      if (!user) {
        console.error('❌ No user found!', authError);
        Alert.alert('Error', 'You must be signed in to save a schedule');
        return;
      }
      
      console.log('✅ User authenticated:', user.id);

      const messages = [
        `Creating ${formData.childFirstName}'s personalized schedule...`,
        'Analyzing therapy needs...',
        'Finding best exercise times...',
        'Avoiding meal times and conflicts...',
        'Optimizing for your availability...',
        'Almost ready...'
      ];
      
      let messageIndex = 0;
      const messageInterval = setInterval(() => {
        if (messageIndex < messages.length) {
          setLoadingMessage(messages[messageIndex]);
          messageIndex++;
        }
      }, 800);
      
      const scheduleResult = await generateRealSchedule(formData);
      
      clearInterval(messageInterval);
      
      if (!scheduleResult || !scheduleResult.schedule) {
        setIsGenerating(false);
        Alert.alert('Error', 'Failed to generate schedule structure');
        return;
      }
      
      const hasAnyExercises = Object.values(scheduleResult.schedule)
        .some(daySchedule => daySchedule.length > 0);
      
      if (!hasAnyExercises) {
        setIsGenerating(false);
        Alert.alert(
          '📅 Schedule Issue',
          'Could not fit any exercises with current settings. Please ensure you have selected available time blocks.',
          [{ text: 'Adjust Settings', onPress: () => setCurrentStep(6) }]
        );
        return;
      }
   const environment = await captureUserEnvironment();

      const dataToSave = {
  user_id: user.id,
  user_email: user.email,
  
  form_data: {
    parentName: formData.parentName,
    email: formData.email,
    phone: formData.phone,
    user_timezone: environment.timezone,
    push_token: environment.pushToken,
    utc_offset: environment.utcOffset,
    childFirstName: formData.childFirstName,
    childAge: formData.childAge,
    tellUsAboutChild: formData.tellUsAboutChild,
    selectedConcerns: formData.selectedConcerns,
    speechTherapy: formData.speechTherapy,
    otTherapy: formData.otTherapy,
    physicalTherapy: formData.physicalTherapy,
    abaTherapy: formData.abaTherapy,
    
    schoolSchedule: {
      hasSchool: formData.hasSchool,
      schoolStartTime: formData.schoolStartTime,
      schoolEndTime: formData.schoolEndTime,
      schoolDays: formData.schoolDays
    },
    dailyRoutine: {
      breakfastTime: formData.breakfastTime,
      lunchTime: formData.lunchTime,
      dinnerTime: formData.dinnerTime,
      bedtime: formData.bedtime

    },
    parentAvailability: formData.parentAvailability,
    remindersEnabled: formData.remindersEnabled,
    morningBriefingTime: formData.morningBriefingTime,
    eveningReflectionEnabled: formData.eveningReflectionEnabled,
    exerciseNotes: formData.exerciseNotes || {}
  },
  daily_schedule: scheduleResult.schedule,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
  
};
 // await supabase.from('therapy_schedules').upsert(dataToSave);
  await queueNotificationsInBackend(scheduleResult.schedule, formData, environment);


      if (!isDemoMode && user) {
        const { error } = await supabase
          .from('therapy_schedules')
          .upsert(dataToSave, {
            onConflict: 'user_id'
          });
        
        if (error) {
          console.error('❌ Error saving to Supabase:', error);
          Alert.alert(
            'Save Error', 
            'Failed to save to cloud. Schedule will be saved locally only.'
          );
        } else {
          console.log('✅ Schedule saved to Supabase');
        }
      }
      
      const localData = {
        ...formData,

          morningBriefingTime: formData.morningBriefingTime || '07:00',
      eveningReflectionTime: formData.eveningReflectionTime || '20:00',
      remindersEnabled: formData.remindersEnabled || false,
        dailySchedule: scheduleResult.schedule,
        conflicts: scheduleResult.conflicts || {},
        explanations: scheduleResult.explanations || {},
        childFirstName: formData.childFirstName,
        user_id: user.id,
        user_email: user.email
      };
      
      await AsyncStorage.setItem('therapyFormData', JSON.stringify(localData));
      console.log('✅ Schedule saved to AsyncStorage');
   console.log('FormData before scheduling:', {
  morningBriefingTime: formData.morningBriefingTime,
  dinnerTime: formData.dinnerTime,
  remindersEnabled: formData.remindersEnabled
});
   
      if (formData.remindersEnabled) {
        //await scheduleNotifications(scheduleResult.schedule, formData);
          // await setupEveningCheckIns(scheduleResult.schedule, formData.childFirstName);
            await scheduleTomorrowOnly(scheduleResult.schedule, formData);
const scheduled = await Notifications.getAllScheduledNotificationsAsync();

 console.log(`Total notifications scheduled: ${scheduled.length}`);

        if (!isDemoMode) {
          await logScheduledReminders(scheduleResult.schedule, formData);
        }
      }
      
      setLoadingMessage('Schedule ready! 🎉');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIsGenerating(false);
      router.push('/schedule');
      
    } catch (error) {
      console.error('❌ Error in generateScheduleAfterValidation:', error);
      setIsGenerating(false);
      Alert.alert('Error', 'Failed to generate schedule: ' + error.message);
    }
  };

  const logScheduledReminders = async (schedule, formData) => {
    const logs = [];
    
    for (const [day, exercises] of Object.entries(schedule)) {
      for (const exercise of exercises) {
        logs.push({
          user_email: formData.email,
          reminder_type: formData.reminderType,
          scheduled_time: `${day} ${exercise.time}`,
          exercise_name: exercise.exercise,
          exercise_type: exercise.therapy_type,
          was_sent: false,
          was_acknowledged: false,
          completed: false
        });
      }
    }
    
    if (logs.length > 0) {
      const { error } = await supabase
        .from('reminder_logs')
        .insert(logs);
      
      if (error) console.error('Error logging reminders:', error);
    }
  };


  const hasConflict = (day, time, formData) => {
  const conflicts = [];
  const timeInMinutes = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);
  
  // Check meal times
  const mealTimes = [
    { name: 'Breakfast', time: formData.breakfastTime, prepTime: 30, digestTime: 60 },
    { name: 'Lunch', time: formData.lunchTime, prepTime: 30, digestTime: 60 },
    { name: 'Dinner', time: formData.dinnerTime, prepTime: 45, digestTime: 60 }
  ];
  
  mealTimes.forEach(meal => {
    if (meal.time) {
      const [mealHour, mealMin] = meal.time.split(':');
      const mealMinutes = parseInt(mealHour) * 60 + parseInt(mealMin);
      
      if (timeInMinutes >= mealMinutes - meal.prepTime && timeInMinutes <= mealMinutes) {
        conflicts.push(`${meal.name} prep time`);
      }
      
      if (timeInMinutes >= mealMinutes && timeInMinutes < mealMinutes + meal.digestTime) {
        conflicts.push(`Digestion time after ${meal.name}`);
      }
    }
  });
  
  // Check bedtime
  const bedtime = formData.bedtime;
  if (bedtime) {
    const [bedHour, bedMin] = bedtime.split(':');
    const bedMinutes = parseInt(bedHour) * 60 + parseInt(bedMin);
    if (timeInMinutes >= bedMinutes - 30) {
      conflicts.push('Too close to bedtime - winding down time');
    }
  }
  
  // Check nap time for young children
  if (parseInt(formData.childAge) < 5 && timeInMinutes >= 13 * 60 && timeInMinutes < 15 * 60) {
    conflicts.push('Typical nap time for young children');
  }
  
  // Check school hours
  if (formData.hasSchool === 'yes' && formData.schoolDays?.includes(day)) {
    const schoolStart = formData.schoolStartTime;
    const schoolEnd = formData.schoolEndTime;
    
    if (schoolStart && schoolEnd) {
      const [startHour, startMin] = schoolStart.split(':');
      const [endHour, endMin] = schoolEnd.split(':');
      const schoolStartMinutes = parseInt(startHour) * 60 + parseInt(startMin);
      const schoolEndMinutes = parseInt(endHour) * 60 + parseInt(endMin);
      
      if (timeInMinutes >= schoolStartMinutes && timeInMinutes < schoolEndMinutes) {
        conflicts.push('School hours');
      }
    }
  }
  
  // Check standard therapies
  const therapies = ['speechTherapy', 'otTherapy', 'physicalTherapy', 'abaTherapy'];
  
  for (const therapy of therapies) {
    if (formData[therapy]?.enabled && formData[therapy]?.sessionDays?.includes(day)) {
      const sessionStart = formData[therapy].sessionTime;
      const sessionHours = parseFloat(formData[therapy].sessionHours || 1);
      
      if (sessionStart) {
        const [sessionHour, sessionMin] = sessionStart.split(':');
        const sessionStartMinutes = parseInt(sessionHour) * 60 + parseInt(sessionMin);
        const sessionEndMinutes = sessionStartMinutes + (sessionHours * 60);
        
        if (timeInMinutes >= sessionStartMinutes && timeInMinutes < sessionEndMinutes) {
          conflicts.push(`${therapy.replace('Therapy', ' therapy')} session`);
        }
      }
    }
  }
  
  // Check additional therapies (replacing fixed activities)
  if (formData.additionalTherapies && formData.additionalTherapies.length > 0) {
    formData.additionalTherapies.forEach(therapy => {
      if (therapy.enabled && therapy.sessionDays?.includes(day) && therapy.sessionTime) {
        const [therapyHour, therapyMin] = therapy.sessionTime.split(':');
        const therapyStartMinutes = parseInt(therapyHour) * 60 + parseInt(therapyMin);
        const therapyDuration = parseFloat(therapy.sessionHours || 1) * 60;
        const therapyEndMinutes = therapyStartMinutes + therapyDuration;
        
        if (timeInMinutes >= therapyStartMinutes && timeInMinutes < therapyEndMinutes) {
          conflicts.push(`${therapy.name || 'Additional therapy'} session`);
        }
      }
    });
  }
  
  return conflicts;
};

  const checkTherapistExercises = async (email) => {
    try {
      console.log('Checking exercises for:', email);

      const { data: prescribed } = await supabase
        .from('prescribed_exercises')
        .select('*')
        .eq('family_email', email)
        .eq('active', true);
      
      if (prescribed && prescribed.length > 0) {
        const therapistExercises = prescribed.map(ex => ({
          name: ex.exercise_name,
          duration: ex.duration_minutes,
          frequency: ex.frequency_per_day,
          type: ex.exercise_type,
          isTherapistAssigned: true,
          instructions: ex.instructions
        }));
        
        return therapistExercises;
      }
      return [];
    } catch (error) {
      console.error('Error fetching therapist exercises:', error);
      return [];
    }
  };

  const generateRealSchedule = async (formData) => {
  const schedule = {};
  const conflicts = {};
  const explanations = {};
  const occupiedSlots = {};
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const therapistExercises = await checkTherapistExercises(formData.email);
  const parentPriorities = formData.parentPriorities || [];

  const allPriorityExercises = [
    ...therapistExercises.map(e => ({...e, source: 'therapist'})),
    ...parentPriorities.filter(p => p.importance === 'critical').map(e => ({...e, source: 'parent-critical'})),
    ...parentPriorities.filter(p => p.importance !== 'critical').map(e => ({...e, source: 'parent-normal'}))
  ];

  let globalExerciseIndex = 0;
  
  const getDetailedTimeSlots = (timeBlocks, isWeekend, hasSchool, schoolEnd, formData) => {
    const slots = [];
    const timeInMinutes = (time) => {
      const [h, m] = time.split(':');
      return parseInt(h) * 60 + parseInt(m);
    };
    
    const addSlotsInRange = (startTime, endTime, period) => {
      const startMin = timeInMinutes(startTime);
      const endMin = timeInMinutes(endTime);
      
      for (let time = startMin; time <= endMin - 15; time += 20) {
        const hour = Math.floor(time / 60);
        const min = time % 60;
        slots.push({
          time: `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
          period: period
        });
      }
    };
    
    if (timeBlocks?.earlyMorning) {
      //const startTime = timeInMinutes('06:00');
      //const endTime = Math.min(timeInMinutes('08:00'), timeInMinutes(formData.breakfastTime || '08:00') - 30);
      
    /*  if (startTime < endTime) {
        const startHour = Math.floor(startTime / 60);
        const startMinute = startTime % 60;
        const endHour = Math.floor(endTime / 60);
        const endMinute = endTime % 60;
        
        addSlotsInRange(
          `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`,
          `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`,
          'earlyMorning'
        );
      }*/
    }
    
if (timeBlocks?.morning && (isWeekend || !hasSchool)) {
  // More realistic morning timing - kids need time to settle after breakfast
  const startTime = Math.max(
    timeInMinutes('09:30'), // Never before 9:30 AM
    formData.breakfastTime ? timeInMinutes(formData.breakfastTime) + 90 : timeInMinutes('09:30')
    // 1.5 hours after breakfast for digestion and settling
  );
  
  const endTime = Math.min(
    timeInMinutes('11:30'), // Morning block ends at 11:30
    formData.lunchTime ? timeInMinutes(formData.lunchTime) - 30 : timeInMinutes('11:30')
    // Stop 30 min before lunch
  );
  
  if (startTime < endTime) {
    const startHour = Math.floor(startTime / 60);
    const startMinute = startTime % 60;
    const endHour = Math.floor(endTime / 60);
    const endMinute = endTime % 60;
    
    addSlotsInRange(
      `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`,
      `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`,
      'morning'
    );
  }
}

    if (timeBlocks?.afternoon) {
  let startTime;
  let endTime;
  
  if (hasSchool && !isWeekend && schoolEnd) {
    // School days: kids need time to decompress
    const [schoolEndHour, schoolEndMin] = schoolEnd.split(':');
    const schoolEndMinutes = parseInt(schoolEndHour) * 60 + parseInt(schoolEndMin);
    
    // Give 45 minutes after school for snack, bathroom, decompress
    startTime = Math.max(
      schoolEndMinutes + 45,  // 45 min after school ends
      timeInMinutes('15:30')   // But never before 3:30 PM
    );
    
    // End by 5:30 PM on school days
    endTime = Math.min(
      timeInMinutes('17:30'),
      formData.dinnerTime ? timeInMinutes(formData.dinnerTime) - 45 : timeInMinutes('17:30')
    );
    
  } else {
    // Weekends/No school: afternoon is post-lunch
    // Allow 1 hour after lunch for digestion
    startTime = formData.lunchTime ? 
      timeInMinutes(formData.lunchTime) + 60 : 
      timeInMinutes('13:30');
    
    // Weekend afternoons can go until 4 PM
    endTime = Math.min(
      timeInMinutes('16:00'),
      formData.dinnerTime ? timeInMinutes(formData.dinnerTime) - 60 : timeInMinutes('16:00')
    );
  }
  
  // Only add slots if there's actually time available
  if (startTime < endTime) {
    const startHour = Math.floor(startTime / 60);
    const startMinute = startTime % 60;
    const endHour = Math.floor(endTime / 60);
    const endMinute = endTime % 60;
    
    addSlotsInRange(
      `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`,
      `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`,
      'afternoon'
    );
  }
}
    
   if (timeBlocks?.evening) {
  let startTime;
  let endTime;
  
  // Evening should start AFTER afternoon ends, not overlap
  if (hasSchool && !isWeekend) {
    // School days: evening is 5:30 PM - 7:00 PM window
    startTime = timeInMinutes('17:30'); // After afternoon ends
  } else {
    // Weekends: evening can start at 4:00 PM (after afternoon ends at 4)
    startTime = timeInMinutes('16:00');
  }
  
  // Evening ends 45 minutes before dinner (for prep)
  endTime = formData.dinnerTime ? 
    timeInMinutes(formData.dinnerTime) - 45 :
    timeInMinutes('18:15'); // Default assumes 7 PM dinner
  
  // Only create evening slots if there's actual time
  if (startTime < endTime) {
    const startHour = Math.floor(startTime / 60);
    const startMinute = startTime % 60;
    const endHour = Math.floor(endTime / 60);
    const endMinute = endTime % 60;
    
    addSlotsInRange(
      `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`,
      `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`,
      'evening'
    );
  }
}

    if (timeBlocks?.night) {
      const dinnerEnd = formData.dinnerTime ? 
        timeInMinutes(formData.dinnerTime) + 60 :
        timeInMinutes('20:00');
      const bedtimeStart = formData.bedtime ? 
        timeInMinutes(formData.bedtime) - 45 :
        timeInMinutes('21:30');
      
      if (dinnerEnd < bedtimeStart) {
        const startHour = Math.floor(dinnerEnd / 60);
        const startMinute = dinnerEnd % 60;
        const endHour = Math.floor(bedtimeStart / 60);
        const endMinute = bedtimeStart % 60;
        
        addSlotsInRange(
          `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`,
          `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`,
          'night'
        );
      }
    }
    
    return slots;
  };
  
 
    
    const generateSuggestions = (day, exercisesScheduled, exercisesNeeded, formData, timeBlocks) => {
      const suggestions = [];
      
      if (exercisesScheduled < exercisesNeeded) {
        const deficit = exercisesNeeded - exercisesScheduled;
        
        if (timeBlocks?.night && formData.bedtime) {
          const [bedHour] = formData.bedtime.split(':');
          if (parseInt(bedHour) <= 21) {
            suggestions.push({
              type: 'actionable',
              message: `Moving bedtime 30min later (to ${parseInt(bedHour)}:30) would add space for ${Math.min(2, deficit)} more exercises`
            });
          }
        }
        
        if (timeBlocks?.evening && formData.dinnerTime) {
          const [dinnerHour] = formData.dinnerTime.split(':');
          if (parseInt(dinnerHour) >= 19) {
            suggestions.push({
              type: 'actionable',
              message: `Moving dinner 30min earlier would add space for ${Math.min(2, deficit)} more exercises`
            });
          }
        }
        
        if (!timeBlocks?.earlyMorning && parseInt(formData.childAge) >= 5) {
          suggestions.push({
            type: 'actionable',
            message: `Adding early morning slot (6-8am) would provide space for ${Math.min(3, deficit)} more exercises`
          });
        }
        
        if (formData.dinnerTime && formData.bedtime) {
          const timeInMinutes = (time) => {
            if (!time) return 0;
            const [h, m] = time.split(':');
            return parseInt(h) * 60 + parseInt(m);
          };
          
          const dinnerEnd = timeInMinutes(formData.dinnerTime) + 60;
          const bedStart = timeInMinutes(formData.bedtime) - 30;
          const availableMinutes = Math.max(0, bedStart - dinnerEnd);
          const possibleExercises = Math.floor(availableMinutes / 20);
          
          suggestions.push({
            type: 'explanation',
            message: `Current window: ${Math.floor(availableMinutes/60)}h ${availableMinutes%60}min between dinner and bedtime = space for ${possibleExercises} exercises`
          });
        }
      }
      
      return suggestions;
    };
    
    const timeInMinutes = (time) => {
      if (!time) return 0;
      const [h, m] = time.split(':');
      return parseInt(h) * 60 + parseInt(m);
    };
    
    for (const day of days) {
      const isWeekend = day === 'Saturday' || day === 'Sunday';
      const isSchoolDay = !isWeekend && formData.hasSchool === 'yes' && formData.schoolDays?.includes(day);
      
      const parentHours = parseFloat(
        isWeekend 
          ? formData.parentAvailability?.weekendHours 
          : formData.parentAvailability?.weekdayHours
      ) || 0;
      
      schedule[day] = [];
      conflicts[day] = [];
      explanations[day] = [];
      
      if (parentHours > 0) {
        const timeBlocks = isWeekend 
          ? formData.parentAvailability?.weekendTimeBlocks
          : formData.parentAvailability?.weekdayTimeBlocks;
        
        const availableSlots = getDetailedTimeSlots(
          timeBlocks, 
          isWeekend, 
          isSchoolDay,
          formData.schoolEndTime,
          formData
        );
        
        const exercisesNeeded = Math.floor(parentHours * 60 / 15);
        let exercisesScheduled = 0;
        
        console.log(`${day}: Found ${availableSlots.length} potential slots for ${exercisesNeeded} exercises`);
        
        for (let i = 0; i < availableSlots.length && exercisesScheduled < exercisesNeeded; i++) {
          const slot = availableSlots[i];

          const slotMinutes = timeInMinutes(slot.time);
          let isOccupied = false;
          
          if (occupiedSlots[day]) {
            for (const occupied of occupiedSlots[day]) {
              if (slotMinutes >= occupied.start && slotMinutes < occupied.end) {
                isOccupied = true;
                break;
              }
            }
          }
          
          if (isOccupied) continue;

          const conflictList = hasConflict(day, slot.time, formData);
          
          if (conflictList.length === 0) {
            const exercise = await getExerciseType(formData, globalExerciseIndex++, allPriorityExercises);
            
            const durationMatch = exercise.duration.match(/(\d+)/);
            const duration = durationMatch ? parseInt(durationMatch[1]) : 15;
            
            if (!occupiedSlots[day]) occupiedSlots[day] = [];
            occupiedSlots[day].push({
              start: slotMinutes,
              end: slotMinutes + duration + 10
            });
            
            const exerciseDuration = parseInt(exercise.duration) || 15;
            const breakTime = 10;
            const totalBlockTime = exerciseDuration + breakTime;
            
            const [hours, minutes] = slot.time.split(':').map(Number);
            const endTimeMinutes = hours * 60 + minutes + totalBlockTime;
            
         schedule[day].push({
  time: slot.time,
  exercise: exercise.name,
  endTime: `${Math.floor(endTimeMinutes/60)}:${(endTimeMinutes%60).toString().padStart(2, '0')}`,
  therapy_type: exercise.therapy_type,
  duration: exercise.duration || '15 minutes',
  targets: exercise.targets,
  tools: exercise.tools,
  how_to: exercise.how_to,
  period: slot.period,
  noteKey: `${day}-${slot.time}`,  // ADD THIS LINE
  customNote: ''  // ADD THIS LINE
});
            
            exercisesScheduled++;
          } else {
            conflicts[day].push({
              time: slot.time,
              reasons: conflictList
            });
          }
        }
        
        if (exercisesScheduled < exercisesNeeded) {
          const suggestions = generateSuggestions(
            day, 
            exercisesScheduled, 
            exercisesNeeded, 
            formData, 
            timeBlocks
          );
          
          explanations[day].push({
            type: 'warning',
            message: `Only scheduled ${exercisesScheduled} of ${exercisesNeeded} exercises due to time constraints.`,
            suggestions: suggestions
          });
        }
        
        schedule[day].sort((a, b) => {
          const timeA = parseInt(a.time.replace(':', ''));
          const timeB = parseInt(b.time.replace(':', ''));
          return timeA - timeB;
        });
      } else {
        explanations[day].push({
          type: 'info',
          message: 'No exercises scheduled - no hours allocated for this day'
        });
      }
    }
    
    const totalExercisesScheduled = Object.values(schedule).flat().length;
    const weekdayHours = parseFloat(formData.parentAvailability?.weekdayHours || 0);
    const weekendHours = parseFloat(formData.parentAvailability?.weekendHours || 0);
    const expectedTotal = Math.floor((weekdayHours * 5 + weekendHours * 2) * 60 / 15);
    
    console.log(`Scheduled ${totalExercisesScheduled} exercises. Expected ${expectedTotal}`);
    
    return { schedule, conflicts, explanations };
  };

  const getExerciseType = async (formData, index, priorityExercises  = []) => {
    try {
      if (priorityExercises.length > 0 && index < priorityExercises.length) {
        const priorityEx = priorityExercises[index];
        return {
          name: priorityEx.name,
          therapy_type: priorityEx.source === 'therapist' 
            ? priorityEx.type + ' (Therapist Assigned)'
            : priorityEx.source === 'parent-critical'
            ? 'Parent Priority (Critical)'
            : 'Parent Priority',
          duration: `${priorityEx.duration} minutes`,
          targets: priorityEx.source === 'therapist' 
            ? 'As prescribed by therapist'
            : 'Parent knows this works',
          tools: priorityEx.instructions || 'See instructions',
          how_to: priorityEx.instructions || 'Follow guidance',
          isTherapistAssigned: priorityEx.source === 'therapist',
          isParentPriority: priorityEx.source?.includes('parent')
        };
      }
      
      const adjustedIndex = index - priorityExercises.length;
      const childAge = parseInt(formData.childAge) || 5;
      const concerns = Object.keys(formData.selectedConcerns || {})
        .filter(k => formData.selectedConcerns[k]);
      
      console.log('Fetching exercises for age:', childAge, 'concerns:', concerns);
      
      let query = supabase
        .from('exercise_library')
        .select('*')
        .gte('min_age', 0)
        .lte('min_age', childAge)
        .gte('max_age', childAge);
      
      if (concerns.length > 0) {
        const orConditions = concerns.map(concern => 
          `skill_areas.cs.{${concern}}`
        ).join(',');
        
        query = query.or(orConditions);
      }
      
      const { data: exercises, error } = await query;
      
      if (error) {
        console.error('Supabase error:', error);
        return getDefaultExercise(index);
      }
      
      console.log('Found exercises:', exercises?.length || 0);
      
      if (exercises && exercises.length > 0) {
        const exercise = exercises[adjustedIndex % exercises.length];
        console.log('Selected:', exercise.exercise_name);
        
        return {
          name: exercise.exercise_name || `Activity ${index + 1}`,
          therapy_type: Array.isArray(exercise.therapy_type) 
            ? exercise.therapy_type.join(', ') 
            : exercise.therapy_type || 'General',
          targets: Array.isArray(exercise.reflex_targets)
            ? exercise.reflex_targets.join(', ')
            : exercise.reflex_targets || 'General development',
          duration: exercise.duration || '15 minutes',
          tools: Array.isArray(exercise.tools_required)
            ? exercise.tools_required.join(', ')
            : exercise.tools_required || 'None required',
          how_to: exercise.how_to_do || 'Follow standard procedure',
          skill_areas: Array.isArray(exercise.skill_areas)
            ? exercise.skill_areas.join(', ')
            : exercise.skill_areas || ''
        };
      }
      
      return getDefaultExercise(index);
      
    } catch (error) {
      console.error('Error in getExerciseType:', error);
      return getDefaultExercise(index);
    }
  };

  const getDefaultExercise = (index) => {
    return {
      name: `Activity ${index + 1}`,
      therapy_type: 'General',
      duration: '15 minutes',
      targets: 'General development',
      tools: 'None required',
      how_to: 'Follow standard procedure'
    };
  };

  const analyzeWithAI = async () => {
    if (!formData.tellUsAboutChild || !formData.childAge) {
      Alert.alert('Missing Info', 'Please fill in child details first');
      return;
    }
    
    setIsAnalyzing(true);

    const selectedConcernsList = Object.keys(formData.selectedConcerns || {})
      .filter(key => formData.selectedConcerns[key])
      .join(', ');
    
    const combinedText = `
      Child Age: ${formData.childAge}
      Description: ${formData.tellUsAboutChild}
      Selected Concerns: ${selectedConcernsList}
      Additional Concerns: ${formData.mainConcerns || 'None'}
    `;
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Analyze this child profile and list 10 specific therapy needs or areas requiring attention. Be concise and specific. Format as numbered list.'
            },
            {
              role: 'user',
              content: combinedText
            }
          ],
          temperature: 0.3,
          max_tokens: 400
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }
      
      const analysis = data.choices[0].message.content;
      
      const points = analysis
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^\d+\.?\s*/, '').trim())
        .filter(line => line.length > 0)
        .slice(0, 10);
      
      setAiAnalysis(points);
      
      setFormData(prev => ({
        ...prev,
        aiDetectedNeeds: points
      }));
      
    } catch (error) {
      console.error('AI Error:', error);
      Alert.alert('Analysis Failed', 'Could not analyze. Please continue manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTherapyDayToggle = (therapy, day) => {
    const currentDays = formData[therapy].sessionDays;
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    
    setFormData({
      ...formData,
      [therapy]: { ...formData[therapy], sessionDays: newDays }
    });
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your progress will be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          onPress: async () => {
            await supabase.auth.signOut();
            await AsyncStorage.removeItem('userEmail');
            router.replace('/welcome');
          }
        }
      ]
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <View style={styles.luxuryHeader}>
              <Text style={styles.luxuryStepTitle}>Parent Information</Text>
              <Text style={styles.luxurySubtitle}>Let's start with your contact details</Text>
            </View>
            
            <View style={styles.readOnlyField}>
              <Text style={styles.luxuryLabel}>Account Email</Text>
              <View style={styles.readOnlyBox}>
                <Text style={styles.readOnlyText}>{formData.email || 'Loading...'}</Text>
              </View>
            </View>
            
            <LuxuryInput
              placeholder="Parent Name *"
              value={formData.parentName}
              onChangeText={(text) => {
                setFormData({...formData, parentName: text});
                validateField('parentName', text);
              }}
              onBlur={() => validateField('parentName', formData.parentName)}
              error={errors.parentName}
              icon={<Ionicons name="person" size={18} />}
            />
            
            <LuxuryInput
              placeholder="Phone Number"
              value={formData.phone}
              onChangeText={(text) => setFormData({...formData, phone: text})}
              keyboardType="phone-pad"
              icon={<Ionicons name="call" size={18} />}
            />
          </View>
        );
        
      case 1:
        return (
          <View style={styles.stepContent}>
            <View style={styles.luxuryHeader}>
              <Text style={styles.luxuryStepTitle}>Tell Us About Your Child</Text>
              <Text style={styles.luxurySubtitle}>Help us understand your child's unique needs</Text>
            </View>
            
            <View style={styles.luxuryInfoBox}>
              <LinearGradient
                colors={['#f5f0e8', '#faf8f5']}
                style={styles.gradientBackground}
              >
                <FontAwesome5 name="robot" size={16} color="#6b5b95" />
                <Text style={styles.luxuryInfoText}>
                  Describe your child's needs. We will analyze this to create the perfect schedule for your Little One.
                </Text>
              </LinearGradient>
            </View>
            
            <LuxuryInput
              placeholder="Child's First Name *"
              value={formData.childFirstName}
              onChangeText={(text) => {
                setFormData({...formData, childFirstName: text});
                validateField('childFirstName', text);
              }}
              onBlur={() => validateField('childFirstName', formData.childFirstName)}
              error={errors.childFirstName}
              icon={<Ionicons name="happy" size={18} />}
            />
            
            <LuxuryInput
              placeholder="Child's Age *"
              value={formData.childAge}
              onChangeText={(text) => {
                setFormData({...formData, childAge: text});
                validateField('childAge', text);
              }}
              onBlur={() => validateField('childAge', formData.childAge)}
              error={errors.childAge}
              keyboardType="numeric"
              icon={<FontAwesome5 name="birthday-cake" size={16} />}
            />
            
            <LuxuryInput
              placeholder="Describe your child (speech delays, behavior issues, sensory problems, motor skills, etc.)"
              value={formData.tellUsAboutChild}
              onChangeText={(text) => setFormData({...formData, tellUsAboutChild: text})}
              multiline
              numberOfLines={4}
              error={errors.tellUsAboutChild}
            />

            <Text style={styles.luxuryLabel}>Select Areas of Concern:</Text>
            <View style={styles.concernsGrid}>
              {[
                { key: 'speech', label: '🗣️ Speech', desc: 'Language & communication' },
                { key: 'feeding', label: '🍽️ Feeding', desc: 'Eating & swallowing' },
                { key: 'behavior', label: '😤 Behavior', desc: 'Tantrums & regulation' },
                { key: 'physical', label: '💪 Physical', desc: 'Strength & endurance' },
                { key: 'balance', label: '🤸 Balance', desc: 'Coordination & motor' },
                { key: 'school', label: '📚 School Ready', desc: 'Academic skills' },
                { key: 'daily', label: '🏠 Daily Living', desc: 'Self-care skills' }
              ].map(concern => (
                <TouchableOpacity
                  key={concern.key}
                  style={[
                    styles.luxuryConcernCard,
                    formData.selectedConcerns?.[concern.key] && styles.luxuryConcernCardActive
                  ]}
                  onPress={() => {
                    setFormData({
                      ...formData,
                      selectedConcerns: {
                        ...formData.selectedConcerns,
                        [concern.key]: !formData.selectedConcerns?.[concern.key]
                      }
                    });
                  }}
                >
                  <Text style={[
                    styles.concernLabel,
                    formData.selectedConcerns?.[concern.key] && styles.concernLabelActive
                  ]}>
                    {concern.label}
                  </Text>
                  <Text style={[
                    styles.concernDesc,
                    formData.selectedConcerns?.[concern.key] && styles.concernDescActive
                  ]}>
                    {concern.desc}
                  </Text>
                  {formData.selectedConcerns?.[concern.key] && (
                    <View style={styles.checkmarkContainer}>
                      <Ionicons name="checkmark-circle" size={20} color="#6b5b95" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
        
     case 2:
  return (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <View style={styles.luxuryHeader}>
        <Text style={styles.luxuryStepTitle}>Professional Therapy Services</Text>
        <Text style={styles.luxurySubtitle}>Include ALL therapies - standard and additional (laser, swimming, massage, etc.)</Text>
      </View>
      
      {/* Standard Therapies */}
      {[
        { key: 'speechTherapy', name: '🗣️ Speech Therapy', maxHours: 2 },
        { key: 'otTherapy', name: '✋ Occupational Therapy', maxHours: 2 },
        { key: 'physicalTherapy', name: '💪 Physical Therapy', maxHours: 2 },
        { key: 'abaTherapy', name: '🧩 ABA Therapy', maxHours: 8 }
      ].map(therapy => (
        <View key={therapy.key} style={styles.luxuryTherapyCard}>
          <View style={styles.therapyHeader}>
            <Text style={styles.therapyName}>{therapy.name}</Text>
            <Switch
              value={formData[therapy.key].enabled}
              onValueChange={(value) => 
                setFormData({
                  ...formData,
                  [therapy.key]: { ...formData[therapy.key], enabled: value }
                })
              }
              trackColor={{ false: "#E2E8F0", true: "#d4a574" }}
              thumbColor={formData[therapy.key].enabled ? "#6b5b95" : "#94A3B8"}
            />
          </View>
          
          {formData[therapy.key].enabled && (
            <View style={styles.therapyDetails}>
              <TimePicker
                value={formData[therapy.key].sessionTime}
                onChange={(time) => 
                  setFormData({
                    ...formData,
                    [therapy.key]: { ...formData[therapy.key], sessionTime: time }
                  })
                }
                label="Session Time"
              />
              
              <Text style={styles.luxuryLabel}>Duration (hours)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.luxuryButtonGroup}>
                  {therapy.key === 'abaTherapy' ? 
                    ['1', '2', '3', '4', '5', '6', '7', '8'].map(hour => (
                      <TouchableOpacity
                        key={hour}
                        style={[
                          styles.luxuryOptionButton,
                          formData[therapy.key].sessionHours === hour && styles.luxuryOptionButtonActive
                        ]}
                        onPress={() => 
                          setFormData({
                            ...formData,
                            [therapy.key]: { ...formData[therapy.key], sessionHours: hour }
                          })
                        }
                      >
                        <Text style={[
                          styles.luxuryOptionText,
                          formData[therapy.key].sessionHours === hour && styles.luxuryOptionTextActive
                        ]}>
                          {hour}
                        </Text>
                      </TouchableOpacity>
                    )) :
                    ['0.5', '1', '1.5', '2'].map(hour => (
                      <TouchableOpacity
                        key={hour}
                        style={[
                          styles.luxuryOptionButton,
                          formData[therapy.key].sessionHours === hour && styles.luxuryOptionButtonActive
                        ]}
                        onPress={() => 
                          setFormData({
                            ...formData,
                            [therapy.key]: { ...formData[therapy.key], sessionHours: hour }
                          })
                        }
                      >
                        <Text style={[
                          styles.luxuryOptionText,
                          formData[therapy.key].sessionHours === hour && styles.luxuryOptionTextActive
                        ]}>
                          {hour}h
                        </Text>
                      </TouchableOpacity>
                    ))
                  }
                </View>
              </ScrollView>
              
              <Text style={styles.luxuryLabel}>Select Days</Text>
              <View style={styles.luxuryDaysGrid}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                  const fullDay = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][idx];
                  return (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.luxuryDayChip,
                        formData[therapy.key].sessionDays.includes(fullDay) && styles.luxuryDayChipActive
                      ]}
                      onPress={() => handleTherapyDayToggle(therapy.key, fullDay)}
                    >
                      <Text style={[
                        styles.luxuryDayText,
                        formData[therapy.key].sessionDays.includes(fullDay) && styles.luxuryDayTextActive
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      ))}
      
      {/* Additional Therapies Section */}
      <View style={styles.luxuryHeader}>
        <Text style={styles.luxuryLabel}>Additional Professional Therapies</Text>
        <Text style={styles.luxurySubtitle}>Add other therapies like laser, aquatic, massage, myofunctional, etc.</Text>
      </View>
      
      {/* Quick Add Templates */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        <View style={styles.quickAddRow}>
          {[
            { name: 'Laser Therapy', icon: '🔦' },
            { name: 'Aquatic/Swimming', icon: '🏊' },
            { name: 'Massage Therapy', icon: '💆' },
            { name: 'Myofunctional', icon: '👄' },
            { name: 'Music Therapy', icon: '🎵' },
            { name: 'Hippotherapy', icon: '🐴' },
            { name: 'Vision Therapy', icon: '👁️' }
          ].map(template => (
            <TouchableOpacity
              key={template.name}
              style={styles.quickAddCard}
              onPress={() => {
                const newTherapy = {
                  id: Date.now(),
                  name: template.name,
                  enabled: true,
                  sessionTime: '',
                  sessionHours: '1',
                  sessionDays: []
                };
                setFormData({
                  ...formData,
                  additionalTherapies: [...(formData.additionalTherapies || []), newTherapy]
                });
              }}
            >
              <Text style={styles.quickAddIcon}>{template.icon}</Text>
              <Text style={styles.quickAddName}>{template.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      
      {/* Custom Add Button */}
      <TouchableOpacity 
        style={styles.luxuryPrimaryButton}
        onPress={() => {
          const newTherapy = {
            id: Date.now(),
            name: '',
            enabled: true,
            sessionTime: '',
            sessionHours: '1',
            sessionDays: []
          };
          setFormData({
            ...formData,
            additionalTherapies: [...(formData.additionalTherapies || []), newTherapy]
          });
        }}
      >
        <LinearGradient
          colors={['#6b5b95', '#8073a3']}
          style={styles.gradientButton}
        >
          <Ionicons name="add-circle" size={20} color="white" />
          <Text style={styles.luxuryButtonText}>Add Custom Therapy</Text>
        </LinearGradient>
      </TouchableOpacity>
      
      {/* Display Additional Therapies */}
      {formData.additionalTherapies?.map((therapy, index) => (
        <View key={therapy.id} style={styles.luxuryTherapyCard}>
          <View style={styles.therapyHeader}>
            <View style={{ flex: 1 }}>
              <LuxuryInput
                placeholder="Therapy Name (e.g., Craniosacral, Chiropractic)"
                value={therapy.name}
                onChangeText={(text) => {
                  const updated = [...formData.additionalTherapies];
                  updated[index].name = text;
                  setFormData({...formData, additionalTherapies: updated});
                }}
              />
            </View>
            <TouchableOpacity
              onPress={() => {
                const updated = formData.additionalTherapies.filter((_, i) => i !== index);
                setFormData({...formData, additionalTherapies: updated});
              }}
              style={{ padding: 8 }}
            >
              <Ionicons name="close-circle" size={24} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.therapyDetails}>
            <TimePicker
              value={therapy.sessionTime}
              onChange={(time) => {
                const updated = [...formData.additionalTherapies];
                updated[index].sessionTime = time;
                setFormData({...formData, additionalTherapies: updated});
              }}
              label="Session Time"
            />
            
            <Text style={styles.luxuryLabel}>Duration (hours)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.luxuryButtonGroup}>
                {['0.5', '1', '1.5', '2', '3'].map(hour => (
                  <TouchableOpacity
                    key={hour}
                    style={[
                      styles.luxuryOptionButton,
                      therapy.sessionHours === hour && styles.luxuryOptionButtonActive
                    ]}
                    onPress={() => {
                      const updated = [...formData.additionalTherapies];
                      updated[index].sessionHours = hour;
                      setFormData({...formData, additionalTherapies: updated});
                    }}
                  >
                    <Text style={[
                      styles.luxuryOptionText,
                      therapy.sessionHours === hour && styles.luxuryOptionTextActive
                    ]}>
                      {hour}h
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            
            <Text style={styles.luxuryLabel}>Select Days</Text>
            <View style={styles.luxuryDaysGrid}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                const fullDay = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][idx];
                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.luxuryDayChip,
                      therapy.sessionDays?.includes(fullDay) && styles.luxuryDayChipActive
                    ]}
                    onPress={() => {
                      const updated = [...formData.additionalTherapies];
                      const currentDays = updated[index].sessionDays || [];
                      updated[index].sessionDays = currentDays.includes(fullDay)
                        ? currentDays.filter(d => d !== fullDay)
                        : [...currentDays, fullDay];
                      setFormData({...formData, additionalTherapies: updated});
                    }}
                  >
                    <Text style={[
                      styles.luxuryDayText,
                      therapy.sessionDays?.includes(fullDay) && styles.luxuryDayTextActive
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      ))}
      
      <View style={styles.luxuryInfoBox}>
        <LinearGradient
          colors={['#f5f0e8', '#faf8f5']}
          style={styles.gradientBackground}
        >
          <FontAwesome5 name="info-circle" size={16} color="#6b5b95" />
          <Text style={styles.luxuryInfoText}>
            Include ALL professional therapies your child receives. We'll schedule home exercises around these times.
          </Text>
        </LinearGradient>
      </View>
    </ScrollView>
  );

      case 3:
        return (
          <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
            <View style={styles.luxuryHeader}>
              <Text style={styles.luxuryStepTitle}>Your Therapy Priorities</Text>
              <Text style={styles.luxurySubtitle}>
                What therapies do YOU know work best for {formData.childFirstName || 'your child'}?
              </Text>
            </View>

            <View style={styles.quickAddSection}>
              <Text style={styles.luxuryLabel}>Quick Add Common Therapies:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.quickAddRow}>
                  {[
                    { name: 'Laser Therapy', duration: '60', icon: '🔦' },
                    { name: 'Deep Pressure', duration: '15', icon: '🤲' },
                    { name: 'Sensory Play', duration: '30', icon: '🎨' },
                    { name: 'Oral Motor', duration: '10', icon: '👄' },
                    { name: 'Massage', duration: '20', icon: '💆' },
                    { name: 'Brushing Protocol', duration: '5', icon: '🖌️' }
                  ].map((template) => (
                    <TouchableOpacity
                      key={template.name}
                      style={styles.quickAddCard}
                      onPress={() => {
                        const newPriority = {
                          name: template.name,
                          duration: template.duration,
                          importance: 'high'
                        };
                        setFormData({
                          ...formData,
                          parentPriorities: [...(formData.parentPriorities || []), newPriority]
                        });
                        Alert.alert('Added', `${template.name} added to priorities`);
                      }}
                    >
                      <Text style={styles.quickAddIcon}>{template.icon}</Text>
                      <Text style={styles.quickAddName}>{template.name}</Text>
                      <Text style={styles.quickAddDuration}>{template.duration} min</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.luxuryInfoBox}>
              <LinearGradient colors={['#f5f0e8', '#faf8f5']} style={styles.gradientBackground}>
                <FontAwesome5 name="info-circle" size={16} color="#6b5b95" />
                <Text style={styles.luxuryInfoText}>
                  Add therapies you want done daily but don't have specific times for - we'll find the best slots
                </Text>
              </LinearGradient>
            </View>

            <TouchableOpacity 
              style={styles.luxuryPrimaryButton}
              onPress={() => setShowAddPriority(true)}
            >
              <LinearGradient colors={['#6b5b95', '#8073a3']} style={styles.gradientButton}>
                <Ionicons name="add-circle" size={20} color="white" />
                <Text style={styles.luxuryButtonText}>Add Priority Therapy</Text>
              </LinearGradient>
            </TouchableOpacity>

            {formData.parentPriorities?.length > 0 ? (
              formData.parentPriorities.map((priority, index) => (
                <View key={index} style={styles.luxuryActivityCard}>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityDay}>
                      {priority.importance === 'critical' ? '🔴 Critical' : '🟡 Important'}
                    </Text>
                    <Text style={styles.activityDetails}>
                      {priority.name} - {priority.duration} minutes daily
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => {
                    const updated = formData.parentPriorities.filter((_, i) => i !== index);
                    setFormData({...formData, parentPriorities: updated});
                  }}>
                    <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.emptyStateContainer}>
                <FontAwesome5 name="clipboard-list" size={40} color="#CBD5E0" />
                <Text style={styles.emptyStateText}>No priority therapies added yet</Text>
              </View>
            )}

            <Modal visible={showAddPriority} transparent animationType="slide">
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Add Priority Therapy</Text>
                  
                  <LuxuryInput
                    placeholder="Therapy name (e.g., Laser therapy, Deep pressure)"
                    value={newPriority.name}
                    onChangeText={(text) => setNewPriority({...newPriority, name: text})}
                  />

                  <Text style={styles.luxuryLabel}>Duration (minutes per session)</Text>
                  <View style={styles.luxuryButtonGroup}>
                    {['15', '30', '45', '60', '90'].map(min => (
                      <TouchableOpacity
                        key={min}
                        style={[
                          styles.luxuryOptionButton,
                          newPriority.duration === min && styles.luxuryOptionButtonActive
                        ]}
                        onPress={() => setNewPriority({...newPriority, duration: min})}
                      >
                        <Text style={[
                          styles.luxuryOptionText,
                          newPriority.duration === min && styles.luxuryOptionTextActive
                        ]}>
                          {min}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.luxuryLabel}>Priority Level</Text>
                  <View style={styles.luxuryButtonGroup}>
                    <TouchableOpacity
                      style={[
                        styles.luxuryOptionButton,
                        newPriority.importance === 'critical' && styles.luxuryOptionButtonActive
                      ]}
                      onPress={() => setNewPriority({...newPriority, importance: 'critical'})}
                    >
                      <Text style={[
                        styles.luxuryOptionText,
                        newPriority.importance === 'critical' && styles.luxuryOptionTextActive
                      ]}>
                        🔴 Critical - Must do
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.luxuryOptionButton,
                        newPriority.importance === 'high' && styles.luxuryOptionButtonActive
                      ]}
                      onPress={() => setNewPriority({...newPriority, importance: 'high'})}
                    >
                      <Text style={[
                        styles.luxuryOptionText,
                        newPriority.importance === 'high' && styles.luxuryOptionTextActive
                      ]}>
                        🟡 Important
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={styles.modalCancelButton}
                      onPress={() => {
                        setShowAddPriority(false);
                        setNewPriority({name: '', duration: '30', importance: 'high'});
                      }}
                    >
                      <Text style={styles.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.modalAddButton}
                      onPress={() => {
                        if (newPriority.name.trim()) {
                          setFormData({
                            ...formData,
                            parentPriorities: [...(formData.parentPriorities || []), newPriority]
                          });
                          setShowAddPriority(false);
                          setNewPriority({name: '', duration: '30', importance: 'high'});
                        }
                      }}
                    >
                      <Text style={styles.modalAddText}>Add Priority</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </ScrollView>
        );

      
      case 4:
        return (
          <View style={styles.stepContent}>
            <View style={styles.luxuryHeader}>
              <Text style={styles.luxuryStepTitle}>School Schedule</Text>
              <Text style={styles.luxurySubtitle}>Tell us about your child's school hours</Text>
            </View>
            
            <Text style={styles.luxuryLabel}>Does your child attend school?</Text>
            <View style={styles.luxuryButtonGroup}>
              {['yes', 'no'].map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.luxuryOptionButton,
                    formData.hasSchool === option && styles.luxuryOptionButtonActive
                  ]}
                  onPress={() => setFormData({...formData, hasSchool: option})}
                >
                  <Text style={[
                    styles.luxuryOptionText,
                    formData.hasSchool === option && styles.luxuryOptionTextActive
                  ]}>
                    {option === 'yes' ? 'Yes' : 'No/Homeschool'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {formData.hasSchool === 'yes' && (
              <>
                <View style={styles.row}>
                  <View style={styles.halfWidth}>
                    <TimePicker
                      value={formData.schoolStartTime}
                      onChange={(time) => setFormData({...formData, schoolStartTime: time})}
                      label="Start Time"
                    />
                  </View>
                  <View style={styles.halfWidth}>
                    <TimePicker
                      value={formData.schoolEndTime}
                      onChange={(time) => setFormData({...formData, schoolEndTime: time})}
                      label="End Time"
                    />
                  </View>
                </View>
                
                <Text style={styles.luxuryLabel}>School Days</Text>
                <View style={styles.luxuryDaysGrid}>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.luxuryDayChip,
                        formData.schoolDays.includes(day) && styles.luxuryDayChipActive
                      ]}
                      onPress={() => {
                        const newDays = formData.schoolDays.includes(day)
                          ? formData.schoolDays.filter(d => d !== day)
                          : [...formData.schoolDays, day];
                        setFormData({...formData, schoolDays: newDays});
                      }}
                    >
                      <Text style={[
                        styles.luxuryDayText,
                        formData.schoolDays.includes(day) && styles.luxuryDayTextActive
                      ]}>
                        {day.slice(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        );

      case 5:
        return (
          <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
            <View style={styles.luxuryHeader}>
              <Text style={styles.luxuryStepTitle}>Daily Routine & Meal Times</Text>
              <Text style={styles.luxurySubtitle}>We'll schedule exercises avoiding meal times</Text>
            </View>
            
            <View style={styles.timeGrid}>
              <View style={styles.timeItem}>
                <TimePicker
                  value={formData.breakfastTime}
                  onChange={(time) => setFormData({...formData, breakfastTime: time})}
                  label="🥣 Breakfast"
                />
              </View>
              
              <View style={styles.timeItem}>
                <TimePicker
                  value={formData.lunchTime}
                  onChange={(time) => setFormData({...formData, lunchTime: time})}
                  label="🍽️ Lunch"
                />
              </View>
              
              <View style={styles.timeItem}>
                <TimePicker
                  value={formData.dinnerTime}
                  onChange={(time) => setFormData({...formData, dinnerTime: time})}
                  label="🍽️ Dinner"
                />
              </View>
              
              <View style={styles.timeItem}>
                <TimePicker
                  value={formData.bedtime}
                  onChange={(time) => setFormData({...formData, bedtime: time})}
                  label="😴 Bedtime"
                />
              </View>
            </View>
            
            <View style={styles.luxuryInfoBox}>
              <LinearGradient
                colors={['#f5f0e8', '#faf8f5']}
                style={styles.gradientBackground}
              >
                <FontAwesome5 name="lightbulb" size={16} color="#6b5b95" />
                <Text style={styles.luxuryInfoText}>
                  We'll automatically avoid scheduling exercises during meal times and 30 minutes after meals for better digestion.
                </Text>
              </LinearGradient>
            </View>
          </ScrollView>
        );

      case 6:
        return (
          <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
            <View style={styles.luxuryHeader}>
              <Text style={styles.luxuryStepTitle}>Your Availability for Home Exercises</Text>
              <Text style={styles.luxurySubtitle}>When can you work with your child?</Text>
            </View>
            
            <View style={styles.luxuryInfoBox}>
              <LinearGradient
                colors={['#f5f0e8', '#faf8f5']}
                style={styles.gradientBackground}
              >
                <FontAwesome5 name="home" size={16} color="#6b5b95" />
                <Text style={styles.luxuryInfoText}>
                  This is YOUR time to do exercises with your child at home
                </Text>
              </LinearGradient>
            </View>
            
            {parseFloat(formData.parentAvailability.weekdayHours) === 0 && 
             parseFloat(formData.parentAvailability.weekendHours) === 0 && (
              <View style={styles.alertBox}>
                <Text style={styles.alertText}>
                  ⚠️ You must set at least some hours to generate a schedule
                </Text>
              </View>
            )}
            
            <Text style={styles.luxuryLabel}>Weekday Hours (Mon-Fri)</Text>
            <View style={styles.luxuryButtonGroup}>
              {['0', '0.5', '1', '1.5', '2', '3'].map(hour => (
                <TouchableOpacity
                  key={hour}
                  style={[styles.luxuryOptionButton, formData.parentAvailability.weekdayHours === hour && styles.luxuryOptionButtonActive]}
                  onPress={() => setFormData({
                    ...formData,
                    parentAvailability: {...formData.parentAvailability, weekdayHours: hour}
                  })}
                >
                  <Text style={[styles.luxuryOptionText, formData.parentAvailability.weekdayHours === hour && styles.luxuryOptionTextActive]}>
                    {hour}h
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.luxuryLabel}>Weekend Hours (Sat-Sun)</Text>
            <View style={styles.luxuryButtonGroup}>
              {['0', '1', '2', '3', '4', '5'].map(hour => (
                <TouchableOpacity
                  key={hour}
                  style={[styles.luxuryOptionButton, formData.parentAvailability.weekendHours === hour && styles.luxuryOptionButtonActive]}
                  onPress={() => setFormData({
                    ...formData,
                    parentAvailability: {...formData.parentAvailability, weekendHours: hour}
                  })}
                >
                  <Text style={[styles.luxuryOptionText, formData.parentAvailability.weekendHours === hour && styles.luxuryOptionTextActive]}>
                    {hour}h
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {(parseFloat(formData.parentAvailability.weekdayHours) > 0 || 
              parseFloat(formData.parentAvailability.weekendHours) > 0) && (
              <View style={styles.smartAnalysisBox}>
                <Text style={styles.smartAnalysisTitle}>📊 Schedule Feasibility Check</Text>
                {analyzeScheduleFeasibility(formData).map((rec, index) => (
                  <View key={index} style={styles.recommendationItem}>
                    <Text style={[
                      styles.recommendationText,
                      rec.type === 'warning' && styles.warningText
                    ]}>
                      {rec.message}
                    </Text>
                    <Text style={styles.suggestionText}>💡 {rec.suggestion}</Text>
                  </View>
                ))}
              </View>
            )}
            
         {parseFloat(formData.parentAvailability.weekdayHours) > 0 && (
  <>
    <Text style={styles.luxuryLabel}>Weekday Preferred Times (SELECT AT LEAST ONE)</Text>
    {['morning', 'afternoon', 'evening', 'night'].map(time => (
      <View key={time} style={styles.timeSlotRow}>
        <Text style={styles.timeSlotText}>
          {time === 'morning' ? '☀️ Morning (9:30 AM - 11:30 AM)' :
           time === 'afternoon' ? '🌤️ Mid-Day (3:30 PM - 5:30 PM)' :
           time === 'evening' ? '🌆 Evening (5:30 PM - 7:00 PM)' :
           '🌙 Night (7:00 PM - 10:00 PM)'}
        </Text>
        <Switch
          value={formData.parentAvailability.weekdayTimeBlocks[time]}
          onValueChange={(value) => 
            setFormData({
              ...formData,
              parentAvailability: {
                ...formData.parentAvailability,
                weekdayTimeBlocks: {
                  ...formData.parentAvailability.weekdayTimeBlocks,
                  [time]: value
                }
              }
            })
          }
          trackColor={{ false: "#E2E8F0", true: "#d4a574" }}
          thumbColor={formData.parentAvailability.weekdayTimeBlocks[time] ? "#6b5b95" : "#94A3B8"}
        />
      </View>
    ))}
  </>
)}
            
    {parseFloat(formData.parentAvailability.weekendHours) > 0 && (
  <>
    <Text style={styles.luxuryLabel}>Weekend Preferred Times (SELECT AT LEAST ONE)</Text>
    {['morning', 'afternoon', 'evening', 'night'].map(time => (
      <View key={time} style={styles.timeSlotRow}>
        <Text style={styles.timeSlotText}>
          {time === 'morning' ? '☀️ Morning (9:30 AM - 12:00 PM)' :
           time === 'afternoon' ? '🌤️ Afternoon (1:00 PM - 4:00 PM)' :
           time === 'evening' ? '🌆 Evening (4:00 PM - 6:30 PM)' :
           '🌙 Night (7:00 PM - 10:00 PM)'}
        </Text>
        <Switch
          value={formData.parentAvailability.weekendTimeBlocks[time]}
          onValueChange={(value) => 
            setFormData({
              ...formData,
              parentAvailability: {
                ...formData.parentAvailability,
                weekendTimeBlocks: {
                  ...formData.parentAvailability.weekendTimeBlocks,
                  [time]: value
                }
              }
            })
          }
          trackColor={{ false: "#E2E8F0", true: "#d4a574" }}
          thumbColor={formData.parentAvailability.weekendTimeBlocks[time] ? "#6b5b95" : "#94A3B8"}
        />
      </View>
    ))}
  </>
)}
            
            <View style={styles.reminderSection}>
  <Text style={styles.sectionTitle}>📱 Exercise Reminders</Text>
  
  <View style={styles.reminderToggleRow}>
    <View style={{ flex: 1 }}>
      <Text style={styles.luxuryLabel}>Enable Daily Reminders</Text>
      <Text style={styles.reminderSubtext}>
        3 daily touchpoints: Morning briefing, exercise alerts, evening reflection
      </Text>
    </View>
    <Switch
      value={formData.remindersEnabled}
      onValueChange={async (value) => {
        if (value) {
          const granted = await requestNotificationPermissions();
          if (granted) {
            setFormData({
              ...formData, 
              remindersEnabled: true,
              eveningReflectionEnabled: true
            });
          }
        } else {
          setFormData({...formData, remindersEnabled: false});
        }
      }}
      trackColor={{ false: "#E2E8F0", true: "#d4a574" }}
      thumbColor={formData.remindersEnabled ? "#6b5b95" : "#94A3B8"}
    />
  </View>
  
  {formData.remindersEnabled && (
    <>
      <View style={styles.reminderTimingSection}>
        <Text style={styles.luxuryLabel}>Notification Schedule</Text>
        
        {/* Morning Briefing Time */}
     
      <View style={styles.reminderTimeRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.reminderTimeLabel}>🌞 Morning Briefing</Text>
            <Text style={styles.reminderTimeDesc}>
              Daily overview of {formData.childFirstName || 'your child'}'s therapy schedule
            </Text>
          </View>
          <TimePicker
            value={formData.morningBriefingTime || '07:00'}
            onChange={(time) => setFormData({...formData, morningBriefingTime: time})}
            label=""
          />
        </View>
        
        {/* Exercise Reminders - Fixed */}
        <View style={styles.reminderTimeRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.reminderTimeLabel}>⏰ Exercise Alerts</Text>
            <Text style={styles.reminderTimeDesc}>
              5 minutes before each scheduled session
            </Text>
          </View>
          <View style={styles.fixedTimeBadge}>
            <Text style={styles.fixedTimeText}>Automatic</Text>
          </View>
        </View>
        
        {/* Evening Reflection - Calculated */}
      <View style={styles.reminderTimeRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.reminderTimeLabel}>🌙 Evening Reflection</Text>
            <Text style={styles.reminderTimeDesc}>
              Review today's progress and prepare for tomorrow
            </Text>
          </View>
          <TimePicker
            value={formData.eveningReflectionTime || '20:00'}
            onChange={(time) => setFormData({...formData, eveningReflectionTime: time})}
            label=""
          />
        </View>
      </View>
      
      {/* Custom Notes Info */}
      <View style={styles.luxuryInfoBox}>
        <LinearGradient
          colors={['#f5f0e8', '#faf8f5']}
          style={styles.gradientBackground}
        >
          <FontAwesome5 name="info-circle" size={16} color="#6b5b95" />
          <Text style={styles.luxuryInfoText}>
            You can add custom notes to each time slot after generating the schedule
          </Text>
        </LinearGradient>
      </View>
    </>
  )}
</View>
            
            {(parseFloat(formData.parentAvailability.weekdayHours) > 0 || 
              parseFloat(formData.parentAvailability.weekendHours) > 0) && (
              <View style={styles.successBox}>
                <Text style={styles.successText}>
                  📊 Total commitment: {
                    (parseFloat(formData.parentAvailability.weekdayHours || 0) * 5) + 
                    (parseFloat(formData.parentAvailability.weekendHours || 0) * 2)
                  } hours per week
                </Text>
                <Text style={styles.successText}>
                  This will generate approximately {
                    Math.floor(((parseFloat(formData.parentAvailability.weekdayHours || 0) * 5) + 
                    (parseFloat(formData.parentAvailability.weekendHours || 0) * 2)) * 4)
                  } exercises
                </Text>
                {formData.remindersEnabled && (
                  <Text style={styles.successText}>
                    📱 Reminders: {formData.reminderType === 'morning' ? 
                      `Daily at ${formData.reminderTime}` : 
                      '5 min before each exercise'}
                  </Text>
                )}
              </View>
            )}
          </ScrollView>
        );
        
      default:
        return null;
    }
  };

  const LoadingOverlay = () => (
    <View style={styles.loadingOverlay}>
      <View style={styles.luxuryLoadingContainer}>
        <LinearGradient
          colors={['#6b5b95', '#8073a3']}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingTitle}>Generating Schedule</Text>
          <Text style={styles.loadingMessage}>{loadingMessage}</Text>
          
          <View style={styles.funFactBox}>
            <Text style={styles.funFactTitle}>Did you know?</Text>
            <Text style={styles.funFactText}>
              {[
                "Consistent daily exercises can improve outcomes by 40%",
                "Morning exercises often work best for young children",
                "15-minute sessions are perfect for maintaining attention",
                "Parent involvement doubles therapy effectiveness",
                "Small daily steps lead to big improvements"
              ][Math.floor(Math.random() * 5)]}
            </Text>
          </View>
        </LinearGradient>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ValidationModal
        visible={showValidationModal}
        message={validationMessage}
        onClose={() => setShowValidationModal(false)}
      />
      
      <LinearGradient
        colors={['#faf8f5', '#f0e9df']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTopRow}>
            <Text style={styles.stepIndicator}>Step {currentStep + 1} of {steps.length}</Text>
            <TouchableOpacity 
              style={styles.signOutButton}
              onPress={handleSignOut}
            >
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.progressBar}>
            {steps.map((step, index) => (
              <View 
                key={index} 
                style={[
                  styles.progressDot, 
                  index <= currentStep && styles.progressDotActive
                ]} 
              />
            ))}
          </View>
          
          <Text style={styles.currentStepName}>{steps[currentStep]}</Text>
        </View>
      </LinearGradient>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>
      
      <View style={styles.luxuryFooter}>
        <TouchableOpacity 
          style={[styles.footerButton, styles.footerButtonSecondary]}
          onPress={handlePrevious}
          disabled={currentStep === 0}
        >
          <Text style={[styles.footerButtonText, styles.footerButtonTextSecondary]}>
            Previous
          </Text>
        </TouchableOpacity>
        
        {currentStep === steps.length - 1 ? (
          <TouchableOpacity 
            style={styles.footerButton}
            onPress={handleSubmit}
          >
            <LinearGradient
              colors={['#6b5b95', '#8073a3']}
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.footerButtonText}>Generate Schedule</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.footerButton}
            onPress={handleNext}
          >
            <LinearGradient
              colors={['#6b5b95', '#8073a3']}
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.footerButtonText}>Next</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
      
      {isGenerating && <LoadingOverlay />}
    </KeyboardAvoidingView>
  );
}

// COMPLETE STYLES - ALL PINK THEME
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf8f5',
  },

  // Header Section
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },

  headerContent: {
    paddingHorizontal: 20,
  },

  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

stepIndicator: {
  fontSize: 14,
  color: '#6b5b95', // Keep purple
  fontWeight: '600',
  fontFamily: 'Poppins-Medium',
},

  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(107, 91, 149, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(107, 91, 149, 0.3)',
  },

  signOutText: {
    color: '#6b5b95',
    fontSize: 14,
    fontWeight: '600',
  },

  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 6,
  },

  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(107, 91, 149, 0.3)',
  },

  progressDotActive: {
    backgroundColor: '#6b5b95',
    width: 24,
  },

  currentStepName: {
    color: '#2C2546',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Main Content
  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  stepContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(107, 91, 149, 0.3)',
    shadowColor: '#6b5b95',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },

  // Headers
  luxuryHeader: {
    marginBottom: 24,
  },

  luxuryStepTitle: {
  fontSize: 24,
  fontWeight: '800',
  color: '#2C2546',
  marginBottom: 8,
  fontFamily: 'Quicksand', // Match welcome screen brand font
},


  luxurySubtitle: {
    fontSize: 15,
    color: 'rgba(62, 56, 88, 0.6)',
    lineHeight: 20,
  },

  // Input Components
  luxuryInputContainer: {
    marginBottom: 20,
  },

  inputWrapper: {
    borderWidth: 1.5,
    borderColor: 'rgba(107, 91, 149, 0.4)',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#6b5b95',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 18,
    zIndex: 1,
  },

luxuryInput: {
  padding: 18,
  fontSize: 16,
  color: '#2C2546',
  fontWeight: '500',
  fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto', // Native feel for inputs
},

  inputWithIcon: {
    paddingLeft: 48,
  },

  luxuryTextArea: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: 18,
  },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
  },

  errorText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginLeft: 4,
  },


  reminderSubtext: {
  fontSize: 12,
  color: 'rgba(62, 56, 88, 0.6)',
  marginTop: 4,
},

reminderTimingSection: {
  marginTop: 20,
},

reminderTimeRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingVertical: 16,
  borderBottomWidth: 1,
  borderBottomColor: 'rgba(107, 91, 149, 0.1)',
},

reminderTimeLabel: {
  fontSize: 15,
  fontWeight: '600',
  color: '#2C2546',
  marginBottom: 4,
},

reminderTimeDesc: {
  fontSize: 12,
  color: 'rgba(62, 56, 88, 0.6)',
  lineHeight: 16,
},

fixedTimeBadge: {
  backgroundColor: 'rgba(107, 91, 149, 0.1)',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 12,
},

fixedTimeText: {
  fontSize: 12,
  color: '#6b5b95',
  fontWeight: '600',
},

  // Labels
  luxuryLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
    color: '#2C2546',
  },

  // Read-only Fields
  readOnlyField: {
    marginBottom: 20,
  },

  readOnlyBox: {
    backgroundColor: 'rgba(250, 248, 245, 1)',
    padding: 18,
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(107, 91, 149, 0.2)',
  },

  readOnlyText: {
    fontSize: 16,
    color: '#2C2546',
  },

  // Info Boxes
  luxuryInfoBox: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },

  gradientBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(245, 240, 232, 0.6)',
  },

  luxuryInfoText: {
    fontSize: 14,
    color: '#2C2546',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },

  // Buttons and Options
  luxuryButtonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },

  luxuryOptionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(107, 91, 149, 0.4)',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },

  luxuryOptionButtonActive: {
    backgroundColor: '#6b5b95',
    borderColor: '#6b5b95',
  },

  luxuryOptionText: {
    fontSize: 14,
    color: 'rgba(62, 56, 88, 0.7)',
    fontWeight: '600',
  },

  luxuryOptionTextActive: {
    color: 'white',
  },

  // Primary Buttons
  luxuryPrimaryButton: {
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 8,
  },

  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
  },

  luxuryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },

  // Cards
  luxuryCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(107, 91, 149, 0.3)',
    shadowColor: '#6b5b95',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  luxuryTherapyCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(107, 91, 149, 0.3)',
    shadowColor: '#6b5b95',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  luxuryActivityCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(107, 91, 149, 0.3)',
    shadowColor: '#6b5b95',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },

  // Concerns Grid
  concernsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  luxuryConcernCard: {
    width: '48%',
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(107, 91, 149, 0.3)',
    borderRadius: 16,
    backgroundColor: 'white',
    shadowColor: '#6b5b95',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },

  luxuryConcernCardActive: {
    borderColor: '#6b5b95',
    backgroundColor: 'rgba(245, 240, 232, 0.5)',
  },

  concernLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2546',
    marginBottom: 4,
  },

  concernLabelActive: {
    color: '#6b5b95',
  },

  concernDesc: {
    fontSize: 12,
    color: 'rgba(62, 56, 88, 0.6)',
  },

  concernDescActive: {
    color: '#6b5b95',
  },

  checkmarkContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },

  // Time Picker
  timePickerContainer: {
    marginBottom: 16,
  },

  timePickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2C2546',
  },

  luxuryTimePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(107, 91, 149, 0.4)',
    borderRadius: 16,
    padding: 16,
    backgroundColor: 'white',
  },

  timePickerText: {
    fontSize: 16,
    color: '#2C2546',
    fontWeight: '500',
    marginLeft: 12,
  },

  luxuryTimePickerModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginTop: 8,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(107, 91, 149, 0.3)',
    shadowColor: '#6b5b95',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },

  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  timePickerColumn: {
    flex: 1,
    maxHeight: 120,
  },

  timeOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 2,
    borderRadius: 8,
    alignItems: 'center',
  },

  timeOptionActive: {
    backgroundColor: '#6b5b95',
  },

  timeOptionText: {
    fontSize: 16,
    color: '#2C2546',
  },

  timeOptionTextActive: {
    color: 'white',
    fontWeight: '600',
  },

  luxuryDoneButton: {
    backgroundColor: '#6b5b95',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },

  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Days Grid
  luxuryDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  luxuryDayChip: {
    width: '30%',
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(107, 91, 149, 0.3)',
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: 'white',
    alignItems: 'center',
  },

  luxuryDayChipActive: {
    backgroundColor: '#6b5b95',
    borderColor: '#6b5b95',
  },

  luxuryDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2546',
  },

  luxuryDayTextActive: {
    color: 'white',
  },

  // Activity and Therapy Details
  therapyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  therapyName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C2546',
  },

  therapyDetails: {
    paddingTop: 8,
  },

  activityInfo: {
    flex: 1,
  },

  activityDay: {
    fontSize: 12,
    color: '#6b5b95',
    fontWeight: '600',
    marginBottom: 4,
  },

  activityDetails: {
    fontSize: 14,
    color: '#2C2546',
  },

  removeButton: {
    padding: 4,
  },

  existingActivities: {
    marginTop: 24,
  },

  // Empty States
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: 'rgba(250, 248, 245, 0.5)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(107, 91, 149, 0.2)',
  },

  emptyStateText: {
    fontSize: 14,
    color: 'rgba(62, 56, 88, 0.5)',
    marginTop: 12,
  },

  // Alert & Success Boxes
  alertBox: {
    backgroundColor: 'rgba(107, 91, 149, 0.1)',
    borderColor: '#6b5b95',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },

  alertText: {
    color: '#D1416C',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  successBox: {
    backgroundColor: 'rgba(245, 240, 232, 0.5)',
    borderColor: '#6b5b95',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },

  successText: {
    color: '#2C2546',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },

  // Smart Analysis
  smartAnalysisBox: {
    backgroundColor: 'rgba(250, 248, 245, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(107, 91, 149, 0.3)',
  },

  smartAnalysisTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C2546',
    marginBottom: 12,
  },

  recommendationItem: {
    marginBottom: 12,
  },

  recommendationText: {
    fontSize: 14,
    color: '#2C2546',
    marginBottom: 4,
  },

  warningText: {
    color: '#D1416C',
  },

  suggestionText: {
    fontSize: 13,
    color: 'rgba(62, 56, 88, 0.7)',
    marginLeft: 20,
  },

  // Time Slots
  timeSlotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(107, 91, 149, 0.2)',
  },

  timeSlotText: {
    fontSize: 15,
    color: '#2C2546',
    flex: 1,
  },

  // Reminders
  reminderSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(107, 91, 149, 0.2)',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C2546',
    marginBottom: 16,
  },

  reminderToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  reminderTypeContainer: {
    gap: 12,
  },

  reminderOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(107, 91, 149, 0.3)',
    backgroundColor: 'white',
    marginBottom: 12,
  },

  reminderOptionActive: {
    borderColor: '#6b5b95',
    backgroundColor: 'rgba(245, 240, 232, 0.3)',
  },

  reminderOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2546',
    marginBottom: 8,
  },

  reminderPreview: {
    fontSize: 13,
    color: 'rgba(62, 56, 88, 0.7)',
    marginBottom: 8,
  },

  reminderExample: {
    fontSize: 12,
    color: 'rgba(62, 56, 88, 0.5)',
    fontStyle: 'italic',
    backgroundColor: 'rgba(250, 248, 245, 0.8)',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },

  // Analytics
  analyticsBox: {
    backgroundColor: 'rgba(250, 248, 245, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(107, 91, 149, 0.3)',
  },

  analyticsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C2546',
    marginBottom: 12,
  },

  // Layout Helpers
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },

  halfWidth: {
    flex: 1,
  },

  timeGrid: {
    marginBottom: 24,
  },

  timeItem: {
    marginBottom: 16,
  },

  // Quick Add Section
  quickAddSection: {
    marginBottom: 20,
  },

  quickAddRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },

  quickAddCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(107, 91, 149, 0.3)',
    alignItems: 'center',
    minWidth: 100,
  },

  quickAddIcon: {
    fontSize: 24,
    marginBottom: 8,
  },

  quickAddName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C2546',
    textAlign: 'center',
    marginBottom: 4,
  },

  quickAddDuration: {
    fontSize: 11,
    color: 'rgba(62, 56, 88, 0.6)',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C2546',
    marginBottom: 20,
    textAlign: 'center',
  },

  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },

  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(107, 91, 149, 0.2)',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(107, 91, 149, 0.3)',
  },

  modalCancelText: {
    color: '#6b5b95',
    fontSize: 16,
    fontWeight: '600',
  },

  modalAddButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: '#6b5b95',
    alignItems: 'center',
  },

  modalAddText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Footer Navigation
  luxuryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(107, 91, 149, 0.2)',
  },

  footerButton: {
    minWidth: 120,
    borderRadius: 999,
    overflow: 'hidden',
  },

  footerButtonSecondary: {
    backgroundColor: 'rgba(107, 91, 149, 0.15)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(107, 91, 149, 0.4)',
  },

  footerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },

  footerButtonTextSecondary: {
    color: '#6b5b95',
  },

  // Loading Overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },

  luxuryLoadingContainer: {
    width: '85%',
    borderRadius: 20,
    overflow: 'hidden',
  },

  loadingGradient: {
    padding: 32,
    alignItems: 'center',
  },

  loadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },

  loadingMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 24,
    textAlign: 'center',
  },

  funFactBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    width: '100%',
  },

  funFactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },

  funFactText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Disclaimer
  luxuryDisclaimerContainer: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },

  disclaimerGradient: {
    padding: 20,
  },

  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  disclaimerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D97706',
    marginLeft: 8,
  },

  disclaimerText: {
    fontSize: 14,
    color: '#92400E',
    marginBottom: 12,
    lineHeight: 20,
  },

  disclaimerPoints: {
    marginBottom: 12,
  },

  disclaimerPoint: {
    fontSize: 13,
    color: '#92400E',
    marginBottom: 6,
    lineHeight: 18,
  },

  disclaimerAck: {
    fontSize: 12,
    color: '#92400E',
    fontStyle: 'italic',
    marginTop: 8,
  },
});