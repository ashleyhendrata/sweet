import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for use in Server Components, Server Actions, and Route Handlers.
 *
 * In Next.js 16 `cookies()` is async, so this factory is async too. Session
 * cookies are read from / written to the request via the `cookies` adapter.
 *
 * Note: when called from a Server Component, cookie writes throw (you can't set
 * cookies while rendering) — we swallow that. Session refresh still happens in
 * `proxy.ts`, so this is safe.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component render — ignore. The `proxy`
            // refreshes the session cookie on the next request.
          }
        },
      },
    },
  );
}
