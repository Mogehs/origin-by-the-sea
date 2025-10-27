import React from "react";
import { Helmet } from "react-helmet-async";

/**
 * A component to add SEO metadata to pages
 *
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} props.description - Page description
 * @param {string} props.canonicalUrl - Canonical URL for the page
 * @param {Object} props.schema - JSON-LD schema data
 * @param {string} props.ogImage - Open Graph image URL
 * @param {string} props.keywords - Keywords for meta tags
 * @param {string} props.type - Open Graph type
 * @param {string} props.publishedAt - Article published date
 * @param {string} props.modifiedAt - Article modified date
 * @param {string} props.author - Article author
 * @param {string} props.section - Article section
 * @param {string} props.pageType - Schema.org page type
 */
const SEO = ({
  title = "Origins By The Sea | Handcrafted Sustainable Fashion",
  description = "Discover elegantly handcrafted swimwear, dresses, and accessories inspired by the sea. Sustainable, ethical fashion designed with passion and purpose.",
  canonicalUrl = "https://originsbythesea.com",
  schema = null,
  ogImage = "https://originsbythesea.com/images/hero-banner.jpg",
  keywords = "origins by the sea, swimwear, handmade dresses, sustainable fashion, ethical clothing, beach wear, crop tops, waterproof jewelry",
  type = "website",
  publishedAt,
  modifiedAt,
  author = "Origins By The Sea",
  section = "",
  pageType = "website",
}) => {
  // Base schema that will be used if no custom schema is provided
  const baseSchema = {
    "@context": "https://schema.org",
    "@type": pageType,
    name: title,
    description,
    url: canonicalUrl,
    image: ogImage,
  };

  if (pageType === "Article") {
    baseSchema.author = {
      "@type": "Organization",
      name: author,
    };
    baseSchema.publisher = {
      "@type": "Organization",
      name: "Origins By The Sea",
      logo: {
        "@type": "ImageObject",
        url: "https://originsbythesea.com/images/logo.png",
      },
    };
    if (publishedAt) baseSchema.datePublished = publishedAt;
    if (modifiedAt) baseSchema.dateModified = modifiedAt;
  }

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Origins By The Sea" />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Article Specific Meta Tags */}
      {publishedAt && (
        <meta property="article:published_time" content={publishedAt} />
      )}
      {modifiedAt && (
        <meta property="article:modified_time" content={modifiedAt} />
      )}
      {section && <meta property="article:section" content={section} />}
      {author && <meta property="article:author" content={author} />}

      {/* Schema.org JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(schema || baseSchema)}
      </script>

      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#e6994b" />
      <meta name="author" content="Origins By The Sea" />
    </Helmet>
  );
};

export default SEO;
