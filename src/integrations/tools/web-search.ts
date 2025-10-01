export interface SearchResult {
  title: string;
  url: string;
  description: string;
  publishedDate?: string;
  author?: string;
}

export interface ToolResult {
  success: boolean;
  data?: SearchResult[];
  error?: string;
  cost?: number;
}

export interface WebSearchParams {
  query: string;
  count?: number;
  language?: string;
  region?: string;
  safeSearch?: boolean;
}

export class WebSearchTool {
  private apiKey: string;
  private baseUrl: string = 'https://api.search.brave.com/res/v1/web/search';

  constructor() {
    this.apiKey = import.meta.env.VITE_BRAVE_SEARCH_API_KEY;
  }

  async execute(params: WebSearchParams): Promise<ToolResult> {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          error: 'Brave Search API key not configured'
        };
      }

      const searchParams = new URLSearchParams({
        q: params.query,
        count: (params.count || 10).toString(),
        offset: '0',
        mkt: params.language || 'en-US',
        safesearch: params.safeSearch ? 'strict' : 'moderate'
      });

      const response = await fetch(`${this.baseUrl}?${searchParams}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Search API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      const results: SearchResult[] = data.web?.results?.map((result: any) => ({
        title: result.title,
        url: result.url,
        description: result.description,
        publishedDate: result.age,
        author: result.extra_snippets?.[0]
      })) || [];

      return {
        success: true,
        data: results,
        cost: 0.005 // Approximate cost per search
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async fetchPage(url: string): Promise<ToolResult> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status}`);
      }

      const content = await response.text();
      
      return {
        success: true,
        data: [{
          title: this.extractTitle(content),
          url: url,
          description: this.extractDescription(content),
          publishedDate: this.extractDate(content)
        }],
        cost: 0.002 // Approximate cost per page fetch
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private extractTitle(html: string): string {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : 'Untitled';
  }

  private extractDescription(html: string): string {
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    return descMatch ? descMatch[1].trim() : 'No description available';
  }

  private extractDate(html: string): string | undefined {
    const dateMatch = html.match(/<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i);
    return dateMatch ? dateMatch[1] : undefined;
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const testResult = await this.execute({
        query: 'test search',
        count: 1
      });
      return testResult.success;
    } catch (error) {
      return false;
    }
  }
}
