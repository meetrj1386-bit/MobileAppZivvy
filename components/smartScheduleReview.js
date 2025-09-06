import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

export default function SmartScheduleReview({ scheduleData, onApprove, onEdit }) {
  const [editMode, setEditMode] = useState(false);
  const [customSchedule, setCustomSchedule] = useState(scheduleData);
  const [conflicts, setConflicts] = useState([]);

  const detectConflicts = () => {
    const foundConflicts = [];
    
    // Check meal time conflicts
    Object.keys(customSchedule.schedule).forEach(day => {
      customSchedule.schedule[day].exercises.forEach(exercise => {
        const exerciseTime = parseInt(exercise.time.split(':')[0]);
        
        // Check against meal times
        if (Math.abs(exerciseTime - 8) < 1) {
          foundConflicts.push({
            day,
            time: exercise.time,
            issue: 'Too close to breakfast time',
            suggestion: '09:30'
          });
        }
        if (Math.abs(exerciseTime - 12) < 1) {
          foundConflicts.push({
            day,
            time: exercise.time,
            issue: 'Conflicts with lunch time',
            suggestion: '14:00'
          });
        }
      });
    });
    
    setConflicts(foundConflicts);
    return foundConflicts;
  };

  const autoResolveConflicts = () => {
    const resolved = { ...customSchedule };
    
    conflicts.forEach(conflict => {
      const dayExercises = resolved.schedule[conflict.day].exercises;
      const exercise = dayExercises.find(e => e.time === conflict.time);
      if (exercise) {
        exercise.time = conflict.suggestion;
      }
    });
    
    setCustomSchedule(resolved);
    setConflicts([]);
    Alert.alert('Resolved', 'All conflicts have been automatically resolved!');
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <Text style={styles.headerTitle}>Review Your Smart Schedule</Text>
        <Text style={styles.headerSubtitle}>
          AI has optimized based on your needs
        </Text>
      </LinearGradient>

      {/* Insights Section */}
      {scheduleData.insights && scheduleData.insights.length > 0 && (
        <View style={styles.insightsContainer}>
          <Text style={styles.sectionTitle}>AI Insights & Recommendations</Text>
          {scheduleData.insights.map((insight, idx) => (
            <View key={idx} style={[
              styles.insightCard,
              insight.priority === 'high' && styles.highPriority
            ]}>
              <Text style={styles.insightMessage}>{insight.message}</Text>
              <Text style={styles.insightAction}>{insight.action}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Detected Additional Needs */}
      {scheduleData.suggestions && scheduleData.suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.sectionTitle}>Additional Therapies Detected</Text>
          <Text style={styles.subtitle}>
            Based on your description, we recommend adding:
          </Text>
          {scheduleData.suggestions.map((suggestion, idx) => (
            <View key={idx} style={styles.suggestionCard}>
              <Text style={styles.suggestionType}>
                {suggestion.type.toUpperCase()} Therapy
              </Text>
              <Text style={styles.suggestionReason}>
                Why: {suggestion.reason}
              </Text>
              <Text style={styles.confidenceText}>
                Confidence: {suggestion.confidence}%
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Conflict Detection */}
      {conflicts.length > 0 && (
        <View style={styles.conflictContainer}>
          <Text style={styles.conflictTitle}>Schedule Conflicts Detected</Text>
          {conflicts.map((conflict, idx) => (
            <View key={idx} style={styles.conflictCard}>
              <Text style={styles.conflictText}>
                {conflict.day} at {conflict.time}: {conflict.issue}
              </Text>
              <Text style={styles.conflictSuggestion}>
                Suggested: {conflict.suggestion}
              </Text>
            </View>
          ))}
          <TouchableOpacity 
            style={styles.resolveButton}
            onPress={autoResolveConflicts}
          >
            <Text style={styles.resolveButtonText}>Auto-Resolve All</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Weekly Schedule Preview */}
      <View style={styles.schedulePreview}>
        <Text style={styles.sectionTitle}>Your Weekly Schedule</Text>
        {Object.keys(customSchedule.schedule).map(day => (
          <View key={day} style={styles.dayCard}>
            <Text style={styles.dayTitle}>{day}</Text>
            {customSchedule.schedule[day].exercises.map((exercise, idx) => (
              <View key={idx} style={styles.exerciseRow}>
                <View style={styles.exerciseTimeBox}>
                  {editMode ? (
                    <TextInput
                      style={styles.timeInput}
                      value={exercise.time}
                      onChangeText={(text) => {
                        const updated = { ...customSchedule };
                        updated.schedule[day].exercises[idx].time = text;
                        setCustomSchedule(updated);
                      }}
                    />
                  ) : (
                    <Text style={styles.exerciseTime}>{exercise.time}</Text>
                  )}
                </View>
                <View style={styles.exerciseDetails}>
                  <Text style={styles.exerciseType}>
                    {exercise.type.toUpperCase()}
                    {exercise.category === 'suggested' && ' (Recommended)'}
                  </Text>
                  <Text style={styles.exerciseDuration}>
                    {exercise.duration} minutes
                  </Text>
                </View>
                {editMode && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => {
                      const updated = { ...customSchedule };
                      updated.schedule[day].exercises.splice(idx, 1);
                      setCustomSchedule(updated);
                    }}
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <Text style={styles.dayTotal}>
              Total: {customSchedule.schedule[day].totalMinutes} minutes
            </Text>
          </View>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => setEditMode(!editMode)}
        >
          <Text style={styles.actionButtonText}>
            {editMode ? 'Done Editing' : 'Customize Schedule'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.checkButton]}
          onPress={() => detectConflicts()}
        >
          <Text style={styles.actionButtonText}>Check Conflicts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => onApprove(customSchedule)}
        >
          <Text style={styles.actionButtonText}>Approve & Start</Text>
        </TouchableOpacity>
      </View>

      {/* Professional Disclaimer */}
      <View style={styles.disclaimerContainer}>
        <Text style={styles.disclaimerText}>
          Note: This is an AI-generated schedule based on your inputs. 
          Always consult with your child's therapists for professional guidance. 
          You can replace any suggested exercise with therapist-prescribed activities.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  insightsContainer: {
    padding: 15,
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 10,
  },
  insightCard: {
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  highPriority: {
    borderLeftColor: '#ff9800',
    backgroundColor: '#fff3e0',
  },
  insightMessage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  insightAction: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  suggestionsContainer: {
    padding: 15,
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 10,
  },
  suggestionCard: {
    padding: 12,
    backgroundColor: '#fff9e6',
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
  },
  suggestionType: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  suggestionReason: {
    fontSize: 13,
    color: '#666',
    marginTop: 5,
  },
  confidenceText: {
    fontSize: 12,
    color: '#999',
    marginTop: 3,
  },
  conflictContainer: {
    padding: 15,
    backgroundColor: '#ffebee',
    margin: 10,
    borderRadius: 10,
  },
  conflictTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#c62828',
    marginBottom: 10,
  },
  conflictCard: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    marginBottom: 8,
  },
  conflictText: {
    fontSize: 14,
    color: '#333',
  },
  conflictSuggestion: {
    fontSize: 13,
    color: '#4CAF50',
    marginTop: 3,
  },
  resolveButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  resolveButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  schedulePreview: {
    padding: 15,
  },
  dayCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  exerciseTimeBox: {
    width: 70,
  },
  exerciseTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 5,
    fontSize: 14,
  },
  exerciseDetails: {
    flex: 1,
    marginLeft: 15,
  },
  exerciseType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  exerciseDuration: {
    fontSize: 12,
    color: '#666',
  },
  removeButton: {
    padding: 5,
  },
  removeText: {
    color: '#f44336',
    fontSize: 12,
  },
  dayTotal: {
    fontSize: 13,
    color: '#999',
    marginTop: 10,
    textAlign: 'right',
  },
  actionContainer: {
    padding: 15,
  },
  actionButton: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#9c27b0',
  },
  checkButton: {
    backgroundColor: '#ff9800',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disclaimerContainer: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    margin: 10,
    borderRadius: 10,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
});