import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use OS temp cache directory to avoid locked folders in the repo on Windows
  cacheDir: 'C:/Users/jayes/AppData/Local/Temp/ai-plant-vite-cache',
})
