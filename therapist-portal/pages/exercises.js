// therapist-portal/pages/exercises.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { checkTherapistAuth } from '../lib/therapistAuth';
import { supabase } from '../../app/supabaseClient';

export default function ExercisesPage() {
  const router = useRouter();
  const { patient: patientEmail } = router.query;
  
  const [therapist, setTherapist] = useState(null);
  const [patient, setPatient] = useState(null);
  const [prescribedExercises, setPrescribedExercises] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completionData, setCompletionData] = useState({});
  
  const [newExercise, setNewExercise] = useState({
    exerciseName: '',
    exerciseType: 'ot',
    durationMinutes: '15',
    frequencyPerDay: '1',
    daysPerWeek: '7',
    instructions: '',
    videoUrl: ''
  });

  // Common exercise templates
  const exerciseTemplates = [
    { name: 'Oral Motor Exercises', type: 'speech', duration: 10 },
    { name: 'Laser Therapy', type: 'sensory', duration: 30 },
    { name: 'Bubble Mountain', type: 'speech', duration: 5 },
    { name: 'Joint Compressions', type: 'ot', duration: 10 },
    { name: 'Balance Board', type: 'pt', duration: 15 },
    { name: 'Brushing Protocol', type: 'sensory', duration: 5 },
    { name: 'Fine Motor Activities', type: 'ot', duration: 20 },
    { name: 'Gross Motor Play', type: 'pt', duration: 30 }
  ];

  useEffect(() => {
    if (patientEmail) {
      loadData();
    }
  }, [patientEmail]);

  const loadData = async () => {
    const therapistData = await checkTherapistAuth();
    if (!therapistData) {
      router.push('/therapist-portal/pages/login');
      return;
    }
    
    setTherapist(therapistData);
    
    // Load patient info
    const { data: patientData } = await supabase
      .from('therapist_assignments')
      .select('*')
      .eq('therapist_id', therapistData.id)
      .eq('family_email', patientEmail)
      .single();
    
    if (patientData) {
      setPatient(patientData);
      await loadExercises(therapistData.id);
      await loadCompletionStats();
    }
  };

  const loadExercises = async (therapistId) => {
    const { data } = await supabase
      .from('prescribed_exercises')
      .select('*')
      .eq('therapist_id', therapistId)
      .eq('family_email', patientEmail)
      .eq('active', true)
      .order('created_at', { ascending: false });
    
    setPrescribedExercises(data || []);
  };

  const loadCompletionStats = async () => {
    // Get last 7 days of completions
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { data } = await supabase
      .from('exercise_completions')
      .select('*')
      .eq('family_email', patientEmail)
      .gte('completed_at', weekAgo.toISOString());
    
    // Group by exercise
    const stats = {};
    data?.forEach(completion => {
      if (!stats[completion.prescribed_exercise_id]) {
        stats[completion.prescribed_exercise_id] = 0;
      }
      if (completion.completed) {
        stats[completion.prescribed_exercise_id]++;
      }
    });
    
    setCompletionData(stats);
  };

  const handleAddExercise = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('prescribed_exercises')
      .insert({
        therapist_id: therapist.id,
        family_email: patientEmail,
        exercise_name: newExercise.exerciseName,
        exercise_type: newExercise.exerciseType,
        duration_minutes: parseInt(newExercise.durationMinutes),
        frequency_per_day: parseInt(newExercise.frequencyPerDay),
        days_per_week: parseInt(newExercise.daysPerWeek),
        instructions: newExercise.instructions,
        video_url: newExercise.videoUrl
      });

    if (error) {
      alert('Error adding exercise: ' + error.message);
    } else {
      await loadExercises(therapist.id);
      setShowAddModal(false);
      setNewExercise({
        exerciseName: '',
        exerciseType: 'ot',
        durationMinutes: '15',
        frequencyPerDay: '1',
        daysPerWeek: '7',
        instructions: '',
        videoUrl: ''
      });
    }
    
    setLoading(false);
  };

  const handleDeleteExercise = async (exerciseId) => {
    if (confirm('Remove this exercise from the prescription?')) {
      await supabase
        .from('prescribed_exercises')
        .update({ active: false })
        .eq('id', exerciseId);
      
      await loadExercises(therapist.id);
    }
  };

  const handleUseTemplate = (template) => {
    setNewExercise({
      ...newExercise,
      exerciseName: template.name,
      exerciseType: template.type,
      durationMinutes: template.duration.toString()
    });
  };

  const calculateCompliance = (exerciseId, frequency) => {
    const completed = completionData[exerciseId] || 0;
    const expected = frequency * 7; // weekly
    return expected > 0 ? Math.round((completed / expected) * 100) : 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-purple-600 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Exercise Prescription</h1>
              {patient && (
                <p className="text-purple-200">
                  Patient: {patient.child_name} ({patient.child_age} years)
                </p>
              )}
            </div>
            <button
              onClick={() => router.push('/therapist-portal/pages/patients')}
              className="bg-purple-700 px-4 py-2 rounded hover:bg-purple-800"
            >
              Back to Patients
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Add Exercise Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
          >
            + Prescribe New Exercise
          </button>
        </div>

        {/* Prescribed Exercises */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Prescribed Exercises</h2>
            
            {prescribedExercises.length === 0 ? (
              <p className="text-gray-500">No exercises prescribed yet.</p>
            ) : (
              <div className="space-y-4">
                {prescribedExercises.map(exercise => {
                  const compliance = calculateCompliance(exercise.id, exercise.frequency_per_day);
                  return (
                    <div key={exercise.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{exercise.exercise_name}</h3>
                          <div className="text-sm text-gray-600 mt-1">
                            <span className="inline-block bg-purple-100 px-2 py-1 rounded mr-2">
                              {exercise.exercise_type}
                            </span>
                            <span>{exercise.duration_minutes} minutes</span>
                            <span className="mx-2">•</span>
                            <span>{exercise.frequency_per_day}x daily</span>
                            <span className="mx-2">•</span>
                            <span>{exercise.days_per_week} days/week</span>
                          </div>
                          {exercise.instructions && (
                            <p className="text-sm mt-2 text-gray-700">{exercise.instructions}</p>
                          )}
                          <div className="mt-2">
                            <span className="text-sm font-medium">Weekly Compliance: </span>
                            <span className={`text-sm font-bold ${
                              compliance >= 80 ? 'text-green-600' : 
                              compliance >= 50 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {compliance}%
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteExercise(exercise.id)}
                          className="text-red-600 hover:text-red-800 ml-4"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Exercise Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-8">
            <h2 className="text-xl font-bold mb-4">Prescribe Exercise</h2>
            
            {/* Quick Templates */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Quick Templates:</p>
              <div className="flex flex-wrap gap-2">
                {exerciseTemplates.map(template => (
                  <button
                    key={template.name}
                    onClick={() => handleUseTemplate(template)}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>
            
            <form onSubmit={handleAddExercise}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exercise Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-md"
                    value={newExercise.exerciseName}
                    onChange={(e) => setNewExercise({...newExercise, exerciseName: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={newExercise.exerciseType}
                    onChange={(e) => setNewExercise({...newExercise, exerciseType: e.target.value})}
                  >
                    <option value="speech">Speech</option>
                    <option value="ot">OT</option>
                    <option value="pt">PT</option>
                    <option value="sensory">Sensory</option>
                    <option value="behavioral">Behavioral</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="120"
                    className="w-full px-3 py-2 border rounded-md"
                    value={newExercise.durationMinutes}
                    onChange={(e) => setNewExercise({...newExercise, durationMinutes: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Times per Day *
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={newExercise.frequencyPerDay}
                    onChange={(e) => setNewExercise({...newExercise, frequencyPerDay: e.target.value})}
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Days per Week *
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={newExercise.daysPerWeek}
                    onChange={(e) => setNewExercise({...newExercise, daysPerWeek: e.target.value})}
                  >
                    <option value="7">Every day</option>
                    <option value="5">Weekdays only</option>
                    <option value="3">3 days</option>
                  </select>
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instructions (optional)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md"
                    rows="3"
                    value={newExercise.instructions}
                    onChange={(e) => setNewExercise({...newExercise, instructions: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Prescribe Exercise'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}