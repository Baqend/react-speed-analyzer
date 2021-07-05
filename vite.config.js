import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  root: path.join(__dirname, "src"),
  envDir: path.join(__dirname, "envs"),
  plugins: [reactRefresh()]
})
