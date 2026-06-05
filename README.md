# Module Federation Shared Dependency Monitor
> Browser extension for inspecting live Module Federation remotes and shared dependency drift.
> https://chromewebstore.google.com/detail/module-federation-shared/iihmjeoimfipagokghlfeighikoonila

<img width="640" height="400" alt="image" src="https://github.com/user-attachments/assets/7246542a-6aa8-4455-8308-2d3ed3d562ae" />
<img width="640" height="400" alt="image" src="https://github.com/user-attachments/assets/8c1c0a7d-c060-4b3f-97b8-abd307d92c1b" />
<img width="640" height="400" alt="image" src="https://github.com/user-attachments/assets/aa3128be-ed1b-4ea4-9325-5e102fad399a" />



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


### Browser store notes

- Extension.js builds browser-specific packages under `dist/chrome`, `dist/edge`, and `dist/firefox`.
- Permissions are limited to the active tab workflow (`activeTab`, `scripting`, `tabs`).
- The extension does not send scan data off-device.
- Privacy policy page: `https://yanpes.github.io/mf-shared-dependency-monitor/privacy-policy/`

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

`npm run dev` launches Chrome and Firefox through Extension.js. For a single browser, use `npm run dev:chrome`, `npm run dev:firefox`, or `npm run dev:edge`.

Production builds:

```bash
npm run build
```

Build output goes to `dist/<browser>/`, with zip packages generated for Chrome, Edge, and Firefox.

## Limitations

- Browser pages like `chrome://` and extension pages cannot be scanned.
- Detection quality depends on runtime exposure and loaded resources on the active page.
- Firefox install is temporary unless packaged/signed separately.

## License

MIT (see [LICENSE](./LICENSE)).
