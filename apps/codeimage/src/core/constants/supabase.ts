import {createClient} from '@supabase/supabase-js';

const env = import.meta.env;

export const supabase = createClient(
  env.VITE_PUBLIC_SUPABASE_URL as string,
  env.VITE_PUBLIC_SUPABASE_ANON_KEY as string,
  {multiTab: false},
);
