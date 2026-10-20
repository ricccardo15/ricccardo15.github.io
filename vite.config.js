import { defineConfig } from 'vite';
import { generate, PAGES } from './scripts/pages.js';

// Build the HTML pages from content/*.md before Vite starts (dev and build).
await generate();

// In `npm run dev`, regenerate the pages and reload the browser when a content file changes.
const contentWatcher = {
  name: 'content-pages',
  configureServer(server) {
    server.watcher.add('content');
    server.watcher.on('change', async (file) => {
      if (!/content\/.+\.md$/.test(file)) return;
      await generate();
      server.ws.send({ type: 'full-reload' });
    });
  },
};

// User site (ricccardo15.github.io) is served from the domain root, so base = '/'.
export default defineConfig({
  base: '/',
  plugins: [contentWatcher],
  build: {
    outDir: 'dist',
    rollupOptions: { input: PAGES },
  },
});
