'use strict';

// Authored local illustrations only: no commands, model calls, or user data.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const panels = [...document.querySelectorAll('.demo-panel')];
const announcement = document.querySelector('#demo-announcement');
let replayTimer;

function stopReplay() {
  clearTimeout(replayTimer);
  panels.forEach(panel => panel.classList.remove('is-replaying'));
}

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
  if (event.animationName === 'copy-flash') stopCopyAnimation();
});
reducedMotion.addEventListener('change', stopCopyAnimation);
copyButton.addEventListener('click', async () => {
  clearTimeout(copyReset);
  stopCopyAnimation();
  const command = document.querySelector('#install-command');
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(command.textContent);
    copyStatus.textContent = 'Copied. Paste it into your terminal to install a1.';
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

// Roadmap: on desktop the versions scroll horizontally. Arrows step through them and the strip opens on the current version.
const roadmap = document.querySelector('.roadmap');
const roadmapControls = document.querySelector('.roadmap-controls');
const roadmapArrows = [...document.querySelectorAll('[data-roadmap-step]')];
const syncRoadmapArrows = () => {
  const max = roadmap.scrollWidth - roadmap.clientWidth - 1;
  roadmapArrows[0].disabled = roadmap.scrollLeft <= 1;
  roadmapArrows[1].disabled = roadmap.scrollLeft >= max;
  roadmap.classList.toggle('fade-start', !roadmapArrows[0].disabled);
  roadmap.classList.toggle('fade-end', !roadmapArrows[1].disabled);
};
const showCurrentRoadmapItem = () => {
  const current = roadmap.querySelector('.is-current');
  if (!current) return;
  roadmap.style.scrollBehavior = 'auto';
  roadmap.scrollLeft = Math.max(0, current.offsetLeft - current.offsetWidth);
  roadmap.style.scrollBehavior = '';
  syncRoadmapArrows();
};
if (roadmap && roadmapControls) {
  roadmapControls.hidden = false;
  roadmapArrows.forEach(arrow => arrow.addEventListener('click', () => {
    const step = roadmap.querySelector('.roadmap-item').offsetWidth * 2;
    roadmap.scrollBy({ left: step * Number(arrow.dataset.roadmapStep), behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  }));
  roadmap.addEventListener('scroll', syncRoadmapArrows, { passive: true });
  // Mouse drag scrolls the strip. Touch and trackpads already scroll natively.
  let drag = null;
  roadmap.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || roadmap.scrollWidth <= roadmap.clientWidth) return;
    drag = { x: event.clientX, left: roadmap.scrollLeft };
    roadmap.setPointerCapture(event.pointerId);
    roadmap.classList.add('is-dragging');
  });
  roadmap.addEventListener('pointermove', event => {
    if (drag) roadmap.scrollLeft = drag.left - (event.clientX - drag.x);
  });
  const endDrag = () => {
    if (!drag) return;
    drag = null;
    roadmap.classList.remove('is-dragging');
  };
  roadmap.addEventListener('pointerup', endDrag);
  roadmap.addEventListener('pointercancel', endDrag);
  window.addEventListener('resize', syncRoadmapArrows);
  showCurrentRoadmapItem();
}

// Roadmap reveal: versions rise in one after another the first time the strip scrolls into view.
if (roadmap && 'IntersectionObserver' in window && !reducedMotion.matches) {
  roadmap.querySelectorAll('.roadmap-item').forEach((item, index) => item.style.setProperty('--i', index));
  roadmap.classList.add('roadmap-animate');
  const revealObserver = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    roadmap.classList.add('is-revealed');
    revealObserver.disconnect();
  }, { threshold: 0.25 });
  revealObserver.observe(roadmap);
}

// Published versions from npm. The release (latest) and develop (next) tags fall back to their tag names, and the 0.2.0 roadmap highlight stays, if this fails.
const npmVersion = tag => fetch(`https://registry.npmjs.org/@timurproko/a1/${tag}`)
  .then(response => (response.ok ? response.json() : Promise.reject(response.status)))
  .then(({ version }) => {
    if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) return Promise.reject(version);
    const label = document.querySelector(`[data-npm-tag="${tag}"]`);
    if (label) label.textContent = `v${version}`;
    return version;
  });

npmVersion('latest')
  .then(version => {
    const [major, minor] = version.split('.');
    const target = document.querySelector(`.roadmap-item[data-version="${major}.${minor}.0"]`);
    if (!target) return;
    document.querySelectorAll('.roadmap-item').forEach(item => {
      const current = item === target;
      item.classList.toggle('is-current', current);
      if (current) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current');
      item.querySelector('.roadmap-current')?.remove();
    });
    target.querySelector('h3').insertAdjacentHTML('beforeend', '<span class="roadmap-current">current</span>');
    if (roadmap) showCurrentRoadmapItem();
  })
  .catch(() => {});
