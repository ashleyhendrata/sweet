import { ImageResponse } from "next/og";

// Browser-tab favicon, generated in code (no image asset): a white cat-head
// outline (with whiskers) on Sweetwaters red.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Rounded cat head: two ears + a round face.
const HEAD =
  "M30 12 L46 34 Q50 31 54 34 L70 12 L78 40 Q92 60 50 83 Q8 60 22 40 Z";
const WHISKERS = ["M45 60 L12 55", "M45 67 L12 71", "M55 60 L88 55", "M55 67 L88 71"];

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#a32235",
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 100 100"
          fill="none"
          stroke="#ffffff"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          <path d={HEAD} strokeWidth={7} />
          {WHISKERS.map((d) => (
            <path key={d} d={d} strokeWidth={4} />
          ))}
        </svg>
      </div>
    ),
    { ...size },
  );
}
