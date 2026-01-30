/**
 * Social Media Analyzer Tests
 * Unit tests for the Grok-powered social media analysis service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  SocialMediaAnalyzer,
  socialMediaAnalyzer,
  type SocialMediaQuery,
  type SocialMediaAnalysisResult,
  type SentimentAnalysis,
  type TrendAnalysis,
  type InfluencerAnalysis,
} from './social-media-analyzer';

// Mock Grok provider
vi.mock('@core/ai/llm/providers/grok-ai', () => ({
  grokProvider: {
    sendMessage: vi.fn(),
    getConfig: vi.fn().mockReturnValue({ model: 'grok-4' }),
  },
  GrokProvider: vi.fn().mockImplementation(() => ({
    sendMessage: vi.fn(),
    getConfig: vi.fn().mockReturnValue({ model: 'grok-4' }),
  })),
}));

// Mock Supabase client
vi.mock('@shared/lib/supabase-client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('Social Media Analyzer', () => {
  let mockGrokProvider: {
    sendMessage: ReturnType<typeof vi.fn>;
    getConfig: ReturnType<typeof vi.fn>;
  };
  let mockSupabase: { from: ReturnType<typeof vi.fn> };
  let analyzer: SocialMediaAnalyzer;

  beforeEach(async () => {
    vi.clearAllMocks();

    const { grokProvider } = await import('@core/ai/llm/providers/grok-ai');
    mockGrokProvider = grokProvider as unknown as {
      sendMessage: ReturnType<typeof vi.fn>;
      getConfig: ReturnType<typeof vi.fn>;
    };
    mockGrokProvider.getConfig.mockReturnValue({ model: 'grok-4' });

    const { supabase } = await import('@shared/lib/supabase-client');
    mockSupabase = supabase as unknown as { from: ReturnType<typeof vi.fn> };

    // Setup Supabase mock for storing analysis
    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    });

    // Cast to unknown first, then to the expected type to avoid direct any cast
    analyzer = new SocialMediaAnalyzer(mockGrokProvider as unknown as ConstructorParameters<typeof SocialMediaAnalyzer>[0]);

    // Suppress console logs during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getInstance', () => {
    it('should export singleton as socialMediaAnalyzer', () => {
      expect(socialMediaAnalyzer).toBeDefined();
    });
  });

  describe('analyze', () => {
    const mockQuery: SocialMediaQuery = {
      topic: 'artificial intelligence',
      platforms: ['x', 'twitter'],
      timeframe: '24h',
      analysisType: ['sentiment', 'trends'],
    };

    it('should analyze social media successfully', async () => {
      const mockResponse = {
        content: JSON.stringify({
          summary: 'AI discussions are trending positively',
          sentiment: {
            overall: 'positive',
            scores: { positive: 65, negative: 15, neutral: 20 },
            drivers: [
              {
                sentiment: 'positive',
                topic: 'GPT advancements',
                mentions: 1500,
                examples: ['Amazing progress in AI'],
              },
            ],
            emotionalTone: { joy: 40, surprise: 30 },
          },
          trends: {
            trending: [
              { topic: 'GPT-5', volume: 50000, growth: '+200%' },
            ],
            emerging: [],
            declining: [],
          },
          topContent: {
            posts: [
              {
                content: 'AI is transforming everything',
                author: '@techinfluencer',
                engagement: { likes: 5000, shares: 1000, comments: 200, total: 6200 },
                sentiment: 'positive',
              },
            ],
            viralContent: [],
          },
          insights: ['AI sentiment is overwhelmingly positive'],
          recommendations: ['Engage with AI content creators'],
        }),
      };

      mockGrokProvider.sendMessage.mockResolvedValueOnce(mockResponse);

      const result = await analyzer.analyze(mockQuery);

      expect(result.query).toEqual(mockQuery);
      expect(result.summary).toBe('AI discussions are trending positively');
      expect(result.sentiment?.overall).toBe('positive');
      expect(result.trends?.trending.length).toBeGreaterThan(0);
      expect(result.metadata.provider).toBe('grok');
    });

    it('should parse JSON from markdown code blocks', async () => {
      const mockResponse = {
        content:
          '```json\n{"summary": "Test summary", "insights": [], "recommendations": []}\n```',
      };

      mockGrokProvider.sendMessage.mockResolvedValueOnce(mockResponse);

      const result = await analyzer.analyze({ topic: 'test' });

      expect(result.summary).toBe('Test summary');
    });

    it('should handle non-JSON response gracefully', async () => {
      mockGrokProvider.sendMessage.mockResolvedValueOnce({
        content: 'This is a plain text response about the topic.',
      });

      const result = await analyzer.analyze({ topic: 'test' });

      expect(result.summary).toBe(
        'This is a plain text response about the topic.'
      );
      expect(result.insights).toEqual([]);
      expect(result.recommendations).toEqual([]);
    });

    it('should store analysis when userId provided', async () => {
      mockGrokProvider.sendMessage.mockResolvedValueOnce({
        content: JSON.stringify({
          summary: 'Test',
          insights: [],
          recommendations: [],
        }),
      });

      const insertMock = vi.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValueOnce({ insert: insertMock });

      await analyzer.analyze({ topic: 'test' }, 'user-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('social_media_analyses');
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          topic: 'test',
        })
      );
    });

    it('should not store analysis when userId not provided', async () => {
      mockGrokProvider.sendMessage.mockResolvedValueOnce({
        content: JSON.stringify({
          summary: 'Test',
          insights: [],
          recommendations: [],
        }),
      });

      await analyzer.analyze({ topic: 'test' });

      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should throw error on analysis failure', async () => {
      mockGrokProvider.sendMessage.mockRejectedValueOnce(
        new Error('Grok API error')
      );

      await expect(analyzer.analyze({ topic: 'test' })).rejects.toThrow(
        'Social media analysis failed: Grok API error'
      );
    });

    it('should include all analysis types in request', async () => {
      mockGrokProvider.sendMessage.mockResolvedValueOnce({
        content: JSON.stringify({
          summary: 'Full analysis',
          sentiment: { overall: 'neutral', scores: {} },
          trends: { trending: [], emerging: [], declining: [] },
          influencers: { topInfluencers: [], risingVoices: [] },
          insights: [],
          recommendations: [],
        }),
      });

      await analyzer.analyze({
        topic: 'test',
        analysisType: ['all'],
      });

      const sentMessages = mockGrokProvider.sendMessage.mock.calls[0][0];
      const userPrompt = sentMessages[1].content;

      expect(userPrompt).toContain('Sentiment Analysis');
      expect(userPrompt).toContain('Trend Analysis');
      expect(userPrompt).toContain('Influencer Analysis');
    });

    it('should handle database storage errors gracefully', async () => {
      mockGrokProvider.sendMessage.mockResolvedValueOnce({
        content: JSON.stringify({
          summary: 'Test',
          insights: [],
          recommendations: [],
        }),
      });

      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: new Error('DB error') }),
      });

      // Should not throw
      const result = await analyzer.analyze({ topic: 'test' }, 'user-123');

      expect(result.summary).toBe('Test');
    });
  });

  describe('quickSentiment', () => {
    it('should return quick sentiment analysis', async () => {
      mockGrokProvider.sendMessage.mockResolvedValueOnce({
        content: JSON.stringify({
          summary: 'Positive sentiment detected',
          sentiment: {
            overall: 'positive',
            scores: { positive: 70, negative: 10, neutral: 20 },
          },
          insights: [],
          recommendations: [],
        }),
      });

      const result = await analyzer.quickSentiment('bitcoin');

      expect(result.sentiment).toBe('positive');
      expect(result.score).toBe(70);
      expect(result.summary).toBe('Positive sentiment detected');
    });

    it('should use default timeframe of 24h', async () => {
      mockGrokProvider.sendMessage.mockResolvedValueOnce({
        content: JSON.stringify({
          summary: 'Test',
          insights: [],
          recommendations: [],
        }),
      });

      await analyzer.quickSentiment('test');

      const sentMessages = mockGrokProvider.sendMessage.mock.calls[0][0];
      const userPrompt = sentMessages[1].content;

      expect(userPrompt).toContain('24h');
    });

    it('should return neutral when sentiment not available', async () => {
      mockGrokProvider.sendMessage.mockResolvedValueOnce({
        content: JSON.stringify({
          summary: 'No sentiment data',
          insights: [],
          recommendations: [],
        }),
      });

      const result = await analyzer.quickSentiment('test');

      expect(result.sentiment).toBe('neutral');
      expect(result.score).toBe(50);
    });
  });

  describe('getTrends', () => {
    it('should return trend analysis', async () => {
      mockGrokProvider.sendMessage.mockResolvedValueOnce({
        content: JSON.stringify({
          summary: 'Multiple trends detected',
          trends: {
            trending: [
              { topic: '#AI', volume: 100000, growth: '+150%' },
              { topic: '#ML', volume: 50000, growth: '+80%' },
            ],
            emerging: [
              {
                topic: '#AGI',
                currentVolume: 5000,
                projectedGrowth: '+500%',
                confidence: 'high',
              },
            ],
            declining: [
              {
                topic: '#blockchain',
                previousVolume: 80000,
                currentVolume: 40000,
                decline: '-50%',
              },
            ],
          },
          insights: [],
          recommendations: [],
        }),
      });

      const result = await analyzer.getTrends('technology');

      expect(result.trending.length).toBe(2);
      expect(result.emerging.length).toBe(1);
      expect(result.declining.length).toBe(1);
      expect(result.trending[0].topic).toBe('#AI');
    });

    it('should return empty arrays when no trends found', async () => {
      mockGrokProvider.sendMessage.mockResolvedValueOnce({
        content: JSON.stringify({
          summary: 'No trends',
          insights: [],
          recommendations: [],
        }),
      });

      const result = await analyzer.getTrends('obscure topic');

      expect(result.trending).toEqual([]);
      expect(result.emerging).toEqual([]);
      expect(result.declining).toEqual([]);
    });
  });

  describe('findInfluencers', () => {
    it('should return influencer analysis', async () => {
      mockGrokProvider.sendMessage.mockResolvedValueOnce({
        content: JSON.stringify({
          summary: 'Top influencers identified',
          influencers: {
            topInfluencers: [
              {
                username: '@tech_guru',
                platform: 'x',
                followers: 500000,
                engagement: 5.2,
                relevance: 'high',
                recentPosts: 15,
                sentiment: 'positive',
              },
            ],
            risingVoices: [
              {
                username: '@new_voice',
                platform: 'x',
                growthRate: '+200%',
                niche: 'AI',
              },
            ],
          },
          insights: [],
          recommendations: [],
        }),
      });

      const result = await analyzer.findInfluencers('AI', 'x');

      expect(result.topInfluencers.length).toBe(1);
      expect(result.topInfluencers[0].username).toBe('@tech_guru');
      expect(result.risingVoices.length).toBe(1);
    });

    it('should use 7d timeframe for influencer analysis', async () => {
      mockGrokProvider.sendMessage.mockResolvedValueOnce({
        content: JSON.stringify({
          summary: 'Test',
          insights: [],
          recommendations: [],
        }),
      });

      await analyzer.findInfluencers('test');

      const sentMessages = mockGrokProvider.sendMessage.mock.calls[0][0];
      const userPrompt = sentMessages[1].content;

      expect(userPrompt).toContain('7d');
    });

    it('should return empty arrays when no influencers found', async () => {
      mockGrokProvider.sendMessage.mockResolvedValueOnce({
        content: JSON.stringify({
          summary: 'No influencers',
          insights: [],
          recommendations: [],
        }),
      });

      const result = await analyzer.findInfluencers('obscure');

      expect(result.topInfluencers).toEqual([]);
      expect(result.risingVoices).toEqual([]);
    });
  });

  describe('compareSentiment', () => {
    it('should compare sentiment across multiple topics', async () => {
      mockGrokProvider.sendMessage
        .mockResolvedValueOnce({
          content: JSON.stringify({
            summary: 'Bitcoin positive',
            sentiment: {
              overall: 'positive',
              scores: { positive: 70 },
            },
            insights: [],
            recommendations: [],
          }),
        })
        .mockResolvedValueOnce({
          content: JSON.stringify({
            summary: 'Ethereum neutral',
            sentiment: {
              overall: 'neutral',
              scores: { neutral: 60 },
            },
            insights: [],
            recommendations: [],
          }),
        });

      const result = await analyzer.compareSentiment(['bitcoin', 'ethereum']);

      expect(result.length).toBe(2);
      expect(result[0].topic).toBe('bitcoin');
      expect(result[0].sentiment).toBe('positive');
      expect(result[1].topic).toBe('ethereum');
      expect(result[1].sentiment).toBe('neutral');
    });

    it('should run comparisons in parallel', async () => {
      const startTime = Date.now();

      mockGrokProvider.sendMessage.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return {
          content: JSON.stringify({
            summary: 'Test',
            sentiment: { overall: 'neutral', scores: {} },
            insights: [],
            recommendations: [],
          }),
        };
      });

      await analyzer.compareSentiment(['topic1', 'topic2', 'topic3']);

      const duration = Date.now() - startTime;

      // Should be faster than sequential (3 * 50ms = 150ms)
      expect(duration).toBeLessThan(150);
    });
  });

  describe('metadata calculation', () => {
    it('should calculate confidence score based on data completeness', async () => {
      mockGrokProvider.sendMessage.mockResolvedValueOnce({
        content: JSON.stringify({
          summary: 'Complete analysis',
          sentiment: { scores: { positive: 70 } },
          trends: { trending: [{ topic: 'test' }] },
          influencers: { topInfluencers: [{ username: '@test' }] },
          topContent: { posts: [{ content: 'test' }] },
          insights: ['insight 1'],
          recommendations: ['rec 1'],
        }),
      });

      const result = await analyzer.analyze({ topic: 'test' });

      // Base 50 + 10 (sentiment) + 10 (trends) + 10 (influencers) + 10 (content) + 5 (insights) + 5 (recs) = 100
      expect(result.metadata.confidenceScore).toBe(100);
    });

    it('should estimate data sources count', async () => {
      mockGrokProvider.sendMessage.mockResolvedValueOnce({
        content: JSON.stringify({
          summary: 'Analysis',
          topContent: {
            posts: [{ content: 'post1' }, { content: 'post2' }],
          },
          influencers: { topInfluencers: [{ username: '@user1' }] },
          trends: { trending: [{ topic: 't1' }, { topic: 't2' }] },
          insights: [],
          recommendations: [],
        }),
      });

      const result = await analyzer.analyze({ topic: 'test' });

      // 2 posts + 1 influencer + 2 trends = 5
      expect(result.metadata.dataSourcesCount).toBe(5);
    });

    it('should include analysis timestamp', async () => {
      const beforeAnalysis = new Date().toISOString();

      mockGrokProvider.sendMessage.mockResolvedValueOnce({
        content: JSON.stringify({
          summary: 'Test',
          insights: [],
          recommendations: [],
        }),
      });

      const result = await analyzer.analyze({ topic: 'test' });

      const afterAnalysis = new Date().toISOString();

      expect(result.metadata.analyzedAt).toBeDefined();
      expect(result.metadata.analyzedAt >= beforeAnalysis).toBe(true);
      expect(result.metadata.analyzedAt <= afterAnalysis).toBe(true);
    });
  });

  describe('query building', () => {
    it('should include keywords in prompt', async () => {
      mockGrokProvider.sendMessage.mockResolvedValueOnce({
        content: JSON.stringify({
          summary: 'Test',
          insights: [],
          recommendations: [],
        }),
      });

      await analyzer.analyze({
        topic: 'AI',
        keywords: ['machine learning', 'neural networks'],
      });

      const userPrompt =
        mockGrokProvider.sendMessage.mock.calls[0][0][1].content;

      expect(userPrompt).toContain('machine learning');
      expect(userPrompt).toContain('neural networks');
    });

    it('should include hashtags in prompt', async () => {
      mockGrokProvider.sendMessage.mockResolvedValueOnce({
        content: JSON.stringify({
          summary: 'Test',
          insights: [],
          recommendations: [],
        }),
      });

      await analyzer.analyze({
        topic: 'AI',
        hashtags: ['#AI', '#MachineLearning'],
      });

      const userPrompt =
        mockGrokProvider.sendMessage.mock.calls[0][0][1].content;

      expect(userPrompt).toContain('#AI');
      expect(userPrompt).toContain('#MachineLearning');
    });

    it('should include location in prompt', async () => {
      mockGrokProvider.sendMessage.mockResolvedValueOnce({
        content: JSON.stringify({
          summary: 'Test',
          insights: [],
          recommendations: [],
        }),
      });

      await analyzer.analyze({
        topic: 'AI',
        location: 'San Francisco',
      });

      const userPrompt =
        mockGrokProvider.sendMessage.mock.calls[0][0][1].content;

      expect(userPrompt).toContain('San Francisco');
    });
  });
});
