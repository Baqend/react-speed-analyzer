import { defineConfig, normalizePath } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  envDir: normalizePath("./envs"),
  plugins: [
    reactRefresh()
  ],
  build: {
    outDir: normalizePath("./build")
  },
})
