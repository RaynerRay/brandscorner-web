export const APPAREL_SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "3XL",
] as const;

/** Typical UK adult shoe range — sellers can add more via custom sizes. */
export const UK_SHOE_SIZES = [
  "UK 3",
  "UK 4",
  "UK 5",
  "UK 6",
  "UK 7",
  "UK 8",
  "UK 9",
  "UK 10",
  "UK 11",
  "UK 12",
  "UK 13",
] as const;

export const ALL_SIZE_PRESETS = [
  ...APPAREL_SIZES,
  ...UK_SHOE_SIZES,
] as readonly string[];

/** Exact strings used on products — use for catalogue filters. */
export const FILTER_SIZE_OPTIONS = [...ALL_SIZE_PRESETS];
