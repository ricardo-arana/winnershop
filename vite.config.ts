import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      includeAssets: ['logo.png'],
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: 'WinnerShop',
        short_name: 'WinnerShop',
        description:
          'Organiza tus listas de compras y exporta tus productos fácilmente.',
        theme_color: '#16a34a',
        background_color: '#f7fafc',
        display: 'standalone',
        start_url: '/winnershop/',
        scope: '/winnershop/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,txt}'],
      },
    }),
  ],
  base: '/winnershop/',
})
