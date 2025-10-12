import { Helmet } from 'react-helmet-async';
import React from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  ogType?: 'website' | 'article';
  ogImage?: string;
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
  schema?: object | object[];
  noindex?: boolean;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'AGI Agent Automation | #1 AI Employees Platform in USA | Hire 165+ AI Agents',
  description = 'Hire AI Employees starting at $1/month. 165+ specialized AI agents for automation, customer support, sales, marketing & more. Best AI workforce platform in USA. 24/7 operation, 95% cost savings. Start free trial today!',
  keywords = [
    'ai employees',
    'hire ai employees',
    'ai agents',
    'ai automation',
    'agi agent automation',
    'cheapest ai employees',
    'best ai employees usa',
    'no 1 in usa',
    'ai workforce',
    'agi',
    'asi',
    'hiring ai employees',
    'ai employee platform',
    'automation platform',
    'ai agents for business',
  ],
  canonical,
  ogType = 'website',
  ogImage = 'https://agiagentautomation.com/og-image.jpg',
  article,
  schema,
  noindex = false,
}) => {
  const siteUrl = 'https://agiagentautomation.com';
  const fullTitle = title.includes('AGI Agent Automation')
    ? title
    : `${title} | AGI Agent Automation`;
  const canonicalUrl =
    canonical ||
    (typeof window !== 'undefined' ? window.location.href : siteUrl);

  // Default Organization Schema
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AGI Agent Automation',
    legalName: 'AGI Agent Automation LLC',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description:
      'Leading AI Employee and Automation Platform - Hire 165+ specialized AI agents for business automation',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'US',
      addressRegion: 'USA',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'support@agiagentautomation.com',
      availableLanguage: ['en'],
    },
    sameAs: [
      'https://twitter.com/agiagentauto',
      'https://linkedin.com/company/agi-agent-automation',
      'https://github.com/agiagentautomation',
    ],
  };

  // Website Schema
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AGI Agent Automation',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  // Breadcrumb Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
    ],
  };

  // Combine all schemas
  const allSchemas = [organizationSchema, websiteSchema, breadcrumbSchema];
  if (schema) {
    if (Array.isArray(schema)) {
      allSchemas.push(...schema);
    } else {
      allSchemas.push(schema);
    }
  }

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      <link rel="canonical" href={canonicalUrl} />

      {/* Robots */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta
          name="robots"
          content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
        />
      )}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="AGI Agent Automation" />
      <meta property="og:locale" content="en_US" />

      {/* Article specific OG tags */}
      {article && (
        <>
          {article.publishedTime && (
            <meta
              property="article:published_time"
              content={article.publishedTime}
            />
          )}
          {article.modifiedTime && (
            <meta
              property="article:modified_time"
              content={article.modifiedTime}
            />
          )}
          {article.author && (
            <meta property="article:author" content={article.author} />
          )}
          {article.section && (
            <meta property="article:section" content={article.section} />
          )}
          {article.tags?.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:creator" content="@agiagentauto" />

      {/* Additional Meta Tags */}
      <meta name="author" content="AGI Agent Automation" />
      <meta name="publisher" content="AGI Agent Automation" />
      <meta name="application-name" content="AGI Agent Automation" />
      <meta name="apple-mobile-web-app-title" content="AGI Agent" />

      {/* Schema.org JSON-LD */}
      <script type="application/ld+json">{JSON.stringify(allSchemas)}</script>

      {/* Geo Tags */}
      <meta name="geo.region" content="US" />
      <meta name="geo.placename" content="United States" />

      {/* Language */}
      <meta httpEquiv="content-language" content="en-US" />
      <meta name="language" content="English" />
    </Helmet>
  );
};

export default SEOHead;
