import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    /* `node eval/dev-api.mjs` serves the grade function locally on 3001. */
    proxy: { '/api': 'http://127.0.0.1:3001' }
  }
});
