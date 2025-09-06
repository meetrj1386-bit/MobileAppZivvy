// therapist-portal/lib/therapistAuth.js
import { supabase } from '../../app/supabaseClient';

export const checkTherapistAuth = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  // Check if user is a registered therapist
  const { data: therapist } = await supabase
    .from('therapists')
    .select('*')
    .eq('email', user.email)
    .single();
    
  return therapist;
};

export const registerTherapist = async (userData) => {
  const { data, error } = await supabase
    .from('therapists')
    .insert([userData])
    .select()
    .single();
    
  return { data, error };
};

export const signInTherapist = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) return { error };
  
  // Verify they're a therapist
  const therapist = await checkTherapistAuth();
  if (!therapist) {
    await supabase.auth.signOut();
    return { error: { message: 'Not registered as a therapist' } };
  }
  
  return { data: therapist };
};