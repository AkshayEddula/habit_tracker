/** Mixes a #RRGGBB color with white (amount > 0) or black (amount < 0). */
export function tint(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1, 7), 16);
  const target = amount >= 0 ? 255 : 0;
  const a = Math.abs(amount);
  const mix = (c: number) => Math.round(c + (target - c) * a);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** Appends an alpha channel to a #RRGGBB color. */
export function alpha(hex: string, opacity: number): string {
  const a = Math.round(Math.max(0, Math.min(1, opacity)) * 255);
  return `${hex.slice(0, 7)}${a.toString(16).padStart(2, '0')}`;
}
