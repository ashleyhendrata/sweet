"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// Rendered on the client so the date/time reflect the counter's local timezone
// at the moment they open the report (avoids a server/UTC mismatch).
export default function ReportDate() {
  const now = useSyncExternalStore(
    subscribe,
    () => new Date(),
    () => null,
  );

  if (!now) return <span suppressHydrationWarning>&nbsp;</span>;

  const date = now.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const time = now.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <span suppressHydrationWarning>
      {date} · {time}
    </span>
  );
}
