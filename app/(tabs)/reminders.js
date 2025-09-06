import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RemindersScreen() {
  const [settings, setSettings] = useState({
    exerciseReminders: true,
    morningPreview: true,
    eveningCheckIn: true,
    gentleMode: true,
    minutesBefore: 15,
  });
  const [todaySchedule, setTodaySchedule] = useState([]);

  useEffect(() => {
    loadTodaySchedule();
    loadSettings();
  }, []);

  const loadTodaySchedule = async () => {
    const data = await AsyncStorage.getItem('therapyFormData');
    if (data) {
      const parsed = JSON.parse(data);
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
      const today = parsed.dailySchedule?.[dayName] || [];
      setTodaySchedule(today);
    }
  };

  const loadSettings = async () => {
    const saved = await AsyncStorage.getItem('reminderSettings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  };

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await AsyncStorage.setItem('reminderSettings', JSON.stringify(newSettings));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#8073a3', '#9183b5']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Reminder Settings</Text>
        <Text style={styles.headerSubtext}>
          Gentle nudges to keep you on track
        </Text>
      </LinearGradient>

 
 // Updated Reminders Screen - Coming Up Today section


<View style={styles.card}>
  <Text style={styles.cardTitle}>Coming Up Today</Text>
  {todaySchedule.length > 0 ? (
    todaySchedule.slice(0, 3).map((item, index) => {
      let therapyType = 'Therapy';
      
      if (item.therapy_type) {
        if (item.therapy_type.includes('ST')) {
          therapyType = 'Speech';
        } else if (item.therapy_type.includes('OT')) {
          therapyType = 'OT';
        } else if (item.therapy_type.includes('PT')) {
          therapyType = 'Physical';
        } else if (item.therapy_type.includes('ABA')) {
          therapyType = 'Behavioral';
        }
      }
      
      return (
        <View key={index} style={styles.scheduleItem}>
          <View style={styles.timeBox}>
            <Text style={styles.scheduleTime}>{item.time}</Text>
          </View>
          <View style={styles.exerciseInfo}>
            <Text style={styles.scheduleName}>
              {therapyType} Exercise
            </Text>
            <Text style={styles.reminderPreview}>
              {item.duration} min - As per therapist's plan
            </Text>
          </View>
        </View>
      );
    })
  ) : (
    <Text style={styles.emptyText}>No exercises scheduled today</Text>
  )}
  {todaySchedule.length > 3 && (
    <Text style={styles.moreText}>+{todaySchedule.length - 3} more exercises</Text>
  )}
</View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>How Should We Remind You?</Text>
        
        <TouchableOpacity 
          style={[styles.styleOption, settings.gentleMode && styles.styleOptionActive]}
          onPress={() => updateSetting('gentleMode', true)}
        >
          <Text style={styles.optionEmoji}>💜</Text>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Gentle & Encouraging</Text>
            <Text style={styles.optionDesc}>
              "Ready to try speech practice?"
            </Text>
          </View>
          {settings.gentleMode && <Ionicons name="checkmark-circle" size={24} color="#87a08e" />}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.styleOption, !settings.gentleMode && styles.styleOptionActive]}
          onPress={() => updateSetting('gentleMode', false)}
        >
          <Text style={styles.optionEmoji}>⏰</Text>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Direct Reminders</Text>
            <Text style={styles.optionDesc}>
              "Speech therapy - 4:40 PM"
            </Text>
          </View>
          {!settings.gentleMode && <Ionicons name="checkmark-circle" size={24} color="#87a08e" />}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>When to Remind</Text>
        
        <View style={styles.timingOptions}>
          {[5, 10, 15, 30].map(minutes => (
            <TouchableOpacity
              key={minutes}
              style={[
                styles.timingButton,
                settings.minutesBefore === minutes && styles.timingButtonActive
              ]}
              onPress={() => updateSetting('minutesBefore', minutes)}
            >
              <Text style={[
                styles.timingText,
                settings.minutesBefore === minutes && styles.timingTextActive
              ]}>
                {minutes} min
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.timingDesc}>
          Before each exercise
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Reminder Types</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Exercise Reminders</Text>
            <Text style={styles.settingDesc}>
              Gentle nudge before each activity
            </Text>
          </View>
          <Switch
            value={settings.exerciseReminders}
            onValueChange={(v) => updateSetting('exerciseReminders', v)}
            trackColor={{ false: '#e0e0e0', true: '#87a08e' }}
            thumbColor={'white'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Morning Preview</Text>
            <Text style={styles.settingDesc}>
              Today's opportunities at 8 AM
            </Text>
          </View>
          <Switch
            value={settings.morningPreview}
            onValueChange={(v) => updateSetting('morningPreview', v)}
            trackColor={{ false: '#e0e0e0', true: '#87a08e' }}
            thumbColor={'white'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Progress Check-in</Text>
            <Text style={styles.settingDesc}>
              Evening reflection on today's wins
            </Text>
          </View>
          <Switch
            value={settings.eveningCheckIn}
            onValueChange={(v) => updateSetting('eveningCheckIn', v)}
            trackColor={{ false: '#e0e0e0', true: '#87a08e' }}
            thumbColor={'white'}
          />
        </View>
      </View>
    </ScrollView>
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
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  card: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#6b5b95',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2546',
    marginBottom: 15,
  },
  scheduleItem: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  timeBox: {
    backgroundColor: '#f0e9df',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 12,
  },
  scheduleTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b5b95',
  },
  exerciseInfo: {
    flex: 1,
  },
  scheduleName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2546',
    marginBottom: 4,
  },
  reminderPreview: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
  moreText: {
    color: '#6b5b95',
    fontSize: 13,
    marginTop: 5,
    fontWeight: '500',
  },
  styleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  styleOptionActive: {
    borderColor: '#87a08e',
    backgroundColor: 'rgba(135, 160, 142, 0.05)',
  },
  optionEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C2546',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 12,
    color: '#999',
  },
  timingOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  timingButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  timingButtonActive: {
    backgroundColor: '#87a08e',
  },
  timingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  timingTextActive: {
    color: 'white',
  },
  timingDesc: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(107, 91, 149, 0.1)',
  },
  settingInfo: {
    flex: 1,
    marginRight: 10,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C2546',
    marginBottom: 3,
  },
  settingDesc: {
    fontSize: 12,
    color: '#999',
  },
});