import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing spot for Supabase email links (signup confirmation, password reset).
 * Exchanges the one-time code for a session, then continues to wherever the
 * `auth-next` cookie says (e.g. /welcome after confirming, /reset-password
 * for a reset) — set by the signup/reset actions before the email was sent.
 * A cookie is used instead of a `next` query string on redirectTo because
 * Supabase's redirect-URL allow list only has the bare /auth/callback entry.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const cookieStore = await cookies();
  const next = cookieStore.get("auth-next")?.value ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      cookieStore.delete("auth-next");
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  return NextResponse.redirect(
    new URL(
      "/login?error=" +
        encodeURIComponent("That link is invalid or expired — try again."),
      url.origin,
    ),
  );
}
