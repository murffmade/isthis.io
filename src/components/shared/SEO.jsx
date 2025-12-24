import React from 'react';
import { Helmet } from 'react-helmet';

export default function SEO({
  title = 'IsThis.io - AI Content Verification',
  description = 'Verify if images and videos are real or AI-generated with our free detection tool. Advanced AI analysis for content authenticity.',
  image = 'https://isthis.io/og-image.jpg',
  url,
  type = 'website',
  keywords = 'AI detection, deepfake detection, image verification, video verification, AI-generated content, content authenticity',
  author = 'IsThis.io',
  language = 'en',
  region = 'US',
  structuredData
}) {
  const canonicalUrl = url || (typeof window !== 'undefined' ? window.location.href : 'https://isthis.io');
  const siteName = 'IsThis.io';

  // Default structured data
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "IsThis.io",
    "description": "AI Content Verification Platform",
    "url": "https://isthis.io",
    "applicationCategory": "SecurityApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1250"
    }
  };

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Language & Geo */}
      <html lang={language} />
      <meta name="language" content={language} />
      <meta name="geo.region" content={region} />
      <meta name="geo.placename" content={region === 'US' ? 'United States' : region} />

      {/* Hreflang for International SEO */}
      <link rel="alternate" hrefLang="en" href={canonicalUrl} />
      <link rel="alternate" hrefLang="es" href={canonicalUrl.replace('isthis.io', 'isthis.io/es')} />
      <link rel="alternate" hrefLang="fr" href={canonicalUrl.replace('isthis.io', 'isthis.io/fr')} />
      <link rel="alternate" hrefLang="de" href={canonicalUrl.replace('isthis.io', 'isthis.io/de')} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={language === 'en' ? 'en_US' : `${language}_${region}`} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:creator" content="@IsThisIO" />
      <meta name="twitter:site" content="@IsThisIO" />

      {/* Robots */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow" />

      {/* Mobile & App */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="IsThis.io" />
      <meta name="application-name" content="IsThis.io" />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData || defaultStructuredData)}
      </script>
    </Helmet>
  );
}