npmVersion('next').catch(() => {});

// ASCII fields: decorative canvases driven by [data-ascii] scenes. No data involved.
(function asciiFields() {
  const RAMP = ' .·:;-=+*%#@';
  const FPS = 24;
  const MONO = '"JetBrains Mono", "SFMono-Regular", Consolas, monospace';

  // Deterministic per-cell noise so dissolve and dot patterns are stable between frames.
  function hash(x, y) {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
  }
  const smooth = (edge0, edge1, x) => {
    const k = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return k * k * (3 - 2 * k);
  };

  // Sparse background of faint, slowly blinking dots behind every scene.
  function dots(s, t) {
    for (let r = 0; r < s.rows; r += 1) {
      for (let c = 0; c < s.cols; c += 1) {
        const d = hash(c * 0.37, r * 0.91);
        if (d > 0.84 && Math.sin(d * 40 + t * 0.9) > -0.2) s.glyph(c, r, '·', 0);
      }
    }
  }

  const scenes = {
    // The a1 mark dissolves in from nothing, then into the pi symbol and back.
    morph: {
      intro: 1.9, hold: 2.6, span: 1.9,
      setup(s) {
        const sample = (text, weight, size) => {
          const off = document.createElement('canvas');
          off.width = s.cols; off.height = s.rows;
          const o = off.getContext('2d');
          o.fillStyle = '#fff';
          o.textAlign = 'center';
          o.textBaseline = 'middle';
          if ('letterSpacing' in o) o.letterSpacing = text.length > 1 ? '-0.08em' : '0px';
          o.font = `${weight} ${Math.round(size)}px ${MONO}`;
          o.fillText(text, s.cols / 2, s.rows / 2 + s.rows * 0.04);
          const data = o.getImageData(0, 0, s.cols, s.rows).data;
          const out = new Float32Array(s.cols * s.rows);
          for (let i = 0; i < out.length; i += 1) out[i] = data[i * 4 + 3] / 255;
          return out;
        };
        s.shapeA = sample('π', 700, Math.min(s.rows * 1.42, s.cols * 1.3));
        s.shapeB = sample('a1', 600, Math.min(s.rows * 1.02, s.cols * 0.76));
        s.empty = new Float32Array(s.cols * s.rows);
        s.noise = new Float32Array(s.cols * s.rows);
        for (let r = 0; r < s.rows; r += 1) for (let c = 0; c < s.cols; c += 1) s.noise[r * s.cols + c] = hash(c, r);
      },
      staticTime() { return this.intro + this.hold + this.span * 0.5; },
      draw(s, t) {
        let from = s.shapeA, to = s.shapeB, p, forward;
        if (t < this.intro) { from = s.empty; to = s.shapeB; p = Math.max(0, t / this.intro); forward = true; }
        else {
          // Pick the loop up at the a1 hold, so the mark settles before it turns into pi.
          const cycle = (this.hold + this.span) * 2;
          const local = (t - this.intro + this.hold + this.span) % cycle;
          if (local < this.hold) { p = 0; forward = true; }
          else if (local < this.hold + this.span) { p = (local - this.hold) / this.span; forward = true; }
          else if (local < this.hold * 2 + this.span) { p = 1; forward = false; }
          else { p = 1 - (local - this.hold * 2 - this.span) / this.span; forward = false; }
        }
        const morphing = p > 0 && p < 1;
        for (let r = 0; r < s.rows; r += 1) {
          for (let c = 0; c < s.cols; c += 1) {
            const i = r * s.cols + c;
            const a = from[i], b = to[i];
            const sweep = forward ? c / s.cols : 1 - c / s.cols;
            const threshold = sweep * 0.55 + s.noise[i] * 0.45;
            const mix = smooth(threshold - 0.18, threshold + 0.18, p);
            let value = a + (b - a) * mix;
            value *= 0.78 + 0.22 * Math.sin(c * 0.55 + t * 1.1) * Math.cos(r * 0.6 - t * 0.9);
            if (morphing && mix > 0.08 && mix < 0.92 && s.noise[i] > 0.35 && (a > 0.05 || b > 0.05)) {
              const scramble = hash(c + Math.floor(t * 18), r);
              s.glyph(c, r, RAMP[1 + Math.floor(scramble * (RAMP.length - 1))], 8);
            } else if (value * RAMP.length >= 1) {
              s.plot(c, r, value, 2 + Math.round(value * 6));
            } else {
              const d = hash(c * 0.37, r * 0.91);
              if (d > 0.84 && Math.sin(d * 40 + t * 0.9) > -0.2) s.glyph(c, r, '·', 0);
            }
          }
        }
      },
    },

    // A slowly turning wireframe sphere with a light sweeping across it.
    sphere: {
      staticTime() { return 2.4; },
      draw(s, t) {
        dots(s, t);
        const cx = s.cols / 2, cy = s.rows / 2;
        const radius = Math.min(s.cols, s.rows) * 0.42;
        const tilt = 0.42, spin = t * 0.3;
        const ct = Math.cos(tilt), st = Math.sin(tilt);
        const cs = Math.cos(spin), ss = Math.sin(spin);
        for (let r = 0; r < s.rows; r += 1) {
          for (let c = 0; c < s.cols; c += 1) {
            const x = c - cx + 0.5, y = r - cy + 0.5;
            if (Math.hypot(x, y) >= radius) continue;
            const nx = x / radius, ny = y / radius;
            const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
            const py = ny * ct - nz * st, pz = ny * st + nz * ct;
            const qx = nx * cs + pz * ss, qz = pz * cs - nx * ss;
            const lat = Math.asin(Math.max(-1, Math.min(1, py)));
            const lon = Math.atan2(qx, qz);
            const meridians = Math.pow(Math.abs(Math.sin(lon * 4)), 18);
            const parallels = Math.pow(Math.abs(Math.sin(lat * 4)), 18);
            const light = Math.max(0, -nx * 0.35 - ny * 0.45 + nz * 0.8);
            const band = 0.5 + 0.5 * Math.sin(lat * 3 + lon * 2 - t * 1.3);
            const value = 0.05 + light * (0.5 + 0.5 * band) * 0.62 + Math.max(meridians, parallels) * 0.45;
            if (value * RAMP.length >= 1) s.plot(c, r, value, 2 + Math.round(nz * 6));
          }
        }
      },
    },

    // Sea: an undulating surface line with textured water filling the space beneath it.
    waves: {
      ramp: ' .·:;~=+*%#@',
      staticTime() { return 1.2; },
      draw(s, t) {
        const rows = s.rows, cols = s.cols;
        for (let c = 0; c < cols; c += 1) {
          const x = (c + 0.5) / cols;
          const swell = Math.sin(x * 22 + t * 0.5) * 0.55 + Math.sin(x * 41 - t * 0.8) * 0.3 + Math.sin(x * 9 + t * 0.3) * 0.15;
          const surface = rows * 0.4 + swell * rows * 0.2;
          const inner = rows * 0.76 + (Math.sin(x * 18 - t * 0.45 + 2) * 0.6 + Math.sin(x * 35 + t * 0.7) * 0.4) * rows * 0.1;
          for (let r = 0; r < rows; r += 1) {
            const y = r + 0.5;
            const d = y - surface;
            if (d < -0.5) continue;
            if (d < 0.5) { s.glyph(c, r, '~', 8); continue; }
            if (Math.abs(y - inner) < 0.5) { s.glyph(c, r, '~', 5); continue; }
            // Water body: gentle moving bands that follow the surface, denser with depth.
            const depth = d / Math.max(1, rows - surface);
            const band = 0.5 + 0.5 * Math.sin(d * 1.4 - t * 1.1 + x * 7);
            const value = 0.1 + depth * 0.22 + band * 0.18;
            s.plot(c, r, value, 1 + Math.round(depth * 3));
          }
        }
      },
    },

    // The classic spinning torus, shaded by a fixed light.
    torus: {
      staticTime() { return 1.6; },
      setup(s) { s.depth = new Float32Array(s.cols * s.rows); s.lum = new Float32Array(s.cols * s.rows); },
      draw(s, t) {
        dots(s, t);
        s.depth.fill(0); s.lum.fill(0);
        const A = 1.1 + t * 0.55, B = 0.5 + t * 0.28;
        const cA = Math.cos(A), sA = Math.sin(A), cB = Math.cos(B), sB = Math.sin(B);
        const R1 = 1, R2 = 2, K2 = 5;
        // Scaled so the spinning outline reaches the same radius as the sphere (0.42).
        const K1 = Math.min(s.cols, s.rows) * K2 / (2 * (R1 + R2)) * 0.69;
        const cx = s.cols / 2, cy = s.rows / 2;
        for (let theta = 0; theta < 6.28; theta += 0.07) {
          const ct = Math.cos(theta), st = Math.sin(theta);
          for (let phi = 0; phi < 6.28; phi += 0.02) {
            const cp = Math.cos(phi), sp = Math.sin(phi);
            const circleX = R2 + R1 * ct, circleY = R1 * st;
            const x = circleX * (cB * cp + sA * sB * sp) - circleY * cA * sB;
            const y = circleX * (sB * cp - sA * cB * sp) + circleY * cA * cB;
            const z = K2 + cA * circleX * sp + circleY * sA;
            const ooz = 1 / z;
            const xp = Math.floor(cx + K1 * ooz * x);
            const yp = Math.floor(cy - K1 * ooz * y);
            if (xp < 0 || xp >= s.cols || yp < 0 || yp >= s.rows) continue;
            const L = cp * ct * sB - cA * ct * sp - sA * st + cB * (cA * st - ct * sA * sp);
            const i = yp * s.cols + xp;
            if (ooz > s.depth[i]) { s.depth[i] = ooz; s.lum[i] = Math.max(0.08, L / 1.5); }
          }
        }
        for (let r = 0; r < s.rows; r += 1) {
          for (let c = 0; c < s.cols; c += 1) {
            const i = r * s.cols + c;
            if (s.depth[i] > 0) s.plot(c, r, Math.min(1, s.lum[i]), 2 + Math.round(Math.min(1, s.lum[i]) * 6));
          }
        }
      },
    },
  };

  function mount(field) {
    const scene = scenes[field.dataset.ascii];
    const canvas = field.querySelector('canvas');
    const ctx = canvas?.getContext('2d', { alpha: true });
    if (!scene || !canvas || !ctx) return;

    const rgb = (getComputedStyle(field).getPropertyValue('--ascii-rgb').trim() || '255,255,255');
    const colors = [];
    for (let i = 0; i <= 8; i += 1) colors.push(`rgba(${rgb},${(0.14 + (i / 8) * 0.86).toFixed(3)})`);

    const s = { cols: 0, rows: 0, cell: 12, width: 0, height: 0, offsetX: 0, offsetY: 0 };
    s.glyph = (c, r, ch, level) => {
      ctx.fillStyle = colors[Math.max(0, Math.min(8, level))];
      ctx.fillText(ch, s.offsetX + (c + 0.5) * s.cell, s.offsetY + (r + 0.5) * s.cell);
    };
    const ramp = scene.ramp || RAMP;
    s.plot = (c, r, value, level) => {
      const index = Math.min(ramp.length - 1, Math.floor(value * ramp.length));
      if (index > 0) s.glyph(c, r, ramp[index], level);
    };

    // Scenes with an intro start once the hero is revealed, so the art builds in alongside the copy.
    let raf = 0, last = 0, startedAt = 0, visible = true, held = Boolean(scene.intro);
    if (held) (window.heroReady || Promise.resolve()).then(() => { held = false; sync(); });

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      s.width = Math.max(field.clientWidth, 1);
      s.height = Math.max(field.clientHeight, 1);
      s.cell = s.width >= 480 ? 11 : s.width >= 320 ? 9 : 8;
      s.cols = Math.floor(s.width / s.cell);
      s.rows = Math.floor(s.height / s.cell);
      s.offsetX = (s.width - s.cols * s.cell) / 2;
      s.offsetY = (s.height - s.rows * s.cell) / 2;
      canvas.width = Math.round(s.width * dpr);
      canvas.height = Math.round(s.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `500 ${Math.round(s.cell * 0.98)}px ${MONO}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      scene.setup?.(s);
    }

    function draw(t) {
      ctx.clearRect(0, 0, s.width, s.height);
      scene.draw(s, t);
    }

    const currentTime = () => (performance.now() - (startedAt || performance.now())) / 1000;

    function frame(now) {
      raf = 0;
      if (!visible || document.hidden || reducedMotion.matches) return;
      if (now - last >= 1000 / FPS) {
        last = now;
        draw((now - startedAt) / 1000);
      }
      raf = requestAnimationFrame(frame);
    }
    function play() {
      if (raf || held || reducedMotion.matches) return;
      if (!startedAt) startedAt = performance.now();
      raf = requestAnimationFrame(frame);
    }
    function pause() { cancelAnimationFrame(raf); raf = 0; }
    function redraw() { resize(); draw(reducedMotion.matches ? scene.staticTime() : currentTime()); }
    function sync() {
      if (reducedMotion.matches) { pause(); draw(scene.staticTime()); return; }
      if (visible && !document.hidden) play(); else pause();
    }

    redraw();
    if (document.fonts?.ready) document.fonts.ready.then(redraw);
    if ('ResizeObserver' in window) new ResizeObserver(redraw).observe(field);
    else window.addEventListener('resize', redraw);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); sync(); }, { rootMargin: '120px 0px' }).observe(field);
    }
    document.addEventListener('visibilitychange', sync);
    reducedMotion.addEventListener('change', sync);
    sync();
  }

  document.querySelectorAll('[data-ascii]').forEach(mount);
})();

// Header nav: sliding underline that follows the section in view.
(function navIndicator() {
  const nav = document.querySelector('.site-nav');
  if (!nav) return;
  const links = [...nav.querySelectorAll('a[href^="#"]')];
  if (!links.length || links.some(link => !document.querySelector(link.getAttribute('href')))) return;
  const indicator = document.createElement('span');
  indicator.className = 'nav-indicator';
  indicator.setAttribute('aria-hidden', 'true');
  nav.appendChild(indicator);

  // Every section the page tracks, one per header nav link.
  const entries = links.map(link => ({ text: link.textContent, href: link.getAttribute('href'), navLink: link, target: document.querySelector(link.getAttribute('href')) }));

  let active = null;
  let locked = false;
  let unlockTimer = 0;
  let lockStarted = 0;

  // Release the hold once the smooth scroll has been idle briefly (or after 3s at most).
  function scheduleUnlock() {
    clearTimeout(unlockTimer);
    const wait = performance.now() - lockStarted > 3000 ? 0 : 150;
    unlockTimer = setTimeout(() => { locked = false; spy(); }, wait);
  }

  // Freeze the current label while a smooth scroll travels past other sections.
  function hold() {
    locked = true;
    lockStarted = performance.now();
    scheduleUnlock();
  }

  // Mobile: a toggle naming the current section that opens a list of all sections.
  const menu = document.querySelector('.section-menu');
  const toggle = menu?.querySelector('.section-menu-toggle');
  const label = menu?.querySelector('.section-menu-label');
  const list = menu?.querySelector('.section-menu-list');
  const homeLink = list ? document.createElement('a') : null;
  if (list) {
    homeLink.href = '#';
    homeLink.textContent = 'Home';
    list.appendChild(homeLink);
    entries.forEach(entry => {
      entry.menuLink = document.createElement('a');
      entry.menuLink.href = entry.href;
      entry.menuLink.textContent = entry.text;
      list.appendChild(entry.menuLink);
    });
  }

  function setMenu(open) {
    if (!toggle) return;
    toggle.setAttribute('aria-expanded', String(open));
    list.hidden = !open;
  }

  if (toggle) {
    toggle.addEventListener('click', () => setMenu(list.hidden));
    document.addEventListener('click', event => { if (!menu.contains(event.target)) setMenu(false); });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !list.hidden) { setMenu(false); toggle.focus(); }
    });
  }

  function move(entry) {
    active = entry;
    const link = entry?.navLink || null;
    links.forEach(item => item.classList.toggle('is-active', item === link));
    entries.forEach(item => item.menuLink?.classList.toggle('is-active', item === entry));
    homeLink?.classList.toggle('is-active', !entry);
    if (label) label.textContent = entry ? entry.text : 'Home';
    if (!link) { indicator.style.opacity = '0'; return; }
    indicator.style.opacity = '1';
    indicator.style.width = link.offsetWidth + 'px';
    indicator.style.transform = 'translateX(' + link.offsetLeft + 'px)';
  }

  function spy() {
    if (locked) { scheduleUnlock(); return; }
    const headerHeight = document.querySelector('.site-header')?.offsetHeight || 72;
    const line = headerHeight + 2;
    let current = null;
    entries.forEach(entry => {
      if (entry.target.getBoundingClientRect().top <= line) current = entry;
    });
    if (current !== active) move(current);
  }

  function select(entry) {
    hold();
    move(entry);
    setMenu(false);
  }

  entries.forEach(entry => {
    entry.navLink?.addEventListener('click', () => select(entry));
    entry.menuLink?.addEventListener('click', () => select(entry));
  });
  const installEntry = entries.find(entry => entry.href === '#get-started');
  if (installEntry) document.querySelectorAll('a[href="#get-started"]').forEach(link => {
    if (link !== installEntry.menuLink && link !== installEntry.navLink) link.addEventListener('click', () => select(installEntry));
  });
  homeLink?.addEventListener('click', () => select(null));
  // The logo scrolls home: keep the current label until the page reaches the top.
  document.querySelector('.brand')?.addEventListener('click', () => { hold(); setMenu(false); });
  window.addEventListener('scroll', spy, { passive: true });
  window.addEventListener('resize', () => { if (active) move(active); spy(); });
  if (document.fonts?.ready) document.fonts.ready.then(() => { if (active) move(active); });
  move(null);
  spy();
})();
