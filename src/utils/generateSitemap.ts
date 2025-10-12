// Sitemap Generator for AGI Agent Automation
// Generates XML sitemaps for all pages and blog posts

interface SitemapEntry {
  url: string;
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

export function generateSitemap(entries: SitemapEntry[]): string {
  const siteUrl = 'https://agiagentautomation.com';

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${entries
  .map(
    entry => `  <url>
    <loc>${siteUrl}${entry.url}</loc>
    ${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''}
    ${entry.changefreq ? `<changefreq>${entry.changefreq}</changefreq>` : ''}
    ${entry.priority !== undefined ? `<priority>${entry.priority}</priority>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>`;

  return xml;
}

// Static pages sitemap
export const staticPages: SitemapEntry[] = [
  // Homepage - highest priority
  { url: '/', changefreq: 'daily', priority: 1.0 },

  // Main product pages
  { url: '/marketplace', changefreq: 'daily', priority: 0.9 },
  { url: '/pricing', changefreq: 'weekly', priority: 0.9 },
  { url: '/features/ai-chat', changefreq: 'weekly', priority: 0.8 },
  { url: '/features/ai-dashboards', changefreq: 'weekly', priority: 0.8 },
  { url: '/features/ai-project-manager', changefreq: 'weekly', priority: 0.8 },

  // Use cases
  { url: '/use-cases/startups', changefreq: 'weekly', priority: 0.8 },
  {
    url: '/use-cases/it-service-providers',
    changefreq: 'weekly',
    priority: 0.8,
  },
  { url: '/use-cases/sales-teams', changefreq: 'weekly', priority: 0.8 },
  {
    url: '/use-cases/consulting-businesses',
    changefreq: 'weekly',
    priority: 0.8,
  },

  // Marketing pages
  { url: '/blog', changefreq: 'daily', priority: 0.9 },
  { url: '/resources', changefreq: 'weekly', priority: 0.7 },
  { url: '/help', changefreq: 'weekly', priority: 0.7 },
  { url: '/contact-sales', changefreq: 'monthly', priority: 0.7 },
  { url: '/about', changefreq: 'monthly', priority: 0.6 },

  // Comparison pages - high value for SEO
  { url: '/vs-chatgpt', changefreq: 'weekly', priority: 0.8 },
  { url: '/chatgpt-alternative', changefreq: 'weekly', priority: 0.8 },
  { url: '/vs-claude', changefreq: 'weekly', priority: 0.8 },
  { url: '/claude-alternative', changefreq: 'weekly', priority: 0.8 },

  // Legal pages
  { url: '/privacy-policy', changefreq: 'monthly', priority: 0.3 },
  { url: '/terms-of-service', changefreq: 'monthly', priority: 0.3 },
  { url: '/cookie-policy', changefreq: 'monthly', priority: 0.3 },

  // Other
  { url: '/documentation', changefreq: 'weekly', priority: 0.7 },
  { url: '/api-reference', changefreq: 'weekly', priority: 0.6 },
  { url: '/security', changefreq: 'monthly', priority: 0.6 },
  { url: '/careers', changefreq: 'weekly', priority: 0.5 },
];

// Generate blog sitemap from database
export function generateBlogSitemap(
  posts: Array<{ slug: string; updated_at: string }>
): string {
  const entries: SitemapEntry[] = posts.map(post => ({
    url: `/blog/${post.slug}`,
    lastmod: new Date(post.updated_at).toISOString(),
    changefreq: 'weekly' as const,
    priority: 0.8,
  }));

  return generateSitemap(entries);
}

// Master sitemap index
export function generateSitemapIndex(): string {
  const siteUrl = 'https://agiagentautomation.com';

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${siteUrl}/sitemap-pages.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${siteUrl}/sitemap-blog.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
</sitemapindex>`;
}

// Export static pages sitemap
export const staticPagesSitemap = generateSitemap(staticPages);
