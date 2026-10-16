import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development, any request starting with /api is forwarded to Django.
// This means no CORS setup is needed.
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
});
