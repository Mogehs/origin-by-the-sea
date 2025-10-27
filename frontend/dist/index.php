<?php
// This is a fallback script for cPanel environments where .htaccess might not be fully supported
// It captures requests to non-existent files and redirects to the index.html for React Router to handle

// Get the requested URL path
$request_uri = $_SERVER['REQUEST_URI'];

// Define assets folders and extensions that should be handled normally
$asset_folders = array('/assets/', '/images/', '/static/');
$asset_extensions = array('.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf');

// Check if this is a request for a physical file or asset
$is_asset = false;

// Check if the URI path contains an asset folder
foreach ($asset_folders as $folder) {
    if (strpos($request_uri, $folder) !== false) {
        $is_asset = true;
        break;
    }
}

// Check if the URI ends with an asset extension
if (!$is_asset) {
    foreach ($asset_extensions as $ext) {
        if (substr($request_uri, -strlen($ext)) === $ext) {
            $is_asset = true;
            break;
        }
    }
}

// If it's not an asset and the file doesn't exist, serve index.html
if (!$is_asset && !file_exists($_SERVER['DOCUMENT_ROOT'] . $request_uri)) {
    include_once 'index.html';
    exit;
}

// Otherwise, let the server handle the request normally
?>
