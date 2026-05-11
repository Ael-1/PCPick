// Centralized Supabase Configuration
// Update these values with your new Supabase project details
const SUPABASE_CONFIG = {
  URL: 'https://hblxxblihhxtzrpliolf.supabase.co', // Replace with your new URL
  ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhibHh4YmxpaGh4dHpycGxpb2xmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0OTMyMDAsImV4cCI6MjA5NDA2OTIwMH0.YVj3zgPdf2mGNEfhtABYdGt7T7xxT8cOpI-89vu-48A', // Replace with your new Anon Key
  PROJECT_REF: 'hblxxblihhxtzrpliolf' // The random string in your URL
};

// Make config available globally
if (typeof window !== 'undefined') {
  window.SUPABASE_CONFIG = SUPABASE_CONFIG;
}
