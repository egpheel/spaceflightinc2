import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/spaceflightinc2/' : '/',
  plugins: [
    tailwindcss(),
    svelte(),
  ],
}))
