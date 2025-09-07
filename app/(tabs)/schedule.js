// app/schedule-view.js
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';


export default function ScheduleView() {
    console.log("SCHEDULE VIEW LOADED - VERSION 2");

  const router = useRouter();
  const [scheduleData, setScheduleData] = useState(null);
  const [childName, setChildName] = useState('');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(null);
const [dismissedExplanation, setDismissedExplanation] = useState(false);
  const [conflicts, setConflicts] = useState({});
  const [explanations, setExplanations] = useState({});
    const [showInsights, setShowInsights] = useState(false);

    const [selectedDay, setSelectedDay] = useState(() => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date().getDay();
  return days[today];
});

  useEffect(() => {
    loadScheduleData();
  }, []);


// Add this new useEffect after your existing loadScheduleData useEffect
// Add this new useEffect after your existing loadScheduleData useEffect




// Add this after your setupDailyRefresh useEffect in schedule.js
useEffect(() => {
  const debugScheduledNotifications = async () => {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`Current scheduled notifications: ${scheduled.length}`);
    scheduled.forEach(n => {
      const triggerDate = new Date(n.trigger.date);

      console.log(`Notification: ${n.content.title} scheduled for ${n.trigger.date}`);
  console.log(`Trigger object:`, n.trigger);


    });
  };
  
  debugScheduledNotifications();
}, [scheduleData]);


  useEffect(() => {
  const trackDailyOpen = async () => {
    const today = new Date().toISOString().split('T')[0];
    const lastOpen = await AsyncStorage.getItem('lastOpenDate');
    
    if (lastOpen !== today) {
      // Increment days of trying
      const days = await AsyncStorage.getItem('daysOfTrying') || '0';
      await AsyncStorage.setItem('daysOfTrying', String(parseInt(days) + 1));
      await AsyncStorage.setItem('lastOpenDate', today);
      
      // Track weekly pattern
      const dayOfWeek = new Date().getDay();
      const weekData = JSON.parse(await AsyncStorage.getItem('weeklyOpens') || '{}');
      weekData[dayOfWeek] = true;
      await AsyncStorage.setItem('weeklyOpens', JSON.stringify(weekData));
    }
  };
  
  trackDailyOpen();
}, []);

 useEffect(() => {
  if (showInsights) {
    console.log("Modal opened, auto-close in 5 seconds");
    const timer = setTimeout(() => {
      console.log("Auto-closing modal");
      setShowInsights(false);
    }, 5000);
    return () => clearTimeout(timer);
  }
}, [showInsights]);

useEffect(() => {
  const checkNotifications = async () => {
    // Check permission
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('❌ Notifications not permitted');
      return;
    }
    
    // Check what's scheduled
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`📅 Total scheduled: ${scheduled.length}`);
    
    // Show next 3 notifications
    const upcoming = scheduled
      .sort((a, b) => a.trigger.value - b.trigger.value)
      .slice(0, 3);
      
    upcoming.forEach(n => {
      const date = new Date(n.trigger.value);
      console.log(`🔔 ${n.content.title} at ${date.toLocaleString()}`);
    });
  };
  
  checkNotifications();
}, []);


// Auto-scroll to today's day button


// Auto-scroll to today's day button

// Auto-scroll to today's day button
const scrollViewRef = useRef(null);

useEffect(() => {
  // Small delay to ensure the ScrollView is rendered
  const timer = setTimeout(() => {
    // Your day order in the scroll view
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    // Get today's day name
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date().getDay();
    const todayName = daysOfWeek[today];
    
    // Find index in your display order
    const todayIndex = days.indexOf(todayName);
    
    console.log('Today is:', todayName, 'Index:', todayIndex);
    
    if (scrollViewRef.current && todayIndex !== -1) {
      // Calculate scroll position
      // dayButton width (85) + paddingHorizontal (24*2) + marginHorizontal (6*2) = ~145
      const scrollPosition = todayIndex * 145;
      
      scrollViewRef.current.scrollTo({
        x: scrollPosition,
        y: 0,
        animated: true
      });
      
      console.log('Scrolling to position:', scrollPosition);
    }
  }, 500); // Give time for component to mount
  
  return () => clearTimeout(timer);
}, []);



