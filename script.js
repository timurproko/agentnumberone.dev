'use strict';

// These are illustrative transcripts, not a live agent or recorded benchmark.
const examples = {
  understand: {
    prompt: 'Find out how authentication works in this project.',
    tools: [['read', 'src/auth/session.ts'], ['bash', "find src -iname '*auth*'"]],
    response: 'Authentication starts in ',
    highlight: 'src/auth/session.ts',
    detail: 'I found the session handler, token validation, and the routes that use them. Here’s how they fit together.',
  },
  build: {
    prompt: 'Add an expiry check to the session token.',
    tools: [['read', 'src/auth/session.ts'], ['edit', 'src/auth/session.ts']],
    response: 'Added an expiry check to ',
    highlight: 'validateSession()',
    detail: 'Expired tokens now return an authentication error. The existing handling for valid sessions is unchanged. Review the diff before keeping it.',
  },
  refine: {
    prompt: 'Now add tests for the edge cases.',
    tools: [['write', 'test/auth/session.test.ts'], ['bash', 'npm test -- session']],
    response: 'Added tests for ',
    highlight: 'valid, expired, and missing tokens',
    detail: 'The example checks pass. Next, review the changes and try the authentication flow in your application.',
  },
};

const content = document.querySelector('#demo-content');
const steps = document.querySelectorAll('[data-step]');
const scanline = document.querySelector('.demo-scanline');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let demoAnimations = [];

function cancelDemoAnimations() {
  for (const animation of demoAnimations) animation.cancel();
  demoAnimations = [];
}

reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) cancelDemoAnimations();
});

function animateExample() {
  if (reducedMotion.matches || !scanline?.animate) return;
  demoAnimations.push(scanline.animate([
    { transform: 'scaleX(0)', opacity: 1, offset: 0 },
    { transform: 'scaleX(1)', opacity: 1, offset: 0.75 },
    { transform: 'scaleX(1)', opacity: 0, offset: 1 },
  ], { duration: 650, easing: 'ease-out' }));

  Array.from(content.children).forEach((row, index) => {
    demoAnimations.push(row.animate([
      { opacity: 0, transform: 'translateY(6px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ], { duration: 300, delay: index * 70, easing: 'ease-out', fill: 'backwards' }));
  });
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function showExample(key) {
  const example = examples[key];
  if (!example) return;
  const fragment = document.createDocumentFragment();
  const prompt = element('p', 'terminal-prompt');
  const arrow = element('span', '', '❯');
  arrow.setAttribute('aria-hidden', 'true');
  prompt.append(arrow, ` ${example.prompt}`);
  fragment.append(prompt);

  for (const [tool, file] of example.tools) {
    const line = element('div', 'tool-line');
    const dot = element('span', 'tool-dot', '●');
    dot.setAttribute('aria-hidden', 'true');
    line.append(dot, element('strong', '', tool), element('span', '', file), element('span', 'tool-done', 'done'));
    fragment.append(line);
  }

  const response = element('div', 'terminal-response');
  const summary = element('p', '', example.response);
  summary.append(element('span', 'code-highlight', example.highlight), '.');
  response.append(summary, element('p', 'dim', example.detail));
  fragment.append(response);
  cancelDemoAnimations();
  content.replaceChildren(fragment);
  for (const step of steps) step.setAttribute('aria-pressed', String(step.dataset.step === key));
  animateExample();
}

for (const step of steps) {
  step.addEventListener('click', () => showExample(step.dataset.step));
}

const copyButton = document.querySelector('#copy-install');
const copyStatus = document.querySelector('#copy-status');
let copyReset;

copyButton.addEventListener('click', async () => {
  clearTimeout(copyReset);
  const command = document.querySelector('#install-command');
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(command.textContent);
    copyStatus.textContent = 'Copied. Paste it into your terminal.';
    copyButton.setAttribute('aria-label', 'Install command copied');
  } catch {
    const range = document.createRange();
    range.selectNodeContents(command);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    copyStatus.textContent = 'Command selected. Use your device’s copy action.';
  }
  copyReset = setTimeout(() => {
    copyStatus.textContent = '';
    copyButton.setAttribute('aria-label', 'Copy install command');
  }, 6000);
});
