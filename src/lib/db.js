import { createClient } from '@supabase/supabase-js';
const url = 'https://hiwudsluyviliijyhmtg.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhpd3Vkc2x1eXZpbGlpanlobXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMjc2MjEsImV4cCI6MjA3NTcwMzYyMX0.RUKDsqCE73hPlF-bYAwyScV6p9ch0o5kQ1oLO9nGyJc';
export const supabase = (url && key) ? createClient(url, key) : null;

export function getCurrentUserId() {
  const k = 'vcoder_user_id';
  let id = localStorage.getItem(k);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(k, id); }
  return id;
}