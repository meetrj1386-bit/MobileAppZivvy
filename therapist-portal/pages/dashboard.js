// therapist-portal/pages/dashboard.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { checkTherapistAuth } from '../lib/therapistAuth';
import { supabase } from '../../app/supabaseClient';

export default function TherapistDashboard() {
  const router = useRouter();
  const [therapist, setTherapist] = useState(null);
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({
    totalPatients: 0,
    weeklyCompliance: 0,
    todayCompletions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    // Check auth
    const therapistData = await checkTherapistAuth();
    if (!therapistData) {
      router.push('/login');
      return;
    }
    
    setTherapist(therapistData);
    
    // Load patients
    const { data: patientsData } = await supabase
      .from('therapist_assignments')
      .select('*')
      .eq('therapist_id', therapistData.id)
      .eq('active', true);
    
    setPatients(patientsData || []);
    
    // Calculate compliance stats
    if (patientsData && patientsData.length > 0) {
      await calculateStats(therapistData.id, patientsData);
    }
    
    setLoading(false);
  };

  const calculateStats = async (therapistId, patientsList) => {
    // Get all prescribed exercises
    const { data: exercises } = await supabase
      .from('prescribed_exercises')
      .select('*')
      .eq('therapist_id', therapistId)
      .eq('active', true);
    
    // Get completions from last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { data: completions } = await supabase
      .from('exercise_completions')
      .select('*')
      .in('prescribed_exercise_id', exercises?.map(e => e.id) || [])
      .gte('completed_at', weekAgo.toISOString());
    
    // Calculate compliance
    const expectedCompletions = exercises?.reduce((sum, ex) => {
      return sum + (ex.frequency_per_day * 7); // Expected for a week
    }, 0) || 0;
    
    const actualCompletions = completions?.filter(c => c.completed).length || 0;
    
    const compliance = expectedCompletions > 0 
      ? Math.round((actualCompletions / expectedCompletions) * 100)
      : 0;
    
    setStats({
      totalPatients: patientsList.length,
      weeklyCompliance: compliance,
      todayCompletions: completions?.filter(c => {
        const today = new Date().toDateString();
        return new Date(c.completed_at).toDateString() === today;
      }).length || 0
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-purple-600 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Therapist Portal</h1>
              <p className="text-purple-200">Welcome, {therapist?.full_name}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="bg-purple-700 px-4 py-2 rounded hover:bg-purple-800"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">Total Patients</h3>
            <p className="text-3xl font-bold text-gray-800">{stats.totalPatients}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">Weekly Compliance</h3>
            <p className="text-3xl font-bold text-green-600">{stats.weeklyCompliance}%</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">Exercises Completed Today</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.todayCompletions}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/patients')}
                className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700"
              >
                Manage Patients
              </button>
              <button
                onClick={() => router.push('/exercises')}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                Assign Exercises
              </button>
            </div>
          </div>
        </div>

        {/* Patient List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Recent Patients</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Child Name</th>
                    <th className="text-left py-2">Parent Email</th>
                    <th className="text-left py-2">Age</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.slice(0, 5).map(patient => (
                    <tr key={patient.id} className="border-b">
                      <td className="py-3">{patient.child_name}</td>
                      <td className="py-3">{patient.family_email}</td>
                      <td className="py-3">{patient.child_age}</td>
                      <td className="py-3">
                        <button
                          onClick={() => router.push(`/exercises?patient=${patient.family_email}`)}
                          className="text-purple-600 hover:underline"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}