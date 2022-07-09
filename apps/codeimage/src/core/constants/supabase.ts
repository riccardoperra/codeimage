import {createClient} from '@supabase/supabase-js';

export const supabase = createClient(
  'https://lxuslbblmueaqwdfsmhm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4dXNsYmJsbXVlYXF3ZGZzbWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTczODE2MTQsImV4cCI6MTk3Mjk1NzYxNH0.X5KWwr3aP4JkKTvAeqtnBtG8rxAxYGL8gKH7MMauU3I',
  {
    multiTab: true,
  },
);
