'use strict';

// Entirely fictional, local demo content. No commands, models, or files are used.
const escapeDemo = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const demoPrompt = (text, time) => `<div class="terminal-prompt"><span aria-hidden="true">❯</span><p>${escapeDemo(text)}</p><time>${time}</time></div>`;
const demoThought = text => `<p class="terminal-thought">${escapeDemo(text)}</p>`;
const demoRead = (path, range, lines) => `<div class="terminal-tool"><strong>read</strong> <span class="tool-path">${escapeDemo(path)}</span><span class="tool-range">:${range}</span><pre class="terminal-output">${escapeDemo(lines)}</pre></div>`;
const demoShell = (command, output, state = 'success', duration = '0.8s') => `<div class="terminal-tool is-${state}"><p class="terminal-command">$ ${escapeDemo(command)}</p><pre class="terminal-output">${escapeDemo(output)}</pre><p class="tool-hint terminal-runtime">Took ${duration}</p></div>`;
const demoEdit = (path, lines) => `<div class="terminal-tool"><strong>edit</strong> <span class="tool-path">${escapeDemo(path)}</span><pre class="terminal-diff">${lines.map(([kind, text]) => `<span class="diff-${kind}">${escapeDemo(text)}</span>`).join('\n')}</pre></div>`;
const demoReply = text => `<p class="terminal-response">${escapeDemo(text)}</p>`;
const demoEvents = [
  { prompt: 'Handle empty config files', time: '15:19', delay: 1000 },
  { html: demoThought('Checking the loader and its tests'), delay: 1400 },
  { html: demoRead('src/config/load.ts', '10-24', '12 const source = await readFile(path, "utf8");\n13 return JSON.parse(source);'), delay: 1800 },
  { html: demoShell('npx vitest run test/config.test.ts', 'FAIL  config › empty file\nSyntaxError: Unexpected end of JSON input\n\nTests  1 failed | 7 passed', 'error'), delay: 2200 },
  { html: demoThought('Treating blank files as empty settings'), delay: 1300 },
  { html: demoEdit('src/config/load.ts', [['removed', '-13 return JSON.parse(source);'], ['added', '+13 const text = source.trim();'], ['added', '+14 return text ? JSON.parse(text) : {};']]), delay: 2100 },
  { html: demoShell('npx vitest run test/config.test.ts', '✓ test/config.test.ts (8 tests)\n\nTest Files  1 passed\nTests       8 passed', 'success', '1.2s'), delay: 2000 },
  { html: demoReply('Empty files now return {}. All 8 config tests pass.'), delay: 2400 },
  { prompt: 'Use LF line endings in generated release notes', time: '15:21', delay: 1100 },
  { html: demoThought('Checking how the output file is written'), delay: 1400 },
  { html: demoRead('scripts/release-notes.mjs', '15-22', '16 const body = await renderNotes(releases);\n17 await writeFile(target, body, "utf8");'), delay: 1900 },
  { html: demoShell('git check-attr text eol -- docs/releases.md', 'docs/releases.md: text: auto\ndocs/releases.md: eol: unspecified', 'success', '0.2s'), delay: 1700 },
  { html: demoThought('Normalizing the generated text before writing'), delay: 1200 },
  { html: demoEdit('scripts/release-notes.mjs', [['removed', '-17 await writeFile(target, body, "utf8");'], ['added', String.raw`+17 const output = body.replace(/\r\n/g, "\n");`], ['added', '+18 await writeFile(target, output, "utf8");']]), delay: 2300 },
  { html: demoShell('npx vitest run test/release-notes.test.ts', '✓ keeps existing LF line endings\n✓ normalizes CRLF input\n✓ preserves the final newline\n\nTests  6 passed', 'success', '0.6s'), delay: 2300 },
  { html: demoReply('Release notes now use LF on every platform. All 6 tests pass.'), delay: 2400 },
  { prompt: 'Review the changes', time: '15:23', delay: 1200 },
  { html: demoThought('Checking the diff and whitespace'), delay: 1500 },
  { html: demoShell('git diff --check && git diff --stat', 'src/config/load.ts        | 3 ++-\nscripts/release-notes.mjs  | 3 ++-\n2 files changed, 4 insertions(+), 2 deletions(-)', 'success', '0.3s'), delay: 2200 },
  { html: demoReply('Review complete\n- Blank config files are handled.\n- Release notes use consistent line endings.\n- 14 tests pass. Nothing has been committed.'), delay: 3200 },
];

