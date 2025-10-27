import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Custom plugin to generate static HTML files for each route
const generateHtmlPlugin = () => {
  return {
    name: 'generate-html-for-routes',
    writeBundle: async () => {
      // Define all routes from App.jsx
      const routes = [
        { path: '/', component: 'Home' },
        { path: '/about', component: 'About' },
        { path: '/shop', component: 'Shop' },
        { path: '/cart', component: 'Cart' },
        { path: '/favorites', component: 'Favorites' },
        { path: '/buy', component: 'Buy' },
        { path: '/order-success', component: 'OrderSuccess' },
        { path: '/track-order', component: 'TrackOrder' },
        { path: '/privacy-policy', component: 'PrivacyPolicy' },
        { path: '/terms-and-conditions', component: 'TermsAndConditions' },
        { path: '/account', component: 'AccountPage' },
        { path: '/signup', component: 'Signup' },
        { path: '/login', component: 'Login' },
        { path: '/forgot-password', component: 'ForgotPassword' },
        // Dynamic routes - we'll create placeholders for these
        { path: '/product', component: 'SingleProduct'},
        // Special case for 404
        { path: '/404', component: 'NotFound' }
      ]

      console.log('📂 Generating HTML files for static routes...')
      
      try {
        const distDir = resolve(__dirname, 'dist')
        const indexHtmlPath = resolve(distDir, 'index.html')
        
        // Ensure index.html exists in the dist directory
        if (!fs.existsSync(indexHtmlPath)) {
          console.error('❌ index.html not found in dist directory')
          return
        }
        
        // Read the original index.html content
        const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8')
        
        // Process each route except the home route (which is already index.html)
        for (const route of routes) {
          if (route.path === '/') continue // Skip home route
          
          if (route.isDynamic) {
            // For dynamic routes, create a special handler
            const basePath = route.path.split('/:')[0].substring(1) // Remove leading slash and parameter part
            const dirPath = resolve(distDir, basePath)
            
            // Create _app.html file in the base directory that will handle all dynamic routes
            if (!fs.existsSync(dirPath)) {
              fs.mkdirSync(dirPath, { recursive: true })
            }
            
            // Create HTML content with proper meta for SEO
            let html = indexHtml
            // Customize the HTML with route-specific information
            html = html.replace(/<title>(.*?)<\/title>/, `<title>Origin By The Sea | ${route.component}</title>`)
            
            // Add a special script to handle client-side routing for dynamic routes
            const clientRoutingScript = `
              <script>
                // This ensures that deep links to specific products work correctly
                (function() {
                  // Remove hash if it's incorrectly added to product URLs
                  if (window.location.pathname.includes('/shop/') && window.location.hash) {
                    // If we have a product ID in the hash instead of the path, fix it
                    if (window.location.hash.startsWith('#')) {
                      const productId = window.location.hash.substring(1);
                      if (productId) {
                        window.history.replaceState(
                          {}, 
                          document.title, 
                          window.location.pathname + (window.location.pathname.endsWith('/') ? '' : '/') + productId
                        );
                      }
                    }
                  }
                })();
              </script>
            `
            
            // Insert the script right before the closing head tag
            html = html.replace('</head>', clientRoutingScript + '</head>')
            
            // Write the file to the correct directory
            fs.writeFileSync(resolve(dirPath, 'index.html'), html)
            console.log(`✅ Generated dynamic route handler: ${basePath}/index.html`)
            
            continue
          }
          
          // Create path for the new HTML file
          const routePath = route.path.substring(1) // Remove leading slash
          const dirPath = resolve(distDir, routePath)
          const htmlPath = resolve(dirPath, 'index.html')
          
          // Create directory if it doesn't exist
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true })
          }
          
          // Create HTML content with proper meta for SEO
          let html = indexHtml
          // Customize the HTML with route-specific information
          html = html.replace(/<title>(.*?)<\/title>/, `<title>Origin By The Sea | ${route.component}</title>`)
          
          // Special case for 404 page
          if (route.path === '/404') {
            fs.writeFileSync(resolve(distDir, '404.html'), html)
          }
          
          // Write the file
          fs.writeFileSync(htmlPath, html)
          console.log(`✅ Generated: ${routePath}/index.html`)
        }
        
        console.log('🎉 All HTML files generated successfully!')
      } catch (error) {
        console.error('❌ Error generating HTML files:', error)
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
    plugins: [
      react(),
      generateHtmlPlugin()
    ],
    base: '/',

    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        emptyOutDir: true,
        sourcemap: false,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
            },
        },
        // Make sure the build process correctly handles client-side routing
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: false,
            },
        },
    },

})