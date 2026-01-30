/**
 * Marketing Endpoints Tests
 * Unit tests for the marketing website API services
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  submitContactForm,
  subscribeToNewsletter,
  getBlogPosts,
  getBlogCategories,
  getResources,
  trackResourceDownload,
  getPricingPlans,
  getSupportCategories,
  getHelpArticles,
  getFAQItems,
  createSupportTicket,
  getUserTickets,
  type ContactFormData,
  type NewsletterData,
  type BlogPostsParams,
  type SupportTicket,
} from './marketing-endpoints';

// Mock Supabase client
vi.mock('@shared/lib/supabase-client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Marketing Endpoints', () => {
  let mockSupabase: { from: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.clearAllMocks();

    const { supabase } = await import('@shared/lib/supabase-client');
    mockSupabase = supabase as unknown as { from: ReturnType<typeof vi.fn> };

    // Reset fetch mock
    mockFetch.mockReset();

    // Suppress console logs during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Stub environment variable
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('submitContactForm', () => {
    const mockFormData: ContactFormData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      company: 'Acme Inc',
      phone: '+1234567890',
      companySize: '50-100',
      message: 'I would like to learn more about your product.',
      source: 'website',
    };

    it('should submit contact form successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, id: 'contact-123' }),
      });

      const result = await submitContactForm(mockFormData);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/contact-form'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mockFormData),
        })
      );
    });

    it('should throw error on submission failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid email format' }),
      });

      await expect(submitContactForm(mockFormData)).rejects.toThrow(
        'Invalid email format'
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(submitContactForm(mockFormData)).rejects.toThrow(
        'Network error'
      );
    });

    it('should use default error message when none provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      });

      await expect(submitContactForm(mockFormData)).rejects.toThrow(
        'Failed to submit contact form'
      );
    });
  });

  describe('subscribeToNewsletter', () => {
    const mockNewsletterData: NewsletterData = {
      email: 'subscriber@example.com',
      name: 'Jane Doe',
      source: 'footer',
      tags: ['product-updates', 'blog'],
    };

    it('should subscribe to newsletter successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await subscribeToNewsletter(mockNewsletterData);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/newsletter-subscribe'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockNewsletterData),
        })
      );
    });

    it('should throw error on subscription failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Email already subscribed' }),
      });

      await expect(subscribeToNewsletter(mockNewsletterData)).rejects.toThrow(
        'Email already subscribed'
      );
    });

    it('should handle minimal newsletter data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await subscribeToNewsletter({ email: 'test@example.com' });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.email).toBe('test@example.com');
    });
  });

  describe('getBlogPosts', () => {
    it('should fetch blog posts successfully', async () => {
      const mockPosts = {
        posts: [
          { id: '1', title: 'Post 1', slug: 'post-1' },
          { id: '2', title: 'Post 2', slug: 'post-2' },
        ],
        total: 2,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPosts),
      });

      const result = await getBlogPosts();

      expect(result.posts.length).toBe(2);
    });

    it('should apply category filter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ posts: [] }),
      });

      await getBlogPosts({ category: 'technology' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('category=technology')
      );
    });

    it('should apply search filter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ posts: [] }),
      });

      await getBlogPosts({ search: 'ai automation' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('search=ai+automation')
      );
    });

    it('should apply pagination', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ posts: [] }),
      });

      await getBlogPosts({ limit: 10, offset: 20 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=10')
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('offset=20')
      );
    });

    it('should apply featured filter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ posts: [] }),
      });

      await getBlogPosts({ featured: true });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('featured=true')
      );
    });

    it('should throw error on fetch failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      await expect(getBlogPosts()).rejects.toThrow('Server error');
    });
  });

  describe('getBlogCategories', () => {
    it('should fetch blog categories from Supabase', async () => {
      const mockCategories = [
        { id: '1', name: 'Technology', slug: 'technology' },
        { id: '2', name: 'Business', slug: 'business' },
      ];

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockCategories,
            error: null,
          }),
        }),
      });

      const result = await getBlogCategories();

      expect(result.length).toBe(2);
      expect(mockSupabase.from).toHaveBeenCalledWith('blog_categories');
    });

    it('should throw error on Supabase failure', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error'),
          }),
        }),
      });

      await expect(getBlogCategories()).rejects.toThrow('Database error');
    });
  });

  describe('getResources', () => {
    it('should fetch all resources', async () => {
      const mockResources = [
        { id: '1', title: 'Guide 1', type: 'Guide' },
        { id: '2', title: 'Template 1', type: 'Template' },
      ];

      // Create a chainable mock that supports the full query builder pattern
      const createQueryBuilder = (finalData: unknown) => {
        const builder: Record<string, ReturnType<typeof vi.fn>> = {};
        builder.select = vi.fn().mockReturnValue(builder);
        builder.eq = vi.fn().mockReturnValue(builder);
        builder.order = vi.fn().mockReturnValue(builder);
        // Make the builder also act as a promise that resolves with data
        builder.then = vi.fn((resolve: (value: unknown) => void) => {
          resolve({ data: finalData, error: null });
          return Promise.resolve({ data: finalData, error: null });
        });
        return builder;
      };

      mockSupabase.from.mockReturnValueOnce(createQueryBuilder(mockResources));

      const result = await getResources();

      expect(result.length).toBe(2);
      expect(mockSupabase.from).toHaveBeenCalledWith('resources');
    });

    it('should filter by type', async () => {
      const mockResources = [{ id: '1', title: 'Guide 1', type: 'Guide' }];

      // Create a chainable mock
      const eqCalls: Array<[string, unknown]> = [];
      const createQueryBuilder = (finalData: unknown) => {
        const builder: Record<string, ReturnType<typeof vi.fn>> = {};
        builder.select = vi.fn().mockReturnValue(builder);
        builder.eq = vi.fn().mockImplementation((col, val) => {
          eqCalls.push([col, val]);
          return builder;
        });
        builder.order = vi.fn().mockReturnValue(builder);
        builder.then = vi.fn((resolve: (value: unknown) => void) => {
          resolve({ data: finalData, error: null });
          return Promise.resolve({ data: finalData, error: null });
        });
        return builder;
      };

      mockSupabase.from.mockReturnValueOnce(createQueryBuilder(mockResources));

      await getResources('Guide');

      // Verify both eq calls were made: published=true and type='Guide'
      expect(mockSupabase.from).toHaveBeenCalledWith('resources');
      expect(eqCalls).toContainEqual(['published', true]);
      expect(eqCalls).toContainEqual(['type', 'Guide']);
    });

    it('should not filter when type is "All"', async () => {
      const eqCalls: Array<[string, unknown]> = [];
      const createQueryBuilder = (finalData: unknown) => {
        const builder: Record<string, ReturnType<typeof vi.fn>> = {};
        builder.select = vi.fn().mockReturnValue(builder);
        builder.eq = vi.fn().mockImplementation((col, val) => {
          eqCalls.push([col, val]);
          return builder;
        });
        builder.order = vi.fn().mockReturnValue(builder);
        builder.then = vi.fn((resolve: (value: unknown) => void) => {
          resolve({ data: [], error: null });
          return Promise.resolve({ data: [], error: null });
        });
        return builder;
      };

      mockSupabase.from.mockReturnValueOnce(createQueryBuilder([]));

      await getResources('All');

      // Should only call eq for 'published', not for 'type'
      expect(eqCalls).toContainEqual(['published', true]);
      expect(eqCalls.some(([col]) => col === 'type')).toBe(false);
    });
  });

  describe('trackResourceDownload', () => {
    it('should track resource download', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await trackResourceDownload('resource-123', 'user@example.com');

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/resource-download'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            resourceId: 'resource-123',
            userEmail: 'user@example.com',
          }),
        })
      );
    });

    it('should work without user email', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await trackResourceDownload('resource-123');

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.resourceId).toBe('resource-123');
      expect(callBody.userEmail).toBeUndefined();
    });
  });

  describe('getPricingPlans', () => {
    it('should fetch active pricing plans', async () => {
      const mockPlans = [
        {
          id: '1',
          name: 'Free',
          slug: 'free',
          price_monthly: 0,
          price_yearly: 0,
        },
        {
          id: '2',
          name: 'Pro',
          slug: 'pro',
          price_monthly: 29,
          price_yearly: 290,
        },
      ];

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockPlans,
              error: null,
            }),
          }),
        }),
      });

      const result = await getPricingPlans();

      expect(result.length).toBe(2);
      expect(mockSupabase.from).toHaveBeenCalledWith('subscription_plans');
    });

    it('should only fetch active plans', async () => {
      const eqMock = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: eqMock,
        }),
      });

      await getPricingPlans();

      expect(eqMock).toHaveBeenCalledWith('active', true);
    });
  });

  describe('getSupportCategories', () => {
    it('should fetch support categories', async () => {
      const mockCategories = [
        { id: '1', title: 'Getting Started', slug: 'getting-started' },
        { id: '2', title: 'Billing', slug: 'billing' },
      ];

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockCategories,
            error: null,
          }),
        }),
      });

      const result = await getSupportCategories();

      expect(result.length).toBe(2);
      expect(mockSupabase.from).toHaveBeenCalledWith('support_categories');
    });
  });

  describe('getHelpArticles', () => {
    it('should fetch all help articles', async () => {
      const mockArticles = [
        { id: '1', title: 'How to get started', category: {} },
      ];

      // Create a chainable mock for help_articles
      const createQueryBuilder = (finalData: unknown) => {
        const builder: Record<string, ReturnType<typeof vi.fn>> = {};
        builder.select = vi.fn().mockReturnValue(builder);
        builder.eq = vi.fn().mockReturnValue(builder);
        builder.order = vi.fn().mockReturnValue(builder);
        builder.then = vi.fn((resolve: (value: unknown) => void) => {
          resolve({ data: finalData, error: null });
          return Promise.resolve({ data: finalData, error: null });
        });
        return builder;
      };

      mockSupabase.from.mockReturnValueOnce(createQueryBuilder(mockArticles));

      const result = await getHelpArticles();

      expect(result.length).toBe(1);
    });

    it('should filter by category slug', async () => {
      // The getHelpArticles function first looks up category by slug, then queries articles
      // First call: support_categories lookup
      const categoryBuilder: Record<string, ReturnType<typeof vi.fn>> = {};
      categoryBuilder.select = vi.fn().mockReturnValue(categoryBuilder);
      categoryBuilder.eq = vi.fn().mockReturnValue(categoryBuilder);
      categoryBuilder.maybeSingle = vi.fn().mockResolvedValue({
        data: { id: 'cat-1' },
        error: null,
      });

      // Second call: help_articles query with category filter
      const eqCalls: Array<[string, unknown]> = [];
      const articlesBuilder: Record<string, ReturnType<typeof vi.fn>> = {};
      articlesBuilder.select = vi.fn().mockReturnValue(articlesBuilder);
      articlesBuilder.eq = vi.fn().mockImplementation((col, val) => {
        eqCalls.push([col, val]);
        return articlesBuilder;
      });
      articlesBuilder.then = vi.fn((resolve: (value: unknown) => void) => {
        resolve({ data: [{ id: '1', title: 'Article' }], error: null });
        return Promise.resolve({ data: [{ id: '1', title: 'Article' }], error: null });
      });

      // The function calls from('help_articles') first, then from('support_categories')
      mockSupabase.from.mockReturnValueOnce(articlesBuilder);
      mockSupabase.from.mockReturnValueOnce(categoryBuilder);

      await getHelpArticles('getting-started');

      expect(mockSupabase.from).toHaveBeenCalledWith('help_articles');
      expect(mockSupabase.from).toHaveBeenCalledWith('support_categories');
      // Should filter by category_id after finding the category
      expect(eqCalls).toContainEqual(['category_id', 'cat-1']);
    });
  });

  describe('getFAQItems', () => {
    it('should fetch published FAQ items', async () => {
      const mockFAQs = [
        { id: '1', question: 'What is this?', answer: 'This is a product.' },
      ];

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockFAQs,
              error: null,
            }),
          }),
        }),
      });

      const result = await getFAQItems();

      expect(result.length).toBe(1);
      expect(mockSupabase.from).toHaveBeenCalledWith('faq_items');
    });

    it('should only fetch published FAQs', async () => {
      const eqMock = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: eqMock,
        }),
      });

      await getFAQItems();

      expect(eqMock).toHaveBeenCalledWith('published', true);
    });
  });

  describe('createSupportTicket', () => {
    const mockTicket: SupportTicket = {
      subject: 'Need help with billing',
      description: 'I cannot update my payment method.',
      priority: 'high',
      category_id: 'billing-cat',
    };

    it('should create support ticket successfully', async () => {
      const mockResponse = { id: 'ticket-123', ...mockTicket };

      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockResponse,
              error: null,
            }),
          }),
        }),
      });

      const result = await createSupportTicket(mockTicket);

      expect(result.id).toBe('ticket-123');
      expect(mockSupabase.from).toHaveBeenCalledWith('support_tickets');
    });

    it('should throw error on creation failure', async () => {
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Failed to create ticket'),
            }),
          }),
        }),
      });

      await expect(createSupportTicket(mockTicket)).rejects.toThrow(
        'Failed to create ticket'
      );
    });
  });

  describe('getUserTickets', () => {
    it('should fetch user tickets', async () => {
      const mockTickets = [
        { id: '1', subject: 'Issue 1', category: {} },
        { id: '2', subject: 'Issue 2', category: {} },
      ];

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockTickets,
            error: null,
          }),
        }),
      });

      const result = await getUserTickets();

      expect(result.length).toBe(2);
      expect(mockSupabase.from).toHaveBeenCalledWith('support_tickets');
    });

    it('should order by created_at descending', async () => {
      const orderMock = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: orderMock,
        }),
      });

      await getUserTickets();

      expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should throw error on fetch failure', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('Access denied'),
          }),
        }),
      });

      await expect(getUserTickets()).rejects.toThrow('Access denied');
    });
  });
});
