/* eslint-disable @typescript-eslint/no-require-imports */
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

// ── Brand tokens ─────────────────────────────────────────
const LIGHT_BG = '#fefcf9';
const AMBER = '#e8913a';
const AMBER_DARK = '#b87028';
const AMBER_GLOW = '#e8913a22';
const WHITE = '#ffffff';
const SLATE = '#2d2319';

const ASSETS_DIR = path.join(__dirname, '..', 'assets', 'images');

// Register font
const fontPath = path.join(__dirname, '..', 'assets', 'fonts', 'SpaceMono-Regular.ttf');
if (fs.existsSync(fontPath)) {
  GlobalFonts.registerFromPath(fontPath, 'SpaceMono');
}

// ── Drawing helpers ──────────────────────────────────────

function drawGlow(ctx, cx, cy, size, glowColor) {
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.6);
  gradient.addColorStop(0, glowColor || AMBER_GLOW);
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.fillRect(cx - size, cy - size, size * 2, size * 2);
}

function drawWordmark(ctx, cx, cy, fontSize, color) {
  ctx.save();
  ctx.font = `bold ${fontSize}px SpaceMono, monospace`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('LP', cx, cy);
  ctx.restore();
}

function drawFullWordmark(ctx, cx, cy, fontSize, color) {
  ctx.save();
  ctx.font = `bold ${fontSize}px SpaceMono, monospace`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('LaunchPad', cx, cy);
  ctx.restore();
}

// ── Asset generators ─────────────────────────────────────

function generateIcon() {
  const size = 1024;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Light background
  ctx.fillStyle = WHITE;
  ctx.fillRect(0, 0, size, size);

  // Subtle glow behind text
  drawGlow(ctx, size / 2, size / 2, size * 0.5, '#e8913a18');

  // LP wordmark
  drawWordmark(ctx, size / 2, size / 2, size * 0.42, AMBER);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(ASSETS_DIR, 'icon.png'), buffer);
  console.log('Generated icon.png');
}

function generateAdaptiveIconForeground() {
  const size = 1024;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // LP wordmark (scaled for safe zone)
  drawWordmark(ctx, size / 2, size / 2, size * 0.32, AMBER);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(ASSETS_DIR, 'android-icon-foreground.png'), buffer);
  console.log('Generated android-icon-foreground.png');
}

function generateAdaptiveIconBackground() {
  const size = 1024;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = WHITE;
  ctx.fillRect(0, 0, size, size);

  drawGlow(ctx, size / 2, size / 2, size * 0.5, '#e8913a10');

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(ASSETS_DIR, 'android-icon-background.png'), buffer);
  console.log('Generated android-icon-background.png');
}

function generateMonochrome() {
  const size = 1024;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  drawWordmark(ctx, size / 2, size / 2, size * 0.32, SLATE);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(ASSETS_DIR, 'android-icon-monochrome.png'), buffer);
  console.log('Generated android-icon-monochrome.png');
}

function generateFavicon() {
  const size = 48;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = WHITE;
  ctx.fillRect(0, 0, size, size);

  drawWordmark(ctx, size / 2, size / 2, size * 0.42, AMBER);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(ASSETS_DIR, 'favicon.png'), buffer);
  console.log('Generated favicon.png');
}

function generateSplashIcon() {
  const size = 1024;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Light background
  ctx.fillStyle = LIGHT_BG;
  ctx.fillRect(0, 0, size, size);

  // Glow
  drawGlow(ctx, size / 2, size / 2, size * 0.5, '#e8913a15');

  // Full "LaunchPad" text
  drawFullWordmark(ctx, size / 2, size / 2, 72, AMBER_DARK);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(ASSETS_DIR, 'splash-icon.png'), buffer);
  console.log('Generated splash-icon.png');
}

// ── Run ──────────────────────────────────────────────────

console.log('Generating LaunchPad assets...\n');
generateIcon();
generateAdaptiveIconForeground();
generateAdaptiveIconBackground();
generateMonochrome();
generateFavicon();
generateSplashIcon();
console.log('\nDone! All assets written to', ASSETS_DIR);
