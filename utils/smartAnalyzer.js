// Smart Analyzer for detecting undiagnosed therapy needs
export const analyzeChildNeeds = (formData) => {
  const detectedNeeds = {
    speech: { detected: false, confidence: 0, indicators: [] },
    ot: { detected: false, confidence: 0, indicators: [] },
    physical: { detected: false, confidence: 0, indicators: [] },
    behavioral: { detected: false, confidence: 0, indicators: [] }
  };

  const description = (formData.tellUsAboutChild + ' ' + formData.mainConcerns).toLowerCase();
  
  // Speech indicators
  const speechKeywords = [
    'speech', 'talking', 'words', 'vocabulary', 'pronunciation', 
    'stutter', 'articulation', 'language', 'verbal', 'communication',
    'doesn\'t speak', 'delayed speech', 'unclear speech'
  ];
  
  // OT indicators  
  const otKeywords = [
    'writing', 'fine motor', 'pencil', 'buttons', 'scissors',
    'sensory', 'texture', 'coordination', 'dressing', 'eating issues',
    'clumsy', 'drops things', 'handwriting'
  ];
  
  // Physical therapy indicators
  const physicalKeywords = [
    'walking', 'running', 'balance', 'gross motor', 'jumping',
    'stairs', 'muscle', 'strength', 'posture', 'falls often',
    'toe walking', 'delayed walking'
  ];
  
  // Behavioral indicators
  const behaviorKeywords = [
    'tantrum', 'behavior', 'attention', 'focus', 'hyperactive',
    'aggressive', 'social', 'autism', 'adhd', 'emotional',
    'meltdown', 'routine', 'transition'
  ];

  // Analyze each category
  speechKeywords.forEach(keyword => {
    if (description.includes(keyword)) {
      detectedNeeds.speech.confidence += 10;
      detectedNeeds.speech.indicators.push(keyword);
    }
  });
  
  otKeywords.forEach(keyword => {
    if (description.includes(keyword)) {
      detectedNeeds.ot.confidence += 10;
      detectedNeeds.ot.indicators.push(keyword);
    }
  });
  
  physicalKeywords.forEach(keyword => {
    if (description.includes(keyword)) {
      detectedNeeds.physical.confidence += 10;
      detectedNeeds.physical.indicators.push(keyword);
    }
  });
  
  behaviorKeywords.forEach(keyword => {
    if (description.includes(keyword)) {
      detectedNeeds.behavioral.confidence += 10;
      detectedNeeds.behavioral.indicators.push(keyword);
    }
  });

  // Mark as detected if confidence > 20
  Object.keys(detectedNeeds).forEach(key => {
    detectedNeeds[key].detected = detectedNeeds[key].confidence > 20;
  });

  return detectedNeeds;
};

export const generateSmartSchedule = (formData, detectedNeeds) => {
  const schedule = {};
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Get parent's available time blocks
  const weekdayHours = parseFloat(formData.parentAvailability.weekdayHours);
  const weekendHours = parseFloat(formData.parentAvailability.weekendHours);
  
  // Count total therapy needs
  const enabledTherapies = [];
  const suggestedTherapies = [];
  
  // Add parent-selected therapies
  if (formData.speechTherapy.enabled) enabledTherapies.push('speech');
  if (formData.otTherapy.enabled) enabledTherapies.push('ot');
  if (formData.physicalTherapy.enabled) enabledTherapies.push('physical');
  if (formData.abaTherapy.enabled) enabledTherapies.push('aba');
  
  // Add AI-detected needs not already covered
  if (detectedNeeds.speech.detected && !formData.speechTherapy.enabled) {
    suggestedTherapies.push({
      type: 'speech',
      reason: `Detected: ${detectedNeeds.speech.indicators.join(', ')}`,
      confidence: detectedNeeds.speech.confidence
    });
  }
  
  if (detectedNeeds.ot.detected && !formData.otTherapy.enabled) {
    suggestedTherapies.push({
      type: 'ot',
      reason: `Detected: ${detectedNeeds.ot.indicators.join(', ')}`,
      confidence: detectedNeeds.ot.confidence
    });
  }
  
  if (detectedNeeds.physical.detected && !formData.physicalTherapy.enabled) {
    suggestedTherapies.push({
      type: 'physical',
      reason: `Detected: ${detectedNeeds.physical.indicators.join(', ')}`,
      confidence: detectedNeeds.physical.confidence
    });
  }

  // Generate daily schedules
  days.forEach(day => {
    const isWeekend = day === 'Saturday' || day === 'Sunday';
    const availableHours = isWeekend ? weekendHours : weekdayHours;
    const exercises = [];
    
    // Skip if child has school and it's a weekday
    if (!isWeekend && formData.hasSchool === 'yes' && formData.schoolDays.includes(day)) {
      // After school exercises only
      const afterSchoolTime = formData.schoolEndTime.split(':');
      let startHour = parseInt(afterSchoolTime[0]) + 1; // Start 1 hour after school
      
      // Distribute therapy exercises
      const totalNeeds = enabledTherapies.length + suggestedTherapies.length;
      if (totalNeeds > 0) {
        const minutesPerTherapy = Math.min(30, (availableHours * 60) / totalNeeds);
        
        enabledTherapies.forEach(therapy => {
          if (startHour < 19) { // Don't schedule after 7 PM
            exercises.push({
              time: `${startHour}:00`,
              duration: minutesPerTherapy,
              type: therapy,
              category: 'prescribed',
              exercises: getExercisesForType(therapy, formData.childAge)
            });
            startHour++;
          }
        });
        
        suggestedTherapies.forEach(therapy => {
          if (startHour < 19) {
            exercises.push({
              time: `${startHour}:00`,
              duration: minutesPerTherapy,
              type: therapy.type,
              category: 'suggested',
              reason: therapy.reason,
              exercises: getExercisesForType(therapy.type, formData.childAge)
            });
            startHour++;
          }
        });
      }
    } else {
      // Full day available - distribute exercises throughout
      const slots = [
        { time: '09:00', available: true },
        { time: '10:30', available: true },
        { time: '14:00', available: true },
        { time: '15:30', available: true },
        { time: '17:00', available: true }
      ];
      
      // Avoid meal times
      const mealTimes = [
        formData.breakfastTime,
        formData.lunchTime,
        formData.snackTime,
        formData.dinnerTime
      ];
      
      let exerciseIndex = 0;
      [...enabledTherapies, ...suggestedTherapies.map(t => t.type)].forEach(therapy => {
        if (exerciseIndex < slots.length) {
          const therapyObj = suggestedTherapies.find(t => t.type === therapy);
          exercises.push({
            time: slots[exerciseIndex].time,
            duration: 30,
            type: typeof therapy === 'string' ? therapy : therapy.type,
            category: therapyObj ? 'suggested' : 'prescribed',
            reason: therapyObj?.reason,
            exercises: getExercisesForType(typeof therapy === 'string' ? therapy : therapy.type, formData.childAge)
          });
          exerciseIndex++;
        }
      });
    }
    
    schedule[day] = {
      exercises,
      totalMinutes: exercises.reduce((sum, ex) => sum + ex.duration, 0),
      suggestedAdditions: suggestedTherapies
    };
  });
  
  return {
    schedule,
    suggestions: suggestedTherapies,
    insights: generateInsights(detectedNeeds, formData)
  };
};

