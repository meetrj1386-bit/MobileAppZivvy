import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
 import { NotificationManager } from '../utils/notificationManager';

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    notifications: true,
    weekendReminders: true,
    vacationMode: false,
    quietHoursEnabled: false,
    quietHoursStart: '21:00',
    quietHoursEnd: '07:00',
  });

  const [childName, setChildName] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('appSettings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
      
      const formData = await AsyncStorage.getItem('therapyFormData');
      if (formData) {
        const parsed = JSON.parse(formData);
        setChildName(parsed.childFirstName || 'Your child');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await AsyncStorage.setItem('appSettings', JSON.stringify(newSettings));
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            router.replace('/welcome');
          }
        }
      ]
    );
  };

 const handleEditSchedule = () => {
  // This assumes you want to go back to form to edit
  router.push({
    pathname: '/calendar-form',
    params: { editMode: true }
  });
};

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will remove all your data including schedule and progress. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert('Success', 'All data cleared');
            router.replace('/welcome');
          }
        }
      ]
    );
  };

  const handleSkipToday = async () => {
  await NotificationManager.skipToday();
  Alert.alert('Success', "Today's reminders have been paused");
};

const handleVacationMode = async (enabled) => {
  await NotificationManager.setVacationMode(enabled);
  updateSetting('vacationMode', enabled);
  
  if (enabled) {
    Alert.alert('Vacation Mode', 'All reminders paused. Enjoy your break!');
  } else {
    Alert.alert('Welcome Back', 'Reminders have been reactivated');
  }
};


const handleTestNotification = async () => {
  const success = await NotificationManager.sendTestNotification();
  if (success) {
    Alert.alert('Test Sent', 'You should receive a notification in 2 seconds');
  } else {
    Alert.alert('Test Blocked', 'Notification blocked by current settings (vacation mode, quiet hours, or today skipped)');
  }
};



  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={['#6b5b95', '#8073a3']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtext}>
          Managing {childName}'s therapy schedule
        </Text>
      </LinearGradient>

      {/* Quick Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleEditSchedule}>
          <View style={styles.actionContent}>
            <View style={[styles.iconCircle, { backgroundColor: '#f0e9df' }]}>
              <Ionicons name="calendar" size={20} color="#6b5b95" />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Edit Schedule</Text>
              <Text style={styles.actionDesc}>Modify therapy times</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => updateSetting('vacationMode', !settings.vacationMode)}
        >
          <View style={styles.actionContent}>
            <View style={[styles.iconCircle, { backgroundColor: '#e8f5e9' }]}>
              <Ionicons name="airplane" size={20} color="#87a08e" />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Vacation Mode</Text>
              <Text style={styles.actionDesc}>
                {settings.vacationMode ? 'Active - Reminders paused' : 'Pause all reminders'}
              </Text>
            </View>
          </View>
          <Switch
            value={settings.vacationMode}
onValueChange={(v) => handleVacationMode(v)}
            trackColor={{ false: '#e0e0e0', true: '#87a08e' }}
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
onPress={handleSkipToday}
        >
          <View style={styles.actionContent}>
            <View style={[styles.iconCircle, { backgroundColor: '#ffeaa7' }]}>
              <Ionicons name="pause-circle" size={20} color="#fdcb6e" />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Skip Today</Text>
              <Text style={styles.actionDesc}>Pause today's reminders</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      {/* Notification Settings */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notifications</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Weekend Reminders</Text>
            <Text style={styles.settingDesc}>Keep reminders on weekends</Text>
          </View>
          <Switch
            value={settings.weekendReminders}
            onValueChange={(v) => updateSetting('weekendReminders', v)}
            trackColor={{ false: '#e0e0e0', true: '#87a08e' }}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Quiet Hours</Text>
            <Text style={styles.settingDesc}>No reminders 9 PM - 7 AM</Text>
          </View>
          <Switch
            value={settings.quietHoursEnabled}
            onValueChange={(v) => updateSetting('quietHoursEnabled', v)}
            trackColor={{ false: '#e0e0e0', true: '#87a08e' }}
          />
        </View>
      </View>

      {/* About */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>About</Text>
        
        <TouchableOpacity style={styles.actionButton}>
          <View style={styles.actionContent}>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Privacy Policy</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <View style={styles.actionContent}>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Terms of Service</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <View style={styles.actionContent}>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Contact Support</Text>
              <Text style={styles.actionDesc}>Get help or report issues</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      {/* Data Management */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Data Management</Text>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.dangerButton]}
          onPress={handleClearData}
        >
          <Text style={styles.dangerText}>Clear All Data</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.dangerButton]}
          onPress={handleSignOut}
        >
          <Text style={styles.dangerText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.version}>Version 1.0.0</Text>
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(107, 91, 149, 0.1)',
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C2546',
    marginBottom: 2,
  },
  actionDesc: {
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
  dangerButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerText: {
    color: '#ff6b6b',
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 10,
  },
  version: {
    fontSize: 12,
    color: '#999',
  },
});