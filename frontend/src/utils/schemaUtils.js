/**
 * This file contains structured data templates for various pages
 * to enhance search engine visibility and rich snippet opportunities.
 *
 * Usage:
 * Import these functions into your page components and include
 * the returned JSON-LD in a script tag with type="application/ld+json"
 */

/**
 * Generates Organization schema
 * @returns {Object} Organization schema
 */
export const generateOrganizationSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Origins By The Sea",
    url: "https://originsbythesea.com",
    logo: "https://originsbythesea.com/images/logo.png",
    sameAs: [
      "https://www.instagram.com/originbythesea",
      "https://www.facebook.com/originbythesea",
    ],
    description:
      "Handcrafted sustainable fashion inspired by the ocean. Swimwear, dresses, and accessories made with ethical practices.",
    address: {
      "@type": "PostalAddress",
      addressCountry: "AE",
    },
  };
};

/**
 * Generates Product schema for product pages
 * @param {Object} product - The product data
 * @returns {Object} Product schema
 */
export const generateProductSchema = (product) => {
  if (!product) return null;

  const {
    id,
    name,
    description,
    price,
    images = [],
    category,
    inStock = true,
    rating = 4.5,
    reviewCount = 0,
  } = product;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: name,
    description: description,
    image:
      images.length > 0
        ? images.map((img) => `https://originsbythesea.com${img}`)
        : null,
    sku: id,
    mpn: id,
    brand: {
      "@type": "Brand",
      name: "Origins By The Sea",
    },
    offers: {
      "@type": "Offer",
      url: `https://originsbythesea.com/product?id=${id}`,
      priceCurrency: "AED",
      price: price,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Origins By The Sea",
      },
    },
    aggregateRating:
      reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: rating,
            reviewCount: reviewCount,
          }
        : null,
    category: category,
  };
};

/**
 * Generates BreadcrumbList schema for navigation context
 * @param {Array} breadcrumbs - Array of breadcrumb items
 * @returns {Object} BreadcrumbList schema
 */
export const generateBreadcrumbSchema = (breadcrumbs) => {
  if (!breadcrumbs || !breadcrumbs.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `https://originsbythesea.com${crumb.path}`,
    })),
  };
};

/**
 * Generates LocalBusiness schema
 * @returns {Object} LocalBusiness schema
 */
export const generateLocalBusinessSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Origins By The Sea",
    image: "https://originsbythesea.com/images/logo.png",
    url: "https://originsbythesea.com",
    telephone: "+971XXXXXXXX", // Replace with actual phone number
    address: {
      "@type": "PostalAddress",
      addressCountry: "AE",
      addressLocality: "Dubai", // Replace with actual location
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "25.276987", // Replace with actual coordinates
      longitude: "55.296249", // Replace with actual coordinates
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "10:00",
        closes: "22:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday", "Sunday"],
        opens: "12:00",
        closes: "20:00",
      },
    ],
    priceRange: "$$",
  };
};

/**
 * Generates WebSite schema
 * @returns {Object} WebSite schema
 */
export const generateWebsiteSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: "https://originsbythesea.com",
    name: "Origins By The Sea",
    description: "Handcrafted sustainable fashion inspired by the ocean",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://originsbythesea.com/shop?search={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };
};

/**
 * Generates FAQPage schema for FAQ sections
 * @param {Array} faqs - Array of FAQ items with question and answer properties
 * @returns {Object} FAQPage schema
 */
export const generateFAQSchema = (faqs) => {
  if (!faqs || !faqs.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
};
