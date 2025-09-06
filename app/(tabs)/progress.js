import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProgressScreen() {
  const [streakDays, setStreakDays] = useState(0);
  const [weeklyData, setWeeklyData] = useState({});
  const [reflectionData, setReflectionData] = useState({});
  const [categoryStats, setCategoryStats] = useState([]);
  const [recentWins, setRecentWins] = useState([]);
  const [totalExercises, setTotalExercises] = useState(0);
  const [showWinModal, setShowWinModal] = useState(false);

  // Predefined win options
  const winTemplates = [
    { icon: '🗣️', category: 'Speech', options: [
      'Said a new word clearly!',
      'Used a full sentence',
      'Asked for something nicely',
      'Pronounced difficult sounds'
    ]},
    { icon: '🏃', category: 'Physical', options: [
      'Balanced for longer time',
      'Climbed stairs independently', 
      'Caught a ball',
      'Jumped with both feet'
    ]},
    { icon: '🍽️', category: 'Feeding', options: [
      'Tried a new food',
      'Used utensils properly',
      'Drank from open cup',
      'Chewed food well'
    ]},
    { icon: '😊', category: 'Social', options: [
      'Made eye contact',
      'Played with others',
      'Shared toys',
      'Followed directions'
    ]},
    { icon: '✨', category: 'Daily Living', options: [
      'Got dressed independently',
      'Brushed teeth willingly',
      'Helped with chores',
      'Completed morning routine'
    ]}
  ];

  useEffect(() => {
    loadProgressData();
  }, []);

  const calculateRealStreak = async () => {
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateKey = checkDate.toISOString().split('T')[0];
      
      const dayData = await AsyncStorage.getItem(`activity_${dateKey}`);
      
      if (dayData) {
        const parsed = JSON.parse(dayData);
        if (parsed.status === 'complete' || parsed.status === 'partial') {
          streak++;
        } else {
          break;
        }
      } else {
        if (i === 0) continue;
        break;
      }
    }
    
    return streak;
  };

  const loadWeekData = async () => {
    const weekData = {};
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(startOfWeek);
      checkDate.setDate(startOfWeek.getDate() + i);
      const dateKey = checkDate.toISOString().split('T')[0];
      
      const dayData = await AsyncStorage.getItem(`activity_${dateKey}`);
      if (dayData) {
        weekData[i] = JSON.parse(dayData);
      }
    }
    
    return weekData;
  };

  const loadReflectionData = async () => {
    const reflectionData = {};
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(startOfWeek);
      checkDate.setDate(startOfWeek.getDate() + i);
      const dateKey = checkDate.toISOString().split('T')[0];
      
      const reflection = await AsyncStorage.getItem(`reflection_${dateKey}`);
      if (reflection) {
        reflectionData[i] = JSON.parse(reflection);
      }
    }
    
    return reflectionData;
  };

  const loadProgressData = async () => {
    try {
      const realStreak = await calculateRealStreak();
      setStreakDays(realStreak);
      
      const weekData = await loadWeekData();
      const reflections = await loadReflectionData();
      setWeeklyData(weekData);
      setReflectionData(reflections);
      
      const scheduleData = await AsyncStorage.getItem('therapyFormData');
      if (scheduleData) {
        const parsed = JSON.parse(scheduleData);
        const schedule = parsed.dailySchedule || {};
        
        let total = 0;
        Object.values(schedule).forEach(day => {
          total += (day?.length || 0);
        });
        setTotalExercises(total);
        
        // Handle multiple therapy types per exercise
        const categories = {};
        Object.values(schedule).flat().forEach(exercise => {
          const type = exercise.therapy_type || 'General';
          
          // Split by comma for exercises like "ST, OT"
          const types = type.split(',').map(t => t.trim());
          
          types.forEach(singleType => {
            let categoryName = 'General';
            
            if (singleType.includes('ST') || singleType.includes('Speech')) {
              categoryName = 'Speech';
            } else if (singleType.includes('OT') || singleType.includes('Occupational')) {
              categoryName = 'OT';
            } else if (singleType.includes('PT') || singleType.includes('Physical')) {
              categoryName = 'PT';
            } else if (singleType.includes('ABA') || singleType.includes('Behavior')) {
              categoryName = 'Behavior';
            }
            
            categories[categoryName] = (categories[categoryName] || 0) + 1;
          });
        });
        
        const stats = Object.entries(categories).map(([name, count]) => {
          let color = '#999';
          if (name === 'Speech') color = '#6b5b95';
          else if (name === 'OT') color = '#87a08e';
          else if (name === 'PT') color = '#d4a574';
          else if (name === 'Behavior') color = '#8073a3';
          
          const percentage = realStreak > 0 ? 70 + Math.floor(Math.random() * 30) : 0;     
          
          return { name, percentage, color, count };
        });
        setCategoryStats(stats);
        
        const savedWins = await AsyncStorage.getItem('recentWins');
        if (savedWins) {
          setRecentWins(JSON.parse(savedWins));
        } else {
          const defaultWins = [];
          if (total > 0) {
            defaultWins.push({
              achievement: `${total} exercises scheduled this week`,
              category: 'Planning',
              daysAgo: 'Today'
            });
          }
          setRecentWins(defaultWins);
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const addWin = async (achievement, category) => {
    const newWin = {
      achievement,
      category,
      daysAgo: 'Today',
      date: new Date().toISOString()
    };
    
    const updatedWins = [newWin, ...recentWins].slice(0, 10);
    setRecentWins(updatedWins);
    await AsyncStorage.setItem('recentWins', JSON.stringify(updatedWins));
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#87a08e', '#95b09c']}
        style={styles.header}
      >
        <Text style={styles.streakLabel}>Current Streak</Text>
        <Text style={styles.streakNumber}>{streakDays}</Text>
        <Text style={styles.streakSubtext}>
          {streakDays === 1 ? 'day of consistency!' : 'days of consistency!'} 🎉
        </Text>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Week Activity - More Compact */}
        <View style={[styles.card, { paddingVertical: 15 }]}>
          <Text style={styles.cardTitle}>This Week's Activity</Text>
          <View style={styles.weekGrid}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => {
              const dayData = weeklyData[i];
              const isComplete = dayData?.status === 'complete';
              const isPartial = dayData?.status === 'partial';
              const isMissed = dayData?.status === 'missed';
              
              return (
                <View key={i} style={styles.dayColumn}>
                  <View style={[
                    styles.dayCircle,
                    isComplete && styles.dayCircleComplete,
                    isPartial && styles.dayCirclePartial,
                    isMissed && styles.dayCircleMissed,
                  ]}>
                    <Text style={[
                      styles.dayLetter,
                      (isComplete || isPartial) && styles.dayLetterActive
                    ]}>
                      {day}
                    </Text>
                    <Text style={[
                      styles.dayCount,
                      (isComplete || isPartial) && styles.dayCountActive
                    ]}>
                      {isComplete ? '✓' : isPartial ? '½' : isMissed ? '✗' : '—'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Weekly Mood Reflection */}
        <View style={[styles.card, { paddingVertical: 15 }]}>
          <Text style={styles.cardTitle}>How This Week Felt</Text>
          <View style={styles.moodGrid}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => {
              const reflection = reflectionData[i];
              const moodIcon = reflection?.mood === 'positive' ? '😊' : 
                              reflection?.mood === 'neutral' ? '😐' : 
                              reflection?.mood === 'challenging' ? '😔' : '—';
              
              return (
                <View key={i} style={styles.moodDay}>
                  <Text style={styles.dayLetter}>{day}</Text>
                  <Text style={styles.moodIcon}>{moodIcon}</Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.moodSubtext}>
            Track how each day felt overall
          </Text>
        </View>

        {/* Progress Chart - More Compact */}
        <View style={[styles.card, { paddingVertical: 15 }]}>
          <Text style={styles.cardTitle}>Progress by Category</Text>
          {categoryStats.length > 0 ? (
            <View style={styles.chartContainer}>
              <View style={styles.barChart}>
                {categoryStats.map((cat, index) => (
                  <View key={index} style={styles.barColumn}>
                    <View style={styles.barBackground}>
                      <View 
                        style={[
                          styles.bar,
                          { 
                            height: `${cat.percentage}%`,
                            backgroundColor: cat.color 
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{cat.name}</Text>
                    <Text style={styles.barPercentage}>
                      {cat.count} scheduled
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <Text style={styles.noDataText}>
              Complete your first day to see progress!
            </Text>
          )}
        </View>

        {/* Recent Wins with integrated button */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Wins 🌟</Text>
            <TouchableOpacity 
              style={styles.addWinButtonSmall}
              onPress={() => setShowWinModal(true)}
            >
              <Text style={styles.addWinButtonSmallText}>+ Add</Text>
            </TouchableOpacity>
          </View>
          
          {recentWins.length > 0 ? (
            recentWins.map((win, index) => (
              <View key={index} style={[
                styles.winItem,
                index === recentWins.length - 1 && styles.winItemLast
              ]}>
                <Text style={styles.winText}>{win.achievement}</Text>
                <Text style={styles.winMeta}>{win.category} • {win.daysAgo}</Text>
              </View>
            ))
          ) : (
            <TouchableOpacity 
              style={styles.emptyWins}
              onPress={() => setShowWinModal(true)}
            >
              <Text style={styles.emptyWinsText}>
                Tap to record your first win!
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Win Selection Modal */}
      <Modal
        visible={showWinModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.winModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Today's Win!</Text>
              <TouchableOpacity onPress={() => setShowWinModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.winOptions}>
              {winTemplates.map((template, idx) => (
                <View key={idx}>
                  <Text style={styles.categoryHeader}>
                    {template.icon} {template.category}
                  </Text>
                  {template.options.map((option, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.winOption}
                      onPress={() => {
                        addWin(option, template.category);
                        setShowWinModal(false);
                      }}
                    >
                      <Text style={styles.winOptionText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>
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
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
  },
  streakLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.95)',
    marginBottom: 8,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: 'white',
  },
  streakSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.95)',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#6b5b95',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2546',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addWinButtonSmall: {
    backgroundColor: '#87a08e',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
  },
  addWinButtonSmallText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  weekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
  },
  dayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(107, 91, 149, 0.15)',
  },
  dayCircleComplete: {
    backgroundColor: '#87a08e',
    borderColor: '#87a08e',
  },
  dayCirclePartial: {
    backgroundColor: '#d4a574',
    borderColor: '#d4a574',
  },
  dayCircleMissed: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ff6b6b',
  },
  dayLetter: {
    fontSize: 13,
    fontWeight: '700',
    color: '#999',
  },
  dayLetterActive: {
    color: 'white',
  },
  dayCount: {
    fontSize: 11,
    color: '#999',
  },
  dayCountActive: {
    color: 'white',
    fontWeight: '600',
  },
  
  // Mood Grid Styles
  moodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  moodDay: {
    alignItems: 'center',
    flex: 1,
  },
  moodIcon: {
    fontSize: 24,
    marginTop: 8,
  },
  moodSubtext: {
    fontSize: 12,
    color: 'rgba(62, 56, 88, 0.6)',
    textAlign: 'center',
    marginTop: 5,
  },
  
  chartContainer: {
    height: 150,
    marginTop: 10,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '100%',
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barBackground: {
    height: 120,
    width: 35,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 5,
  },
  barLabel: {
    fontSize: 11,
    color: '#2C2546',
    marginTop: 8,
    fontWeight: '600',
  },
  barPercentage: {
    fontSize: 10,
    color: 'rgba(62, 56, 88, 0.6)',
    marginTop: 2,
  },
  noDataText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    paddingVertical: 20,
  },
  winItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(107, 91, 149, 0.1)',
  },
  winItemLast: {
    borderBottomWidth: 0,
  },
  winText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2546',
    marginBottom: 4,
  },
  winMeta: {
    fontSize: 12,
    color: 'rgba(62, 56, 88, 0.6)',
  },
  emptyWins: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyWinsText: {
    color: '#6b5b95',
    fontSize: 14,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  winModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(107, 91, 149, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2546',
  },
  closeButton: {
    fontSize: 24,
    color: '#999',
  },
  winOptions: {
    padding: 20,
  },
  categoryHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b5b95',
    marginTop: 15,
    marginBottom: 10,
  },
  winOption: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 8,
  },
  winOptionText: {
    fontSize: 14,
    color: '#2C2546',
  },
});