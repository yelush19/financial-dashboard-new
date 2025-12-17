import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteObfuscateFile } from 'vite-plugin-obfuscator'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Code obfuscation לפרודקשן בלבד
    viteObfuscateFile({
      include: ['src/**/*.js', 'src/**/*.ts', 'src/**/*.tsx'],
      exclude: [/node_modules/],
      apply: 'build', // רק בבנייה לפרודקשן
      debugger: false,
      options: {
        // הגדרות obfuscation מאוזנות - קריאות מול אבטחה
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.5,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.3,
        debugProtection: false, // false כדי לא לשבש debug בפרודקשן
        disableConsoleOutput: false,
        identifierNamesGenerator: 'hexadecimal',
        log: false,
        numbersToExpressions: true,
        renameGlobals: false,
        selfDefending: true,
        simplify: true,
        splitStrings: true,
        splitStringsChunkLength: 5,
        stringArray: true,
        stringArrayCallsTransform: true,
        stringArrayEncoding: ['base64'],
        stringArrayIndexShift: true,
        stringArrayRotate: true,
        stringArrayShuffle: true,
        stringArrayWrappersCount: 2,
        stringArrayWrappersChainedCalls: true,
        stringArrayWrappersParametersMaxCount: 4,
        stringArrayWrappersType: 'function',
        stringArrayThreshold: 0.75,
        transformObjectKeys: true,
        unicodeEscapeSequence: false
      }
    })
  ],
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
