// Example Supabase Configuration
// Copy this file to supabase-config.js and update with your own details
const SUPABASE_CONFIG = {
  URL: 'YOUR_SUPABASE_URL',
  ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',
  PROJECT_REF: 'YOUR_PROJECT_REF'
};

if (typeof window !== 'undefined') {
  window.SUPABASE_CONFIG = SUPABASE_CONFIG;
}
