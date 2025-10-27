#!/bin/bash

# Ensure the build succeeds even if there are warnings
export CI=false 

# Install dependencies
echo "Installing dependencies..."
npm install

# Run the build
echo "Building the application..."
npm run build

# Ensure 404.html exists
if [ ! -f "dist/404.html" ]; then
  echo "Creating 404.html..."
  cp dist/index.html dist/404.html
fi

# Copy important files from public to dist
echo "Copying necessary files..."
cp public/_redirects dist/_redirects
cp public/_routes.json dist/_routes.json
cp public/vercel.json dist/vercel.json

echo "Build complete!"
