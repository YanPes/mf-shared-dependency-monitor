# Module Federation Remote Viewer

A Chrome and Firefox extension that shows all connected Module Federation remotes on the current page.

## Features

- Lists all remotes connected to the host application
- Displays remote name, alias (if any), and entry URL
- Refresh button to re-scan the page
- Supports both Webpack Module Federation and `@module-federation/enhanced` runtimes

## Installation

### Chrome

1. Run `npm run build`
2. Open `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist` folder

### Firefox

1. Run `npm run build`
2. Open `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on" and select `dist/manifest.json`

## Usage

1. Navigate to a page that uses Module Federation (host application)
2. Click the extension icon
3. View the list of connected remotes
4. Click the refresh (↻) button to re-scan if the page loaded remotes dynamically

## Development

```bash
npm install
npm run dev
```

The extension is built to the `dist` folder. Reload the extension in your browser after changes.
