"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Email a password-reset link; its callback lands on /reset-password. */
export async function requestReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    redirect(
      "/forgot-password?error=" + encodeURIComponent("Enter your email."),
    );
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "";

  // `next` travels via a cookie rather than a query string on redirectTo:
  // Supabase's redirect-URL allow list only has the bare /auth/callback
  // entry, and a query string appended to it can fail that check.
  (await cookies()).set("auth-next", "/reset-password", {
    httpOnly: true,
    maxAge: 600,
    path: "/",
  });

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback`,
  });

  // Same message either way, so this can't be used to probe which emails exist.
  redirect(
    "/forgot-password?notice=" +
      encodeURIComponent(
        "If that email has an account, a reset link is on its way.",
      ),
  );
}
