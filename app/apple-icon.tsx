import { ImageResponse } from "next/og";

// Home-screen icon for iOS: a white cat-head outline (with whiskers) on
// Sweetwaters red. iOS masks it to a rounded square, so we render full-bleed.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const HEAD =
  "M30 12 L46 34 Q50 31 54 34 L70 12 L78 40 Q90 60 60 80 Q50 85 40 80 Q10 60 22 40 Z";
const WHISKERS = [
  "M45 58 L12 52",
  "M45 63 L11 63",
  "M45 68 L12 73",
  "M55 58 L88 52",
  "M55 63 L89 63",
  "M55 68 L88 73",
];

export default function AppleIcon() {
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
          width="120"
          height="120"
          viewBox="0 0 100 100"
          fill="none"
          stroke="#ffffff"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          <path d={HEAD} strokeWidth={6} />
          {WHISKERS.map((d) => (
            <path key={d} d={d} strokeWidth={3.5} />
          ))}
        </svg>
      </div>
    ),
    { ...size },
  );
}
