# Agent Number One website

English-language, static product site for a1. HTML, CSS, and vanilla JavaScript; no runtime dependencies, build step, analytics, or model calls.

## Preview

```sh
npm run dev
```

Open <http://localhost:4173>. Refresh after editing; no server restart is needed. Stop with `Ctrl+C`. Use `PORT=4174 npm run dev` in Bash for a different port.

The preview listens on all network interfaces. Use it on a trusted network only. To preview on another device on the same network, use `http://<your-computer-ip>:4173` and allow Node.js through your private-network firewall if necessary.

If port 4173 is occupied, use the existing preview or verify which process owns it before stopping anything.

## Structure

- `index.html`: product narrative, illustrative terminal sessions, experience features, pi architecture, comparison table, multi-agent vision, installation, and 17 FAQs.
- `styles.css`: responsive dark design system, restrained rainbow accents, a contrasting light installation section, accessibility and reduced-motion styles.
- `script.js`: accessible demonstration tabs, bounded replay, clipboard fallback, and FAQ Expand all / Collapse all.
- `assets/aurora.svg`: original decorative light-ribbon artwork. The older illustration assets remain available but are not used by this design.
- `server.cjs`: local static preview server. Production remains a static site.

Fonts load from Google Fonts, with system fallbacks. The demo uses authored local examples; it never executes commands, reads project files, or calls a model. Replay is user-triggered, finite, and canceled when the terminal leaves view, the tab is hidden, or reduced motion changes.

## Content and claims

The core positioning is **pi's coding engine, an a1-designed experience, and a multi-agent direction**. Keep copy concrete and conversational: explain actual benefits rather than adding numbered categories, abstract slogans, or invented metrics. The comparison is additive, not a claim that pi extensions cannot offer similar capabilities.

Current copy was checked against the a1 checkout's:

- `README.md`: installer, extension management, and update commands.
- `docs/features/launch-profiles.md`: profile separation and session resume.
- `docs/features/prompt-history.md`: persistent recall, storage, and privacy.
- `docs/architecture/prompt-suggestions.md`: optional suggestions and separate Tab/Enter actions.
- `docs/architecture/boundaries.md`: the multi-agent workspace is on hold and not available today.

The table compares the pi foundation used by a1, not every upstream release or community package. Features can differ between stable and development releases. Recheck these documents before changing availability claims. Do not describe a1 as a shipping multi-agent orchestrator or terminal multiplexer until the implementation is available. Model costs, remote inference, separate profiles, and unencrypted local prompt history are disclosed explicitly.

## Checks

Quick syntax check:

```sh
node --check script.js
```

Browser checklist:

- Check widths 320, 390, 600, 768, 1024, 1440, and 1920px for overflow, clipping, and readable content.
- Switch Build / Review / Extend with pointer and keyboard. Left/Right wrap; Home/End select the first/last tab. Only the active panel is visible.
- Replay repeatedly. Playback must not stack timers, alter layout, or execute commands. Switching tabs or hiding the page should reveal the complete static example.
- Enable reduced motion: no reveal or replay animations, and no smooth scrolling.
- Copy the install command and paste it into a text editor. When clipboard permission is unavailable, the command is selected for manual copying.
- Open and close individual FAQs. Expand all / Collapse all should work after mixed individual states; the label should also track manual changes.
- Without JavaScript, the default Build transcript, comparison, installation command, and native FAQ accordions remain readable and usable. The bulk FAQ control stays hidden.
- Check internal anchors, external documentation links, focus indicators, skip link, and table headers.
- Run an accessibility audit on desktop and mobile, including expanded FAQs and alternate demo panels.

Implementation verification used Playwright/Chromium and axe-core from an external temporary directory, without adding dependencies to this repository.
