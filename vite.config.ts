import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves project sites from /<repo>/. Set base accordingly when
// building for Pages via the BASE_PATH env var; defaults to '/' for local dev.
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH || '/',
})
