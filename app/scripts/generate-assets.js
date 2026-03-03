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

// Register font (Inter is not available as .ttf locally, use system fallback)
const fontPath = path.join(__dirname, '..', 'assets', 'fonts', 'SpaceMono-Regular.ttf');
if (fs.existsSync(fontPath)) {
  GlobalFonts.registerFromPath(fontPath, 'SpaceMono');
}

// ── Drawing helpers ──────────────────────────────────────

function drawChevron(ctx, cx, cy, size, color) {
  const armLength = size * 0.42;
  const thickness = size * 0.1;
  const angle = Math.PI / 5;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(-Math.sin(angle) * armLength, Math.cos(angle) * armLength * 0.6);
  ctx.lineTo(0, -armLength * 0.5);
  ctx.lineTo(Math.sin(angle) * armLength, Math.cos(angle) * armLength * 0.6);
  ctx.stroke();

  ctx.restore();
}

function drawGlow(ctx, cx, cy, size, glowColor) {
  const gradient = ctx.createRadialGradient(cx, cy - size * 0.1, 0, cx, cy, size * 0.6);
  gradient.addColorStop(0, glowColor || AMBER_GLOW);
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.fillRect(cx - size, cy - size, size * 2, size * 2);
}

function drawTrail(ctx, cx, cy, size, color) {
  const trailTop = cy + size * 0.2;
  const trailBottom = cy + size * 0.42;
  const trailWidth = size * 0.04;
  const gap = size * 0.08;

  ctx.save();
  ctx.lineCap = 'round';

  for (let i = -1; i <= 1; i++) {
    const x = cx + i * gap;
    const gradient = ctx.createLinearGradient(x, trailTop, x, trailBottom);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'transparent');
    ctx.strokeStyle = gradient;
    ctx.lineWidth = trailWidth;
    ctx.beginPath();
    ctx.moveTo(x, trailTop);
    ctx.lineTo(x, trailBottom);
    ctx.stroke();
  }

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

  // Subtle glow
  drawGlow(ctx, size / 2, size / 2 - 20, size * 0.5, '#e8913a18');

  // Main chevron in teal
  drawChevron(ctx, size / 2, size / 2 - 20, size * 0.55, AMBER);

  // Exhaust trail
  drawTrail(ctx, size / 2, size / 2 - 20, size * 0.55, AMBER + '66');

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(ASSETS_DIR, 'icon.png'), buffer);
  console.log('Generated icon.png');
}

function generateAdaptiveIconForeground() {
  const size = 1024;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  drawChevron(ctx, size / 2, size / 2 - 15, size * 0.4, AMBER);
  drawTrail(ctx, size / 2, size / 2 - 15, size * 0.4, AMBER + '66');

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

  drawChevron(ctx, size / 2, size / 2 - 15, size * 0.4, SLATE);

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

  drawChevron(ctx, size / 2, size / 2 - 1, size * 0.55, AMBER);

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

  // Chevron above text
  drawGlow(ctx, size / 2, size * 0.38, size * 0.35, '#e8913a15');
  drawChevron(ctx, size / 2, size * 0.38, size * 0.38, AMBER);
  drawTrail(ctx, size / 2, size * 0.38, size * 0.38, AMBER + '44');

  // "LaunchPad" text below
  const fontSize = 64;
  ctx.font = `${fontSize}px SpaceMono`;
  ctx.fillStyle = AMBER_DARK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.letterSpacing = '2px';
  ctx.fillText('LaunchPad', size / 2, size * 0.62);

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
