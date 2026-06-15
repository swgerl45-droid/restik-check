export default defineNuxtConfig({
  modules: ['@vite-pwa/nuxt'],

  runtimeConfig: {
    public: {
      supabaseUrl: 'https://nbhurdasbscmkjssxsbu.supabase.co',
      supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iaHVyZGFzYnNjbWtqc3N4c2J1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NTYyMDIsImV4cCI6MjA5NzAzMjIwMn0.RiBfNJZB8nkDxp71lko4iQH07zE7shQul2TIcOA5_3g'
    }
  },

  pwa: {
    manifest: {
      name: 'Restik Check',
      short_name: 'Restik',
      theme_color: '#1a1a1a',
      background_color: '#1a1a1a',
      display: 'standalone'
    }
  }
})