import { createClient } from '@supabase/supabase-js';

// Preview and local builds use a disconnected endpoint, so they cannot write to production data.
const isolatedVerification = process.env.VERCEL_ENV === 'preview' ||
  (typeof window !== 'undefined' && !['www.resort-style.net', 'resort-style.net'].includes(window.location.hostname));
const supabaseUrl = isolatedVerification ? 'http://127.0.0.1:54321' :
  (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rzosrbkyniyedolhkgxo.supabase.co');
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_8KtRNTxvhkgKcNTNM7ofZA_jW2hJJkC';

export const supabase = createClient(supabaseUrl, supabasePublishableKey);

export function therapistImageUrl(path) {
  if (!path) return '/therapist1.jpg';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return supabase.storage.from('resort-therapists').getPublicUrl(path).data.publicUrl;
}
