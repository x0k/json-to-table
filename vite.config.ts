import { defineConfig } from 'vite'
import path from 'node:path'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/json-to-table/',
  plugins: [react()],
  resolve: {
    alias: {
      lib: path.resolve("src/lib")
    }
  }
})
