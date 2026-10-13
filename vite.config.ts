import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

const siteConfig = {
  title: "Gestor de Solicitudes Corporativas — CET Chile",
  description: "Sistema de gestión de solicitudes corporativas para CET Chile. Coordina espacios, activos, personal y materiales desde un solo panel.",
}

export default defineConfig({
  // Rutas absolutas: con './' las rutas profundas (/dashboard/solicitudes) pedían
  // /dashboard/assets/*.js y Netlify devolvía index.html (MIME text/html) => pantalla en blanco.
  base: '/',
  build: {
    sourcemap: false,
    minify: true,
  },
  plugins: [
    react(),
    tailwindcss(),
    siteMetaPlugin(siteConfig),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '8443'),
    strictPort: true,
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.API_PORT || 3001}`,
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '8443'),
  },
})

function siteMetaPlugin(config: { title: string; description: string }): Plugin {
  return {
    name: 'site-meta',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const tags: HtmlTagDescriptor[] = [
          { tag: 'meta', attrs: { name: 'description', content: config.description }, injectTo: 'head' },
          { tag: 'meta', attrs: { property: 'og:title', content: config.title }, injectTo: 'head' },
          { tag: 'meta', attrs: { property: 'og:description', content: config.description }, injectTo: 'head' },
        ]
        return { html, tags }
      },
    },
  }
}
