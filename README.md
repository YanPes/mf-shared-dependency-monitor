# Module Federation Inspector

> **Disclaimer:** This extension is still under development and is **not published yet** on the Chrome Web Store or Firefox Add-ons store.

Browser extension for teams running micro-frontends with Module Federation.

It shows:
- which remotes are actually loaded at runtime
- which remotes are only configured but not yet fetched
- where shared dependency versions drift across host/remotes

## The USP

Most tools stop at config-level visibility.  
This extension inspects live runtime signals (`window.__FEDERATION__` and fetched federation resources), so you can catch issues that only exist in real page execution.

In short: **it helps you detect runtime dependency drift before users feel it.**

## Why It Is Useful

- `Faster incident triage`: when a screen breaks after a deployment, quickly confirm which remote entry URLs and versions are actually active.
- `Safer upgrades`: detect shared dependency mismatches (`react`, routers, state libs, etc.) between host and remotes.
- `Better release confidence`: see the difference between “configured remotes” and “fetched remotes” on the current route/session.
- `Works where teams debug`: directly in Chrome/Firefox popup, no app code changes required for basic visibility.

## Who This Is For

- Platform teams owning a Module Federation ecosystem
- Frontend engineers debugging runtime integration bugs
- Release managers validating multi-remote rollouts

## Core Features

- Remotes tab
- Grouping by source:
  - Defined by host application
  - Loaded by other remotes
- Toggle for showing configured (not-yet-fetched) remotes
- Shared dependencies tab with:
  - Version mismatch highlighting
  - Module-to-version mapping
  - Mismatch counter badge
- Refresh scan for dynamic/lazy remote loading

## How It Works

The extension executes a page-context extractor and merges data across frames:
- reads Module Federation runtime metadata when available
- falls back to performance resource entries (`remoteEntry.js`, `mf-manifest.json`)
- aggregates remotes and shared dependency versions into one popup view

## Install

### Chrome (Manifest V3)

1. Build:
   ```bash
   npm install
   npm run build
   ```
2. Open `chrome://extensions`
3. Enable `Developer mode`
4. Click `Load unpacked` and select the `dist` folder

### Firefox

1. Build:
   ```bash
   npm install
   npm run build
   ```
2. Open `about:debugging#/runtime/this-firefox`
3. Click `Load Temporary Add-on`
4. Select `dist/manifest.json`

## Usage

1. Open a page powered by Module Federation.
2. Open the extension popup.
3. Check `Remotes` for what is actually running.
4. Check `Shared dependencies` and resolve any mismatch first.
5. Press `Refresh` after route/login changes if remotes load later.

## Local Development

```bash
npm install
npm run dev
```

Build output goes to `dist/`. Reload the extension after changes.

## Limitations

- Browser pages like `chrome://` and extension pages cannot be scanned.
- Detection quality depends on runtime exposure and loaded resources on the active page.
- Firefox install is temporary unless packaged/signed separately.

## License

MIT (see [LICENSE](./LICENSE)).