useEffect(() => {
  // Handle notification responses
  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    // When user taps notification, show today's schedule
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date().getDay();
    setSelectedDay(days[today]);
  });
  
  return () => subscription.remove();
}, []);

const getBusiestDay = () => {
  if (!scheduleData) return { day: 'Monday', count: 0 };
  const exercisesPerDay = Object.entries(scheduleData).map(([day, exercises]) => ({
    day,
    count: exercises.length
  }));
  if (exercisesPerDay.length === 0) return { day: 'Monday', count: 0 };
  return exercisesPerDay.reduce((max, curr) => curr.count > max.count ? curr : max);
};

const getLightestDay = () => {
  if (!scheduleData) return { day: 'Sunday', count: 0 };
  const exercisesPerDay = Object.entries(scheduleData).map(([day, exercises]) => ({
    day,
    count: exercises.length
  }));
  if (exercisesPerDay.length === 0) return { day: 'Sunday', count: 0 };
  return exercisesPerDay.reduce((min, curr) => curr.count < min.count ? curr : min);
};

const getTimeDistribution = () => {
  const distribution = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  if (!scheduleData) return distribution;
  
  Object.values(scheduleData).flat().forEach(exercise => {
    const hour = parseInt(exercise.time.split(':')[0]);
    if (hour < 12) distribution.morning++;
    else if (hour < 17) distribution.afternoon++;
    else if (hour < 19) distribution.evening++;
    else distribution.night++;
  });
  return distribution;
};

const getTherapyBreakdown = () => {
  if (!scheduleData) return [];
  const types = {};
  const allExercises = Object.values(scheduleData).flat();
  
  allExercises.forEach(ex => {
    const type = ex.therapy_type || 'General';
    types[type] = (types[type] || 0) + 1;
  });
  
  return Object.entries(types).map(([type, count]) => ({
    type,
    count,
    percentage: allExercises.length > 0 ? Math.round((count / allExercises.length) * 100) : 0
  }));
};

const getPotentialIssues = () => {
  const issues = [];
  if (!scheduleData || !formData) return issues;
  
  const busiest = getBusiestDay();
  const totalExercises = Object.values(scheduleData).flat().length;
  
  if (busiest.count > 7) {
    issues.push(`${busiest.day} may be overwhelming with ${busiest.count} exercises`);
  }
  
  const nightExercises = getTimeDistribution().night;
  if (totalExercises > 0 && nightExercises > totalExercises * 0.3) {
    issues.push('Too many exercises scheduled after 7 PM');
  }
  
  if (!formData?.remindersEnabled) {
    issues.push('No reminders set - easy to forget sessions');
  }
  
  return issues;
};

// In your header section, add a small icon button
// DELETE THESE LINES (115-125):
// In your header section, add a small icon button


