import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ohqhwmmgilbcldaakklg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_8QeXeE1SLES8U5_tIfyvmw_geK_zrw1";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
