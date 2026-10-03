// Renders the 1200x630 link preview (assets/social/home.png) from index.html
// and keeps the Open Graph / Twitter meta block in index.html in sync with it.
// Run after changing the page title, description, or hero headline:
//   npm run social:build
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = path.join(rootDir, 'index.html');
const socialDir = path.join(rootDir, 'assets', 'social');
const imagePath = path.join(socialDir, 'home.png');
const markerStart = '<!-- social-preview:start -->';
const markerEnd = '<!-- social-preview:end -->';
const siteName = 'a1';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function decodeEntities(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getMetaContent(html, name) {
  const pattern = new RegExp(`<meta\\s+[^>]*(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["'][^>]*>`, 'i');
  const match = html.match(pattern);
  return match ? decodeEntities(match[1].trim()) : '';
}

async function getSiteUrl() {
  const cname = (await fs.readFile(path.join(rootDir, 'CNAME'), 'utf8')).trim();
  return `https://${cname}/`;
}

// Hero headline as [{ text, accent }] spans, so the card mirrors the page.
function getHeadline(html) {
  const h1 = html.match(/<h1[^>]*id=["']hero-title["'][^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '';
  const spans = [...h1.matchAll(/<span([^>]*)>([\s\S]*?)<\/span>/gi)].map(([, attrs, text]) => ({
    text: decodeEntities(text.replace(/\s+/g, ' ').trim()),
    accent: /hero-title-accent/.test(attrs),
  }));
  if (!spans.length) throw new Error('Could not find the hero headline (#hero-title) in index.html');
  return spans;
}

function socialMetaBlock({ title, description, url, imageUrl }) {
  return `${markerStart}
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${escapeHtml(siteName)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(url)}">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(`${title} — social preview`)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}">
  ${markerEnd}`;
}

function injectSocialMeta(html, block) {
  const markerPattern = new RegExp(`${escapeRegExp(markerStart)}[\\s\\S]*?${escapeRegExp(markerEnd)}`);
  if (!markerPattern.test(html)) {
    throw new Error(`index.html is missing the ${markerStart} … ${markerEnd} block`);
  }
  return html.replace(markerPattern, block);
}

function buildCardHtml({ headline, description, url }) {
  const title = headline
    .map(({ text, accent }) => `<span${accent ? ' class="accent"' : ''}>${escapeHtml(text)}</span>`)
    .join(' ');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400&family=Inter:wght@400&family=JetBrains+Mono:wght@500;700&display=block">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      width: 1200px;
      height: 630px;
      overflow: hidden;
      position: relative;
      background: #0a0a0b;
      color: #ededf0;
      font-family: Inter, 'Segoe UI', sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    /* One accent glow and a faint grid, matching the hero. */
    body::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 60% 70% at 100% 0%, #4a60ff33, transparent 70%),
        linear-gradient(#ffffff08 1px, transparent 1px) 0 0 / 64px 64px,
        linear-gradient(90deg, #ffffff08 1px, transparent 1px) 0 0 / 64px 64px;
    }
    main {
      position: relative;
      height: 100%;
      padding: 64px 72px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .top { display: flex; align-items: center; justify-content: space-between; }
    .mark {
      display: grid;
      place-items: center;
      width: 72px;
      height: 72px;
      background: #121f9e;
      color: #fff;
      font: 700 46px/1 'JetBrains Mono', Consolas, monospace;
      letter-spacing: -.08em;
      padding-right: .08em;
    }
    .tag {
      height: 34px;
      display: inline-flex;
      align-items: center;
      padding: 0 14px;
      border: 1px solid #4a60ff66;
      background: #4a60ff1f;
      border-radius: 6px;
      color: #5a6dff;
      font: 500 17px/1 'JetBrains Mono', Consolas, monospace;
      letter-spacing: .08em;
      text-transform: uppercase;
    }
    h1 {
      margin: 0;
      max-width: 1000px;
      font: 400 100px/.94 'Barlow Condensed', 'Arial Narrow', sans-serif;
      letter-spacing: -.025em;
      text-transform: uppercase;
    }
    h1 .accent { color: #c3ccff; }
    p {
      margin: 24px 0 0;
      max-width: 900px;
      color: #b9b9c1;
      font-size: 26px;
      line-height: 1.35;
    }
    .url {
      color: #80808a;
      font: 500 22px/1 'JetBrains Mono', Consolas, monospace;
    }
    .url span { color: #4a60ff; }
  </style>
</head>
<body>
  <main>
    <div class="top">
      <div class="mark">a1</div>
      <div class="tag">Open source · Built on pi</div>
    </div>
    <section>
      <h1>${title}</h1>
      <p>${escapeHtml(description)}</p>
    </section>
    <div class="url"><span>❯</span> ${escapeHtml(url.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</div>
  </main>
</body>
</html>`;
}

async function renderPreview(cardHtml) {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch (error) {
    throw new Error('The "playwright" package is required to render the social preview. Run `npm install`, then retry.', { cause: error });
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    await page.setContent(cardHtml, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: imagePath, type: 'png' });
  } finally {
    await browser.close();
  }
}

async function main() {
  const html = await fs.readFile(indexPath, 'utf8');
  const siteUrl = await getSiteUrl();
  const title = getMetaContent(html, 'og:title');
  const description = getMetaContent(html, 'og:description');
  if (!title || !description) throw new Error('index.html needs og:title and og:description');

  const imageUrl = new URL('/assets/social/home.png', siteUrl).toString();
  const nextHtml = injectSocialMeta(html, socialMetaBlock({ title, description, url: siteUrl, imageUrl }));
  if (nextHtml !== html) await fs.writeFile(indexPath, nextHtml);

  await fs.mkdir(socialDir, { recursive: true });
  await renderPreview(buildCardHtml({ headline: getHeadline(html), description, url: siteUrl }));

  console.log(`Generated ${path.relative(rootDir, imagePath)}`);
}

main().catch(error => {
  console.error(error.message);
  if (error.cause) console.error(error.cause.message);
  process.exit(1);
});
