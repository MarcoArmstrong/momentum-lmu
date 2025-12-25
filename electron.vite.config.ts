import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { join } from 'path'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    css: {
      postcss: './postcss.config.js'
    },
    build: {
      rollupOptions: {
        input: {
          main: join(__dirname, 'src/renderer/index.html'),
          telemetry: join(__dirname, 'src/renderer/telemetry.html')
        }
      }
    }
  }
})
