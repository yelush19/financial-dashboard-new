import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fcrmghhjdnnnvpzsqieb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcm1naGhqZG5ubnZwenNxaWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MDEzODQsImV4cCI6MjA3NjA3NzM4NH0.wer5qFOj4ZLXuxRieEzJyzb85py4lNDMuqgCtM3-5Nw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)