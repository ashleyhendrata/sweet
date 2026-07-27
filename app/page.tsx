import { redirect } from "next/navigation";
import { getItemsGroupedByCategory, getTeamContext } from "@/lib/db";
import CountScreen from "./count-screen";

// The daily driver: items grouped by category with live +/- counting.
// Signed-in users without a team yet are sent to /welcome to join one.
export default async function Home() {
  const ctx = await getTeamContext();
  if (!ctx) redirect("/welcome");

  const groups = await getItemsGroupedByCategory();
  return (
    <CountScreen
      groups={groups}
      teamName={ctx.teamName}
      isAdmin={ctx.role === "admin"}
    />
  );
}
