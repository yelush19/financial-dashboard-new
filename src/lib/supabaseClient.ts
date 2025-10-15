import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fcrmghhjdnnnvpzsqjeb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcm1naGhqZG5ubnZwenNxamViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg3NDQzNDgsImV4cCI6MjA0NDMyMDM0OH0.VT0gzqk8R7sJvSPH5eJIEK0RMPOAqNCIJW8ozhGPLxU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)