const content = document.querySelector('#demo-content');
const transcript = document.querySelector('#demo-transcript');
const inputDraft = document.querySelector('#demo-input-text');
const latestDemo = document.querySelector('#demo-latest');
const activity = document.querySelector('.terminal-activity');
const activityLabel = document.querySelector('#demo-activity');
const announcement = document.querySelector('#demo-announcement');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Reveal the headline once; keep it fully colored without JS or with reduced motion.
const heroTitle = document.querySelector('#hero-title');
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  heroTitle.classList.add('hero-title-pending');
  const heroObserver = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    heroTitle.classList.remove('hero-title-pending');
    heroTitle.classList.add('hero-title-revealed');
    heroObserver.disconnect();
  }, { threshold: .25 });
  heroObserver.observe(heroTitle);
}
let demoTimer;
let demoIndex = 0;
let demoStarted = false;
let demoInView = false;
let readingOutput = false;
let unreadMessages = 0;
let demoWorking = false;
const canPlayDemo = () => demoStarted && demoInView && !document.hidden
  && !reducedMotion.matches;

function updateDemoStatus() {
  latestDemo.hidden = !readingOutput;
  latestDemo.textContent = unreadMessages
    ? `${unreadMessages} new message${unreadMessages === 1 ? '' : 's'} (Ctrl+End) ↓`
    : 'Jump to bottom (Ctrl+End) ↓';
  const working = canPlayDemo() && demoWorking;
  activity.classList.toggle('is-working', working);
  activityLabel.textContent = working ? 'Working…' : '';
  if (!readingOutput) content.scrollTop = content.scrollHeight;
}

function appendDemoEvent(event, animate = true) {
  let previousTop = content.scrollTop;
  const template = document.createElement('template');
  template.innerHTML = event.prompt ? demoPrompt(event.prompt, event.time) : event.html;
  const block = template.content.firstElementChild;
  // Each submitted prompt stays pinned only within its own turn's output.
  if (block.classList.contains('terminal-prompt') || !transcript.lastElementChild) {
    const turn = document.createElement('div');
    turn.className = 'terminal-turn';
    transcript.appendChild(turn);
  }
  transcript.lastElementChild.appendChild(block);
  if (animate && !reducedMotion.matches && block.animate) {
    block.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
  }
  // Bound scrollback without moving the reader when older, offscreen turns expire.
  while (transcript.childElementCount > 12) {
    previousTop -= transcript.firstElementChild.getBoundingClientRect().height
      + parseFloat(getComputedStyle(transcript).rowGap);
    transcript.firstElementChild.remove();
  }
  demoWorking = event.working !== false;
  if (readingOutput) {
    unreadMessages += 1;
    content.scrollTop = Math.max(0, previousTop);
  } else {
    content.scrollTop = content.scrollHeight;
  }
}

function scheduleDemo(delay = 900) {
  clearTimeout(demoTimer);
  updateDemoStatus();
  if (!canPlayDemo()) return;
  demoTimer = setTimeout(() => {
    if (!canPlayDemo()) return;
    const event = demoEvents[demoIndex];
    if (event.prompt && inputDraft.textContent.length < event.prompt.length) {
      demoWorking = false;
      inputDraft.textContent = event.prompt.slice(0, inputDraft.textContent.length + 1);
      inputDraft.scrollLeft = inputDraft.scrollWidth;
      // Hold the completed draft briefly before submitting it to the transcript.
      scheduleDemo(inputDraft.textContent === event.prompt ? 550 : 38);
      return;
    }
    inputDraft.textContent = '';
    appendDemoEvent(event);
    demoIndex = (demoIndex + 1) % demoEvents.length;
    scheduleDemo(event.delay);
  }, delay);
}

function playExample() {
  clearTimeout(demoTimer);
  transcript.replaceChildren();
  inputDraft.textContent = '';
  demoWorking = false;
  demoStarted = true;
  readingOutput = false;
  unreadMessages = 0;
  demoIndex = 0;
  if (reducedMotion.matches) {
    // A complete, static example rather than an endless reduced-motion stream.
    for (const event of demoEvents.slice(0, 8)) appendDemoEvent(event, false);
    updateDemoStatus();
    return;
  }
  scheduleDemo(500);
}

