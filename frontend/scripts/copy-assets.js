/**
 * Script to copy essential files to the dist directory after build
 * Works on both Windows and Unix-based systems
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current filename and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const publicDir = path.resolve(__dirname, '../public');
const distDir = path.resolve(__dirname, '../dist');

// Files to copy from public to dist
const filesToCopy = [
  '.htaccess',
  'robots.txt',
  'sitemap.xml',
  'humans.txt',
  '404.html',
  'root-htaccess.txt',
  'web.config',
  'index.php'
];

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy each file
filesToCopy.forEach(file => {
  const sourcePath = path.join(publicDir, file);
  const destPath = path.join(distDir, file);
  
  try {
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Copied ${file} to dist directory`);
    } else {
      console.warn(`⚠️ Warning: ${file} not found in public directory`);
    }
  } catch (error) {
    console.error(`❌ Error copying ${file}:`, error);
  }
});

console.log('🎉 Post-build file copying completed');
