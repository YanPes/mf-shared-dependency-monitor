import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  source: {
    entry: {
      popup: './src/popup/index.tsx',
    }
  },
  plugins: [
    pluginReact()
  ],
  html: {
    template: "./public/popup.html",
  }
});
