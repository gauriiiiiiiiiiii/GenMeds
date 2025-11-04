import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
// FIX: Explicitly import `cwd` from `process` to resolve TypeScript error "Property 'cwd' does not exist on type 'Process'".
import { cwd } from 'process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, cwd(), '');
  return {
    define: {
      // Vite strips out unknown env variables by default. This exposes your API key to the client code.
      // FIX: Changed env.VITE_API_KEY to env.GEMINI_API_KEY to match the user's .env file.
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    plugins: [react()],
  }
})