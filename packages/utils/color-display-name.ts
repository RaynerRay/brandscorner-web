/** Map stored cart / variant colours (often hex) to a short readable label. */

const NAMED_COLORS: [string, number, number, number][] = [
  ["White", 255, 255, 255],
  ["Black", 0, 0, 0],
  ["Red", 255, 0, 0],
  ["Green", 0, 128, 0],
  ["Blue", 0, 0, 255],
  ["Yellow", 255, 255, 0],
  ["Orange", 255, 165, 0],
  ["Pink", 255, 192, 203],
  ["Hot Pink", 255, 105, 180],
  ["Purple", 128, 0, 128],
  ["Violet", 238, 130, 238],
  ["Lavender", 230, 230, 250],
  ["Brown", 165, 42, 42],
  ["Beige", 245, 245, 220],
  ["Cream", 255, 253, 208],
  ["Ivory", 255, 255, 240],
  ["Grey", 128, 128, 128],
  ["Light Grey", 211, 211, 211],
  ["Dark Grey", 64, 64, 64],
  ["Silver", 192, 192, 192],
  ["Gold", 255, 215, 0],
  ["Navy", 0, 0, 128],
  ["Sky Blue", 135, 206, 235],
  ["Teal", 0, 128, 128],
  ["Turquoise", 64, 224, 208],
  ["Mint", 152, 255, 152],
  ["Lime", 0, 255, 0],
  ["Olive", 128, 128, 0],
  ["Maroon", 128, 0, 0],
  ["Coral", 255, 127, 80],
  ["Salmon", 250, 128, 114],
  ["Peach", 255, 218, 185],
  ["Magenta", 255, 0, 255],
  ["Cyan", 0, 255, 255],
  ["Indigo", 75, 0, 130],
  ["Charcoal", 54, 69, 79],
];

function parseHexToRgb(raw: string): [number, number, number] | null {
  let h = raw.trim();
  if (h.startsWith("#")) h = h.slice(1);
  if (h.length === 3) {
    h = h
      .split("")
      .map((ch) => ch + ch)
      .join("");
  }
  if (h.length === 8) h = h.slice(0, 6);
  if (h.length !== 6 || !/^[0-9a-f]+$/i.test(h)) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return [r, g, b];
}

function parseRgbToRgb(s: string): [number, number, number] | null {
  const m = s
    .trim()
    .match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function nearestName(r: number, g: number, b: number): string {
  let best = NAMED_COLORS[0];
  let bestDist = Infinity;
  for (const c of NAMED_COLORS) {
    const d = (r - c[1]) ** 2 + (g - c[2]) ** 2 + (b - c[3]) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best[0];
}

/** True when a small CSS swatch is meaningful (hex or rgb notation). */
export function isCssColorLiteral(value: string): boolean {
  const t = value.trim();
  if (t.startsWith("#")) return parseHexToRgb(t) !== null;
  return /^rgba?\(/i.test(t);
}

/**
 * Human-readable colour for UI copy. Hex / rgb → nearest palette name;
 * anything else is returned trimmed (e.g. existing size labels).
 */
export function hexToColorName(input: string): string {
  if (!input || typeof input !== "string") return "";
  const trimmed = input.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("#")) {
    const rgb = parseHexToRgb(trimmed);
    if (rgb) return nearestName(...rgb);
    return trimmed;
  }

  const fromRgb = parseRgbToRgb(trimmed);
  if (fromRgb) return nearestName(...fromRgb);

  return trimmed;
}

const FALLBACK_SWATCH = "#e5e7eb";

/** Resolved CSS background for colour swatches (`backgroundColor` / `background`). */
export function colorValueForSwatch(input: string): string {
  if (!input || typeof input !== "string") return FALLBACK_SWATCH;
  const trimmed = input.trim();
  if (!trimmed) return FALLBACK_SWATCH;

  const fromHex = parseHexToRgb(trimmed);
  if (fromHex)
    return `rgb(${fromHex[0]},${fromHex[1]},${fromHex[2]})`;

  const fromRgb = parseRgbToRgb(trimmed);
  if (fromRgb) return `rgb(${fromRgb[0]},${fromRgb[1]},${fromRgb[2]})`;

  return FALLBACK_SWATCH;
}
