import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lvongnmigwieqevqisif.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2b25nbm1pZ3dpZXFldnFpc2lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2ODk3MDEsImV4cCI6MjA3NTI2NTcwMX0.VWBhEzBoST3woqbRv4wRSxKPj3IUQswi1CU_EXDfWqM';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

