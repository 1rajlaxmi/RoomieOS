import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Add this import

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Add this plugin
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // Add this alias configuration
    },
  },
})