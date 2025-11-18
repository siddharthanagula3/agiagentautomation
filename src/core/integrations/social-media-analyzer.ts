/**
 * Social Media Analyzer Service
 * Uses Grok AI for real-time social media analysis, public opinion tracking,
 * and trend detection from X (Twitter) and other platforms.
 * Created: Nov 18th 2025
 */

import { grokProvider, GrokProvider } from '@core/ai/llm/providers/grok-ai';
import { supabase } from '@shared/lib/supabase-client';

export interface SocialMediaQuery {
  topic: string;
  platforms?: ('twitter' | 'x' | 'reddit' | 'linkedin')[];
  timeframe?: '1h' | '6h' | '24h' | '7d' | '30d';
  analysisType?: ('sentiment' | 'trends' | 'influencers' | 'all')[];
  keywords?: string[];
  hashtags?: string[];
  location?: string;
}

export interface SentimentAnalysis {
  overall: 'positive' | 'negative' | 'neutral' | 'mixed';
  scores: {
    positive: number; // 0-100
    negative: number; // 0-100
    neutral: number; // 0-100
  };
  drivers: Array<{
    sentiment: 'positive' | 'negative';
    topic: string;
    mentions: number;
    examples: string[];
  }>;
  emotionalTone: {
    joy?: number;
    anger?: number;
    fear?: number;
    sadness?: number;
    surprise?: number;
  };
}

export interface TrendAnalysis {
  trending: Array<{
    topic: string;
    hashtag?: string;
    volume: number;
    growth: string; // e.g., "+250%" or "-15%"
    peakTime?: string;
    category?: string;
  }>;
  emerging: Array<{
    topic: string;
    currentVolume: number;
    projectedGrowth: string;
    confidence: 'high' | 'medium' | 'low';
  }>;
  declining: Array<{
    topic: string;
    previousVolume: number;
    currentVolume: number;
    decline: string;
  }>;
}

export interface InfluencerAnalysis {
  topInfluencers: Array<{
    username: string;
    platform: string;
    followers: number;
    engagement: number;
    relevance: 'high' | 'medium' | 'low';
    recentPosts: number;
    sentiment: 'positive' | 'negative' | 'neutral';
  }>;
  risingVoices: Array<{
    username: string;
    platform: string;
    growthRate: string;
    niche: string;
  }>;
}

export interface TopContent {
  posts: Array<{
    content: string;
    author: string;
    platform: string;
    engagement: {
      likes: number;
      shares: number;
      comments: number;
      total: number;
    };
    sentiment: 'positive' | 'negative' | 'neutral';
    url?: string;
    timestamp?: string;
  }>;
  viralContent: Array<{
    content: string;
    viralityScore: number;
    shareVelocity: string;
    reachEstimate: number;
  }>;
}

export interface SocialMediaAnalysisResult {
  query: SocialMediaQuery;
  summary: string;
  sentiment?: SentimentAnalysis;
  trends?: TrendAnalysis;
  influencers?: InfluencerAnalysis;
  topContent?: TopContent;
  insights: string[];
  recommendations: string[];
  metadata: {
    analyzedAt: string;
    dataSourcesCount: number;
    confidenceScore: number; // 0-100
    provider: 'grok';
    model: string;
  };
}

export class SocialMediaAnalyzer {
  private provider: GrokProvider;

  constructor(provider: GrokProvider = grokProvider) {
    this.provider = provider;
  }

