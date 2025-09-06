// therapist-portal/pages/patients.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { checkTherapistAuth } from '../lib/therapistAuth';
import { supabase } from '../../app/supabaseClient';

export default function PatientsPage() {
  const router = useRouter();
  const [therapist, setTherapist] = useState(null);
  const [patients, setPatients] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newPatient, setNewPatient] = useState({
    childName: '',
    familyEmail: '',
    parentName: '',
    childAge: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const therapistData = await checkTherapistAuth();
    if (!therapistData) {
      router.push('/login');
      return;
    }
    
    setTherapist(therapistData);
    await loadPatients(therapistData.id);
  };

  const loadPatients = async (therapistId) => {
    const { data, error } = await supabase
      .from('therapist_assignments')
      .select('*')
      .eq('therapist_id', therapistId)
      .eq('active', true)
      .order('created_at', { ascending: false });
    
    if (data) setPatients(data);
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('therapist_assignments')
      .insert({
        therapist_id: therapist.id,
        family_email: newPatient.familyEmail.toLowerCase(),
        child_name: newPatient.childName,
        child_age: parseInt(newPatient.childAge),
        parent_name: newPatient.parentName
      });

    if (error) {
      alert('Error adding patient: ' + error.message);
    } else {
      await loadPatients(therapist.id);
      setShowAddModal(false);
      setNewPatient({ childName: '', familyEmail: '', parentName: '', childAge: '' });
      alert('Patient added successfully!');
    }
    
    setLoading(false);
  };

  const handleDeactivatePatient = async (patientId) => {
    if (confirm('Are you sure you want to remove this patient?')) {
      const { error } = await supabase
        .from('therapist_assignments')
        .update({ active: false })
        .eq('id', patientId);
      
      if (!error) {
        await loadPatients(therapist.id);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-purple-600 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Manage Patients</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-purple-700 px-4 py-2 rounded hover:bg-purple-800"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Add Patient Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
          >
            + Add New Patient
          </button>
        </div>

        {/* Patients Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Child Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {patients.map(patient => (
                <tr key={patient.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {patient.child_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {patient.parent_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {patient.family_email}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {patient.child_age} years
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => router.push(`/exercises?patient=${patient.family_email}`)}
                      className="text-purple-600 hover:text-purple-900 mr-4"
                    >
                      Assign Exercises
                    </button>
                    <button
                      onClick={() => handleDeactivatePatient(patient.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>

                    // In the Actions column, add:
<button
  onClick={() => router.push(`/insights?patient=${patient.family_email}`)}
  className="text-blue-600 hover:text-blue-900 mr-4"
>
  View Insights
</button>

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {patients.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No patients added yet. Click "Add New Patient" to get started.
            </div>
          )}
        </div>
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add New Patient</h2>
            
            <form onSubmit={handleAddPatient}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Child's Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-md"
                  value={newPatient.childName}
                  onChange={(e) => setNewPatient({...newPatient, childName: e.target.value})}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Child's Age *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="18"
                  className="w-full px-3 py-2 border rounded-md"
                  value={newPatient.childAge}
                  onChange={(e) => setNewPatient({...newPatient, childAge: e.target.value})}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent's Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-md"
                  value={newPatient.parentName}
                  onChange={(e) => setNewPatient({...newPatient, parentName: e.target.value})}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent's Email (for app access) *
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 border rounded-md"
                  value={newPatient.familyEmail}
                  onChange={(e) => setNewPatient({...newPatient, familyEmail: e.target.value})}
                />
              </div>
              
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewPatient({ childName: '', familyEmail: '', parentName: '', childAge: '' });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}