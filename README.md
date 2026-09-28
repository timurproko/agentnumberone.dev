# Launch and test

## Launch

Requires Node.js (already installed on this machine). No Python, `npm install`, or build step needed.

```sh
cd D:/Git/agentnumberone.dev
npm run dev
```

Keep the terminal open and visit <http://localhost:4173>. After editing files, refresh the browser; no server restart is needed.

## Stop / restart

Press `Ctrl+C` in the server terminal to stop it. Run `npm run dev` again to restart.

If port 4173 is occupied by the earlier background preview, stop that preview once in PowerShell, then start the new server:

```powershell
Get-NetTCPConnection -LocalPort 4173 -State Listen |
  Select-Object -ExpandProperty OwningProcess -Unique |
  ForEach-Object { Stop-Process -Id $_ }
npm run dev
```

Only use this command when port 4173 belongs to the preview you want to stop.

## Test on another device

Connect to the same Wi-Fi and open `http://<your-computer-ip>:4173`. Run `ipconfig` to find the Wi-Fi IPv4 address (currently `192.168.0.215`; it can change). Allow Node.js through Windows Firewall on private networks if prompted. The preview listens on all network interfaces, so use it only on a trusted network.

## Test

- Check desktop and mobile layouts.
- The tab bar is temporarily hidden for the single illustration; its markup, styling, and event handler are retained. Remove `hidden` from `.workflow-controls` when adding more illustrations. Confirm no tab bar, underline, or reserved gap appears while hidden.
- Watch each fictional prompt type into the input, pause briefly, then appear in the transcript as the input clears. Reads, red/green diffs, failed tests, fixes, and replies follow continuously.
- Use Replay repeatedly; it must not duplicate timers or accelerate playback.
- Use Tab to focus the scrollable output. Scrolling up preserves your position while new output continues. The new-message button or Ctrl+End returns to the latest output.
- Check that the submitted prompt pins to the top while scrolling through its turn; the next prompt replaces it. Working scrolls with the transcript, while the editor and footer stay fixed. Replies remain above Working; its row stays reserved while the next prompt is typed.
- Enable reduced motion: a complete, static example should appear immediately.
- Confirm all terminal text, including the footer and Working status, uses the same monospace size and character-cell spacing.
- Check the editor uses a separator row, one input row, then another separator row; the status bar follows immediately with no added margin. Block gaps and the space before Working share the same half-row spacing as the editor-rule inset. Working stays bottom-aligned while following output; its gap to the upper editor rule matches the footer’s gap to the lower rule.
- Confirm the terminal stays the same height throughout playback, including on mobile.
- Check that playback pauses out of view and in hidden tabs, and that scrollback remains bounded after several loops.
- This is fictional, authored content—not an actual session. No commands or model requests are executed.
- Check the install section’s subtle moving iridescent background; reduced motion should keep it static.
- Copy the install command and paste it into a text editor to verify it.
- Open and close the FAQs.
- Check navigation links and use `Tab` to test keyboard navigation.
