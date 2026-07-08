import { getReportData } from "@/lib/db";
import ReportView from "./report-view";

const LOCATION =
  process.env.NEXT_PUBLIC_LOCATION_NAME || "Sweetwaters Coffee & Tea";

// The print report — the most important screen. Data is fetched on the server;
// sorting + printing are handled client-side in ReportView. Designed so a
// printed copy doubles as a physical count sheet (blank write-in column).
export default async function ReportPage() {
  const { lowItems, groups } = await getReportData();
  return <ReportView groups={groups} lowItems={lowItems} location={LOCATION} />;
}