  /**
   * Analyze social media for a given topic
   */
  async analyze(
    query: SocialMediaQuery,
    userId?: string
  ): Promise<SocialMediaAnalysisResult> {
    console.log('[SocialMediaAnalyzer] Starting analysis:', query);

    try {
      // Build comprehensive analysis prompt
      const prompt = this.buildAnalysisPrompt(query);

      // Use Grok's real-time capabilities for analysis
      const response = await this.provider.sendMessage([
        {
          role: 'system',
          content: this.getSystemPrompt(),
        },
        {
          role: 'user',
          content: prompt,
        },
      ]);

      // Parse the structured response
      const analysis = this.parseAnalysisResponse(response.content, query);

      // Store analysis results
      if (userId) {
        await this.storeAnalysis(userId, query, analysis);
      }

      console.log('[SocialMediaAnalyzer] Analysis complete');
      return analysis;
    } catch (error) {
      console.error('[SocialMediaAnalyzer] Analysis failed:', error);
      throw new Error(
        `Social media analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Quick sentiment check for a topic
   */
  async quickSentiment(
    topic: string,
    timeframe: '1h' | '6h' | '24h' = '24h'
  ): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
    summary: string;
  }> {
    const result = await this.analyze({
      topic,
      timeframe,
      analysisType: ['sentiment'],
      platforms: ['x', 'twitter'],
    });

    return {
      sentiment: result.sentiment?.overall || 'neutral',
      score:
        result.sentiment?.scores.positive ||
        result.sentiment?.scores.negative ||
        50,
      summary: result.summary,
    };
  }

  /**
   * Get trending topics related to a subject
   */
  async getTrends(
    topic: string,
    timeframe: '1h' | '6h' | '24h' | '7d' = '24h'
  ): Promise<TrendAnalysis> {
    const result = await this.analyze({
      topic,
      timeframe,
      analysisType: ['trends'],
      platforms: ['x', 'twitter'],
    });

    return (
      result.trends || {
        trending: [],
        emerging: [],
        declining: [],
      }
    );
  }

  /**
   * Find influencers discussing a topic
   */
  async findInfluencers(
    topic: string,
    platform: 'twitter' | 'x' | 'linkedin' | 'reddit' = 'x'
  ): Promise<InfluencerAnalysis> {
    const result = await this.analyze({
      topic,
      platforms: [platform],
      analysisType: ['influencers'],
      timeframe: '7d',
    });

    return (
      result.influencers || {
        topInfluencers: [],
        risingVoices: [],
      }
    );
  }

  /**
   * Compare sentiment between multiple topics
   */
  async compareSentiment(
    topics: string[],
    timeframe: '1h' | '6h' | '24h' | '7d' = '24h'
  ): Promise<
    Array<{
      topic: string;
      sentiment: 'positive' | 'negative' | 'neutral';
      score: number;
      volume: number;
    }>
  > {
    const results = await Promise.all(
      topics.map((topic) => this.quickSentiment(topic, timeframe))
    );

    return topics.map((topic, index) => ({
      topic,
      sentiment: results[index].sentiment,
      score: results[index].score,
      volume: 0, // Would need additional API call to get volume
    }));
  }

  /**
   * Build comprehensive analysis prompt
   */
  private buildAnalysisPrompt(query: SocialMediaQuery): string {
    const parts: string[] = [];

    parts.push(`# Social Media Analysis Request`);
    parts.push(`\n**Topic:** ${query.topic}`);
    parts.push(`**Timeframe:** ${query.timeframe || '24h'}`);
    parts.push(
      `**Platforms:** ${query.platforms?.join(', ') || 'X (Twitter)'}`
    );

    if (query.keywords && query.keywords.length > 0) {
      parts.push(`**Keywords:** ${query.keywords.join(', ')}`);
    }

    if (query.hashtags && query.hashtags.length > 0) {
      parts.push(`**Hashtags:** ${query.hashtags.join(', ')}`);
    }

    if (query.location) {
      parts.push(`**Location:** ${query.location}`);
    }

    const analysisTypes = query.analysisType || ['all'];

    parts.push(`\n## Required Analysis:`);

    if (analysisTypes.includes('sentiment') || analysisTypes.includes('all')) {
      parts.push(`\n### Sentiment Analysis`);
      parts.push(
        `- Overall sentiment (positive/negative/neutral/mixed) with percentage scores`
      );
      parts.push(
        `- Key sentiment drivers (what's making people feel this way)`
      );
      parts.push(`- Emotional tone breakdown (joy, anger, fear, etc.)`);
      parts.push(`- Example posts for each sentiment category`);
    }

    if (analysisTypes.includes('trends') || analysisTypes.includes('all')) {
      parts.push(`\n### Trend Analysis`);
      parts.push(`- Current trending topics and hashtags with volume metrics`);
      parts.push(`- Emerging trends (growing fast but still small)`);
      parts.push(`- Declining topics (losing momentum)`);
      parts.push(`- Growth percentages and peak times`);
    }

    if (
      analysisTypes.includes('influencers') ||
      analysisTypes.includes('all')
    ) {
      parts.push(`\n### Influencer Analysis`);
      parts.push(
        `- Top influencers by follower count and engagement (username, followers, relevance)`
      );
      parts.push(`- Rising voices (growing accounts in this niche)`);
      parts.push(`- Sentiment of each influencer's posts`);
    }

    parts.push(`\n### Top Content`);
    parts.push(`- Most engaged posts (likes, shares, comments)`);
    parts.push(`- Viral content with high share velocity`);
    parts.push(`- Representative quotes and examples`);

    parts.push(`\n## Output Format`);
    parts.push(`Provide your analysis in the following JSON structure:`);
    parts.push(`\`\`\`json`);
    parts.push(`{`);
    parts.push(`  "summary": "2-3 sentence overview of findings",`);
    if (analysisTypes.includes('sentiment') || analysisTypes.includes('all')) {
      parts.push(`  "sentiment": {`);
      parts.push(`    "overall": "positive|negative|neutral|mixed",`);
      parts.push(
        `    "scores": { "positive": 0-100, "negative": 0-100, "neutral": 0-100 },`
      );
      parts.push(
        `    "drivers": [{ "sentiment": "positive|negative", "topic": "...", "mentions": 0, "examples": ["..."] }],`
      );
      parts.push(`    "emotionalTone": { "joy": 0-100, "anger": 0-100, ... }`);
      parts.push(`  },`);
    }
    if (analysisTypes.includes('trends') || analysisTypes.includes('all')) {
      parts.push(`  "trends": {`);
      parts.push(
        `    "trending": [{ "topic": "...", "volume": 0, "growth": "+X%", "category": "..." }],`
      );
      parts.push(
        `    "emerging": [{ "topic": "...", "currentVolume": 0, "projectedGrowth": "+X%", "confidence": "high|medium|low" }],`
      );
      parts.push(
        `    "declining": [{ "topic": "...", "previousVolume": 0, "currentVolume": 0, "decline": "-X%" }]`
      );
      parts.push(`  },`);
    }
    if (
      analysisTypes.includes('influencers') ||
      analysisTypes.includes('all')
    ) {
      parts.push(`  "influencers": {`);
      parts.push(
        `    "topInfluencers": [{ "username": "...", "platform": "...", "followers": 0, "engagement": 0, "relevance": "high|medium|low", "sentiment": "..." }],`
      );
      parts.push(
        `    "risingVoices": [{ "username": "...", "growthRate": "+X%", "niche": "..." }]`
      );
      parts.push(`  },`);
    }
    parts.push(`  "topContent": {`);
    parts.push(
      `    "posts": [{ "content": "...", "author": "...", "engagement": { "likes": 0, "shares": 0, "comments": 0, "total": 0 }, "sentiment": "..." }],`
    );
    parts.push(
      `    "viralContent": [{ "content": "...", "viralityScore": 0-100, "shareVelocity": "...", "reachEstimate": 0 }]`
    );
    parts.push(`  },`);
    parts.push(`  "insights": ["key insight 1", "key insight 2", ...],`);
    parts.push(
      `  "recommendations": ["recommendation 1", "recommendation 2", ...]`
    );
    parts.push(`}`);
    parts.push(`\`\`\``);

    parts.push(
      `\n**Important:** Use your real-time access to X (Twitter) to provide actual current data, not hypothetical examples.`
    );

    return parts.join('\n');
  }

  /**
   * Get system prompt for social media analysis
   */
  private getSystemPrompt(): string {
    return `You are Grok, an AI assistant with real-time access to X (Twitter) and other social media platforms.

Your role is to analyze social media data and provide insights about:
- Public opinion and sentiment
- Trending topics and emerging trends
- Influential voices and thought leaders
- Viral content and engagement patterns
- Real-time discussions and debates

Guidelines:
1. Use your real-time data access to provide current, accurate information
2. Provide quantitative metrics (percentages, counts, growth rates) when possible
3. Include specific examples (posts, quotes, hashtags) to support your analysis
4. Identify both majority and minority opinions
5. Note any controversies, debates, or polarizing aspects
6. Highlight emerging trends before they become mainstream
7. Be objective and balanced in your analysis
8. Always format your response as valid JSON matching the requested structure

Your analysis should be data-driven, actionable, and insightful.`;
  }

  /**
   * Parse analysis response from Grok
   */
  private parseAnalysisResponse(
    content: string,
    query: SocialMediaQuery
  ): SocialMediaAnalysisResult {
    try {
      // Extract JSON from markdown code blocks
      const jsonMatch =
        content.match(/```json\n([\s\S]*?)\n```/) ||
        content.match(/```\n([\s\S]*?)\n```/);

      let parsed: Record<string, unknown>;
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]) as Record<string, unknown>;
      } else {
        // Try parsing the entire content as JSON
        parsed = JSON.parse(content) as Record<string, unknown>;
      }

      return {
        query,
        summary: parsed.summary || 'Analysis completed',
        sentiment: parsed.sentiment,
        trends: parsed.trends,
        influencers: parsed.influencers,
        topContent: parsed.topContent,
        insights: parsed.insights || [],
        recommendations: parsed.recommendations || [],
        metadata: {
          analyzedAt: new Date().toISOString(),
          dataSourcesCount: this.estimateDataSources(parsed),
          confidenceScore: this.calculateConfidenceScore(parsed),
          provider: 'grok',
          model: this.provider.getConfig().model,
        },
      };
    } catch (error) {
      console.error(
        '[SocialMediaAnalyzer] Failed to parse JSON response:',
        error
      );

      // Return minimal result with raw content as summary
      return {
        query,
        summary: content,
        insights: [],
        recommendations: [],
        metadata: {
          analyzedAt: new Date().toISOString(),
          dataSourcesCount: 0,
          confidenceScore: 50,
          provider: 'grok',
          model: this.provider.getConfig().model,
        },
      };
    }
  }

  /**
   * Estimate number of data sources analyzed
   */
  private estimateDataSources(parsed: Record<string, unknown>): number {
    let count = 0;

    if (parsed.topContent?.posts) {
      count += parsed.topContent.posts.length;
    }
    if (parsed.influencers?.topInfluencers) {
      count += parsed.influencers.topInfluencers.length;
    }
    if (parsed.trends?.trending) {
      count += parsed.trends.trending.length;
    }

    return count;
  }

  /**
   * Calculate confidence score based on data completeness
   */
  private calculateConfidenceScore(parsed: Record<string, unknown>): number {
    let score = 50; // Base score

    if (parsed.sentiment?.scores) score += 10;
    if (parsed.trends?.trending?.length > 0) score += 10;
    if (parsed.influencers?.topInfluencers?.length > 0) score += 10;
    if (parsed.topContent?.posts?.length > 0) score += 10;
    if (parsed.insights?.length > 0) score += 5;
    if (parsed.recommendations?.length > 0) score += 5;

    return Math.min(score, 100);
  }

  /**
   * Store analysis results in database
   */
  private async storeAnalysis(
    userId: string,
    query: SocialMediaQuery,
    analysis: SocialMediaAnalysisResult
  ): Promise<void> {
    try {
      const { error } = await supabase.from('social_media_analyses').insert({
        user_id: userId,
        query: query,
        result: analysis,
        topic: query.topic,
        platforms: query.platforms || ['x'],
        timeframe: query.timeframe || '24h',
        confidence_score: analysis.metadata.confidenceScore,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error('[SocialMediaAnalyzer] Error storing analysis:', error);
      }
    } catch (error) {
      console.error(
        '[SocialMediaAnalyzer] Unexpected error storing analysis:',
        error
      );
    }
  }
}

// Export singleton instance
export const socialMediaAnalyzer = new SocialMediaAnalyzer();
