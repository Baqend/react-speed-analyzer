import {defineConfig, normalizePath} from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
import path from "path";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig({
  envDir: normalizePath("./envs"),
  plugins: [
    reactRefresh(),
    {
      name: 'rename-index',
      closeBundle() {
        fs.renameSync(normalizePath("./build-modules/index_modules.html"), normalizePath("./build-modules/index.html"))
      }
    }
  ],
  build: {
    outDir: path.join(__dirname, "build-modules"),
    rollupOptions: {
      input: path.join(__dirname, 'index_modules.html'),
    }
  }
})