function replayDemo() {
  playExample();
  announcement.textContent = 'Fictional terminal playback restarted. No commands are executed.';
}
document.querySelector('#replay-demo').addEventListener('click', replayDemo);
document.querySelector('#tab-build').addEventListener('click', replayDemo);
function jumpToLatest() {
  readingOutput = false;
  unreadMessages = 0;
  content.scrollTop = content.scrollHeight;
  if (document.activeElement === latestDemo) content.focus({ preventScroll: true });
  updateDemoStatus();
}
latestDemo.addEventListener('click', jumpToLatest);
document.querySelector('.terminal').addEventListener('keydown', event => {
  if (event.ctrlKey && event.key === 'End') {
    event.preventDefault();
    jumpToLatest();
  }
});
content.addEventListener('scroll', () => {
  readingOutput = content.scrollHeight - content.scrollTop - content.clientHeight > 24;
  if (!readingOutput) unreadMessages = 0;
  updateDemoStatus();
}, { passive: true });
reducedMotion.addEventListener('change', playExample);
document.addEventListener('visibilitychange', () => scheduleDemo());

// Pause out of view or in a hidden tab, and continue from the same event on return.
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    demoInView = entries.some(entry => entry.isIntersecting);
    if (demoInView && !demoStarted) playExample();
    else scheduleDemo();
  }, { threshold: 0 });
  observer.observe(document.querySelector('.terminal'));
} else {
  demoInView = true;
  playExample();
}

// Progressively inline our local SVGs so their internal details can animate.
// Keep the original image if loading fails; prefix IDs to isolate masks and filters.
async function prepareIllustration(image, index) {
  try {
    const url = new URL(image.src);
    if (url.origin !== location.origin) return;
    const response = await fetch(url);
    if (!response.ok) return;
    const parsed = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
    if (parsed.querySelector('parsererror') || parsed.documentElement.localName !== 'svg') return;
    const svg = document.importNode(parsed.documentElement, true);
    const ids = new Map();
    for (const node of svg.querySelectorAll('[id]')) {
      const original = node.id;
      ids.set(original, `illustration-${index}-${original}`);
      node.id = ids.get(original);
    }
    for (const node of [svg, ...svg.querySelectorAll('*')]) {
      for (const attribute of [...node.attributes]) {
        const value = attribute.value.replace(/url\(#([\w-]+)\)/g,
          (match, id) => ids.has(id) ? `url(#${ids.get(id)})` : match);
        if (value !== attribute.value) node.setAttribute(attribute.name, value);
      }
    }
    svg.setAttribute('class', image.className);
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    image.replaceWith(svg);
  } catch {
    // The static image is a complete fallback, including the A1 cutout.
  }
}
const illustrationImages = [...document.querySelectorAll('img.feature-art')];
if ('IntersectionObserver' in window) {
  const illustrationObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      illustrationObserver.unobserve(entry.target);
      prepareIllustration(entry.target, illustrationImages.indexOf(entry.target));
    }
  }, { rootMargin: '200px' });
  illustrationImages.forEach(image => illustrationObserver.observe(image));
} else {
  illustrationImages.forEach(prepareIllustration);
}

const getA1Button = document.querySelector('.header-actions .button');
getA1Button.addEventListener('click', () => {
  if (reducedMotion.matches) return;
  getA1Button.classList.remove('is-activated');
  // Restart a short, one-shot accent even on repeated clicks; navigation stays native.
  void getA1Button.offsetWidth;
  getA1Button.classList.add('is-activated');
});
getA1Button.addEventListener('animationend', (event) => {
  if (event.animationName === 'button-rainbow-click') getA1Button.classList.remove('is-activated');
});
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) getA1Button.classList.remove('is-activated');
});

const copyButton = document.querySelector('#copy-install');
const copyStatus = document.querySelector('#copy-status');
const copySheen = document.querySelector('.copy-sheen');
let copyReset;
let copyAnimation;

function animateCopy() {
  copyAnimation?.cancel();
  if (reducedMotion.matches || !copySheen.animate) return;
  copyAnimation = copySheen.animate([
    { transform: 'translateX(-110%)', opacity: 0 },
    { transform: 'translateX(0)', opacity: .35, offset: .45 },
    { transform: 'translateX(110%)', opacity: 0 },
  ], { duration: 1100, easing: 'cubic-bezier(.2, .65, .3, 1)' });
}
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) copyAnimation?.cancel();
});

copyButton.addEventListener('click', async () => {
  clearTimeout(copyReset);
  const command = document.querySelector('#install-command');
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(command.textContent);
    copyStatus.textContent = 'Copied';
    copyButton.setAttribute('aria-label', 'Install command copied');
    animateCopy();
  } catch {
    const range = document.createRange();
    range.selectNodeContents(command);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    copyStatus.textContent = 'Selected — copy manually';
  }
  copyReset = setTimeout(() => {
    copyStatus.textContent = '';
    copyButton.setAttribute('aria-label', 'Copy install command');
  }, 6000);
});
