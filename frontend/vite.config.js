import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.org/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  }
});
