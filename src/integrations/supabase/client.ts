import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://lkpuzbuxnolvatpdisgj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_msqiDKIPTT1zdSXlXGh8Dg_VPK0HAaI";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});