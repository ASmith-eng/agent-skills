#!/usr/bin/env node
// WCAG 2.x contrast checker for color pairs. No dependencies.
//
// Usage:
//   node contrast-check.js "label=FG:BG[:MIN]" ...
//
//   FG, BG  hex (#rgb, #rrggbb) or rgb(r, g, b)
//   MIN     required ratio; defaults to 4.5 (normal text).
//           Use 3 for large text and non-text UI (borders, focus rings, icons).
//
// Example:
//   node contrast-check.js "body=#0a0a0a:#ffffff" "muted=#737373:#ffffff" "focus=#0d344b:#ffffff:3"
//
// Exits 1 when any pair fails, 2 on bad input.

function parseColor(input) {
  const value = input.trim().toLowerCase();

  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (hex) {
    let digits = hex[1];
    if (digits.length === 3) {
      digits = digits.split('').map((d) => d + d).join('');
    }
    return [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16));
  }

  const rgb = value.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/);
  if (rgb) {
    return [rgb[1], rgb[2], rgb[3]].map(Number);
  }

  return null;
}

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

// Splits "label=FG:BG:MIN" without breaking on the commas/colons inside rgb().
function parsePair(arg) {
  const eq = arg.indexOf('=');
  const label = eq === -1 ? arg : arg.slice(0, eq);
  const rest = eq === -1 ? arg : arg.slice(eq + 1);
  const parts = rest.match(/rgb\([^)]*\)|[^:]+/g) || [];
  if (parts.length < 2 || parts.length > 3) return null;

  const fg = parseColor(parts[0]);
  const bg = parseColor(parts[1]);
  const min = parts[2] ? Number(parts[2]) : 4.5;
  if (!fg || !bg || Number.isNaN(min)) return null;

  return { label, fgText: parts[0].trim(), bgText: parts[1].trim(), fg, bg, min };
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node contrast-check.js "label=FG:BG[:MIN]" ...');
  process.exit(2);
}

let failed = false;
for (const arg of args) {
  const pair = parsePair(arg);
  if (!pair) {
    console.error(`Could not parse "${arg}". Expected label=FG:BG[:MIN] with hex or rgb() colors.`);
    process.exit(2);
  }

  const ratio = contrastRatio(pair.fg, pair.bg);
  // WCAG compares the unrounded ratio against the threshold.
  const passes = ratio >= pair.min;
  if (!passes) failed = true;

  const status = passes ? 'PASS' : 'FAIL';
  const largeOnly = !passes && pair.min === 4.5 && ratio >= 3 ? ' — passes for large text only' : '';
  console.log(`${status}  ${pair.label}: ${pair.fgText} on ${pair.bgText} = ${ratio.toFixed(2)}:1 (needs ${pair.min}:1)${largeOnly}`);
}

process.exit(failed ? 1 : 0);
