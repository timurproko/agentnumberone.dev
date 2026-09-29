'use strict';

// Authored local illustrations only: no commands, model calls, or user data.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const tabs = [...document.querySelectorAll('[data-demo]')];
const panels = [...document.querySelectorAll('.demo-panel')];
const announcement = document.querySelector('#demo-announcement');
let replayTimer;

function stopReplay() {
  clearTimeout(replayTimer);
  panels.forEach(panel => panel.classList.remove('is-replaying'));
}

function selectDemo(tab) {
  stopReplay();
  tabs.forEach(item => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
  });
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectDemo(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    selectDemo(tabs[next]);
    tabs[next].focus();
  });
});

panels.forEach(panel => {
  panel.querySelectorAll('.demo-line').forEach((line, index) => {
    line.style.setProperty('--line-index', index);
  });
});

document.querySelector('#replay-demo').addEventListener('click', () => {
  stopReplay();
  const panel = panels.find(item => !item.hidden);
  announcement.textContent = 'Illustrative session. No commands are executed.';
  if (reducedMotion.matches) return;
  // Restart one bounded animation even when Replay is clicked repeatedly.
  void panel.offsetWidth;
  panel.classList.add('is-replaying');
  replayTimer = setTimeout(stopReplay, 3200);
});
reducedMotion.addEventListener('change', stopReplay);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopReplay();
});
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) stopReplay();
  });
  observer.observe(document.querySelector('.terminal'));
}

const copyButton = document.querySelector('#copy-install');
const copyStatus = document.querySelector('#copy-status');
const copyCommand = document.querySelector('.copy-command');
let copyReset;
const stopCopyAnimation = () => copyCommand.classList.remove('is-copied');
copyCommand.addEventListener('animationend', event => {
  if (event.animationName === 'copy-rainbow') stopCopyAnimation();
});
reducedMotion.addEventListener('change', stopCopyAnimation);
copyButton.addEventListener('click', async () => {
  clearTimeout(copyReset);
  stopCopyAnimation();
  const command = document.querySelector('#install-command');
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(command.textContent);
    copyStatus.textContent = 'Copied. Paste it into your terminal to install A1.';
    copyButton.setAttribute('aria-label', 'Install command copied');
    if (!reducedMotion.matches) {
      // Restart the one-shot sweep on every successful copy.
      void copyCommand.offsetWidth;
      copyCommand.classList.add('is-copied');
    }
  } catch {
    const range = document.createRange();
    range.selectNodeContents(command);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    copyStatus.textContent = 'Command selected. Copy it manually.';
  }
  copyReset = setTimeout(() => {
    copyStatus.textContent = '';
    copyButton.setAttribute('aria-label', 'Copy install command');
  }, 6000);
});

// Native details remain usable without JavaScript. The bulk control is an enhancement.
const faqToggle = document.querySelector('#faq-toggle-all');
const questions = [...document.querySelectorAll('.faq-list details')];
if (faqToggle) {
  faqToggle.hidden = false;
  const syncFaqToggle = () => {
    const allOpen = questions.every(question => question.open);
    faqToggle.querySelector('[data-faq-label]').textContent = allOpen ? 'Collapse all' : 'Expand all';
    faqToggle.querySelector('[aria-hidden]').textContent = allOpen ? '−' : '+';
  };
  faqToggle.addEventListener('click', () => {
    const expand = !questions.every(question => question.open);
    questions.forEach(question => { question.open = expand; });
    syncFaqToggle();
  });
  questions.forEach(question => question.addEventListener('toggle', syncFaqToggle));
  syncFaqToggle();
}
