import { defineConfig } from 'vite';

// User site (ricccardo15.github.io) is served from the domain root, so base = '/'.
export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
  },
});
