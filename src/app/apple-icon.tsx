import { ImageResponse } from "next/og";

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
          background: "#05070c",
          borderRadius: 36,
        }}
      >
        <svg width="120" height="120" viewBox="0 0 32 32" fill="none">
          <circle
            cx="16"
            cy="16"
            r="14"
            stroke="#3d5a80"
            strokeWidth="1.25"
            opacity="0.85"
          />
          <circle cx="16" cy="16" r="3.5" fill="#4f8cff" />
          <path
            d="M16 4v4M16 24v4M4 16h4M24 16h4"
            stroke="#4f8cff"
            strokeWidth="1.5"
            strokeLinecap="square"
          />
          <path
            d="M8.5 8.5l2.2 2.2M21.3 21.3l2.2 2.2M21.3 8.5l-2.2 2.2M10.7 21.3l-2.2 2.2"
            stroke="#5eead4"
            strokeWidth="1.25"
            strokeLinecap="square"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
