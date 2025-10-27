/**
 * Utility functions for product-related operations
 */

/**
 * Converts a numeric color code to a hex color string
 * @param {string|number} colorCode - The color code (numeric or hex)
 * @returns {string} - Hex color string (e.g. #ff0000)
 */
export const formatColorToHex = (colorCode) => {
    if (colorCode === null || colorCode === undefined) {
        console.error('Received null or undefined color code');
        return '#000000';
    }

    // Convert to string to safely use string methods
    const colorStr = String(colorCode).trim();

    // If it's already a hex color, return it
    if (colorStr.startsWith('#')) {
        return colorStr;
    }

    try {
        const intColor = parseInt(colorStr);

        if (isNaN(intColor)) {
            console.error('Invalid color code:', colorStr);
            return '#000000';
        }

        // Extract RGB components (assuming ARGB format with 8 bits per channel)
        // Format: 0xAARRGGBB
        const r = (intColor >> 16) & 0xFF;
        const g = (intColor >> 8) & 0xFF;
        const b = intColor & 0xFF;

        // Generate hex string padded with zeros
        const hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

        console.log(`Converted color code ${colorCode} to hex: ${hexColor}`);
        return hexColor;
    } catch (e) {
        console.error('Error parsing color code', e);
        return '#000000'; // Default to black if parsing fails
    }
};

/**
 * Maps numeric color codes to standard color names for display
 * @param {string|number} colorCode - The color code
 * @returns {string} - Color name or original code
 */
export const getColorName = (colorCode) => {
    if (colorCode === null || colorCode === undefined) {
        return 'Unknown';
    }

    // Create a hex color string
    const hexColor = formatColorToHex(colorCode).toLowerCase();

    // Common color mappings
    const colorMap = {
        '#ff0000': 'Red',
        '#00ff00': 'Green',
        '#0000ff': 'Blue',
        '#ffff00': 'Yellow',
        '#00ffff': 'Cyan',
        '#ff00ff': 'Magenta',
        '#000000': 'Black',
        '#ffffff': 'White',
        '#ffa500': 'Orange',
        '#800080': 'Purple',
        '#a52a2a': 'Brown',
        '#ffc0cb': 'Pink',
        '#808080': 'Gray',
        '#00aaff': 'Sky Blue',
        // Add more mappings for specific numeric codes from Firebase
        '#ffd700': 'Gold',
        '#f08080': 'Light Coral',
        '#e6994b': 'Amber',
    };

    return colorMap[hexColor] || String(colorCode);
};

/**
 * Gets a contrasting text color (black or white) based on background color
 * @param {string|number} colorCode - The background color
 * @returns {string} - '#000000' for dark text or '#ffffff' for light text
 */
export const getContrastColor = (colorCode) => {
    try {
        const hexColor = formatColorToHex(colorCode);

        // Convert hex to RGB
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);

        // Calculate relative luminance
        // Formula: 0.299*R + 0.587*G + 0.114*B
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        // Return black for bright backgrounds, white for dark backgrounds
        return luminance > 0.5 ? '#000000' : '#ffffff';
    } catch (e) {
        return '#ffffff'; // Default to white text
    }
};

/**
 * Converts hex color to RGB components
 * @param {string} hex - The hex color string
 * @returns {Object} - RGB components {r, g, b}
 */
export const hexToRgb = (hex) => {
    // Ensure we have a valid hex color
    const validHex = hex.startsWith('#') ? hex : `#${hex}`;
    
    // Convert hex to RGB
    const r = parseInt(validHex.slice(1, 3), 16);
    const g = parseInt(validHex.slice(3, 5), 16);
    const b = parseInt(validHex.slice(5, 7), 16);
    
    return { r, g, b };
};

/**
 * Gets the color family a hex color belongs to
 * @param {string} hex - The hex color string
 * @returns {string} - The color family (red, green, blue, etc.)
 */
export const getColorFamily = (hex) => {
    const { r, g, b } = hexToRgb(hex);
    
    // Color family definitions with thresholds
    // This is a simplified approach to color categorization
    
    // Check for grayscale first (when R, G, and B are close to each other)
    const range = 30; // Threshold for gray detection
    if (Math.abs(r - g) <= range && Math.abs(g - b) <= range && Math.abs(r - b) <= range) {
        if (r + g + b < 150) return 'black';
        if (r + g + b > 600) return 'white';
        return 'gray';
    }
    
    // Determine dominant color
    if (r > g && r > b) {
        if (g > 150 && b < 100) return 'orange';
        if (g < 100 && b < 100) return 'red';
        if (g > 150 && b > 150) return 'pink';
    }
    
    if (g > r && g > b) {
        if (r > 150 && b < 100) return 'lime';
        if (r < 100 && b < 100) return 'green';
        if (r < 100 && b > 150) return 'teal';
    }
    
    if (b > r && b > g) {
        if (r > 150 && g < 100) return 'purple';
        if (r < 100 && g < 100) return 'blue';
        if (r < 100 && g > 150) return 'cyan';
    }
    
    if (r > 180 && g > 180 && b < 100) return 'yellow';
    
    return 'unknown';
};

/**
 * Checks if two colors are similar or in the same color family
 * @param {string} color1 - First hex color
 * @param {string} color2 - Second hex color
 * @returns {boolean} - True if colors are similar
 */
export const areColorsSimilar = (color1, color2) => {
    // Convert both colors to hex format
    const hex1 = formatColorToHex(color1);
    const hex2 = formatColorToHex(color2);
    
    // Get color families
    const family1 = getColorFamily(hex1);
    const family2 = getColorFamily(hex2);
    
    // Debug info
    if (family1 === family2 && family1 !== 'unknown') {
        console.log(`Color match: ${hex1} and ${hex2} are both in the ${family1} family`);
    }
    
    // Return true if they're in the same color family
    return family1 === family2 && family1 !== 'unknown';
};

/**
 * Converts full country names to ISO 3166-1 alpha-2 country codes required by Stripe
 * @param {string} countryName - The full country name
 * @returns {string} - ISO 3166-1 alpha-2 country code (e.g., 'US', 'AE', 'GB')
 */
export const getCountryCode = (countryName) => {
    if (!countryName) return 'AE'; // Default to UAE

    // Mapping of common country names to ISO 3166-1 alpha-2 codes
    const countryCodeMap = {
        'united arab emirates': 'AE',
        'uae': 'AE',
        'saudi arabia': 'SA',
        'qatar': 'QA',
        'kuwait': 'KW',
        'bahrain': 'BH',
        'oman': 'OM',
        'jordan': 'JO',
        'lebanon': 'LB',
        'egypt': 'EG',
        'india': 'IN',
        'pakistan': 'PK',
        'united states': 'US',
        'usa': 'US',
        'united kingdom': 'GB',
        'uk': 'GB'
    };

    // Normalize input by converting to lowercase and trimming
    const normalizedCountry = countryName.toLowerCase().trim();

    // Return the country code if found in the map, or the first 2 characters as fallback
    return countryCodeMap[normalizedCountry] || 'AE';
};