// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dbwdaphrepcjbmxhjgou.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRid2RhcGhyZXBjamJteGhqZ291Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDc5MDQsImV4cCI6MjA3MDA4MzkwNH0.BAFtq7Z66Z23RF7dXGNNG4woIGSVGkPJKEDURQG7HBc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
