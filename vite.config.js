import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode, isPreview }) => {
  // Preview serves the already built files; environment values are embedded at build time.
  if (!isPreview) {
    const env = loadEnv(mode, process.cwd())
    const missing = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY']
      .filter((name) => !env[name]?.trim())

    if (missing.length > 0) {
      throw new Error(`環境変数が未設定です: ${missing.join(', ')}。READMEの環境変数設定を確認してください。`)
    }
  }

  return { plugins: [react()] }
})
