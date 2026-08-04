"use client";

export interface ResultCardInput {
  champion: string;
  level: number;
  total: number;
  target: string;
  combo: string;
  buildA?: number | null;
  buildB?: number | null;
  url: string;
}

export async function shareResultCard(input: ResultCardInput): Promise<"copied" | "downloaded"> {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image generation is unavailable in this browser.");

  const gradient = context.createLinearGradient(0, 0, 1200, 630);
  gradient.addColorStop(0, "#05070c");
  gradient.addColorStop(1, "#0c1828");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1200, 630);

  context.strokeStyle = "#1a2233";
  context.lineWidth = 2;
  for (let x = 0; x <= 1200; x += 60) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, 630);
    context.stroke();
  }
  for (let y = 0; y <= 630; y += 60) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(1200, y);
    context.stroke();
  }

  context.fillStyle = "#5eead4";
  context.font = "600 26px ui-monospace, monospace";
  context.fillText("RIFTINTEL · DAMAGE REPORT", 70, 82);

  context.fillStyle = "#e8edf7";
  context.font = "700 58px system-ui, sans-serif";
  context.fillText(`${input.champion} · level ${input.level}`, 70, 165);

  context.fillStyle = "#9aa8c0";
  context.font = "500 24px ui-monospace, monospace";
  context.fillText(`COMBO  ${input.combo}`, 72, 222);
  context.fillText(`TARGET ${input.target}`, 72, 260);

  context.fillStyle = "#2ee59d";
  context.font = "700 116px ui-monospace, monospace";
  context.fillText(Math.round(input.total).toLocaleString("en-US"), 64, 410);
  context.fillStyle = "#9aa8c0";
  context.font = "500 26px ui-monospace, monospace";
  context.fillText("MODELED POST-MITIGATION DAMAGE", 72, 452);

  if (input.buildA != null && input.buildB != null) {
    const delta = input.buildB - input.buildA;
    context.fillStyle = "#4f8cff";
    context.font = "600 25px ui-monospace, monospace";
    context.fillText(
      `BUILD A ${Math.round(input.buildA)}  ·  BUILD B ${Math.round(input.buildB)}  ·  ${delta >= 0 ? "+" : ""}${Math.round(delta)}`,
      72,
      510,
    );
  }

  context.fillStyle = "#6b7a94";
  context.font = "400 20px ui-monospace, monospace";
  context.fillText(shorten(input.url, 92), 72, 570);
  context.fillText("Modeled estimate · verify unsupported spell mechanics in game", 72, 600);

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("Image export failed."))), "image/png"),
  );

  if (navigator.clipboard && "write" in navigator.clipboard && "ClipboardItem" in window) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      return "copied";
    } catch {
      // Downloads work in browsers that do not allow image clipboard writes.
    }
  }

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `riftintel-${input.champion.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-damage.png`;
  link.click();
  URL.revokeObjectURL(link.href);
  return "downloaded";
}

function shorten(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}
