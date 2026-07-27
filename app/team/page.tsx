import { redirect } from "next/navigation";
import { getTeamContext, getTeamMembers } from "@/lib/db";
import AppNav from "../app-nav";
import TeamView from "./team-view";

// Your store's team: the join code to share and who's on the team.
export default async function TeamPage() {
  const ctx = await getTeamContext();
  if (!ctx) redirect("/welcome");

  const members = await getTeamMembers();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 p-4 pb-16 sm:max-w-[8.25in]">
      <header>
        <AppNav current="/team" isAdmin={ctx.role === "admin"} />
      </header>
      <TeamView
        teamName={ctx.teamName}
        joinCode={ctx.joinCode}
        members={members}
        currentUserId={ctx.userId}
        isAdmin={ctx.role === "admin"}
      />
    </main>
  );
}
