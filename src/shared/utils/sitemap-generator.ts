// Dynamic sitemap generation utility
// Generates XML sitemap based on actual routes

export interface SitemapEntry {
  path: string;
  priority: number;
  changefreq:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never';
  lastmod?: string;
}

export const publicRoutes: SitemapEntry[] = [
  // Main pages
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/pricing', priority: 0.9, changefreq: 'weekly' },
  { path: '/about', priority: 0.8, changefreq: 'monthly' },
  { path: '/contact-sales', priority: 0.8, changefreq: 'monthly' },

  // Help & Resources
  { path: '/help', priority: 0.7, changefreq: 'weekly' },
  { path: '/documentation', priority: 0.7, changefreq: 'weekly' },
  { path: '/resources', priority: 0.7, changefreq: 'weekly' },
  { path: '/blog', priority: 0.8, changefreq: 'daily' },

  // Marketplace
  { path: '/marketplace', priority: 0.9, changefreq: 'daily' },

  // Use Cases
  { path: '/use-cases/startups', priority: 0.6, changefreq: 'monthly' },
  {
    path: '/use-cases/it-service-providers',
    priority: 0.6,
    changefreq: 'monthly',
  },
  { path: '/use-cases/sales-teams', priority: 0.6, changefreq: 'monthly' },
  {
    path: '/use-cases/consulting-businesses',
    priority: 0.6,
    changefreq: 'monthly',
  },

  // Features
  { path: '/features/ai-chat', priority: 0.7, changefreq: 'monthly' },
  { path: '/features/ai-dashboards', priority: 0.7, changefreq: 'monthly' },
  {
    path: '/features/ai-project-manager',
    priority: 0.7,
    changefreq: 'monthly',
  },

  // Legal
  { path: '/privacy-policy', priority: 0.4, changefreq: 'yearly' },
  { path: '/terms-of-service', priority: 0.4, changefreq: 'yearly' },
  { path: '/cookie-policy', priority: 0.3, changefreq: 'yearly' },
];

export function generateSitemap(baseUrl: string = ''): string {
  const now = new Date().toISOString();

  const urls = publicRoutes
    .map((entry) => {
      const lastmod = entry.lastmod || now;
      return `  <url>
    <loc>${baseUrl}${entry.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export function generateSitemapIndex(baseUrl: string = ''): string {
  const now = new Date().toISOString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap-pages.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;
}
