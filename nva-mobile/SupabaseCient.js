import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xjjihwrhmnlrrxbofvfv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqamlod3JobW5scnJ4Ym9mdmZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyODE3NDAsImV4cCI6MjA3MDg1Nzc0MH0.6pcb8QOVHyYwgUFmwilVjLfbnlFd_0LxynD0IvUCSNc';

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