// Now update your generateDynamicInsights function:
const generateDynamicInsights = () => {
  if (!scheduleData) return {
    totalExercises: 0,
    busiestDay: { day: 'Monday', count: 0 },
    lightestDay: { day: 'Sunday', count: 0 },
    timeDistribution: { morning: 0, afternoon: 0, evening: 0, night: 0 },
    tips: [],
    avgPerDay: 0
  };
  
  const totalExercises = Object.values(scheduleData).flat().length;
  const busiestDay = getBusiestDay();
  const lightestDay = getLightestDay();
  const timeDistribution = getTimeDistribution();
  
  const tips = [];
  
  if (busiestDay.count > 6) {
    tips.push(`${busiestDay.day} has ${busiestDay.count} exercises - consider spreading some to ${lightestDay.day}`);
  }
  
  if (timeDistribution.night > totalExercises * 0.3) {
    tips.push('Many exercises scheduled late - may affect bedtime routine');
  }
  
  if (formData?.childAge < 5 && timeDistribution.afternoon > timeDistribution.morning) {
    tips.push('Young children focus better in mornings - consider shifting exercises earlier');
  }
  
  return {
    totalExercises,
    busiestDay,
    lightestDay,
    timeDistribution,
    tips,
    avgPerDay: totalExercises > 0 ? Math.round(totalExercises / 7) : 0
  };
};
  
  const loadScheduleData = async () => {
  try {
    const savedData = await AsyncStorage.getItem('therapyFormData');
    console.log('Raw saved data:', savedData); // Debug log
    
    if (savedData) {
      const data = JSON.parse(savedData);
      console.log('Parsed data structure:', Object.keys(data)); // See what keys exist
      console.log('dailySchedule:', data.dailySchedule); // Check if this exists
      console.log('daily_schedule:', data.daily_schedule); // Check underscore version
      
      // Try both naming conventions
      const schedule = data.dailySchedule || data.daily_schedule || {};
      
      setScheduleData(schedule);
      setChildName(data.childFirstName || data.child_first_name || 'Your child');
      setFormData(data);
      setConflicts(data.conflicts || {});
      setExplanations(data.explanations || {});
      
      console.log('Schedule set to:', schedule);
    } else {
      console.log('No saved data found in AsyncStorage');
    }
    setLoading(false);
  } catch (error) {
    console.error('Error loading schedule:', error);
    setLoading(false);
  }
};
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Calculate schedule statistics
  const getScheduleStats = () => {
    if (!scheduleData || !formData) return null;
    
    const weekdayHours = parseFloat(formData.parentAvailability?.weekdayHours || 0);
    const weekendHours = parseFloat(formData.parentAvailability?.weekendHours || 0);
    const plannedExercises = Math.floor((weekdayHours * 5 + weekendHours * 2) * 60 / 15);
    const actualExercises = Object.values(scheduleData).flat().length;
    const completionRate = plannedExercises > 0 ? Math.round((actualExercises / plannedExercises) * 100) : 0;

    return {
      plannedExercises,
      actualExercises,
      completionRate,
      weekdayHours,
      weekendHours
    };
  };
  
  
  // Get daily routine for timeline view
  const getDailyTimeline = () => {
    if (!formData) return [];
    
    return [
      { time: formData.breakfastTime, event: '🥣 Breakfast', type: 'meal' },
      { time: formData.lunchTime, event: '🍽️ Lunch', type: 'meal' },
      { time: formData.dinnerTime, event: '🍽️ Dinner', type: 'meal' },
      { time: formData.bedtime, event: '😴 Bedtime', type: 'routine' }
    ].filter(item => item.time);
  };
  
  const timeToMinutes = (time) => {
    if (!time) return 0;
    const [h, m] = time.split(':');
    return parseInt(h) * 60 + parseInt(m);
  };
  
  if (loading) {

    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6b5b95" />
        <Text style={styles.loadingText}>Loading schedule...</Text>
      </View>
    );
  }
  
  if (!scheduleData || Object.keys(scheduleData).length === 0) {

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No schedule data found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/calendar-form')}
        >
          <Text style={styles.backButtonText}>Create Schedule</Text>
        </TouchableOpacity>

      </View>
    );
  }


  
  const currentDaySchedule = scheduleData[selectedDay] || [];
  const currentDayConflicts = conflicts[selectedDay] || [];
  const currentDayExplanations = explanations[selectedDay] || [];
  const dailyTimeline = getDailyTimeline();
  const stats = getScheduleStats();
  const insights = generateDynamicInsights();

  // Combine exercises and daily routine for timeline
  const combinedTimeline = [
    ...currentDaySchedule.map(item => ({
      time: item.time,
      event: item.exercise,
      type: 'exercise',
      details: item
    })),
    ...dailyTimeline
  ].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  
  return (
    <View style={styles.container}>
     
     <LinearGradient
  colors={['#6b5b95', '#8073a3']}
  style={styles.header}
>
  <View style={styles.headerTop}>
    <Text style={styles.title}>{childName}'s Schedule</Text>
    <View style={styles.headerIcons}>
      <TouchableOpacity 
        onPress={() => setShowInsights(true)}
        style={styles.headerIcon}
      >
        <Ionicons name="stats-chart" size={20} color="white" />
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => router.push('/calendar-form')}
        style={styles.headerIcon}
      >
        <Ionicons name="settings-outline" size={20} color="white" />
      </TouchableOpacity>
    </View>
  </View>
  
  {stats && (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{stats.actualExercises}</Text>
        <Text style={styles.statLabel}>Exercises/Week</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{stats.completionRate}%</Text>
        <Text style={styles.statLabel}>Schedule Fill</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{stats.weekdayHours * 5 + stats.weekendHours * 2}h</Text>
        <Text style={styles.statLabel}>Weekly Total</Text>
      </View>
    </View>
  )}
