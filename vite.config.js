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
  'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://fcrmghhjdnnnvpzsqjeb.supabase.co'),
  'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcm1naGhqZG5ubnZwenNxamViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg3NDQzNDgsImV4cCI6MjA0NDMyMDM0OH0.VT0gzqk8R7sJvSPH5eJIEK0RMPOAqNCIJW8ozhGPLxU')
}
})