#!/usr/bin/env node
// WCAG 2.x contrast checker for color pairs. No dependencies, no file or
// network access: it reads its arguments and prints one line per pair.
//
// Usage:
//   node contrast-check.js "label=FG:BG[:MIN]" ...
//
//   FG, BG  a color in any of these formats (the two sides may differ):
//             hex     #rgb or #rrggbb
//             rgb     rgb(r, g, b)
//             oklch   oklch(L C H) as written in CSS: L as 0–1 or a percentage,
//                     C as a number or a percentage (100% = 0.4),
//                     H in deg (default), rad, grad or turn
//   MIN     required ratio; defaults to 4.5 (normal text).
//           Use 3 for large text and non-text UI (borders, focus rings, icons).
//
// Example:
//   node contrast-check.js "body=#0a0a0a:#ffffff" "muted=oklch(0.55 0.01 60):#ffffff" "focus=oklch(45% 0.08 190):oklch(1 0 0):3"
//
// How it works:
//   1. Parse each color into 8-bit sRGB [r, g, b].
//   2. Compute the WCAG relative luminance of each and the ratio between them.
//   3. Print PASS or FAIL against MIN.
//
// An OKLCH color is printed with the hex it resolves to. One that falls outside
// the sRGB gamut is clipped to it and flagged: its hex and ratio are what an
// sRGB screen shows, and may differ on a wide-gamut (P3) screen.
//
// Exits 1 when any pair fails, 2 on bad input.

// ---------------------------------------------------------------------------
// 1. Parsing. Each parser returns { rgb, inGamut }, { error }, or null when the
//    text isn't in its format.
// ---------------------------------------------------------------------------

function parseHex(value) {
  const match = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (!match) return null;

  let digits = match[1];
  if (digits.length === 3) {
    digits = digits.split('').map((d) => d + d).join('');
  }
  return { rgb: [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16)), inGamut: true };
}

function parseRgb(value) {
  const match = value.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/);
  if (!match) return null;

  return { rgb: [match[1], match[2], match[3]].map(Number), inGamut: true };
}

const NUMBER = '[+-]?(?:\\d+\\.?\\d*|\\.\\d+)(?:e[+-]?\\d+)?';
const OKLCH_PATTERN = new RegExp(
  `^oklch\\(\\s*(${NUMBER}%?|none)\\s+(${NUMBER}%?|none)\\s+(${NUMBER}(?:deg|rad|grad|turn)?|none)\\s*(?:/\\s*(${NUMBER}%?|none)\\s*)?\\)$`
);
const HUE_TO_DEGREES = { deg: 1, grad: 0.9, rad: 180 / Math.PI, turn: 360 };

function parseOklch(value) {
  const match = value.match(OKLCH_PATTERN);
  if (!match) return null;

  const alpha = match[4] === undefined ? 1 : numberOrPercent(match[4], 1);
  if (alpha < 1) {
    return { error: 'has an alpha below 1; composite it over its background first and check the result' };
  }

  const lightness = Math.min(1, Math.max(0, numberOrPercent(match[1], 1)));
  const chroma = Math.max(0, numberOrPercent(match[2], 0.4));
  const hueUnit = (match[3].match(/[a-z]+$/) || ['deg'])[0];
  const hueDegrees = match[3] === 'none' ? 0 : parseFloat(match[3]) * HUE_TO_DEGREES[hueUnit];

  return { ...oklchToRgb(lightness, chroma, hueDegrees), resolvedFromOklch: true };
}

// "62%" with a percentScale of 1 → 0.62; "0.62" → 0.62; "none" → 0.
function numberOrPercent(text, percentScale) {
  if (text === 'none') return 0;
  return text.endsWith('%') ? (parseFloat(text) / 100) * percentScale : parseFloat(text);
}