</LinearGradient>
      
   







      <ScrollView   ref={scrollViewRef}  
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.daySelector}
      >
      
      {days.map(day => {
  const hasConflicts = conflicts[day]?.length > 0;
  const exerciseCount = scheduleData[day]?.length || 0;
  
  // Check if this is today
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date().getDay();
  const isToday = day === daysOfWeek[today];
  
  return (
    <TouchableOpacity
      key={day}
      style={[
        styles.dayButton,
        selectedDay === day && styles.dayButtonActive,
        isToday && styles.dayButtonToday  // ADD THIS
      ]}
      onPress={() => {
        setSelectedDay(day);
        setDismissedExplanation(false);
      }}
    >
      {isToday && (
        <View style={styles.todayBadge}>
          <Text style={styles.todayBadgeText}>TODAY</Text>
        </View>
      )}
      <Text style={[
        styles.dayButtonText,
        selectedDay === day && styles.dayButtonTextActive
      ]}>
        {day.slice(0, 3)}
      </Text>
      <Text style={[
        styles.exerciseCount,
        selectedDay === day && styles.exerciseCountActive
      ]}>
        {exerciseCount} × 15min
      </Text>
      {hasConflicts && (
        <View style={styles.conflictIndicator} />
      )}
    </TouchableOpacity>
  );
})}

      </ScrollView>

