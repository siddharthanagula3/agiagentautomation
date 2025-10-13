import { monitoringService } from './monitoring-service';

interface SEOData {
  title: string;
  description: string;
  keywords: string[];
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

interface PageSEOData extends SEOData {
  path: string;
  lastModified?: string;
  priority?: number;
  changeFrequency?:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never';
}

class SEOService {
  private isInitialized = false;
  private baseUrl: string;
  private defaultSEO: SEOData;

  constructor() {
    this.baseUrl =
      import.meta.env.VITE_APP_URL || 'https://agiagentautomation.com';
    this.defaultSEO = {
      title: 'AGI Agent Automation - AI Workforce Platform',
      description:
        'Transform your business with AI employees. Hire, manage, and scale your AI workforce with our comprehensive automation platform.',
      keywords: [
        'AI',
        'automation',
        'workforce',
        'artificial intelligence',
        'AI employees',
        'business automation',
      ],
      ogType: 'website',
      twitterCard: 'summary_large_image',
      twitterSite: '@agiagentautomation',
      robots: 'index, follow',
    };
  }

  /**
   * Initialize SEO service
   */
  initialize(): void {
    if (this.isInitialized) return;

    // Set up meta tag management
    this.setupMetaTagManagement();

    // Set up structured data
    this.setupStructuredData();

    // Set up sitemap generation
    this.setupSitemapGeneration();

    this.isInitialized = true;
    console.log('✅ SEO service initialized');
  }

  /**
   * Update page SEO data
   */
  updatePageSEO(seoData: Partial<SEOData>, path?: string): void {
    const currentPath = path || window.location.pathname;
    const fullSEO = { ...this.defaultSEO, ...seoData };

    // Update document title
    document.title = fullSEO.title;

    // Update meta tags
    this.updateMetaTag('description', fullSEO.description);
    this.updateMetaTag('keywords', fullSEO.keywords.join(', '));
    this.updateMetaTag('author', fullSEO.author);
    this.updateMetaTag('robots', fullSEO.robots);

    // Update Open Graph tags
    this.updateMetaTag('og:title', fullSEO.title, 'property');
    this.updateMetaTag('og:description', fullSEO.description, 'property');
    this.updateMetaTag('og:type', fullSEO.ogType, 'property');
    this.updateMetaTag('og:url', this.getCanonicalUrl(currentPath), 'property');
    this.updateMetaTag('og:image', fullSEO.ogImage, 'property');
    this.updateMetaTag('og:site_name', 'AGI Agent Automation', 'property');

    // Update Twitter Card tags
    this.updateMetaTag('twitter:card', fullSEO.twitterCard);
    this.updateMetaTag('twitter:site', fullSEO.twitterSite);
    this.updateMetaTag('twitter:creator', fullSEO.twitterCreator);
    this.updateMetaTag('twitter:title', fullSEO.title);
    this.updateMetaTag('twitter:description', fullSEO.description);
    this.updateMetaTag('twitter:image', fullSEO.ogImage);

    // Update canonical URL
    this.updateCanonicalUrl(
      fullSEO.canonicalUrl || this.getCanonicalUrl(currentPath)
    );

    // Update structured data
    if (fullSEO.structuredData) {
      this.updateStructuredData(fullSEO.structuredData);
    }

    // Track SEO update
    monitoringService.trackEvent('seo_update', {
      path: currentPath,
      title: fullSEO.title,
      hasStructuredData: !!fullSEO.structuredData,
    });
  }

  /**
   * Generate structured data for different page types
   */
  generateStructuredData(
    type: string,
    data: Record<string, unknown>
  ): Record<string, unknown> {
    const baseStructuredData = {
      '@context': 'https://schema.org',
      '@type': type,
      url: this.getCanonicalUrl(window.location.pathname),
      name: data.name || document.title,
      description: data.description || this.getMetaContent('description'),
    };

    switch (type) {
      case 'WebSite':
        return {
          ...baseStructuredData,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${this.baseUrl}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        };

      case 'Organization':
        return {
          ...baseStructuredData,
          logo: `${this.baseUrl}/logo.png`,
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+1-555-0123',
            contactType: 'customer service',
            availableLanguage: 'English',
          },
          sameAs: [
            'https://twitter.com/agiagentautomation',
            'https://linkedin.com/company/agi-agent-automation',
            'https://github.com/agiagentautomation',
          ],
        };

      case 'Article':
        return {
          ...baseStructuredData,
          headline: data.headline,
          author: {
            '@type': 'Person',
            name: data.author || 'AGI Agent Automation Team',
          },
          publisher: {
            '@type': 'Organization',
            name: 'AGI Agent Automation',
            logo: {
              '@type': 'ImageObject',
              url: `${this.baseUrl}/logo.png`,
            },
          },
          datePublished: data.datePublished,
          dateModified: data.dateModified,
          image: data.image,
        };

      case 'Product':
        return {
          ...baseStructuredData,
          brand: {
            '@type': 'Brand',
            name: 'AGI Agent Automation',
          },
          offers: {
            '@type': 'Offer',
            price: data.price,
            priceCurrency: data.priceCurrency || 'USD',
            availability: 'https://schema.org/InStock',
          },
          aggregateRating: data.aggregateRating,
        };

      case 'SoftwareApplication':
        return {
          ...baseStructuredData,
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web Browser',
          offers: {
            '@type': 'Offer',
            price: data.price || '0',
            priceCurrency: 'USD',
          },
          aggregateRating: data.aggregateRating,
        };

      default:
        return baseStructuredData;
    }
  }

