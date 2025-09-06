import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { exerciseLibrary } from './data/exerciseLibrary';

export default function Disclaimer({ onAccept }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    checkDisclaimer();
  }, []);

  const checkDisclaimer = async () => {
    const seen = await AsyncStorage.getItem('disclaimerAccepted');
    if (!seen) {
      setVisible(true);
    }
  };

  const handleAccept = async () => {
    await AsyncStorage.setItem('disclaimerAccepted', 'true');
    setVisible(false);
    if (onAccept) onAccept();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Important Information</Text>
          <Text style={styles.text}>
            This app provides exercise suggestions based on therapeutic principles 
            and parent experiences. These suggestions are:
            {'\n\n'}
            • NOT medical advice or treatment
            • NOT FDA evaluated or approved
            • NOT a replacement for professional therapy
            • For scheduling and educational purposes only
            {'\n\n'}
            Always consult your child's healthcare providers before starting 
            new exercises or making changes to their therapy routine.
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleAccept}>
            <Text style={styles.buttonText}>I Understand & Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    margin: 20,
    padding: 25,
    borderRadius: 15,
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
    color: '#555',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#667eea',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});