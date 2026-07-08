"use client";

// Native browser print — "Save as PDF" is a destination in the same dialog.
// No PDF library needed (per the project constraints).
export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="min-h-11 rounded-lg bg-neutral-900 px-5 py-2.5 text-base font-semibold text-white hover:bg-neutral-700"
    >
      Print / Save as PDF
    </button>
  );
}
