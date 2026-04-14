/**
 * Supabase client for React Native.
 *
 * Uses AsyncStorage for session persistence (so users stay logged in
 * across app restarts). react-native-url-polyfill is imported so
 * supabase-js's URL parsing works on React Native, which doesn't have
 * a native URL implementation.
 */
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY env vars',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Mobile apps don't have URL-based auth redirects, so disable the URL hash
    // detection that Supabase does by default for web.
    detectSessionInUrl: false,
  },
});
