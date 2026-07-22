import { ImageResponse } from "next/og";

export const alt =
  "RiftIntel — What Riot's patch notes actually mean";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Branded share card for Discord / iMessage / Twitter / LinkedIn.
 * Replaces generic previews (and accidental Vercel/default branding).
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#05070c",
          padding: "64px 72px",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        {/* subtle grid wash */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(26,34,51,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(26,34,51,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            opacity: 0.45,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "280px",
            background:
              "radial-gradient(ellipse 70% 80% at 50% 0%, rgba(79,140,255,0.22), transparent 70%)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* Brand mark */}
          <svg width="56" height="56" viewBox="0 0 32 32" fill="none">
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
              opacity="0.95"
            />
          </svg>
          <div style={{ display: "flex", alignItems: "baseline", gap: 0 }}>
            <span
              style={{
                fontSize: 42,
                fontWeight: 700,
                color: "#e8edf7",
                letterSpacing: "-0.03em",
              }}
            >
              Rift
            </span>
            <span
              style={{
                fontSize: 42,
                fontWeight: 700,
                color: "#4f8cff",
                letterSpacing: "-0.03em",
              }}
            >
              Intel
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 52,
              fontWeight: 650,
              color: "#e8edf7",
              letterSpacing: "-0.035em",
              lineHeight: 1.15,
              maxWidth: 980,
            }}
          >
            What Riot&apos;s patch notes actually mean
          </div>
          <div
            style={{
              fontSize: 26,
              color: "#9aa8c0",
              letterSpacing: "-0.02em",
              lineHeight: 1.35,
              maxWidth: 900,
            }}
          >
            The intelligence layer on League updates — real numbers, champion
            history, build damage. Every patch day.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontSize: 18,
              color: "#5eead4",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Raw notes in · clarity out
          </div>
          <div style={{ fontSize: 18, color: "#6b7a94" }}>
            unofficial · free fan tool
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
