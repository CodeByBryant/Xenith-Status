import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    // Last deploy time — surfaced as "last updated" on the status page.
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
})
