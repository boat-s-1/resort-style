import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rzosrbkyniyedolhkgxo.supabase.co';
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_8KtRNTxvhkgKcNTNM7ofZA_jW2hJJkC';

export const supabase = createClient(supabaseUrl, supabasePublishableKey);

export function therapistImageUrl(path) {
  if (!path) return '/therapist1.jpg';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return supabase.storage.from('resort-therapists').getPublicUrl(path).data.publicUrl;
}
