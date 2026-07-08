import { ImageResponse } from "next/og";

// Home-screen icon for iOS ("Add to Home Screen"), since the app is phone-first.
// iOS masks it to a rounded square, so we render full-bleed.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

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
          background: "#6f4e37",
          color: "#ffffff",
          fontSize: 120,
          fontWeight: 700,
        }}
      >
        S
      </div>
    ),
    { ...size },
  );
}
