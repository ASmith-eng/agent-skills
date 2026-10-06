#!/usr/bin/env node
/**
 * WCAG contrast ratio checker for design audits.
 *
 * Usage:
 *   node contrast.js "#3b82f6"                     # against white
 *   node contrast.js "#3b82f6" "#f8fafc"           # against a given surface
 *   node contrast.js "#3b82f6" "#d97706" "#ffffff" # several colours on one surface
 *
 * With two or more arguments, the LAST one is always the surface. With a
 * single colour, the surface defaults to white.
 */

const WHITE = '#ffffff';

const AA_NORMAL_TEXT = 4.5;
const AA_LARGE_TEXT = 3.0;

function normaliseHex(input) {
  const hex = input.trim().replace(/^#/, '');
  if (hex.length === 3) {
    return '#' + [...hex].map(character => character + character).join('');
  }
  if (hex.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(hex)) {
    throw new Error(`Not a hex colour: "${input}"`);
  }
  return '#' + hex.toLowerCase();
}

function relativeLuminance(hex) {
  const channels = [1, 3, 5]
    .map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map(channel =>
      channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)
    );
  const [red, green, blue] = channels;
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foregroundHex, backgroundHex) {
  const foreground = relativeLuminance(foregroundHex);
  const background = relativeLuminance(backgroundHex);
  const lighter = Math.max(foreground, background);
  const darker = Math.min(foreground, background);
  return (lighter + 0.05) / (darker + 0.05);
}

function verdict(ratio) {
  if (ratio >= AA_NORMAL_TEXT) return 'passes AA';
  if (ratio >= AA_LARGE_TEXT) return 'passes AA large text only — fails for normal text';
  return 'FAILS AA';
}

const rawArgs = process.argv.slice(2);

if (rawArgs.length === 0) {
  console.error('Usage: node contrast.js <colour> [more colours...] [surface]');
  process.exit(1);
}

let args;
try {
  args = rawArgs.map(normaliseHex);
} catch (error) {
  console.error(error.message);
  console.error('Pass hex values, not Tailwind classes — resolve the class to its hex first.');
  process.exit(1);
}

// One colour => against white. Two or more => the last is the surface.
const surface = args.length === 1 ? WHITE : args[args.length - 1];
const foregrounds = args.length === 1 ? args : args.slice(0, -1);

for (const foreground of foregrounds) {
  const ratio = contrastRatio(foreground, surface);
  console.log(`${foreground} on ${surface} = ${ratio.toFixed(2)}:1 — ${verdict(ratio)}`);
}
