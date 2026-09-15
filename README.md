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
- Click all three workflow examples below the terminal preview.
- Copy the install command and paste it into a text editor to verify it.
- Open and close the FAQs.
- Check navigation links and use `Tab` to test keyboard navigation.
