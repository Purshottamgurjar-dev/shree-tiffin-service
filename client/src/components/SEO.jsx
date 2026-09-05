import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const DEFAULT_CANONICAL_ORIGIN = import.meta.env.VITE_CANONICAL_URL || 'https://shree-tiffin.onrender.com';
const DEFAULT_TITLE = 'Shree Tiffin Service | Ghar Jaisa Khana, Har Din';
const DEFAULT_DESCRIPTION = 'Authentic, freshly cooked, homestyle Indian meals delivered hot to your doorstep every day. 100% Pure Vegetarian, prepared with Desi Cow Ghee. Ghar Jaisa Khana, Har Din.';
const DEFAULT_IMAGE = `${DEFAULT_CANONICAL_ORIGIN}/assets/hero-thali.jpg`;

/**
 * Reusable SEO & Metadata Management Component
 * Dynamically synchronizes document title, meta tags, Open Graph, Twitter Cards,
 * canonical URLs, robots directives, and JSON-LD structured data without external packages.
 */
export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  canonicalUrl,
  noindex = false,
  type = 'website',
  schema = null,
}) {
  const location = useLocation();

  useEffect(() => {
    // 1. Page Title
    const formattedTitle = title 
      ? `${title} | Shree Tiffin Service`
      : DEFAULT_TITLE;
    document.title = formattedTitle;

    // Helper: update or create <meta> tag
    const setMetaTag = (attributeName, attributeValue, content) => {
      if (!content) return;
      let tag = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attributeName, attributeValue);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    // 2. Primary Meta Description
    setMetaTag('name', 'description', description);

    // 3. Robots Directives (Strict noindex, nofollow on private/admin pages)
    const robotsContent = noindex ? 'noindex, nofollow' : 'index, follow';
    setMetaTag('name', 'robots', robotsContent);

    // 4. Canonical URL Strategy
    const fullCanonical = canonicalUrl || `${DEFAULT_CANONICAL_ORIGIN}${location.pathname}`;
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', fullCanonical);

    // 5. Open Graph Metadata
    setMetaTag('property', 'og:title', formattedTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:url', fullCanonical);
    setMetaTag('property', 'og:image', image);
    setMetaTag('property', 'og:site_name', 'Shree Tiffin Service');

    // 6. Twitter / X Cards
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', formattedTitle);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', image);

    // 7. Structured Data (JSON-LD)
    const scriptId = 'json-ld-structured-data';
    let scriptTag = document.getElementById(scriptId);
    if (schema) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = scriptId;
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(schema);
    } else if (scriptTag) {
      scriptTag.remove();
    }

    // Cleanup when component unmounts (reset to default safe index/follow)
    return () => {
      const robotsTag = document.querySelector('meta[name="robots"]');
      if (robotsTag && noindex) {
        robotsTag.setAttribute('content', 'index, follow');
      }
      const existingScript = document.getElementById(scriptId);
      if (existingScript && schema) {
        existingScript.remove();
      }
    };
  }, [title, description, image, canonicalUrl, noindex, type, schema, location.pathname]);

  return null;
}
