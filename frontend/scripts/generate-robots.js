/**
 * Robots.txt Generator Script for Origins by the Sea
 *
 * This script generates a robots.txt file to guide search engine crawlers.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get current filename and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Website URL
const SITE_URL = "https://originsbythesea.com";

// Generate robots.txt content
const robotsTxt = `User-agent: *
Allow: /

# Disallow pages that shouldn't be indexed
Disallow: /cart
Disallow: /buy
Disallow: /order-success
Disallow: /account
Disallow: /login
Disallow: /signup
Disallow: /forgot-password
Disallow: /404

# Allow product pages and collections to be indexed
Allow: /shop
Allow: /shop/*
Allow: /about
Allow: /privacy-policy
Allow: /terms-and-conditions

# Point to sitemap
Sitemap: ${SITE_URL}/sitemap.xml

# Point to humans.txt
Host: ${SITE_URL}
`;

// Define output path
const outputPath = path.resolve(__dirname, "../public/robots.txt");

// Write robots.txt to file
fs.writeFileSync(outputPath, robotsTxt);

console.log(`robots.txt generated at ${outputPath}`);
