// Generates every app icon from the Networth hub-and-spoke logo (the same mark
// as src/components/Logo.tsx), so the installed PWA / Android icon matches the
// in-app header. Run: `npm i --no-save sharp` then `node scripts/generate-icons.mjs`.
import sharp from 'sharp';
import { promises as fs } from 'fs';

const ACCENT = '#4F46E5';

// The mark in a 24-unit space (identical geometry to Logo.tsx).
const mark = (color, scale, tx) => `
  <g transform="translate(${tx},${tx}) scale(${scale})"
     fill="${color}" stroke="${color}" stroke-width="1.6" stroke-linecap="round">
    <line x1="12" y1="12" x2="12" y2="4.5"/>
    <line x1="12" y1="12" x2="5" y2="18"/>
    <line x1="12" y1="12" x2="19" y2="18"/>
    <circle cx="12" cy="12" r="3"/>
    <circle cx="12" cy="4.5" r="2.1"/>
    <circle cx="5" cy="18" r="2.1"/>
    <circle cx="19" cy="18" r="2.1"/>
  </g>`;

// Full-bleed icon: indigo background + white mark at ~62% (for PWA/favicon/iOS).
const fullScale = (0.62 * 512) / 24; // 13.23
const fullTx = 256 - 12 * fullScale; // 97.3
const fullSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${ACCENT}"/>
  ${mark('#ffffff', fullScale, fullTx)}
</svg>`;

// Android adaptive foreground: white mark on transparent, smaller (~46%) so it
// sits inside the launcher's safe zone; the indigo comes from backgroundColor.
const fgScale = (0.46 * 512) / 24; // 9.81
const fgTx = 256 - 12 * fgScale; // 138.3
const fgSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  ${mark('#ffffff', fgScale, fgTx)}
</svg>`;

const png = (svg, file) => sharp(Buffer.from(svg)).png().toFile(file);

await fs.mkdir('public/icons', { recursive: true });
await Promise.all([
  png(fullSvg(1024), 'assets/icon.png'),
  png(fullSvg(48), 'assets/favicon.png'),
  png(fullSvg(512), 'public/icons/icon-512.png'),
  png(fullSvg(192), 'public/icons/icon-192.png'),
  png(fgSvg(1024), 'assets/android-icon-foreground.png'),
  png(fgSvg(1024), 'assets/android-icon-monochrome.png'),
]);

console.log('generate-icons: wrote all app icons from the logo mark.');
