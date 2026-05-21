import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/rallye-romand-etiquettes/',
  plugins: [react()],
});
