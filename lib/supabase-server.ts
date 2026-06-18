// lib/supabase-server.ts
import { createClient } from '@supabase/supabase-js';
import { unstable_noStore as noStore } from 'next/cache';

export function createServiceClient() {
  noStore();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Brak zmiennych Supabase');
  return createClient(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (url, options) =>
        fetch(url, { ...options, cache: 'no-store' }),
    },
  });
}

export function createPublicClient() {
  noStore();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Brak zmiennych Supabase');
  return createClient(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (url, options) =>
        fetch(url, { ...options, cache: 'no-store' }),
    },
  });
}