{currentDayExplanations.length > 0 && !dismissedExplanation && (
  <TouchableOpacity 
    activeOpacity={0.95}
    onPress={() => setDismissedExplanation(true)}
    style={styles.explanationBox}
  >
    <View style={{
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      marginBottom: 10,
      paddingRight: 5
    }}>
      <Text style={{fontSize: 12, color: '#999', flex: 1}}>
        Tap anywhere to dismiss
      </Text>
      <View style={{
        backgroundColor: '#f0f0f0',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Text style={{fontSize: 16, color: '#666'}}>✕</Text>
      </View>
    </View>
    
    {currentDayExplanations.map((exp, index) => (
      <View key={index} onStartShouldSetResponder={() => true}>
        <Text style={[
          styles.explanationText,
          exp.type === 'warning' && styles.warningText
        ]}>
          {exp.type === 'warning' ? '⚠️' : 'ℹ️'} {exp.message}
        </Text>
        
        {exp.suggestions && exp.suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {exp.suggestions.map((suggestion, idx) => (
              <View key={idx} style={styles.suggestionItem}>
                {suggestion.type === 'actionable' ? (
                  <View style={styles.actionableSuggestion}>
                    <Text style={styles.suggestionIcon}>💡</Text>
                    <Text style={styles.actionableSuggestionText}>
                      {suggestion.message}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.explanationDetail}>
                    <Text style={styles.explanationIcon}>📊</Text>
                    <Text style={styles.explanationDetailText}>
                      {suggestion.message}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    ))}
  </TouchableOpacity>
)}

{currentDayExplanations.length > 0 && dismissedExplanation && (
  <TouchableOpacity 
    style={{
      backgroundColor: 'rgba(250, 248, 245, 0.8)',
      padding: 8,
      marginHorizontal: 15,
      marginTop: 10,
      borderRadius: 20,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(107, 91, 149, 0.15)'
    }}
    onPress={() => setDismissedExplanation(false)}
  >
    <Text style={{color: '#6b5b95', fontSize: 12}}>
      💡 Tap to see schedule suggestions
    </Text>
  </TouchableOpacity>
)}
      
      <ScrollView style={styles.scheduleContainer}>
        <Text style={styles.sectionTitle}>Daily Timeline</Text>
        
        {combinedTimeline.map((item, index) => {
          const isMealTime = item.type === 'meal';
          const isExercise = item.type === 'exercise';
          const isRoutine = item.type === 'routine';

          return (
            <View key={index} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <Text style={styles.timelineTime}>{item.time}</Text>
                <View style={[
                  styles.timelineDot,
                  isExercise && styles.exerciseDot,
                  isMealTime && styles.mealDot,
                  isRoutine && styles.routineDot
                ]} />
                {index < combinedTimeline.length - 1 && (
                  <View style={styles.timelineLine} />
                )}
              </View>
              
              <View style={[
                styles.timelineContent,
                isExercise && styles.exerciseContent,
                isMealTime && styles.mealContent,
                isRoutine && styles.routineContent
              ]}>
                {isExercise ? (
                  <>
                    <Text style={styles.exerciseName}>{item.event}</Text>
                    <Text style={styles.exerciseType}>
                      Type: {item.details.therapy_type}
                    </Text>
                    <Text style={styles.exerciseDuration}>
                      Duration: {item.details.duration}
                    </Text>
                    {item.details.targets && (
                      <Text style={styles.exerciseTargets}>
                        Targets: {item.details.targets}
                      </Text>
                    )}
                    {item.details.tools && item.details.tools !== 'None required' && (
                      <Text style={styles.exerciseTools}>
                        Tools: {item.details.tools}
                      </Text>
                    )}
                  </>
                ) : (
                  <>
                    <Text style={[
                      styles.eventName,
                      isMealTime && styles.mealName
                    ]}>
                      {item.event}
                    </Text>
                    {isMealTime && (
                      <Text style={styles.bufferNote}>
                        ⏱️ No exercises 30min before & 1hr after
                      </Text>
                    )}
                  </>
                )}



              </View>



              
            </View>


          );
        })}
        
        {currentDayConflicts.length > 0 && (
          <View style={styles.conflictsSection}>
            <Text style={styles.sectionTitle}>⚠️ Time Slots Avoided</Text>
            {currentDayConflicts.map((conflict, index) => (
              <View key={index} style={styles.conflictItem}>
                <Text style={styles.conflictTime}>{conflict.time}</Text>
                <Text style={styles.conflictReason}>
                  {conflict.reasons.join(', ')}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      
     
     
<Modal
  visible={showInsights}
  animationType="slide"
  transparent={true}
>
  <View style={styles.modalOverlay}>
    <View style={styles.insightsModal}>
      <View style={styles.insightsHeader}>
        <Text style={styles.insightsTitle}>Schedule Insights</Text>
        <TouchableOpacity onPress={() => setShowInsights(false)}>
          <Ionicons name="close-circle" size={28} color="#6b5b95" />
        </TouchableOpacity>
       
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false} style={{flex: 1}}>
        <View style={styles.insightCard}>
          <Text style={styles.insightCardTitle}>📊 Your Weekly Load</Text>
          <Text style={styles.insightText}>
            Busiest: {getBusiestDay().day} ({getBusiestDay().count} exercises)
          </Text>
          <Text style={styles.insightText}>
            Lightest: {getLightestDay().day} ({getLightestDay().count} exercises)
          </Text>
          <Text style={styles.insightText}>
            Daily Average: {insights.avgPerDay} exercises
          </Text>
        </View>
        
        <View style={styles.insightCard}>
          <Text style={styles.insightCardTitle}>⏰ Time Distribution</Text>
          <Text style={styles.insightText}>
            Morning: {getTimeDistribution().morning} exercises
          </Text>
          <Text style={styles.insightText}>
            Afternoon: {getTimeDistribution().afternoon} exercises  
          </Text>
          <Text style={styles.insightText}>
            Evening: {getTimeDistribution().evening} exercises
          </Text>
          <Text style={styles.insightText}>
            Night: {getTimeDistribution().night} exercises
          </Text>
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightCardTitle}>💡 Recommendations</Text>
          {getBusiestDay().count > 5 && (
            <Text style={styles.insightText}>
              • Consider moving 1-2 exercises from {getBusiestDay().day} to {getLightestDay().day}
            </Text>
          )}
          <Text style={styles.insightText}>
            • Afternoon is your busiest time - ensure snacks are ready
          </Text>
          {formData?.remindersEnabled ? (
            <Text style={[styles.insightText, {color: 'green'}]}>
              ✓ Reminders are enabled - great for consistency!
            </Text>
          ) : (
            <Text style={styles.insightText}>
              • Enable reminders for better success rate
            </Text>
          )}
        </View>
      </ScrollView>

      
      
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={() => setShowInsights(false)}
      >
        <Text style={styles.closeButtonText}>Got it!</Text>
      </TouchableOpacity>
    </View>



  </View>
</Modal>



    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf8f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#faf8f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#2C2546',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#faf8f5',
  },
  emptyText: {
    fontSize: 18,
    color: '#2C2546',
    marginBottom: 20,
  },
  
  // Header - Enhanced
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.5,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 15,
  },
  headerIcon: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    paddingHorizontal: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
  },
 
  statLabel: {
  fontSize: 12,  // Bump up from 11
  color: 'rgba(255,255,255,0.9)',  // Slightly more opaque
  marginTop: 4,
 // textTransform: 'uppercase',
  letterSpacing: 0.8,  // More spacing for caps
  fontWeight: '500',  // Slightly lighter than 600
},

  // Day selector - Enhanced
  daySelector: {
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 10,
    maxHeight: 100,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(107, 91, 149, 0.1)',
  },
  dayButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginHorizontal: 6,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    minWidth: 85,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(107, 91, 149, 0.12)',
    shadowColor: '#6b5b95',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  dayButtonActive: {
    backgroundColor: '#6b5b95',
    borderColor: '#6b5b95',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    transform: [{ scale: 1.02 }],
  },
  dayButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2C2546',
    letterSpacing: 0.3,
  },
  dayButtonTextActive: {
    color: 'white',
  },
  exerciseCount: {
    fontSize: 11,
    color: 'rgba(62, 56, 88, 0.5)',
    marginTop: 6,
    fontWeight: '500',
  },
  exerciseCountActive: {
    color: 'rgba(255,255,255,0.9)',
  },
  conflictIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d4a574',
  },
  
  // Explanation box
  explanationBox: {
    backgroundColor: '#faf8f5',
    padding: 12,
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#d4a574',
    borderWidth: 1,
    borderColor: 'rgba(107, 91, 149, 0.1)',
  },
  explanationText: {
    fontSize: 14,
    color: '#2C2546',
    lineHeight: 20,
    fontWeight: '500',
  },
  warningText: {
    color: '#6b5b95',
    fontWeight: '600',
  },
  suggestionsContainer: {
    marginTop: 10,
    paddingLeft: 10,
  },
  suggestionItem: {
    marginVertical: 4,
  },
  actionableSuggestion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(135, 160, 142, 0.15)',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#87a08e',
  },
  suggestionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  actionableSuggestionText: {
    flex: 1,
    fontSize: 13,
    color: '#5a7961',
    lineHeight: 18,
    fontWeight: '500',
  },
  explanationDetail: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(107, 91, 149, 0.05)',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#8073a3',
  },
  explanationIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  explanationDetailText: {
    flex: 1,
    fontSize: 13,
    color: '#5c4d7d',
    lineHeight: 18,
  },
  
  // Schedule container
  scheduleContainer: {
    flex: 1,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C2546',
    marginBottom: 15,
    marginTop: 10,
  },
  
  // Timeline - Enhanced
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineLeft: {
    width: 60,
    alignItems: 'center',
  },
  timelineTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b5b95',
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E0E0E0',
    marginTop: 8,
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 2,
  },
  exerciseDot: {
    backgroundColor: '#87a08e',
    borderColor: 'white',
  },
  mealDot: {
    backgroundColor: '#d4a574',
    borderColor: 'white',
  },
  routineDot: {
    backgroundColor: '#8073a3',
    borderColor: 'white',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(107, 91, 149, 0.1)',
    marginTop: -2,
    zIndex: 1,
  },
  
  // Timeline content - Enhanced
  timelineContent: {
    flex: 1,
    marginLeft: 20,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#6b5b95',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(107, 91, 149, 0.08)',
  },
  exerciseContent: {
    backgroundColor: 'white',
    borderLeftWidth: 4,
    borderLeftColor: '#87a08e',
  },
  mealContent: {
    backgroundColor: 'rgba(250, 245, 240, 0.5)',
    borderLeftWidth: 4,
    borderLeftColor: '#d4a574',
  },
  routineContent: {
    backgroundColor: 'rgba(250, 248, 255, 0.5)',
    borderLeftWidth: 4,
    borderLeftColor: '#8073a3',
  },
  
  // Exercise details - Enhanced
  exerciseName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2C2546',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  exerciseType: {
    fontSize: 13,
    color: '#6b5b95',
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exerciseDuration: {
    fontSize: 13,
    color: 'rgba(62, 56, 88, 0.6)',
    marginBottom: 4,
    fontWeight: '500',
  },
  exerciseTargets: {
    fontSize: 13,
    color: 'rgba(62, 56, 88, 0.6)',
    marginBottom: 4,
  },
  exerciseTools: {
    fontSize: 12,
    color: 'rgba(62, 56, 88, 0.5)',
    fontStyle: 'italic',
    marginTop: 4,
    lineHeight: 18,
  },
  eventName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C2546',
  },
  mealName: {
    color: '#d4a574',
  },
  bufferNote: {
    fontSize: 12,
    color: 'rgba(62, 56, 88, 0.5)',
    marginTop: 5,
    fontStyle: 'italic',
  },
  
  // Conflicts section
  conflictsSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'rgba(245, 240, 232, 0.5)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(107, 91, 149, 0.15)',
  },
  conflictItem: {
    marginBottom: 10,
  },
  conflictTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b5b95',
  },
  conflictReason: {
    fontSize: 13,
    color: 'rgba(62, 56, 88, 0.7)',
    marginTop: 2,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightsModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    height: '75%',
    marginTop: 'auto',
  },
  insightsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  insightsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2C2546',
  },
  insightCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 15,
    padding: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(107, 91, 149, 0.2)',
  },
  insightCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b5b95',
    marginBottom: 10,
  },
  insightText: {
    fontSize: 14,
    color: '#2C2546',
    marginBottom: 5,
    lineHeight: 20,
  },
  closeButton: {
    backgroundColor: '#6b5b95',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#6b5b95',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  dayButtonToday: {
  borderColor: '#87a08e',
  borderWidth: 2.5,
},

todayBadge: {
  position: 'absolute',
  top: -8,
  backgroundColor: '#87a08e',
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 8,
},

todayBadgeText: {
  fontSize: 9,
  color: 'white',
  fontWeight: '700',
  letterSpacing: 0.5,
},

});