/**
 * TokenAnalyticsDashboard - Comprehensive token usage analytics
 * Displays usage trends, costs, and session breakdowns
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@shared/ui/card';
import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select';
import { ScrollArea } from '@shared/ui/scroll-area';
import { Separator } from '@shared/ui/separator';
import { cn } from '@shared/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Zap,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Download,
} from 'lucide-react';
import { supabase } from '@shared/lib/supabase-client';
import { useAuthStore } from '@shared/stores/authentication-store';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface TokenUsageData {
  sessionId: string;
  sessionTitle: string;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  provider: string;
  createdAt: Date;
}

interface UsageStats {
  totalTokens: number;
  totalCost: number;
  avgTokensPerSession: number;
  sessionsCount: number;
  todayTokens: number;
  todayCost: number;
  weekTokens: number;
  weekCost: number;
  monthTokens: number;
  monthCost: number;
}

interface DailyUsage {
  date: string;
  tokens: number;
  cost: number;
}

interface SessionWithTokens {
  id: string;
  title: string | null;
  created_at: string;
  provider: string | null;
  chat_session_tokens: {
    total_input_tokens: number;
    total_output_tokens: number;
    total_tokens: number;
    total_cost: number;
  } | null;
}

export function TokenAnalyticsDashboard() {
  const { user } = useAuthStore();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [usageData, setUsageData] = useState<TokenUsageData[]>([]);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Calculate date range
      const now = new Date();
      const startDate =
        timeRange === 'all'
          ? new Date('2020-01-01')
          : timeRange === '90d'
            ? subDays(now, 90)
            : timeRange === '30d'
              ? subDays(now, 30)
              : subDays(now, 7);

      // Fetch session token usage
      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select(
          `
          id,
          title,
          created_at,
          provider,
          chat_session_tokens (
            total_input_tokens,
            total_output_tokens,
            total_tokens,
            total_cost
          )
        `
        )
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[TokenAnalytics] Failed to load data:', error);
        setIsLoading(false);
        return;
      }

      // Process data
      const processedData: TokenUsageData[] = ((sessions || []) as SessionWithTokens[])
        .filter((s) => s.chat_session_tokens && s.chat_session_tokens.total_tokens > 0)
        .map((s) => ({
          sessionId: s.id,
          sessionTitle: s.title || 'Untitled',
          totalTokens: s.chat_session_tokens!.total_tokens || 0,
          inputTokens: s.chat_session_tokens!.total_input_tokens || 0,
          outputTokens: s.chat_session_tokens!.total_output_tokens || 0,
          totalCost: s.chat_session_tokens!.total_cost || 0,
          provider: s.provider || 'openai',
          createdAt: new Date(s.created_at),
        }));

      setUsageData(processedData);

      // Calculate stats
      const totalTokens = processedData.reduce((sum, d) => sum + d.totalTokens, 0);
      const totalCost = processedData.reduce((sum, d) => sum + d.totalCost, 0);

      const today = startOfDay(now);
      const weekAgo = subDays(now, 7);
      const monthAgo = subDays(now, 30);

      const todayData = processedData.filter((d) => d.createdAt >= today);
      const weekData = processedData.filter((d) => d.createdAt >= weekAgo);
      const monthData = processedData.filter((d) => d.createdAt >= monthAgo);

      setStats({
        totalTokens,
        totalCost,
        avgTokensPerSession: processedData.length > 0 ? totalTokens / processedData.length : 0,
        sessionsCount: processedData.length,
        todayTokens: todayData.reduce((sum, d) => sum + d.totalTokens, 0),
        todayCost: todayData.reduce((sum, d) => sum + d.totalCost, 0),
        weekTokens: weekData.reduce((sum, d) => sum + d.totalTokens, 0),
        weekCost: weekData.reduce((sum, d) => sum + d.totalCost, 0),
        monthTokens: monthData.reduce((sum, d) => sum + d.totalTokens, 0),
        monthCost: monthData.reduce((sum, d) => sum + d.totalCost, 0),
      });

      // Calculate daily usage for chart
      const dailyMap = new Map<string, DailyUsage>();
      processedData.forEach((d) => {
        const dateKey = format(d.createdAt, 'yyyy-MM-dd');
        const existing = dailyMap.get(dateKey) || { date: dateKey, tokens: 0, cost: 0 };
        dailyMap.set(dateKey, {
          date: dateKey,
          tokens: existing.tokens + d.totalTokens,
          cost: existing.cost + d.totalCost,
        });
      });

      setDailyUsage(
        Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date))
      );
    } catch (error) {
      console.error('[TokenAnalytics] Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, timeRange]);

  useEffect(() => {
    if (user?.id) {
      loadAnalytics();
    }
  }, [user?.id, timeRange, loadAnalytics]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(Math.round(num));
  };

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
    }).format(cost);
  };

  const exportCSV = () => {
    if (usageData.length === 0) return;

    const headers = ['Session Title', 'Date', 'Total Tokens', 'Input Tokens', 'Output Tokens', 'Cost', 'Provider'];
    const rows = usageData.map((d) => [
      `"${d.sessionTitle}"`,
      format(d.createdAt, 'yyyy-MM-dd HH:mm:ss'),
      d.totalTokens,
      d.inputTokens,
      d.outputTokens,
      d.totalCost.toFixed(6),
      d.provider,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `token-usage-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <div className="text-center">
          <Activity className="mx-auto mb-4 h-12 w-12 animate-pulse text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Token Usage Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Track your AI usage, costs, and trends
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(v: '7d' | '30d' | '90d' | 'all') => setTimeRange(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Tokens */}
          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Tokens</p>
                <p className="mt-1 text-2xl font-bold">{formatNumber(stats.totalTokens)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Avg: {formatNumber(stats.avgTokensPerSession)} per session
                </p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </Card>

          {/* Total Cost */}
          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Cost</p>
                <p className="mt-1 text-2xl font-bold">{formatCost(stats.totalCost)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stats.sessionsCount} sessions
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          {/* Today */}
          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Today</p>
                <p className="mt-1 text-2xl font-bold">{formatNumber(stats.todayTokens)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatCost(stats.todayCost)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          {/* This Week */}
          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">This Week</p>
                <p className="mt-1 text-2xl font-bold">{formatNumber(stats.weekTokens)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatCost(stats.weekCost)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Daily Usage Chart (Simple Bar Chart) */}
      {dailyUsage.length > 0 && (
        <Card className="p-4">
          <h3 className="mb-4 text-sm font-semibold">Daily Usage Trend</h3>
          <div className="space-y-2">
            {dailyUsage.slice(-14).map((day, idx) => {
              const maxTokens = Math.max(...dailyUsage.map((d) => d.tokens));
              const percentage = maxTokens > 0 ? (day.tokens / maxTokens) * 100 : 0;

              return (
                <div key={idx} className="flex items-center gap-3">
                  <span className="w-20 text-xs text-muted-foreground">
                    {format(new Date(day.date), 'MMM d')}
                  </span>
                  <div className="flex-1">
                    <div className="h-6 w-full rounded bg-muted">
                      <div
                        className="h-full rounded bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-24 text-right text-xs font-medium">
                    {formatNumber(day.tokens)}
                  </span>
                  <span className="w-20 text-right text-xs text-muted-foreground">
                    {formatCost(day.cost)}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Top Sessions */}
      <Card className="p-4">
        <h3 className="mb-4 text-sm font-semibold">Top Sessions by Token Usage</h3>
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {usageData
              .sort((a, b) => b.totalTokens - a.totalTokens)
              .slice(0, 20)
              .map((session, idx) => (
                <div
                  key={session.sessionId}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Badge variant="secondary" className="w-8 text-center shrink-0">
                      {idx + 1}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{session.sessionTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(session.createdAt, 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {formatNumber(session.totalTokens)}
                      </p>
                      <p className="text-xs text-muted-foreground">tokens</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {formatCost(session.totalCost)}
                      </p>
                      <p className="text-xs text-muted-foreground">cost</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {session.provider}
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        </ScrollArea>
      </Card>

      {usageData.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <BarChart3 className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground">No usage data for this period</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Start a conversation to see analytics
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
