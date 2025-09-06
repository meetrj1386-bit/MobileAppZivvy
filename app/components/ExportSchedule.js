// app/components/ExportSchedule.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';

export const ExportSchedule = ({ schedule, childName }) => {
  
  const generateHTML = () => {
    const days = Object.keys(schedule);
    
    let html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #6B46C1; }
            .day { margin-bottom: 30px; page-break-inside: avoid; }
            .day-title { color: #6B46C1; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
            .exercise { background: #F3F4F6; padding: 10px; margin: 5px 0; border-radius: 8px; }
            .time { font-weight: bold; color: #374151; }
            .details { margin-top: 5px; font-size: 14px; color: #6B7280; }
          </style>
        </head>
        <body>
          <h1>Therapy Schedule - ${childName}</h1>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
    `;
    
    days.forEach(day => {
      html += `<div class="day"><div class="day-title">${day}</div>`;
      
      if (schedule[day]?.length > 0) {
        schedule[day].forEach(exercise => {
          html += `
            <div class="exercise">
              <span class="time">${exercise.time}</span> - ${exercise.exercise}
              <div class="details">
                Type: ${exercise.therapy_type}<br>
                Duration: ${exercise.duration}
              </div>
            </div>
          `;
        });
      } else {
        html += '<p>No exercises scheduled</p>';
      }
      
      html += '</div>';
    });
    
    html += '</body></html>';
    return html;
  };
  
  const exportAsPDF = async () => {
    try {
      const html = generateHTML();
      const { uri } = await Print.printToFileAsync({ html });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Success', 'PDF created but sharing is not available on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create PDF');
    }
  };
  
  const shareAsText = async () => {
    let text = `Therapy Schedule for ${childName}\n\n`;
    
    Object.keys(schedule).forEach(day => {
      text += `${day}:\n`;
      if (schedule[day]?.length > 0) {
        schedule[day].forEach(exercise => {
          text += `  ${exercise.time} - ${exercise.exercise} (${exercise.duration})\n`;
        });
      } else {
        text += `  No exercises\n`;
      }
      text += '\n';
    });
    
    try {
      await Share.share({
        message: text,
        title: `${childName}'s Therapy Schedule`
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share schedule');
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Share Schedule</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.exportButton} onPress={exportAsPDF}>
          <Ionicons name="document-text" size={20} color="white" />
          <Text style={styles.buttonText}>Export PDF</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.shareButton} onPress={shareAsText}>
          <Ionicons name="share-social" size={20} color="#6B46C1" />
          <Text style={styles.shareText}>Share Text</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exportButton: {
    flexDirection: 'row',
    backgroundColor: '#6b5b95',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#6b5b95',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '600',
  },
  shareText: {
    color: '#6b5b95',
    marginLeft: 8,
    fontWeight: '600',
  },
});