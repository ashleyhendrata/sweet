"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Create a personal account (own email + password). After signing up, the
 * user lands on /welcome to either join a franchise with a code or create one.
 *
 * Works whether or not "Confirm email" is enabled in Supabase: with it off,
 * signup returns a session and we go straight to /welcome; with it on, we
 * show a "check your email" notice and the emailed link lands on /welcome.
 */
export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(
      "/signup?error=" + encodeURIComponent("Enter an email and password."),
    );
  }
  if (password.length < 8) {
    redirect(
      "/signup?error=" +
        encodeURIComponent("Password must be at least 8 characters."),
    );
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "";

  // `next` travels via a cookie rather than a query string on emailRedirectTo:
  // Supabase's redirect-URL allow list only has the bare /auth/callback
  // entry, and a query string appended to it can fail that check.
  (await cookies()).set("auth-next", "/welcome", {
    httpOnly: true,
    maxAge: 600,
    path: "/",
  });

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect("/signup?error=" + encodeURIComponent(error.message));
  }

  if (!data.session) {
    // Email confirmation is enabled — the session arrives via the email link.
    redirect(
      "/signup?notice=" +
        encodeURIComponent(
          "Almost there — check your email and tap the confirmation link.",
        ),
    );
  }

  redirect("/welcome");
}
