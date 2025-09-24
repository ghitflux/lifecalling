import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/ui': resolve(__dirname, './src/ui'),
      '@/lib': resolve(__dirname, './src/lib'),
    },
  },
})