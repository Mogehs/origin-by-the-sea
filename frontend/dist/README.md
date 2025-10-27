# Origin by the Sea - Public Assets

This directory contains public assets for the Origin by the Sea website.

## Important Files

### .htaccess
The `.htaccess` file contains server configurations for Apache web servers. It handles:
- URL rewriting for React Router (SPA navigation)
- HTTPS redirection
- www/non-www redirection
- Browser caching settings
- Compression settings
- CORS headers

### sitemap.xml
The `sitemap.xml` file helps search engines discover and navigate your website. It's automatically generated during the build process by the script in `scripts/generate-sitemap.js`.

To update routes in the sitemap:
1. Edit the `routes` array in `scripts/generate-sitemap.js`
2. Run `npm run generate-sitemap` or just `npm run build` which includes sitemap generation

### robots.txt
The `robots.txt` file provides instructions to search engine crawlers about which pages to index and which to ignore. It also points to the sitemap.xml file.

## Deployment Notes

When deploying to a cPanel hosting environment:
1. Upload the entire `dist` directory content to your website's root directory
2. Ensure the `.htaccess` file is properly uploaded with the correct permissions
3. Verify that `sitemap.xml` and `robots.txt` are accessible at your domain root

## SEO Optimization

The combination of a properly configured:
- `.htaccess` file (for clean URLs)
- `sitemap.xml` (for search engine discovery)
- `robots.txt` (for crawler guidance)

Will significantly improve your website's SEO and ensure all routes work properly in production.
