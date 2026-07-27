import { redirect } from "next/navigation";
import { getTeamContext } from "@/lib/db";
import { logout } from "../login/actions";
import WelcomeForm from "./welcome-form";

// Signed in but not on a team yet: join a store with its code, or create one.
export default async function WelcomePage() {
  const ctx = await getTeamContext();
  if (ctx) redirect("/");

  return (
    <main className="flex min-h-full items-center justify-center bg-neutral-50 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Welcome!
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            One last step — connect to your store.
          </p>
        </div>

        <WelcomeForm />

        <form action={logout} className="mt-4 text-center">
          <button
            type="submit"
            className="min-h-11 rounded-lg px-3 text-sm font-medium text-neutral-500 hover:bg-neutral-100"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
