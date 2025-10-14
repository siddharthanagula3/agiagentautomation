import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { seoService } from '@_core/monitoring/seo-service';

interface SEOOptions {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterSite?: string;
  twitterCreator?: string;
  structuredData?: Record<string, unknown>;
  robots?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
}

/**
 * Hook for SEO management
 */
export const useSEO = (options: SEOOptions = {}) => {
  const location = useLocation();

  // Update SEO when location changes
  useEffect(() => {
    seoService.updatePageSEO(options, location.pathname);
  }, [location.pathname, options]);

  // Track SEO performance
  useEffect(() => {
    seoService.trackSEOPerformance();
  }, [location.pathname]);

  // Generate structured data
  const generateStructuredData = useCallback(
    (type: string, data: Record<string, unknown>) => {
      return seoService.generateStructuredData(type, data);
    },
    []
  );

  // Update page SEO
  const updateSEO = useCallback(
    (newOptions: SEOOptions) => {
      seoService.updatePageSEO(newOptions, location.pathname);
    },
    [location.pathname]
  );

  return {
    updateSEO,
    generateStructuredData,
    currentSEO: seoService.getCurrentPageSEO(),
  };
};

/**
 * Hook for page-specific SEO
 */
export const usePageSEO = (
  pageType: string,
  pageData: Record<string, unknown> = {}
) => {
  const { generateStructuredData, updateSEO } = useSEO();

  useEffect(() => {
    // Generate page-specific structured data
    const structuredData = generateStructuredData(pageType, pageData);

    // Update SEO with structured data
    updateSEO({
      structuredData,
      ...pageData,
    });
  }, [pageType, pageData, generateStructuredData, updateSEO]);

  return {
    generateStructuredData,
    updateSEO,
  };
};

/**
 * Hook for blog post SEO
 */
export const useBlogSEO = (postData: {
  title: string;
  description: string;
  content: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
  image?: string;
}) => {
  const { updateSEO, generateStructuredData } = useSEO();

  useEffect(() => {
    const structuredData = generateStructuredData('Article', {
      headline: postData.title,
      description: postData.description,
      author: postData.author,
      datePublished: postData.publishedTime,
      dateModified: postData.modifiedTime,
      image: postData.image,
      keywords: postData.tags,
    });

    updateSEO({
      title: `${postData.title} - AGI Agent Automation Blog`,
      description: postData.description,
      keywords: postData.tags,
      ogType: 'article',
      structuredData,
      author: postData.author,
      publishedTime: postData.publishedTime,
      modifiedTime: postData.modifiedTime,
      tags: postData.tags,
    });
  }, [postData, updateSEO, generateStructuredData]);

  return {
    updateSEO,
    generateStructuredData,
  };
};

/**
 * Hook for product SEO
 */
export const useProductSEO = (productData: {
  name: string;
  description: string;
  price?: number;
  priceCurrency?: string;
  image?: string;
  category?: string;
  brand?: string;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}) => {
  const { updateSEO, generateStructuredData } = useSEO();

  useEffect(() => {
    const structuredData = generateStructuredData('Product', {
      name: productData.name,
      description: productData.description,
      price: productData.price,
      priceCurrency: productData.priceCurrency,
      image: productData.image,
      category: productData.category,
      brand: productData.brand,
      aggregateRating: productData.aggregateRating,
    });

    updateSEO({
      title: `${productData.name} - AGI Agent Automation`,
      description: productData.description,
      ogType: 'product',
      structuredData,
    });
  }, [productData, updateSEO, generateStructuredData]);

  return {
    updateSEO,
    generateStructuredData,
  };
};

/**
 * Hook for organization SEO
 */
export const useOrganizationSEO = () => {
  const { updateSEO, generateStructuredData } = useSEO();

  useEffect(() => {
    const structuredData = generateStructuredData('Organization', {
      name: 'AGI Agent Automation',
      description: 'AI workforce automation platform',
      logo: '/logo.png',
      contactPoint: {
        telephone: '+1-555-0123',
        contactType: 'customer service',
        availableLanguage: 'English',
      },
      sameAs: [
        'https://twitter.com/agiagentautomation',
        'https://linkedin.com/company/agi-agent-automation',
        'https://github.com/agiagentautomation',
      ],
    });

    updateSEO({
      title: 'AGI Agent Automation - AI Workforce Platform',
      description:
        'Transform your business with AI employees. Hire, manage, and scale your AI workforce.',
      structuredData,
    });
  }, [updateSEO, generateStructuredData]);

  return {
    updateSEO,
    generateStructuredData,
  };
};
