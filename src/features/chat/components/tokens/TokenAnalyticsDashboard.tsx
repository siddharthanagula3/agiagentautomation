/**
 * TokenAnalyticsDashboard - Comprehensive token usage analytics
 * Displays usage trends, costs, and session breakdowns
 * Updated: Jan 18th 2026 - Migrated to React Query for server state management
 */

import React, { useState } from 'react';
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
import {
  TrendingUp,
  DollarSign,
  Zap,
  Calendar,
  BarChart3,
  Activity,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';
import { useTokenAnalytics } from '@features/billing/hooks/use-billing-queries';

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

export function TokenAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>(
    '30d'
  );

  // Use React Query for analytics data
  const { data: analyticsData, isLoading } = useTokenAnalytics(timeRange);

  // Extract data from query result
  const usageData: TokenUsageData[] = analyticsData?.sessions ?? [];
  const stats: UsageStats | null = analyticsData?.stats ?? null;
  const dailyUsage: DailyUsage[] = analyticsData?.dailyUsage ?? [];

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

    const headers = [
      'Session Title',
      'Date',
      'Total Tokens',
      'Input Tokens',
      'Output Tokens',
      'Cost',
      'Provider',
    ];
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
          <Activity className="text-muted-foreground mx-auto mb-4 h-12 w-12 animate-pulse" />
          <p className="text-muted-foreground text-sm">Loading analytics...</p>
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
          <p className="text-muted-foreground text-sm">
            Track your AI usage, costs, and trends
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={timeRange}
            onValueChange={(v: '7d' | '30d' | '90d' | 'all') => setTimeRange(v)}
          >
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
                <p className="text-muted-foreground text-xs">Total Tokens</p>
                <p className="mt-1 text-2xl font-bold">
                  {formatNumber(stats.totalTokens)}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
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
                <p className="text-muted-foreground text-xs">Total Cost</p>
                <p className="mt-1 text-2xl font-bold">
                  {formatCost(stats.totalCost)}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
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
                <p className="text-muted-foreground text-xs">Today</p>
                <p className="mt-1 text-2xl font-bold">
                  {formatNumber(stats.todayTokens)}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
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
                <p className="text-muted-foreground text-xs">This Week</p>
                <p className="mt-1 text-2xl font-bold">
                  {formatNumber(stats.weekTokens)}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
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
            {dailyUsage.slice(-14).map((day) => {
              const maxTokens = Math.max(...dailyUsage.map((d) => d.tokens));
              const percentage =
                maxTokens > 0 ? (day.tokens / maxTokens) * 100 : 0;

              return (
                <div
                  key={`daily-usage-${day.date}`}
                  className="flex items-center gap-3"
                >
                  <span className="text-muted-foreground w-20 text-xs">
                    {format(new Date(day.date), 'MMM d')}
                  </span>
                  <div className="flex-1">
                    <div className="bg-muted h-6 w-full rounded">
                      <div
                        className="h-full rounded bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-24 text-right text-xs font-medium">
                    {formatNumber(day.tokens)}
                  </span>
                  <span className="text-muted-foreground w-20 text-right text-xs">
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
        <h3 className="mb-4 text-sm font-semibold">
          Top Sessions by Token Usage
        </h3>
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {usageData
              .sort((a, b) => b.totalTokens - a.totalTokens)
              .slice(0, 20)
              .map((session, idx) => (
                <div
                  key={session.sessionId}
                  className="hover:bg-accent flex items-center justify-between rounded-lg border p-3 transition-colors"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Badge
                      variant="secondary"
                      className="w-8 shrink-0 text-center"
                    >
                      {idx + 1}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {session.sessionTitle}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {format(session.createdAt, 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {formatNumber(session.totalTokens)}
                      </p>
                      <p className="text-muted-foreground text-xs">tokens</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {formatCost(session.totalCost)}
                      </p>
                      <p className="text-muted-foreground text-xs">cost</p>
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
            <BarChart3 className="text-muted-foreground mx-auto mb-4 h-12 w-12 opacity-30" />
            <p className="text-muted-foreground text-sm">
              No usage data for this period
            </p>
            <p className="text-muted-foreground/70 mt-1 text-xs">
              Start a conversation to see analytics
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
