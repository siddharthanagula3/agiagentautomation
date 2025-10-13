import { seoService } from '@/services/seo-service';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never';
  priority?: number;
}

interface SitemapImage {
  loc: string;
  title?: string;
  caption?: string;
  geo_location?: string;
  license?: string;
}

interface SitemapNews {
  publication: {
    name: string;
    language: string;
  };
  publication_date: string;
  title: string;
  keywords?: string;
}

class SitemapGenerator {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      import.meta.env.VITE_APP_URL || 'https://agiagentautomation.com';
  }

  /**
   * Generate XML sitemap
   */
  generateSitemap(): string {
    const urls = this.getSitemapUrls();
    const sitemap = this.buildSitemapXML(urls);
    return sitemap;
  }

  /**
   * Generate sitemap index
   */
  generateSitemapIndex(): string {
    const sitemaps = [
      {
        loc: `${this.baseUrl}/sitemap.xml`,
        lastmod: new Date().toISOString().split('T')[0],
      },
      {
        loc: `${this.baseUrl}/sitemap-pages.xml`,
        lastmod: new Date().toISOString().split('T')[0],
      },
      {
        loc: `${this.baseUrl}/sitemap-blog.xml`,
        lastmod: new Date().toISOString().split('T')[0],
      },
    ];

    let sitemapIndex = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemapIndex +=
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    sitemaps.forEach(sitemap => {
      sitemapIndex += '  <sitemap>\n';
      sitemapIndex += `    <loc>${sitemap.loc}</loc>\n`;
      sitemapIndex += `    <lastmod>${sitemap.lastmod}</lastmod>\n`;
      sitemapIndex += '  </sitemap>\n';
    });

    sitemapIndex += '</sitemapindex>';
    return sitemapIndex;
  }

  /**
   * Generate robots.txt content
   */
  generateRobotsTxt(): string {
    let robots = `User-agent: *\n`;
    robots += `Allow: /\n`;
    robots += `Disallow: /admin/\n`;
    robots += `Disallow: /api/\n`;
    robots += `Disallow: /_next/\n`;
    robots += `Disallow: /private/\n`;
    robots += `\n`;
    robots += `Sitemap: ${this.baseUrl}/sitemap.xml\n`;
    robots += `Sitemap: ${this.baseUrl}/sitemap-pages.xml\n`;
    robots += `Sitemap: ${this.baseUrl}/sitemap-blog.xml\n`;

    return robots;
  }

  /**
   * Get all sitemap URLs
   */
  private getSitemapUrls(): SitemapUrl[] {
    const seoData = seoService.generateSitemapData();
    const urls: SitemapUrl[] = [];

    // Add main pages
    seoData.forEach(page => {
      urls.push({
        loc: `${this.baseUrl}${page.path}`,
        lastmod: page.lastModified || new Date().toISOString().split('T')[0],
        changefreq: page.changeFrequency || 'weekly',
        priority: page.priority || 0.5,
      });
    });

    // Add dynamic pages (blog posts, etc.)
    this.addDynamicPages(urls);

    return urls;
  }

  /**
   * Add dynamic pages to sitemap
   */
  private addDynamicPages(urls: SitemapUrl[]): void {
    // Add blog posts (this would typically come from your CMS/API)
    const blogPosts = this.getBlogPosts();
    blogPosts.forEach(post => {
      urls.push({
        loc: `${this.baseUrl}/blog/${post.slug}`,
        lastmod: post.lastModified || new Date().toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: 0.7,
      });
    });

    // Add AI employee pages
    const aiEmployees = this.getAIEmployees();
    aiEmployees.forEach(employee => {
      urls.push({
        loc: `${this.baseUrl}/marketplace/${employee.slug}`,
        lastmod:
          employee.lastModified || new Date().toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: 0.8,
      });
    });
  }

  /**
   * Build XML sitemap
   */
  private buildSitemapXML(urls: SitemapUrl[]): string {
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';
    sitemap += ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"';
    sitemap +=
      ' xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n';

    urls.forEach(url => {
      sitemap += '  <url>\n';
      sitemap += `    <loc>${url.loc}</loc>\n`;

      if (url.lastmod) {
        sitemap += `    <lastmod>${url.lastmod}</lastmod>\n`;
      }

      if (url.changefreq) {
        sitemap += `    <changefreq>${url.changefreq}</changefreq>\n`;
      }

      if (url.priority) {
        sitemap += `    <priority>${url.priority}</priority>\n`;
      }

      sitemap += '  </url>\n';
    });

    sitemap += '</urlset>';
    return sitemap;
  }

  /**
   * Get blog posts (mock data - replace with actual API call)
   */
  private getBlogPosts(): Array<{ slug: string; lastModified?: string }> {
    // This would typically come from your CMS or API
    return [
      { slug: 'getting-started-with-ai-workforce', lastModified: '2024-01-15' },
      {
        slug: 'best-practices-for-ai-employee-management',
        lastModified: '2024-01-10',
      },
      {
        slug: 'scaling-your-business-with-ai-automation',
        lastModified: '2024-01-05',
      },
      {
        slug: 'ai-workforce-vs-traditional-hiring',
        lastModified: '2024-01-01',
      },
    ];
  }

  /**
   * Get AI employees (mock data - replace with actual API call)
   */
  private getAIEmployees(): Array<{ slug: string; lastModified?: string }> {
    // This would typically come from your database
    return [
      { slug: 'ai-project-manager', lastModified: '2024-01-15' },
      { slug: 'ai-content-writer', lastModified: '2024-01-14' },
      { slug: 'ai-customer-support', lastModified: '2024-01-13' },
      { slug: 'ai-data-analyst', lastModified: '2024-01-12' },
    ];
  }

  /**
   * Generate sitemap with images
   */
  generateImageSitemap(): string {
    const images = this.getSitemapImages();
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';
    sitemap +=
      ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

    images.forEach(image => {
      sitemap += '  <url>\n';
      sitemap += `    <loc>${image.loc}</loc>\n`;
      sitemap += '    <image:image>\n';
      sitemap += `      <image:loc>${image.loc}</image:loc>\n`;

      if (image.title) {
        sitemap += `      <image:title>${image.title}</image:title>\n`;
      }

      if (image.caption) {
        sitemap += `      <image:caption>${image.caption}</image:caption>\n`;
      }

      sitemap += '    </image:image>\n';
      sitemap += '  </url>\n';
    });

    sitemap += '</urlset>';
    return sitemap;
  }

  /**
   * Get sitemap images
   */
  private getSitemapImages(): SitemapImage[] {
    return [
      {
        loc: `${this.baseUrl}/images/ai-workforce-hero.jpg`,
        title: 'AI Workforce Platform',
        caption: 'Transform your business with AI employees',
      },
      {
        loc: `${this.baseUrl}/images/marketplace-preview.jpg`,
        title: 'AI Employee Marketplace',
        caption: 'Browse and hire AI employees for your business',
      },
      {
        loc: `${this.baseUrl}/images/dashboard-overview.jpg`,
        title: 'AI Workforce Dashboard',
        caption: 'Manage and monitor your AI workforce',
      },
    ];
  }

  /**
   * Generate news sitemap
   */
  generateNewsSitemap(): string {
    const news = this.getNewsArticles();
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';
    sitemap +=
      ' xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n';

    news.forEach(article => {
      sitemap += '  <url>\n';
      sitemap += `    <loc>${this.baseUrl}/blog/${article.slug}</loc>\n`;
      sitemap += '    <news:news>\n';
      sitemap += '      <news:publication>\n';
      sitemap += `        <news:name>${article.publication.name}</news:name>\n`;
      sitemap += `        <news:language>${article.publication.language}</news:language>\n`;
      sitemap += '      </news:publication>\n';
      sitemap += `      <news:publication_date>${article.publication_date}</news:publication_date>\n`;
      sitemap += `      <news:title>${article.title}</news:title>\n`;

      if (article.keywords) {
        sitemap += `      <news:keywords>${article.keywords}</news:keywords>\n`;
      }

      sitemap += '    </news:news>\n';
      sitemap += '  </url>\n';
    });

    sitemap += '</urlset>';
    return sitemap;
  }

  /**
   * Get news articles
   */
  private getNewsArticles(): Array<{
    slug: string;
    publication: { name: string; language: string };
    publication_date: string;
    title: string;
    keywords?: string;
  }> {
    return [
      {
        slug: 'ai-workforce-revolution-2024',
        publication: { name: 'AGI Agent Automation Blog', language: 'en' },
        publication_date: '2024-01-15T10:00:00Z',
        title:
          'The AI Workforce Revolution: How 2024 is Changing Business Forever',
        keywords: 'AI workforce, business automation, artificial intelligence',
      },
      {
        slug: 'hiring-ai-employees-guide',
        publication: { name: 'AGI Agent Automation Blog', language: 'en' },
        publication_date: '2024-01-10T14:30:00Z',
        title: 'Complete Guide to Hiring Your First AI Employee',
        keywords: 'AI hiring, AI employees, business automation',
      },
    ];
  }
}

// Export singleton instance
export const sitemapGenerator = new SitemapGenerator();
