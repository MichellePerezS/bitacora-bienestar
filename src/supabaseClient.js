import { createClient } from '@supabase/supabase-js'

// ======================================================
// CONFIGURA ESTO ANTES DE DESPLEGAR (lee el README.md)
// ======================================================
const SUPABASE_URL = "https://oavkxcthiryltmhxprcx.supabase.co"
const SUPABASE_ANON_KEY = "sb_publishable_w7y0gLteV87lNBDAUcH0Jg_SoOCwWzp"
// ======================================================

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
