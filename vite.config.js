import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      overlay: false
    }
  },
 define: {
  global: 'window',
  'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://fcrmghhjdnnnvpzsqieb.supabase.co'),
  'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcm1naGhqZG5ubnZwenNxaWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MDEzODQsImV4cCI6MjA3NjA3NzM4NH0.wer5qFOj4ZLXuxRieEzJyzb85py4lNDMuqgCtM3-5Nw')
}
})