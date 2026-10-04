// Renders the raster favicon set from assets/favicon.svg: favicon.ico, the
// iOS home-screen icon, and the PNGs listed in site.webmanifest.
// Run after changing assets/favicon.svg:
//   npm run icons:build
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const svgPath = path.join(rootDir, 'assets', 'favicon.svg');
const iconsDir = path.join(rootDir, 'assets', 'icons');

// favicon.ico and apple-touch-icon.png live at the site root: browsers and iOS
// request those exact paths even when a page has no <link> for them.
const outputs = [
  { file: path.join(iconsDir, 'favicon-16x16.png'), size: 16 },
  { file: path.join(iconsDir, 'favicon-32x32.png'), size: 32 },
  { file: path.join(rootDir, 'apple-touch-icon.png'), size: 180 },
  { file: path.join(iconsDir, 'android-chrome-192x192.png'), size: 192 },
  { file: path.join(iconsDir, 'android-chrome-512x512.png'), size: 512 },
];
const icoSizes = [16, 32, 48];

// An ICO whose entries are embedded PNGs (supported everywhere since Windows Vista).
function buildIco(pngs) {
  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach(({ size, data }, index) => {
    const entry = 6 + 16 * index;
    header.writeUInt8(size >= 256 ? 0 : size, entry);
    header.writeUInt8(size >= 256 ? 0 : size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...pngs.map(png => png.data)]);
}

async function main() {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    throw new Error('Playwright is not installed. Run `npm install` first.');
  }

  const svg = await fs.readFile(svgPath, 'utf8');
  const browser = await chromium.launch({ headless: true });
  const render = async size => {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(`<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
    const data = await page.screenshot({ type: 'png' });
    await page.close();
    return data;
  };

  try {
    await fs.mkdir(iconsDir, { recursive: true });
    for (const { file, size } of outputs) {
      await fs.writeFile(file, await render(size));
      console.log(`Wrote ${path.relative(rootDir, file)} (${size}x${size})`);
    }
    const icoPngs = [];
    for (const size of icoSizes) icoPngs.push({ size, data: await render(size) });
    await fs.writeFile(path.join(rootDir, 'favicon.ico'), buildIco(icoPngs));
    console.log(`Wrote favicon.ico (${icoSizes.join(', ')})`);
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
