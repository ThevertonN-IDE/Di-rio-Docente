// src/core/supabaseClient.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://nfwhkwouvxeyiwtliugs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_yeKYaByduIC5S53OPZjwgQ_koWBbFqE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);