// OKLCH → OKLab → linear sRGB → 8-bit sRGB. The matrix constants are Björn
// Ottosson's, from https://bottosson.github.io/posts/oklab/ (also used by the
// CSS Color 4 specification).
function oklchToRgb(lightness, chroma, hueDegrees) {
  const hue = (hueDegrees * Math.PI) / 180;
  const a = chroma * Math.cos(hue);
  const b = chroma * Math.sin(hue);

  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;

  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];

  // A linear channel outside 0–1 means the color can't be shown in sRGB. The
  // tolerance (about half an 8-bit step) stops rounding noise on white and
  // pure primaries from being reported.
  const tolerance = 0.002;
  const inGamut = linear.every((channel) => channel >= -tolerance && channel <= 1 + tolerance);

  const rgb = linear.map((channel) => {
    const clipped = Math.min(1, Math.max(0, channel));
    const encoded = clipped <= 0.0031308 ? clipped * 12.92 : 1.055 * clipped ** (1 / 2.4) - 0.055;
    return Math.round(encoded * 255);
  });

  return { rgb, inGamut };
}

function parseColor(input) {
  const value = input.trim().toLowerCase();
  return (
    parseHex(value) ||
    parseRgb(value) ||
    parseOklch(value) || { error: 'is not a hex, rgb() or oklch() color' }
  );
}

// Splits "label=FG:BG:MIN" without breaking on the contents of rgb() or oklch().
function parsePair(arg) {
  const eq = arg.indexOf('=');
  const label = eq === -1 ? arg : arg.slice(0, eq);
  const rest = eq === -1 ? arg : arg.slice(eq + 1);
  const parts = rest.match(/(?:rgb|oklch)\([^)]*\)|[^:]+/gi) || [];
  if (parts.length < 2 || parts.length > 3) {
    return { error: 'Expected label=FG:BG[:MIN].' };
  }

  const min = parts[2] ? Number(parts[2]) : 4.5;
  if (Number.isNaN(min)) {
    return { error: `MIN "${parts[2].trim()}" is not a number.` };
  }

  const fgText = parts[0].trim();
  const bgText = parts[1].trim();
  const fg = parseColor(fgText);
  if (fg.error) return { error: `"${fgText}" ${fg.error}.` };
  const bg = parseColor(bgText);
  if (bg.error) return { error: `"${bgText}" ${bg.error}.` };

  return { label, fgText, bgText, fg, bg, min };
}

// ---------------------------------------------------------------------------
// 2. Contrast, as defined by WCAG 2.x:
//    https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio
// ---------------------------------------------------------------------------

function relativeLuminance([r, g, b]) {
  const linear = [r, g, b].map((channel) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(fg, bg) {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const [light, dark] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (light + 0.05) / (dark + 0.05);
}

// ---------------------------------------------------------------------------
// 3. Output
// ---------------------------------------------------------------------------

// An OKLCH color is shown with its resolved hex: "oklch(0.21 0.006 56) [#1c1917]".
function describe(text, color) {
  if (!color.resolvedFromOklch) return text;
  const hex = '#' + color.rgb.map((channel) => channel.toString(16).padStart(2, '0')).join('');
  return `${text} [${hex}]`;
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node contrast-check.js "label=FG:BG[:MIN]" ...');
  process.exit(2);
}

let failed = false;
for (const arg of args) {
  const pair = parsePair(arg);
  if (pair.error) {
    console.error(`Could not parse "${arg}". ${pair.error}`);
    process.exit(2);
  }

  const ratio = contrastRatio(pair.fg.rgb, pair.bg.rgb);
  // WCAG compares the unrounded ratio against the threshold.
  const passes = ratio >= pair.min;
  if (!passes) failed = true;

  const status = passes ? 'PASS' : 'FAIL';
  const largeOnly = !passes && pair.min === 4.5 && ratio >= 3 ? ' — passes for large text only' : '';
  const clipped = [
    [pair.fgText, pair.fg],
    [pair.bgText, pair.bg],
  ]
    .filter(([, color]) => !color.inGamut)
    .map(([text]) => ` — ${text} is outside sRGB, clipped`)
    .join('');

  console.log(
    `${status}  ${pair.label}: ${describe(pair.fgText, pair.fg)} on ${describe(pair.bgText, pair.bg)} = ${ratio.toFixed(2)}:1 (needs ${pair.min}:1)${largeOnly}${clipped}`
  );
}

process.exit(failed ? 1 : 0);
