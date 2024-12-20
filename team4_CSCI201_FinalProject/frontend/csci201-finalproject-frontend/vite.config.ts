import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/team4_CSCI201_FinalProject/',
  plugins: [react()],
})
