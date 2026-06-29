import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getPublicCredentials() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (or Vercel Environment Variables)."
    );
  }
  return { url, key };
}

let publicClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!publicClient) {
    const { url, key } = getPublicCredentials();
    publicClient = createClient(url, key);
  }
  return publicClient;
}

// Lazy proxy so env vars are read at request time, not module load time.
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase();
    const value = client[prop as keyof SupabaseClient];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

let adminClient: SupabaseClient | null = null;

function createAdminClient(): SupabaseClient {
  const { url } = getPublicCredentials();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Add it to .env.local or Vercel Environment Variables for admin writes."
    );
  }
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// NEVER import supabaseAdmin in client components — API routes only.
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!adminClient) {
      adminClient = createAdminClient();
    }
    const value = adminClient[prop as keyof SupabaseClient];
    return typeof value === "function" ? value.bind(adminClient) : value;
  },
});
