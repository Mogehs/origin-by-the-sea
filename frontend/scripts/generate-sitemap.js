/**
 * Sitemap Generator Script for Origin by the Sea
 * 
 * This script generates a sitemap.xml file based on the routes in your React application.
 * It helps search engines discover and navigate your website efficiently.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Firebase Admin SDK
import admin from 'firebase-admin';
import serviceAccount from '../service-account.json' assert { type: "json" };

// Get current filename and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Website URL
const SITE_URL = 'https://originsbythesea.com';
const CURRENT_DATE = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

// Define all routes in your application with SEO metadata
const routes = [
  {
    path: '/',
    changefreq: 'daily',
    priority: '1.0',
  },
  {
    path: '/about',
    changefreq: 'monthly',
    priority: '0.8',
  },
  {
    path: '/shop',
    changefreq: 'daily',
    priority: '0.9',
  },
  {
    path: '/privacy-policy',
    changefreq: 'yearly',
    priority: '0.3',
  },
  {
    path: '/terms-and-conditions',
    changefreq: 'yearly',
    priority: '0.3',
  },
  // Dynamic routes will be added programmatically
  {
    path: '/',
    changefreq: 'weekly',
    priority: 1.0,
    lastmod: CURRENT_DATE,
    description: 'Handcrafted sustainable fashion inspired by the ocean.'
  },
  {
    path: '/about',
    changefreq: 'monthly',
    priority: 0.8,
    lastmod: CURRENT_DATE,
    description: 'Learn about our story, values and commitment to sustainable fashion.'
  },
  {
    path: '/shop',
    changefreq: 'daily',
    priority: 0.9,
    lastmod: CURRENT_DATE,
    description: 'Explore our collection of handcrafted swimwear, dresses, and accessories.'
  },
  {
    path: '/shop?id=3',
    changefreq: 'weekly',
    priority: 0.8,
    lastmod: CURRENT_DATE,
    description: 'Shop our elegant handmade dresses collection.'
  },
  {
    path: '/shop?id=1',
    changefreq: 'weekly',
    priority: 0.8,
    lastmod: CURRENT_DATE,
    description: 'Discover our sustainable swimwear collection.'
  },
  {
    path: '/shop?id=2',
    changefreq: 'weekly',
    priority: 0.8,
    lastmod: CURRENT_DATE,
    description: 'Browse our stylish crop tops collection.'
  },
  {
    path: '/favorites',
    changefreq: 'weekly',
    priority: 0.7,
    lastmod: CURRENT_DATE,
    description: 'View your saved favorite items.'
  },
  {
    path: '/cart',
    changefreq: 'weekly',
    priority: 0.7,
    lastmod: CURRENT_DATE,
    description: 'View your shopping cart and proceed to checkout.'
  },
  {
    path: '/account',
    changefreq: 'monthly',
    priority: 0.6,
    lastmod: CURRENT_DATE,
    description: 'Manage your account, orders, and personal information.'
  },
  {
    path: '/login',
    changefreq: 'monthly',
    priority: 0.5,
    lastmod: CURRENT_DATE,
    description: 'Log in to your Origin by the Sea account.'
  },
  {
    path: '/signup',
    changefreq: 'monthly',
    priority: 0.5,
    lastmod: CURRENT_DATE,
    description: 'Create a new account with Origin by the Sea.'
  },
  {
    path: '/forgot-password',
    changefreq: 'monthly',
    priority: 0.4,
    lastmod: CURRENT_DATE,
    description: 'Reset your Origin by the Sea account password.'
  },
  {
    path: '/privacy-policy',
    changefreq: 'yearly',
    priority: 0.3,
    lastmod: CURRENT_DATE,
    description: 'Read our privacy policy and how we protect your data.'
  },
  {
    path: '/terms-and-conditions',
    changefreq: 'yearly',
    priority: 0.3,
    lastmod: CURRENT_DATE,
    description: 'View our terms and conditions for using our services.'
  },
  {
    path: '/track-order',
    changefreq: 'monthly',
    priority: 0.6,
    lastmod: CURRENT_DATE,
    description: 'Track the status of your order with our order tracking system.'
  }
];

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Function to fetch all products
async function getProducts() {
  const snapshot = await db.collection('products').get();
  return snapshot.docs.map(doc => ({
    path: `/product/${doc.id}`,
    changefreq: 'weekly',
    priority: '0.7',
    lastmod: doc.updateTime.toDate().toISOString().split('T')[0]
  }));
}

// Function to fetch all collections
async function getCollections() {
  const snapshot = await db.collection('collections').get();
  return snapshot.docs.map(doc => ({
    path: `/shop/collection/${doc.id}`,
    changefreq: 'weekly',
    priority: '0.6',
    lastmod: doc.updateTime.toDate().toISOString().split('T')[0]
  }));
}

// Generate sitemap XML
async function generateSitemap() {
  try {
    // Get dynamic routes
    const productRoutes = await getProducts();
    const collectionRoutes = await getCollections();
    
    // Combine all routes
    const allRoutes = [...routes, ...productRoutes, ...collectionRoutes];

    // Generate XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allRoutes.map(route => `
  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${route.lastmod || CURRENT_DATE}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('')}
</urlset>`;

    // Write to file
    const outputPath = path.resolve(__dirname, '../public/sitemap.xml');
    fs.writeFileSync(outputPath, xml);
    console.log('Sitemap generated successfully!');

    // Cleanup Firebase Admin connection
    await admin.app().delete();
  } catch (error) {
    console.error('Error generating sitemap:', error);
    process.exit(1);
  }
}

// Run the generator
generateSitemap();

// Now, let's also generate a humans.txt file for better SEO
const currentDate = new Date();
const formattedDate = `${currentDate.getFullYear()}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getDate().toString().padStart(2, '0')}`;

const humansTxt = `/* TEAM */
    Creator: Origin by the Sea Team
    Contact: contact@originsbythesea.com
    Location: United Arab Emirates
    
/* SITE */
    Last update: ${formattedDate}
    Standards: HTML5, CSS3, JavaScript, React
    Components: React, Redux, Firebase, Stripe
    Software: Visual Studio Code, Adobe XD
    Language: English
`;

const humansTxtPath = path.resolve(__dirname, '../public/humans.txt');
fs.writeFileSync(humansTxtPath, humansTxt);
console.log(`humans.txt generated at ${humansTxtPath}`);

// Optional: Extend this script to dynamically fetch product IDs from your backend
// and include individual product pages in the sitemap for better SEO
