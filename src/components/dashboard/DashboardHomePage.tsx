/**
 * Dashboard Home Page - Modern AI Workforce Interface
 * Professional design with glassmorphism and smooth animations
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/unified-auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface DashboardHomePageProps {
  className?: string;
}

export const DashboardHomePage: React.FC<DashboardHomePageProps> = ({ className }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeEmployees: 0,
    totalTasks: 0,
    tokensUsed: 0,
    successRate: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        activeEmployees: Math.min(prev.activeEmployees + 1, 0),
        totalTasks: Math.min(prev.totalTasks + 23, 0),
        tokensUsed: Math.min(prev.tokensUsed + 127, 0),
        successRate: Math.min(prev.successRate + 2.3, 0),
      }));
    }, 30);
    setTimeout(() => clearInterval(interval), 1000);
    return () => clearInterval(interval);
  }, []);

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

  const recentActivity = [
    { type: 'info', message: 'Welcome to your AI Workforce! Start by asking AI to help with a task.', time: 'Just now' },
  ];

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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="glass-strong card-hover group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  Ready
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">AI Workforce</p>
              <p className="text-3xl font-bold">
                {stats.activeEmployees}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Available 24/7
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="glass-strong card-hover group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Target className="h-6 w-6 text-accent" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  This month
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Tasks Completed</p>
              <p className="text-3xl font-bold">
                {stats.totalTasks.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Start your first task
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="glass-strong card-hover group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="h-6 w-6 text-secondary" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  <Clock className="mr-1 h-3 w-3" />
                  Free tier
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Tokens Used</p>
              <p className="text-3xl font-bold">
                {stats.tokensUsed.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                5,000 free monthly
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="glass-strong card-hover group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  N/A
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Success Rate</p>
              <p className="text-3xl font-bold">
                --
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Complete tasks to track
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="glass-strong">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Start working with your AI workforce</CardDescription>
              </div>
              <Rocket className="h-6 w-6 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <motion.button
                    key={action.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                    onClick={action.action}
                    className="feature-card text-left p-6 rounded-2xl group"
                  >
                    <div className={cn(
                      "w-14 h-14 rounded-xl mb-4 flex items-center justify-center",
                      action.bgColor,
                      "feature-card-icon"
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
                  </motion.button>
                );
              })}
            </div>
          </CardContent>
        </Card>
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
