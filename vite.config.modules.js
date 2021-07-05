import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  envDir: path.join(__dirname, "envs"),
  plugins: [reactRefresh()],
  build: {
    outDir: path.join(__dirname, "build-modules"),
    rollupOptions: {
      input: path.join(__dirname, 'index_modules.html'),
    }
  }
})
