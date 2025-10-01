/**
 * Workforce Page - Modern AI Workforce Management Interface
 * Professional design with glassmorphism and real-time data
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import WorkforceManagement from '@/components/employees/WorkforceManagement';
import { listPurchasedEmployees, getEmployeeById } from '@/services/supabase-employees';
import { useAuthStore } from '@/stores/unified-auth-store';
import { analyticsService } from '@/services/analytics-service';
import { Users, Bot, BarChart3, Settings, Plus, TrendingUp, Sparkles, Zap, Target, Clock, ArrowRight, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const WorkforcePage: React.FC = () => {
  const { user } = useAuthStore();
  const userId = user?.id;

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', userId],
    queryFn: () => analyticsService.getDashboardStats(userId!),
    enabled: !!userId,
    refetchInterval: 60000,
  });

  const { data: employeePerformance, isLoading: perfLoading } = useQuery({
    queryKey: ['employee-performance', userId],
    queryFn: () => analyticsService.getEmployeePerformance(userId!),
    enabled: !!userId,
  });

  const { data: purchased = [], isLoading: hiresLoading } = useQuery({
    queryKey: ['purchased-employees', userId],
    queryFn: () => listPurchasedEmployees(userId!),
    enabled: !!userId,
    refetchInterval: 30000,
  });

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="glass-strong max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to view workforce</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/login">
              <Button className="w-full gradient-primary text-white">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLoading = statsLoading || perfLoading;
  const utilization = stats?.activeEmployees && stats?.totalEmployees
    ? Math.round((stats.activeEmployees / stats.totalEmployees) * 100)
    : 0;

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-3xl p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <Badge className="mb-4 glass">
                <Users className="mr-2 h-3 w-3" />
                AI Workforce Management
              </Badge>
              <h1 className="text-4xl font-bold mb-2">Your AI Workforce</h1>
              <p className="text-xl text-muted-foreground">
                Manage your AI team and track performance in real-time
              </p>
            </div>
            <Link to="/marketplace">
              <Button size="lg" className="btn-glow gradient-primary text-white">
                <Plus className="mr-2 h-5 w-5" />
                Hire AI Employee
              </Button>
            </Link>
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
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <Badge variant="secondary" className="text-xs">Total</Badge>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-20 mb-2" />
              ) : (
                <>
                  <p className="text-3xl font-bold mb-1">{stats?.totalEmployees || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Employees</p>
                </>
              )}
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
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Bot className="h-6 w-6 text-success" />
                </div>
                <div className="flex items-center gap-1">
                  {(stats?.activeEmployees || 0) > 0 && (
                    <div className="status-dot status-active"></div>
                  )}
                  <Badge variant="secondary" className="text-xs">Active</Badge>
                </div>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-20 mb-2" />
              ) : (
                <>
                  <p className="text-3xl font-bold mb-1">{stats?.activeEmployees || 0}</p>
                  <p className="text-sm text-muted-foreground">Active Now</p>
                </>
              )}
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
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Target className="h-6 w-6 text-accent" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  {stats?.successRate > 90 ? 'Excellent' : stats?.successRate > 70 ? 'Good' : 'Fair'}
                </Badge>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-20 mb-2" />
              ) : (
                <>
                  <p className="text-3xl font-bold mb-1">{Math.round(stats?.successRate || 0)}%</p>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                </>
              )}
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
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="h-6 w-6 text-secondary" />
                </div>
                <Badge variant="secondary" className="text-xs">Utilization</Badge>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-20 mb-2" />
              ) : (
                <>
                  <p className="text-3xl font-bold mb-1">{utilization}%</p>
                  <p className="text-sm text-muted-foreground">Workforce Usage</p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="glass-strong p-1">
            <TabsTrigger value="overview" className="data-[state=active]:glass">
              <Users className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="management" className="data-[state=active]:glass">
              <Settings className="h-4 w-4 mr-2" />
              Management
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:glass">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Hired Employees */}
            <Card className="glass-strong">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Your AI Team
                    </CardTitle>
                    <CardDescription>
                      Employees you've hired from the marketplace
                    </CardDescription>
                  </div>
                  <Badge variant="outline">
                    {purchased.length} {purchased.length === 1 ? 'Employee' : 'Employees'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {hiresLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                    ))}
                  </div>
                ) : purchased.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-6">
                      <Users className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No AI Employees Yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Start building your AI workforce by hiring specialized employees from the marketplace
                    </p>
                    <Link to="/marketplace">
                      <Button size="lg" className="btn-glow gradient-primary text-white">
                        <Plus className="mr-2 h-5 w-5" />
                        Browse Marketplace
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {purchased.map((rec) => {
                        const emp = getEmployeeById(rec.employee_id);
                        return (
                          <motion.div
                            key={rec.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass rounded-2xl p-6 card-hover group"
                          >
                            <div className="flex items-start gap-4 mb-4">
                              <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0 group-hover:scale-110 transition-transform">
                                {emp?.avatar ? (
                                  <img src={emp.avatar} alt={emp.role} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                    <Bot className="h-7 w-7 text-primary" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg truncate mb-1">
                                  {emp?.role || rec.role}
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                  {rec.provider}
                                </Badge>
                              </div>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                              {emp?.specialty || 'AI specialist ready to assist'}
                            </p>

                            <div className="flex gap-2">
                              <Link to="/chat" className="flex-1">
                                <Button variant="outline" size="sm" className="w-full">
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  Chat
                                </Button>
                              </Link>
                              <Button variant="ghost" size="sm">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground">
                        Showing {purchased.length} {purchased.length === 1 ? 'employee' : 'employees'}
                      </p>
                      <Link to="/chat">
                        <Button variant="outline">
                          Start Working
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Workforce Overview */}
            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Workforce Overview
                </CardTitle>
                <CardDescription>
                  Performance metrics and insights for your AI workforce
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : stats && stats.totalEmployees > 0 ? (
                  <div className="space-y-6">
                    <div className="glass rounded-2xl p-6">
                      <h4 className="font-semibold mb-4">Performance Summary</h4>
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        Your AI workforce is {stats.successRate > 90 ? 'performing excellently' : stats.successRate > 70 ? 'performing well' : 'showing potential for improvement'} with a <span className="text-foreground font-semibold">{Math.round(stats.successRate)}%</span> success rate across <span className="text-foreground font-semibold">{stats.totalExecutions}</span> total executions.
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="glass rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-primary mb-1">
                            {stats.totalExecutions}
                          </div>
                          <div className="text-xs text-muted-foreground">Tasks Completed</div>
                        </div>
                        <div className="glass rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-accent mb-1">
                            {(stats.totalTokensUsed || 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">Tokens Processed</div>
                        </div>
                        <div className="glass rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-secondary mb-1">
                            {stats.activeEmployees}
                          </div>
                          <div className="text-xs text-muted-foreground">Active Now</div>
                        </div>
                        <div className="glass rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-success mb-1">
                            {utilization}%
                          </div>
                          <div className="text-xs text-muted-foreground">Utilization</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link to="/analytics" className="flex-1">
                        <Button variant="outline" className="w-full">
                          <BarChart3 className="mr-2 h-4 w-4" />
                          View Detailed Analytics
                        </Button>
                      </Link>
                      <Link to="/chat">
                        <Button className="gradient-primary text-white">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Start Task
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-6">
                      <BarChart3 className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No Activity Yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Hire AI employees and start assigning tasks to see performance metrics
                    </p>
                    <Link to="/marketplace">
                      <Button size="lg" className="btn-glow gradient-primary text-white">
                        <Plus className="mr-2 h-5 w-5" />
                        Get Started
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="management">
            <WorkforceManagement />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="glass-strong">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Performance Analytics
                </CardTitle>
                <CardDescription>
                  Detailed analytics and insights about your workforce performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                {perfLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                    ))}
                  </div>
                ) : employeePerformance && employeePerformance.length > 0 ? (
                  <div className="space-y-4">
                    {employeePerformance.map((employee, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass rounded-2xl p-6"
                      >
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h4 className="font-semibold text-lg">{employee.name}</h4>
                            <Badge variant="outline" className="mt-1">{employee.provider}</Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold text-primary">{employee.successRate}%</p>
                            <p className="text-xs text-muted-foreground">Success Rate</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="glass rounded-xl p-4 text-center">
                            <p className="text-muted-foreground text-xs mb-1">Tasks</p>
                            <p className="font-semibold text-lg">{employee.tasks}</p>
                          </div>
                          <div className="glass rounded-xl p-4 text-center">
                            <p className="text-muted-foreground text-xs mb-1">Avg Duration</p>
                            <p className="font-semibold text-lg">{employee.avgDuration}s</p>
                          </div>
                          <div className="glass rounded-xl p-4 text-center">
                            <p className="text-muted-foreground text-xs mb-1">Cost</p>
                            <p className="font-semibold text-lg">${employee.cost.toFixed(2)}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-6">
                      <BarChart3 className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No Analytics Yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Performance analytics will appear here once your AI employees complete tasks
                    </p>
                    <Link to="/chat">
                      <Button className="gradient-primary text-white">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Start First Task
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default WorkforcePage;
