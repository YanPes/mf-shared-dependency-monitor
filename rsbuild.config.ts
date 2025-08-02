import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSass } from '@rsbuild/plugin-sass';

export default defineConfig({
  source: {
    entry: {
      popup: './src/popup/index.tsx',
    }
  },
  plugins: [
    pluginReact(),
    pluginSass()
  ],
  html: {
    template: "./public/popup.html",
  }
});
