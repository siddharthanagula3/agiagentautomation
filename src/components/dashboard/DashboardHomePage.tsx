/**
 * Dashboard Home Page - Modern AI Workforce Interface
 * Professional design with glassmorphism and smooth animations
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/unified-auth-store';
import { useAgentMetricsStore } from '@/stores/agent-metrics-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BentoGrid, BentoCard } from '@/components/ui/bento-grid';
import { InteractiveHoverCard } from '@/components/ui/interactive-hover-card';
import {
  TrendingUp,
  Users,
  Bot,
  Zap,
  DollarSign,
  Target,
  ArrowRight,
  Sparkles,
  MessageSquare,
  BarChart3,
  Brain,
  Rocket,
  Clock,
  CheckCircle2,
  Play,
  TrendingDown,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, useSpring, useMotionValue, useTransform, animate } from 'framer-motion';

interface DashboardHomePageProps {
  className?: string;
}

// Animated Counter Component
const AnimatedCounter: React.FC<{ value: number; format?: (val: number) => string }> = ({ value, format }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayValue(latest),
    });

    return () => controls.stop();
  }, [value]);

  return <span>{format ? format(displayValue) : Math.round(displayValue)}</span>;
};

export const DashboardHomePage: React.FC<DashboardHomePageProps> = ({ className }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const metricsStore = useAgentMetricsStore();

  // Get live metrics from store
  const stats = {
    activeEmployees: metricsStore.totalAgents, // Total agents available
    activeWorkingAgents: metricsStore.activeAgents, // Agents currently working
    totalTasks: metricsStore.completedTasks + metricsStore.failedTasks,
    completedTasks: metricsStore.completedTasks,
    tokensUsed: metricsStore.totalTokensUsed,
    successRate: metricsStore.getSuccessRate(),
    activeSessions: metricsStore.getActiveSessionsCount(),
  };

  const quickActions = [
    {
      id: 'chat',
      title: 'Start New Task',
      description: 'Tell AI what you need in natural language',
      icon: MessageSquare,
      iconColor: 'text-primary',
      bgColor: 'bg-primary/10',
      action: () => navigate('/chat'),
    },
    {
      id: 'marketplace',
      title: 'Explore Capabilities',
      description: 'See what your AI workforce can do',
      icon: Sparkles,
      iconColor: 'text-accent',
      bgColor: 'bg-accent/10',
      action: () => navigate('/marketplace'),
    },
    {
      id: 'automation',
      title: 'View Workflows',
      description: 'Manage automated processes',
      icon: Zap,
      iconColor: 'text-success',
      bgColor: 'bg-success/10',
      action: () => navigate('/automation'),
    },
    {
      id: 'analytics',
      title: 'See Analytics',
      description: 'Track performance and usage',
      icon: BarChart3,
      iconColor: 'text-warning',
      bgColor: 'bg-warning/10',
      action: () => navigate('/analytics'),
    },
  ];

  // Get recent activity from metrics store
  const recentActivity = metricsStore.recentActivity.length > 0
    ? metricsStore.recentActivity.slice(0, 10).map((activity) => ({
        type: activity.type.includes('failed') || activity.type.includes('error') ? 'error' : 'info',
        message: activity.message,
        time: getTimeAgo(activity.timestamp),
      }))
    : [{ type: 'info' as const, message: 'Welcome to your AI Workforce! Start by asking AI to help with a task.', time: 'Just now' }];

  // Helper to format time ago
  function getTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  return (
    <div className={cn("min-h-screen p-6 space-y-6", className)}>
      {/* Welcome Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-strong rounded-3xl p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <Badge className="mb-4 glass">
                <Sparkles className="mr-2 h-3 w-3" />
                AI Workforce Dashboard
              </Badge>
              <h1 className="text-4xl font-bold mb-2">
                Welcome back{user?.name ? `, ${user.name}` : ''}! 👋
              </h1>
              <p className="text-xl text-muted-foreground">
                Your AI workforce is ready. Just ask what you need.
              </p>
            </div>
            <Button 
              size="lg" 
              className="btn-glow gradient-primary text-white"
              onClick={() => navigate('/chat')}
            >
              <Play className="mr-2 h-5 w-5" />
              Start New Task
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid - Enhanced with BentoGrid */}
      <BentoGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <BentoCard
          gradient={true}
          className="glass-strong"
          icon={<Brain className="h-6 w-6 text-primary" />}
        >
          <div className="flex items-center justify-between mb-4">
            <Badge variant="secondary" className="text-xs">
              {stats.activeWorkingAgents > 0 ? (
                <>
                  <Zap className="mr-1 h-3 w-3 animate-pulse" />
                  {stats.activeWorkingAgents} Working
                </>
              ) : (
                <>
                  <TrendingUp className="mr-1 h-3 w-3" />
                  Ready
                </>
              )}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-1">AI Workforce</p>
          <InteractiveHoverCard>
            <p className="text-3xl font-bold">
              <AnimatedCounter value={stats.activeEmployees} />
            </p>
          </InteractiveHoverCard>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.activeEmployees > 0 ? `${stats.activeEmployees} agents ready` : 'Deploy agents to start'}
          </p>
        </BentoCard>

        <BentoCard
          gradient={true}
          className="glass-strong"
          icon={<Target className="h-6 w-6 text-accent" />}
        >
          <div className="flex items-center justify-between mb-4">
            <Badge variant="secondary" className="text-xs">
              {stats.activeSessions > 0 ? (
                <>
                  <Activity className="mr-1 h-3 w-3 animate-pulse" />
                  {stats.activeSessions} Active
                </>
              ) : (
                'All Time'
              )}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Tasks Completed</p>
          <InteractiveHoverCard>
            <p className="text-3xl font-bold">
              <AnimatedCounter
                value={stats.completedTasks}
                format={(val) => Math.round(val).toLocaleString()}
              />
            </p>
          </InteractiveHoverCard>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.totalTasks > 0 ? `${stats.totalTasks} total tasks` : 'Start your first task'}
          </p>
        </BentoCard>

        <BentoCard
          gradient={true}
          className="glass-strong"
          icon={<Zap className="h-6 w-6 text-secondary" />}
        >
          <div className="flex items-center justify-between mb-4">
            <Badge variant="secondary" className="text-xs">
              <Clock className="mr-1 h-3 w-3" />
              Free tier
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Tokens Used</p>
          <InteractiveHoverCard>
            <p className="text-3xl font-bold">
              <AnimatedCounter
                value={stats.tokensUsed}
                format={(val) => Math.round(val).toLocaleString()}
              />
            </p>
          </InteractiveHoverCard>
          <p className="text-xs text-muted-foreground mt-2">
            5,000 free monthly
          </p>
        </BentoCard>

        <BentoCard
          gradient={true}
          className="glass-strong"
          icon={<CheckCircle2 className="h-6 w-6 text-success" />}
        >
          <div className="flex items-center justify-between mb-4">
            <Badge variant="secondary" className="text-xs">
              {stats.successRate >= 90 ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
              {stats.totalTasks > 0 ? 'Tracking' : 'N/A'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Success Rate</p>
          <InteractiveHoverCard>
            <p className="text-3xl font-bold">
              {stats.totalTasks > 0 ? (
                <>
                  <AnimatedCounter value={stats.successRate} />%
                </>
              ) : (
                '--'
              )}
            </p>
          </InteractiveHoverCard>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.totalTasks > 0 ? `${metricsStore.completedTasks} completed` : 'Complete tasks to track'}
          </p>
        </BentoCard>
      </BentoGrid>

      {/* Quick Actions - Enhanced with BentoGrid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Rocket className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Quick Actions</h2>
          </div>
          <p className="text-muted-foreground">Start working with your AI workforce</p>
        </div>

        <BentoGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            const isFirst = index === 0;
            return (
              <BentoCard
                key={action.id}
                gradient={true}
                colSpan={isFirst ? 2 : 1}
                className="cursor-pointer"
                onClick={action.action}
              >
                <div className={cn(
                  "w-14 h-14 rounded-xl mb-4 flex items-center justify-center",
                  action.bgColor
                )}>
                  <IconComponent className={cn("h-7 w-7", action.iconColor)} />
                </div>
                <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {action.description}
                </p>
                <ArrowRight className="h-5 w-5 text-primary mt-4 group-hover:translate-x-1 transition-transform" />
              </BentoCard>
            );
          })}
        </BentoGrid>
      </motion.div>

      {/* Getting Started Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
      >
        <Card className="card-premium">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>Getting Started</CardTitle>
            </div>
            <CardDescription>
              Three simple steps to unlock your AI workforce
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  step: '1',
                  title: 'Tell AI What You Need',
                  description: 'Just describe your task in plain English. No technical knowledge required.',
                  action: 'Start Chat',
                  route: '/chat',
                  color: 'primary'
                },
                {
                  step: '2',
                  title: 'Watch It Think & Execute',
                  description: 'AI reasons through the problem and implements every step automatically.',
                  action: 'See Examples',
                  route: '/demo',
                  color: 'accent'
                },
                {
                  step: '3',
                  title: 'Get Your Results',
                  description: 'Receive complete, ready-to-use outputs. From idea to execution in minutes.',
                  action: 'View Analytics',
                  route: '/analytics',
                  color: 'secondary'
                }
              ].map((item, index) => (
                <div
                  key={index}
                  className="glass rounded-2xl p-6 flex items-start gap-4 card-hover"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0",
                    item.color === 'primary' && "bg-primary text-primary-foreground",
                    item.color === 'accent' && "bg-accent text-accent-foreground",
                    item.color === 'secondary' && "bg-secondary text-secondary-foreground"
                  )}>
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{item.description}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(item.route)}
                    >
                      {item.action}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.1 }}
      >
        <Card className="glass-strong">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest interactions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="glass rounded-xl p-4 flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}

              {/* Empty State */}
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Activity Yet</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Your activity feed will appear here once you start working with your AI workforce
                </p>
                <Button
                  className="btn-glow gradient-primary text-white"
                  onClick={() => navigate('/chat')}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start Your First Task
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DashboardHomePage;
