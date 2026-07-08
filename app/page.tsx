import { getItemsGroupedByCategory } from "@/lib/db";
import CountScreen from "./count-screen";

// The daily driver: items grouped by category with live +/- counting.
// Fetched on the server (RLS-protected); interactivity lives in CountScreen.
export default async function Home() {
  const groups = await getItemsGroupedByCategory();
  return <CountScreen groups={groups} />;
}
