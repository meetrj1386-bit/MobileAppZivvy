// therapist-portal/pages/insights.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { checkTherapistAuth } from '../lib/therapistAuth';
import { supabase } from '../../app/supabaseClient';

export default function InsightsPage() {
  const router = useRouter();
  const { patient: patientEmail } = router.query;
  
  const [therapist, setTherapist] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (patientEmail) {
      loadInsights();
    }
  }, [patientEmail]);
  
  const loadInsights = async () => {
    const therapistData = await checkTherapistAuth();
    if (!therapistData) {
      router.push('/login');
      return;
    }
    
    setTherapist(therapistData);
    
    // Get prescribed exercises
    const { data: exercises } = await supabase
      .from('prescribed_exercises')
      .select('*')
      .eq('therapist_id', therapistData.id)
      .eq('family_email', patientEmail)
      .eq('active', true);
    
    // Get completions for last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { data: completions } = await supabase
      .from('exercise_completions')
      .select('*')
      .eq('family_email', patientEmail)
      .gte('completed_at', weekAgo.toISOString());
    
    // Calculate compliance per exercise
    const insights = exercises?.map(exercise => {
      const expectedCount = exercise.frequency_per_day * 7;
      const actualCount = completions?.filter(c => 
        c.prescribed_exercise_id === exercise.id && c.completed
      ).length || 0;
      
      return {
        name: exercise.exercise_name,
        type: exercise.exercise_type,
        compliance: Math.round((actualCount / expectedCount) * 100),
        expected: expectedCount,
        actual: actualCount,
        skippedDays: 7 - Math.floor(actualCount / exercise.frequency_per_day)
      };
    }) || [];
    
    setWeeklyData(insights);
    setLoading(false);
  };
  
  const getComplianceColor = (percentage) => {
    if (percentage >= 80) return '#10B981'; // green
    if (percentage >= 50) return '#F59E0B'; // yellow
    return '#EF4444'; // red
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-purple-600 text-white">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Weekly Compliance Report</h1>
          <p className="text-purple-200">Patient: {patientEmail}</p>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-8">
        <button 
          onClick={() => router.back()}
          className="mb-6 text-purple-600 hover:underline"
        >
          ← Back to Patients
        </button>
        
        {loading ? (
          <div>Loading insights...</div>
        ) : (
          <>
            {/* Overall Summary */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Overall Compliance</h2>
              <div className="text-3xl font-bold" style={{
                color: getComplianceColor(
                  weeklyData.reduce((sum, ex) => sum + ex.compliance, 0) / weeklyData.length
                )
              }}>
                {Math.round(weeklyData.reduce((sum, ex) => sum + ex.compliance, 0) / weeklyData.length)}%
              </div>
            </div>
            
            {/* Exercise Breakdown */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Exercise Breakdown</h2>
              <div className="space-y-4">
                {weeklyData.map((exercise, idx) => (
                  <div key={idx} className="border-b pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{exercise.name}</h3>
                        <p className="text-sm text-gray-600">
                          {exercise.type} • {exercise.actual}/{exercise.expected} completed
                        </p>
                        {exercise.skippedDays > 0 && (
                          <p className="text-sm text-red-600 mt-1">
                            Skipped {exercise.skippedDays} day{exercise.skippedDays > 1 ? 's' : ''} this week
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold" style={{ 
                          color: getComplianceColor(exercise.compliance) 
                        }}>
                          {exercise.compliance}%
                        </div>
                      </div>
                    </div>
                    
                    {/* Visual Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="h-2 rounded-full"
                        style={{
                          width: `${exercise.compliance}%`,
                          backgroundColor: getComplianceColor(exercise.compliance)
                        }}
                      />
                    </div>
                    
                    {exercise.compliance < 50 && (
                      <p className="text-sm text-orange-600 mt-2">
                        💡 Consider reducing frequency or duration
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}