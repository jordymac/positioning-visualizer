import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-label', 
            '@radix-ui/react-select',
            '@radix-ui/react-slider',
            '@radix-ui/react-slot',
            '@radix-ui/react-tooltip',
            'lucide-react',
            'framer-motion'
          ],
          'vendor-form': [
            'react-hook-form',
            '@hookform/resolvers',
            'zod'
          ],
          'vendor-ai': [
            '@xenova/transformers',
            'openai'
          ],
          'vendor-data': [
            '@supabase/supabase-js',
            '@tanstack/react-query',
            'zustand'
          ],
          'vendor-utils': [
            'class-variance-authority',
            'clsx',
            'tailwind-merge'
          ],
          'vendor-export': [
            'html2canvas',
            'jspdf'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000 // Increase limit to 1MB
  }
})
