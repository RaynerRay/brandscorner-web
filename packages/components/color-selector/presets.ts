export type PresetColor = { hex: string; label: string };

/** Presets stored as hex strings on products; labels are for UI/filter display only. */
export const PRESET_COLORS: PresetColor[] = [
  { hex: "#000000", label: "Black" },
  { hex: "#ffffff", label: "White" },
  { hex: "#ff0000", label: "Red" },
  { hex: "#00ff00", label: "Green" },
  { hex: "#0000ff", label: "Blue" },
  { hex: "#ffff00", label: "Yellow" },
  { hex: "#ff00ff", label: "Magenta" },
  { hex: "#00ffff", label: "Cyan" },
];

/** Values match DB `colors` strings — use these for catalogue filters. */
export const FILTER_COLOR_OPTIONS = PRESET_COLORS.map(({ hex, label }) => ({
  value: hex,
  label,
}));