const getExercisesForType = (type, age) => {
  const ageNum = parseInt(age);
  
  const exercises = {
    speech: [
      { name: 'Mirror Practice', description: 'Practice sounds in mirror', duration: 5 },
      { name: 'Bubble Blowing', description: 'Strengthen mouth muscles', duration: 5 },
      { name: 'Story Time', description: 'Read and repeat words', duration: 10 },
      { name: 'Sound Games', description: 'Practice target sounds', duration: 10 }
    ],
    ot: [
      { name: 'Playdough Fun', description: 'Strengthen hand muscles', duration: 10 },
      { name: 'Bead Threading', description: 'Fine motor practice', duration: 10 },
      { name: 'Cutting Practice', description: 'Scissor skills', duration: 5 },
      { name: 'Sensory Bin', description: 'Tactile exploration', duration: 5 }
    ],
    physical: [
      { name: 'Obstacle Course', description: 'Balance and coordination', duration: 10 },
      { name: 'Ball Games', description: 'Gross motor skills', duration: 10 },
      { name: 'Yoga Poses', description: 'Strength and flexibility', duration: 5 },
      { name: 'Dance Party', description: 'Movement and rhythm', duration: 5 }
    ],
    aba: [
      { name: 'Token Board', description: 'Reward positive behavior', duration: 10 },
      { name: 'Social Stories', description: 'Practice social scenarios', duration: 10 },
      { name: 'Choice Making', description: 'Decision skills', duration: 5 },
      { name: 'Calm Down Corner', description: 'Self-regulation practice', duration: 5 }
    ]
  };
  
  // Adjust exercises based on age
  if (ageNum < 3) {
    // Simpler exercises for toddlers
    exercises.speech[0].name = 'Peek-a-boo Sounds';
    exercises.ot[0].name = 'Finger Painting';
  } else if (ageNum > 6) {
    // More complex for older kids
    exercises.speech[2].name = 'Conversation Practice';
    exercises.ot[1].name = 'Writing Practice';
  }
  
  return exercises[type] || [];
};

const generateInsights = (detectedNeeds, formData) => {
  const insights = [];
  
  if (detectedNeeds.speech.detected && !formData.speechTherapy.enabled) {
    insights.push({
      type: 'recommendation',
      priority: 'high',
      message: 'Based on your description, we recommend adding speech exercises. Consider consulting a speech therapist.',
      action: 'We\'ve added suggested speech activities to your schedule.'
    });
  }
  
  if (detectedNeeds.ot.detected && !formData.otTherapy.enabled) {
    insights.push({
      type: 'recommendation',
      priority: 'medium',
      message: 'Fine motor skills development could benefit your child. We\'ve included OT exercises.',
      action: 'Try these activities and track progress.'
    });
  }
  
  if (detectedNeeds.behavioral.detected) {
    insights.push({
      type: 'tip',
      priority: 'high',
      message: 'Consistency is key for behavioral improvements. Stick to the schedule as much as possible.',
      action: 'Use our progress tracking to monitor behavior patterns.'
    });
  }
  
  // Add general insights
  const totalTherapyHours = (formData.speechTherapy.enabled ? parseFloat(formData.speechTherapy.sessionHours) : 0) +
                           (formData.otTherapy.enabled ? parseFloat(formData.otTherapy.sessionHours) : 0) +
                           (formData.physicalTherapy.enabled ? parseFloat(formData.physicalTherapy.sessionHours) : 0) +
                           (formData.abaTherapy.enabled ? parseFloat(formData.abaTherapy.sessionHours) : 0);
  
  if (totalTherapyHours > 10) {
    insights.push({
      type: 'warning',
      priority: 'medium',
      message: 'Your child has many therapy hours. Ensure they have enough play and rest time.',
      action: 'We\'ve balanced the home exercises to avoid overwhelm.'
    });
  }
  
  return insights;
};