  /**
   * Generate sitemap data
   */
  generateSitemapData(): PageSEOData[] {
    const pages: PageSEOData[] = [
      {
        path: '/',
        title: 'AGI Agent Automation - AI Workforce Platform',
        description:
          'Transform your business with AI employees. Hire, manage, and scale your AI workforce.',
        keywords: ['AI', 'automation', 'workforce', 'artificial intelligence'],
        priority: 1.0,
        changeFrequency: 'daily',
      },
      {
        path: '/pricing',
        title: 'Pricing - AGI Agent Automation',
        description:
          'Choose the perfect plan for your AI workforce needs. Flexible pricing for businesses of all sizes.',
        keywords: ['pricing', 'AI workforce', 'subscription', 'plans'],
        priority: 0.9,
        changeFrequency: 'weekly',
      },
      {
        path: '/marketplace',
        title: 'AI Employee Marketplace - AGI Agent Automation',
        description:
          'Browse and hire AI employees for your business. Find the perfect AI assistant for your needs.',
        keywords: ['AI employees', 'marketplace', 'hire AI', 'AI assistants'],
        priority: 0.9,
        changeFrequency: 'daily',
      },
      {
        path: '/about',
        title: 'About Us - AGI Agent Automation',
        description:
          'Learn about our mission to democratize AI workforce automation and empower businesses.',
        keywords: ['about', 'company', 'mission', 'AI workforce'],
        priority: 0.7,
        changeFrequency: 'monthly',
      },
      {
        path: '/blog',
        title: 'Blog - AGI Agent Automation',
        description:
          'Latest insights, tutorials, and news about AI workforce automation and business transformation.',
        keywords: ['blog', 'AI insights', 'tutorials', 'automation'],
        priority: 0.8,
        changeFrequency: 'daily',
      },
      {
        path: '/contact-sales',
        title: 'Contact Sales - AGI Agent Automation',
        description:
          'Get in touch with our sales team to discuss your AI workforce automation needs.',
        keywords: ['contact', 'sales', 'AI consultation', 'support'],
        priority: 0.6,
        changeFrequency: 'monthly',
      },
    ];

    return pages;
  }

  /**
   * Update meta tag
   */
  private updateMetaTag(
    name: string,
    content: string,
    attribute: string = 'name'
  ): void {
    if (!content) return;

    let meta = document.querySelector(
      `meta[${attribute}="${name}"]`
    ) as HTMLMetaElement;

    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attribute, name);
      document.head.appendChild(meta);
    }

    meta.setAttribute('content', content);
  }

  /**
   * Get meta tag content
   */
  private getMetaContent(name: string): string {
    const meta = document.querySelector(
      `meta[name="${name}"]`
    ) as HTMLMetaElement;
    return meta?.getAttribute('content') || '';
  }

  /**
   * Update canonical URL
   */
  private updateCanonicalUrl(url: string): void {
    let canonical = document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement;

    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }

    canonical.setAttribute('href', url);
  }

  /**
   * Update structured data
   */
  private updateStructuredData(data: Record<string, unknown>): void {
    // Remove existing structured data
    const existingScripts = document.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    existingScripts.forEach(script => script.remove());

    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  /**
   * Get canonical URL for a path
   */
  private getCanonicalUrl(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  /**
   * Set up meta tag management
   */
  private setupMetaTagManagement(): void {
    // Add viewport meta tag if not present
    if (!document.querySelector('meta[name="viewport"]')) {
      const viewport = document.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1';
      document.head.appendChild(viewport);
    }

    // Add charset meta tag if not present
    if (!document.querySelector('meta[charset]')) {
      const charset = document.createElement('meta');
      charset.setAttribute('charset', 'utf-8');
      document.head.insertBefore(charset, document.head.firstChild);
    }
  }

  /**
   * Set up structured data
   */
  private setupStructuredData(): void {
    // Add organization structured data
    const organizationData = this.generateStructuredData('Organization', {
      name: 'AGI Agent Automation',
      description: 'AI workforce automation platform',
    });
    this.updateStructuredData(organizationData);
  }

  /**
   * Set up sitemap generation
   */
  private setupSitemapGeneration(): void {
    // Generate sitemap on page load
    const sitemapData = this.generateSitemapData();

    // Track sitemap generation
    monitoringService.trackEvent('sitemap_generated', {
      pageCount: sitemapData.length,
      lastGenerated: new Date().toISOString(),
    });
  }

  /**
   * Get current page SEO data
   */
  getCurrentPageSEO(): SEOData {
    return {
      title: document.title,
      description: this.getMetaContent('description'),
      keywords: this.getMetaContent('keywords').split(', '),
      canonicalUrl: document
        .querySelector('link[rel="canonical"]')
        ?.getAttribute('href'),
      ogImage: this.getMetaContent('og:image'),
      ogType: this.getMetaContent('og:type'),
      twitterCard: this.getMetaContent('twitter:card'),
      twitterSite: this.getMetaContent('twitter:site'),
      twitterCreator: this.getMetaContent('twitter:creator'),
      robots: this.getMetaContent('robots'),
      author: this.getMetaContent('author'),
    };
  }

  /**
   * Track SEO performance
   */
  trackSEOPerformance(): void {
    const seoData = this.getCurrentPageSEO();

    monitoringService.trackEvent('seo_performance', {
      title: seoData.title,
      description: seoData.description,
      hasCanonical: !!seoData.canonicalUrl,
      hasStructuredData: !!document.querySelector(
        'script[type="application/ld+json"]'
      ),
      hasOpenGraph: !!seoData.ogImage,
      hasTwitterCard: !!seoData.twitterCard,
    });
  }
}

// Export singleton instance
export const seoService = new SEOService();
