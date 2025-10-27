/**
 * Social Media Preview Generator for Origin by the Sea
 * 
 * This script creates an HTML template that displays a preview of what your
 * website will look like when shared on social media platforms.
 * 
 * To use this:
 * 1. Run this script
 * 2. Open the generated HTML file in a browser
 * 3. Take a screenshot of the preview
 * 4. Save as og-image.jpg in the public/images directory
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current filename and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Social Media Preview</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      background-color: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    .preview-container {
      /* These dimensions are ideal for social media sharing (1200x630 pixels) */
      width: 1200px;
      height: 630px;
      background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('../public/images/hero-banner.jpg');
      background-size: cover;
      background-position: center;
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 40px;
      text-align: center;
      position: relative;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }
    .logo {
      width: 200px;
      margin-bottom: 30px;
      position: relative;
      z-index: 2;
    }
    h1 {
      font-family: 'Italiana', serif;
      font-size: 72px;
      font-weight: 400;
      margin-bottom: 20px;
      text-shadow: 2px 2px 10px rgba(0, 0, 0, 0.7);
      position: relative;
      z-index: 2;
    }
    .tagline {
      font-size: 36px;
      font-weight: 300;
      margin-bottom: 30px;
      max-width: 80%;
      text-shadow: 1px 1px 5px rgba(0, 0, 0, 0.7);
      position: relative;
      z-index: 2;
    }
    .highlight {
      color: #e6994b;
      font-weight: 500;
    }
    .website {
      font-size: 24px;
      margin-top: 50px;
      position: relative;
      z-index: 2;
    }
    .accent-overlay {
      position: absolute;
      width: 400px;
      height: 400px;
      background-color: rgba(230, 153, 75, 0.2);
      border-radius: 50%;
      bottom: -100px;
      right: -100px;
      z-index: 1;
    }
    .accent-overlay-2 {
      position: absolute;
      width: 300px;
      height: 300px;
      background-color: rgba(230, 153, 75, 0.2);
      border-radius: 50%;
      top: -50px;
      left: -50px;
      z-index: 1;
    }
    .instructions {
      margin-top: 30px;
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      color: #333;
      max-width: 600px;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }
    .instructions h2 {
      margin-bottom: 10px;
      color: #e6994b;
    }
    .instructions ol {
      margin-left: 20px;
    }
    .instructions li {
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="instructions">
    <h2>How to use this template:</h2>
    <ol>
      <li>Take a screenshot of the preview below (1200x630 pixels for optimal social sharing)</li>
      <li>Save it as "og-image.jpg" in your public/images directory</li>
      <li>Update your index.html to reference this image in the og:image and twitter:image meta tags</li>
    </ol>
  </div>
  
  <div class="preview-container">
    <div class="accent-overlay"></div>
    <div class="accent-overlay-2"></div>
    <img src="../public/images/logo.png" alt="Origin by the Sea Logo" class="logo">
    <h1>Origin By The Sea</h1>
    <p class="tagline">Handcrafted with love, <span class="highlight">inspired by the sea</span></p>
    <p class="website">originsbythesea.com</p>
  </div>
</body>
</html>`;

// Define output path
const outputPath = path.resolve(__dirname, '../public/social-preview.html');

// Write HTML to file
fs.writeFileSync(outputPath, htmlTemplate);

console.log(`Social media preview template generated at ${outputPath}`);
console.log('Open this file in your browser and take a screenshot to create your OG image.');
