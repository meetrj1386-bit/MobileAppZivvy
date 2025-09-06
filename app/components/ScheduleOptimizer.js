// app/components/ScheduleOptimizer.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export const ScheduleOptimizer = ({ currentSchedule, onSuggestionApply }) => {
  const [patterns, setPatterns] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    analyzePatterns();
  }, []);

  const analyzePatterns = async () => {
    // Get completion data from last 2 weeks
    const twoWeeksData = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = `tracking_${date.toDateString()}`;
      const dayData = await AsyncStorage.getItem(key);
      if (dayData) {
        twoWeeksData.push(JSON.parse(dayData));
      }
    }

    // Find patterns
    const timePatterns = {};
    const exercisePatterns = {};
    
    twoWeeksData.forEach(day => {
      day.skipped?.forEach(item => {
        const hour = parseInt(item.time.split(':')[0]);
        timePatterns[hour] = (timePatterns[hour] || 0) + 1;
        exercisePatterns[item.exercise] = (exercisePatterns[item.exercise] || 0) + 1;
      });
    });

    // Generate suggestions
    const newSuggestions = [];
    
    // Time-based suggestions
    Object.entries(timePatterns).forEach(([hour, count]) => {
      if (count > 5) { // Skipped more than 5 times in 2 weeks
        newSuggestions.push({
          type: 'time',
          severity: count > 10 ? 'high' : 'medium',
          message: `Exercises at ${hour}:00 are frequently skipped (${count} times)`,
          action: `Move ${hour}:00 exercises to a different time`,
          data: { problemHour: hour }
        });
      }
    });

    // Exercise-based suggestions
    Object.entries(exercisePatterns).forEach(([exercise, count]) => {
      if (count > 7) {
        newSuggestions.push({
          type: 'exercise',
          severity: 'high',
          message: `"${exercise}" is rarely completed (skipped ${count} times)`,
          action: 'Consider reducing frequency or replacing this exercise',
          data: { problemExercise: exercise }
        });
      }
    });

    setPatterns({ timePatterns, exercisePatterns });
    setSuggestions(newSuggestions);
  };

  const applySuggestion = async (suggestion) => {
    if (suggestion.type === 'time') {
      // Store preference to avoid this time
      const preferences = await AsyncStorage.getItem('schedulePreferences') || '{}';
      const prefs = JSON.parse(preferences);
      prefs.avoidTimes = [...(prefs.avoidTimes || []), suggestion.data.problemHour];
      await AsyncStorage.setItem('schedulePreferences', JSON.stringify(prefs));
      onSuggestionApply?.();
    }
  };

  if (!suggestions.length) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Schedule Optimization Suggestions</Text>
      {suggestions.map((suggestion, index) => (
        <View key={index} style={[
          styles.suggestionCard,
          suggestion.severity === 'high' && styles.highSeverity
        ]}>
          <View style={styles.suggestionContent}>
            <Ionicons 
              name={suggestion.severity === 'high' ? 'warning' : 'information-circle'} 
              size={20} 
              color={suggestion.severity === 'high' ? '#EF4444' : '#F59E0B'} 
            />
            <View style={styles.textContent}>
              <Text style={styles.message}>{suggestion.message}</Text>
              <Text style={styles.action}>{suggestion.action}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.applyButton}
            onPress={() => applySuggestion(suggestion)}
          >
            <Text style={styles.applyText}>Apply</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(212, 165, 116, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b5b95',
    marginBottom: 12,
  },
  suggestionCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  highSeverity: {
    borderLeftColor: '#EF4444',
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  textContent: {
    flex: 1,
    marginLeft: 12,
  },
  message: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  action: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  applyButton: {
    backgroundColor: '#6b5b95',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  applyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});