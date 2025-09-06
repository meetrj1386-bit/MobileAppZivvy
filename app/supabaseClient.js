// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'


const supabaseUrl = 'https://dbwdaphrepcjbmxhjgou.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRid2RhcGhyZXBjamJteGhqZ291Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDc5MDQsImV4cCI6MjA3MDA4MzkwNH0.BAFtq7Z66Z23RF7dXGNNG4woIGSVGkPJKEDURQG7HBc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storageKey: 'supabase.auth.token', // This is fine as-is
  },
})