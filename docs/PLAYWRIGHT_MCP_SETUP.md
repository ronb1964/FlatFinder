# Playwright MCP Setup for Nobara/Fedora (Wayland)

## Problem

On Nobara/Fedora systems with Wayland, the Playwright MCP server's Firefox browser crashes with SIGSEGV due to display server conflicts between Wayland and X11.

**Error:** `Error: Failed to open Wayland display, fallback to X11. WAYLAND_DISPLAY='wayland-0' DISPLAY=':0'`

## Solution

Use **headless Chromium** instead of Firefox for the Playwright MCP server.

### Configuration Command

```bash
# Remove the existing Playwright MCP (if using Firefox)
claude mcp remove playwright -s local

# Add Playwright with headless Chromium
claude mcp add playwright -s local -- npx -y @playwright/mcp@latest --browser chromium --headless
```

### Important: Restart Required

After changing the MCP configuration, you **must restart Claude Code** for the changes to take effect. The MCP server is started when Claude Code launches, and config changes don't affect an already-running server.

### Verify Configuration

```bash
claude mcp get playwright
```

Should show:

```
playwright:
  Scope: Local config (private to you in this project)
  Status: ✓ Connected
  Type: stdio
  Command: npx
  Args: -y @playwright/mcp@latest --browser chromium --headless
```

## Alternative Options

### 1. Headed Chromium (if you want to see the browser)

```bash
claude mcp add playwright -s local -- npx -y @playwright/mcp@latest --browser chromium
```

Note: Headed mode may still have display issues on Wayland. Headless is more reliable.

### 2. Using xvfb-run (virtual framebuffer)

If you need headed mode, you can use xvfb-run to provide a virtual display:

```bash
# Install xvfb if not already installed
sudo dnf install xorg-x11-server-Xvfb

# Run Claude Code with xvfb
xvfb-run claude
```

### 3. Setting Display Environment Variables

For some configurations, setting these environment variables may help:

```bash
export MOZ_ENABLE_WAYLAND=0  # Force X11 for Firefox
export GDK_BACKEND=x11       # Force GTK to use X11
```

## Troubleshooting

### Browser Not Installed

If you see errors about the browser not being installed:

```bash
npx playwright install chromium
```

### Clear Playwright Cache

If you have issues, clear the Playwright browser profiles:

```bash
rm -rf ~/.cache/ms-playwright/mcp-*
```

### Check Installed Browsers

```bash
ls ~/.cache/ms-playwright/
```

Should show directories like:

- `chromium-1200`
- `chromium_headless_shell-1200`
- `firefox-1497`

## References

- [Playwright MCP GitHub](https://github.com/microsoft/playwright-mcp)
- [Playwright Browsers Documentation](https://playwright.dev/docs/browsers)
- [Firefox Wayland Issues (Bugzilla)](https://bugzilla.mozilla.org/show_bug.cgi?id=1898476)
