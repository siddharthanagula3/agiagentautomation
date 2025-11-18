/**
 * Workforce Page - Modern AI Workforce Management Interface
 * Professional design with glassmorphism and real-time data
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { Skeleton } from '@shared/ui/skeleton';
import { BentoGrid, BentoCard } from '@shared/ui/bento-grid';
import { InteractiveHoverCard } from '@shared/ui/interactive-hover-card';
import { Particles } from '@shared/ui/particles';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@shared/stores/authentication-store';
import {
  useWorkforceStore,
  setupWorkforceSubscription,
} from '@shared/stores/employee-management-store';
import { AI_EMPLOYEES } from '@/data/marketplace-employees';
import { AnimatedAvatar } from '@shared/components/AnimatedAvatar';
import {
  Users,
  Bot,
  BarChart3,
  Settings,
  Plus,
  TrendingUp,
  Sparkles,
  Zap,
  Target,
  Clock,
  ArrowRight,
  MessageSquare,
  Code,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';

const EmployeeManagement: React.FC = () => {
  const { user } = useAuthStore();
  const { hiredEmployees, isLoading, fetchHiredEmployees } =
    useWorkforceStore();

  // Set up real-time subscription and fetch data on mount
  useEffect(() => {
    if (user) {
      setupWorkforceSubscription();
      fetchHiredEmployees();
    }
  }, [user, fetchHiredEmployees]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="glass-strong max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to view workforce</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/login">
              <Button className="gradient-primary w-full text-white">
                Go to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Updated: Nov 16th 2025 - Removed console statements for production
  const totalEmployees = hiredEmployees.length;
  const activeEmployees = hiredEmployees.filter((emp) => emp.is_active).length;

  return (
    <div className="min-h-screen space-y-4 p-4 md:space-y-6 md:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong relative overflow-hidden rounded-3xl p-4 md:p-8"
      >
        <Particles className="absolute inset-0" quantity={30} ease={20} />
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Badge className="glass mb-4">
                <Users className="mr-2 h-3 w-3" />
                AI Workforce Management
              </Badge>
              <h1 className="mb-2 text-2xl font-bold md:text-4xl">
                Your AI Workforce
              </h1>
              <p className="text-base text-muted-foreground md:text-xl">
                Manage your AI team and track performance in real-time
              </p>
            </div>
            <Link to="/marketplace" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="btn-glow gradient-primary w-full text-white"
              >
                <Plus className="mr-2 h-5 w-5" />
                Hire AI Employee
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="glass-strong card-hover group">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-110">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  Total
                </Badge>
              </div>
              {isLoading ? (
                <Skeleton className="mb-2 h-8 w-20" />
              ) : (
                <>
                  <p className="mb-1 text-3xl font-bold">{totalEmployees}</p>
                  <p className="text-sm text-muted-foreground">
                    Total Employees
                  </p>
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
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 transition-transform group-hover:scale-110">
                  <Bot className="h-6 w-6 text-success" />
                </div>
                <div className="flex items-center gap-1">
                  {activeEmployees > 0 && (
                    <div className="status-dot status-active"></div>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    Active
                  </Badge>
                </div>
              </div>
              {isLoading ? (
                <Skeleton className="mb-2 h-8 w-20" />
              ) : (
                <>
                  <p className="mb-1 text-3xl font-bold">{activeEmployees}</p>
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
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 transition-transform group-hover:scale-110">
                  <Target className="h-6 w-6 text-accent" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  {totalEmployees > 5
                    ? 'Excellent'
                    : totalEmployees > 2
                      ? 'Good'
                      : 'Growing'}
                </Badge>
              </div>
              {isLoading ? (
                <Skeleton className="mb-2 h-8 w-20" />
              ) : (
                <>
                  <p className="mb-1 text-3xl font-bold">{activeEmployees}</p>
                  <p className="text-sm text-muted-foreground">Ready to Work</p>
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
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 transition-transform group-hover:scale-110">
                  <Zap className="h-6 w-6 text-secondary" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  Utilization
                </Badge>
              </div>
              {isLoading ? (
                <Skeleton className="mb-2 h-8 w-20" />
              ) : (
                <>
                  <p className="mb-1 text-3xl font-bold">{totalEmployees}</p>
                  <p className="text-sm text-muted-foreground">Total Hired</p>
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
        <div className="space-y-6">
          <div className="space-y-6">
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
                    {hiredEmployees.length}{' '}
                    {hiredEmployees.length === 1 ? 'Employee' : 'Employees'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                    ))}
                  </div>
                ) : hiredEmployees.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted/20">
                      <Users className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">
                      No AI Employees Yet
                    </h3>
                    <p className="mx-auto mb-6 max-w-md text-muted-foreground">
                      Start building your AI workforce by hiring specialized
                      employees from the marketplace
                    </p>
                    <Link to="/marketplace">
                      <Button
                        size="lg"
                        className="btn-glow gradient-primary text-white"
                      >
                        <Plus className="mr-2 h-5 w-5" />
                        Browse Marketplace
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <BentoGrid>
                      {hiredEmployees.map((rec, index) => {
                        const emp = AI_EMPLOYEES.find(
                          (e) => e.id === rec.employee_id
                        );
                        // Fallback values when employee data is not found
                        const displayName =
                          emp?.role || rec.role || 'AI Employee';
                        const displayAvatar = emp?.avatar;
                        const displaySpecialty =
                          emp?.specialty ||
                          emp?.description ||
                          'AI specialist ready to assist';

                        return (
                          <BentoCard
                            key={rec.id}
                            gradient={true}
                            className="glass group transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
                          >
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex h-full flex-col"
                            >
                              <div className="mb-4 flex items-start gap-4">
                                <InteractiveHoverCard>
                                  <AnimatedAvatar
                                    src={displayAvatar}
                                    alt={displayName}
                                    size="lg"
                                    className="h-14 w-14 flex-shrink-0 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-primary/20"
                                  />
                                </InteractiveHoverCard>
                                <div className="min-w-0 flex-1">
                                  <div className="mb-1 flex items-center gap-2">
                                    <h3 className="truncate text-lg font-semibold transition-colors group-hover:text-primary">
                                      {displayName}
                                    </h3>
                                    {emp?.popular && (
                                      <Badge
                                        variant="secondary"
                                        className="border-orange-200 bg-orange-100 text-xs text-orange-800"
                                      >
                                        Popular
                                      </Badge>
                                    )}
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {rec.provider}
                                  </Badge>
                                </div>
                              </div>

                              <p className="mb-4 line-clamp-2 flex-grow text-sm text-muted-foreground">
                                {displaySpecialty}
                              </p>

                              <div className="flex gap-2">
                                <Link
                                  to={`/vibe?employee=${rec.employee_id}`}
                                  className="flex-1"
                                >
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full transition-colors group-hover:border-primary/50"
                                  >
                                    <Code className="mr-2 h-4 w-4" />
                                    Build with AI
                                  </Button>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="transition-colors group-hover:bg-primary/10"
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </div>
                            </motion.div>
                          </BentoCard>
                        );
                      })}
                    </BentoGrid>

                    <div className="flex items-center justify-between border-t border-border pt-4">
                      <p className="text-sm text-muted-foreground">
                        Showing {hiredEmployees.length}{' '}
                        {hiredEmployees.length === 1 ? 'employee' : 'employees'}
                      </p>
                      <Link to="/vibe">
                        <Button variant="outline">
                          <Code className="mr-2 h-4 w-4" />
                          Start Building
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
                ) : totalEmployees > 0 ? (
                  <div className="space-y-6">
                    <div className="glass rounded-2xl p-6">
                      <h4 className="mb-4 font-semibold">Workforce Summary</h4>
                      <p className="mb-4 leading-relaxed text-muted-foreground">
                        Your AI workforce is{' '}
                        {totalEmployees > 5
                          ? 'performing excellently'
                          : totalEmployees > 2
                            ? 'performing well'
                            : 'growing steadily'}{' '}
                        with{' '}
                        <span className="font-semibold text-foreground">
                          {totalEmployees}
                        </span>{' '}
                        AI employees ready to assist you.
                      </p>

                      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                        <div className="glass rounded-xl p-4 text-center">
                          <div className="mb-1 text-2xl font-bold text-primary">
                            {totalEmployees}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Total Employees
                          </div>
                        </div>
                        <div className="glass rounded-xl p-4 text-center">
                          <div className="mb-1 text-2xl font-bold text-accent">
                            {activeEmployees}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Active Now
                          </div>
                        </div>
                        <div className="glass rounded-xl p-4 text-center">
                          <div className="mb-1 text-2xl font-bold text-secondary">
                            {hiredEmployees.length}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Specialists
                          </div>
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
                      <Link to="/vibe">
                        <Button className="gradient-primary text-white">
                          <Code className="mr-2 h-4 w-4" />
                          Start Building
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted/20">
                      <BarChart3 className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">
                      No Activity Yet
                    </h3>
                    <p className="mx-auto mb-6 max-w-md text-muted-foreground">
                      Hire AI employees and start assigning tasks to see
                      performance metrics
                    </p>
                    <Link to="/marketplace">
                      <Button
                        size="lg"
                        className="btn-glow gradient-primary text-white"
                      >
                        <Plus className="mr-2 h-5 w-5" />
                        Get Started
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EmployeeManagement;
