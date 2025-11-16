/**
 * AI Employee Marketplace Page
 * Browse, search, and hire specialized AI employees
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Badge } from '@shared/ui/badge';
import {
  Search,
  Bot,
  Star,
  Users,
  Clock,
  DollarSign,
  CheckCircle,
  Plus,
  Eye,
  TrendingUp,
  Code,
  Palette,
  BarChart3,
  FileText,
  Camera,
  Music,
  Gamepad2,
  Loader2,
  ShoppingCart,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import type { AIEmployee as BaseAIEmployee } from '@/data/marketplace-employees';
import { useAuthStore } from '@shared/stores/authentication-store';
import { useWorkforceStore } from '@shared/stores/workforce-store';
import { useBusinessMetrics } from '@shared/hooks/useAnalytics';
import { HireButton } from '@shared/components/HireButton';
import { AnimatedAvatar } from '@shared/components/AnimatedAvatar';
import { supabase } from '@shared/lib/supabase-client';
import { toast } from 'sonner';

interface AIEmployee extends BaseAIEmployee {
  isHired: boolean;
  rating: number;
  reviews: number;
  successRate: number;
  avgResponseTime: string;
  examples: string[];
}

interface MarketplacePageProps {
  className?: string;
}

const categories = [
  { id: 'all', label: 'All', icon: Bot },
  { id: 'engineering', label: 'Engineering', icon: Code },
  { id: 'design', label: 'Design', icon: Palette },
  { id: 'product', label: 'Product', icon: TrendingUp },
  { id: 'data', label: 'Data & Analytics', icon: BarChart3 },
  { id: 'marketing', label: 'Marketing', icon: Camera },
  { id: 'sales', label: 'Sales', icon: DollarSign },
  { id: 'general', label: 'General', icon: Bot },
];

export const MarketplacePage: React.FC<MarketplacePageProps> = ({
  className,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isHiringAll, setIsHiringAll] = useState(false);
  const [hiringProgress, setHiringProgress] = useState({ current: 0, total: 0 });

  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { hiredEmployees, fetchHiredEmployees } = useWorkforceStore();
  const { trackMarketplaceView, trackEmployeeHire } = useBusinessMetrics();

  // Track marketplace view on component mount
  useEffect(() => {
    trackMarketplaceView(undefined, selectedCategory, {
      searchQuery,
      sortBy,
      viewMode,
    });
  }, [trackMarketplaceView, selectedCategory, searchQuery, sortBy, viewMode]);

  // Fetch hired employees on mount
  useEffect(() => {
    if (user) {
      fetchHiredEmployees();
    }
  }, [user, fetchHiredEmployees]);

  // Get purchased employee IDs from workforce store
  const purchasedEmployeeIds = new Set(
    hiredEmployees.map((emp) => emp.employee_id)
  );

  // Transform base AI employees data for marketplace display
  const transformEmployeeData = (baseEmployee: BaseAIEmployee): AIEmployee => {
    return {
      ...baseEmployee,
      isHired: purchasedEmployeeIds.has(baseEmployee.id), // Check if already hired
      rating: 4.5 + Math.random() * 0.5, // Mock rating
      reviews: Math.floor(Math.random() * 100) + 10, // Mock reviews
      successRate: 85 + Math.floor(Math.random() * 15), // Mock success rate
      avgResponseTime: `${Math.floor(Math.random() * 30) + 5}s`, // Mock response time
      examples: [
        `Help with ${baseEmployee.specialty.toLowerCase()} tasks`,
        `Provide expert advice on ${baseEmployee.category.toLowerCase()}`,
        `Assist with complex ${baseEmployee.role.toLowerCase()} projects`,
      ],
    };
  };

  // Fetch AI employees from Supabase database
  const { data: employees = [], isLoading } = useQuery<AIEmployee[]>({
    queryKey: [
      'marketplace-employees',
      searchQuery,
      selectedCategory,
      sortBy,
      purchasedEmployeeIds.size,
    ],
    queryFn: async () => {
      // Fetch from Supabase ai_employees table
      let query = supabase
        .from('ai_employees')
        .select('*')
        .eq('status', 'active');

      // Apply category filter
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      // Apply search filter
      if (searchQuery) {
        const searchTerm = searchQuery.toLowerCase();
        query = query.or(
          `name.ilike.%${searchTerm}%,role.ilike.%${searchTerm}%,department.ilike.%${searchTerm}%`
        );
      }

      const { data: dbEmployees, error } = await query;

      if (error) {
        console.error('Error fetching employees:', error);
        toast.error('Failed to load employees', {
          description: error.message,
        });
        return [];
      }

      // Transform database employees to marketplace format
      let transformedEmployees = (dbEmployees || []).map((dbEmp) => {
        // Get cost from database or use defaults
        const cost = dbEmp.cost || { monthly: 99, yearly: 999 };
        const monthlyPrice = typeof cost === 'object' && cost.monthly ? cost.monthly : 99;
        const yearlyPrice = typeof cost === 'object' && cost.yearly ? cost.yearly : 999;

        return {
          id: dbEmp.employee_id || dbEmp.id,
          name: dbEmp.name,
          role: dbEmp.role,
          category: dbEmp.category || 'general',
          description: dbEmp.system_prompt?.slice(0, 150) || `Expert ${dbEmp.role}`,
          provider: 'claude' as const, // Default provider
          price: monthlyPrice,
          originalPrice: monthlyPrice * 2,
          yearlyPrice: yearlyPrice,
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${dbEmp.employee_id}&backgroundColor=EEF2FF%2CE0F2FE%2CF0F9FF&radius=50&size=128`,
          skills: dbEmp.capabilities || [],
          specialty: dbEmp.department || dbEmp.category || 'General',
          fitLevel: 'excellent' as const,
          popular: dbEmp.level === 'senior',
          defaultTools: dbEmp.tools || [],
          isHired: purchasedEmployeeIds.has(dbEmp.employee_id || dbEmp.id),
          rating: 4.5 + Math.random() * 0.5,
          reviews: Math.floor(Math.random() * 100) + 10,
          successRate: 85 + Math.floor(Math.random() * 15),
          avgResponseTime: `${Math.floor(Math.random() * 30) + 5}s`,
          examples: [
            `Help with ${dbEmp.role.toLowerCase()} tasks`,
            `Provide expert advice on ${dbEmp.category || 'general'} topics`,
            `Assist with complex ${dbEmp.department || dbEmp.role} projects`,
          ],
        };
      });

      // Apply sorting
      switch (sortBy) {
        case 'rating':
          transformedEmployees.sort((a, b) => b.rating - a.rating);
          break;
        case 'price-low':
          transformedEmployees.sort((a, b) => a.price - b.price);
          break;
        case 'price-high':
          transformedEmployees.sort((a, b) => b.price - a.price);
          break;
        case 'newest':
          transformedEmployees.sort((a, b) => b.id.localeCompare(a.id));
          break;
        case 'popular':
        default:
          transformedEmployees.sort((a, b) => {
            const aScore = (a.popular ? 1 : 0) + a.rating;
            const bScore = (b.popular ? 1 : 0) + b.rating;
            return bScore - aScore;
          });
          break;
      }

      return transformedEmployees;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleHireAll = async () => {
    if (!user) {
      toast.error('Please sign in to hire AI employees', {
        description: 'You need to be signed in to hire AI employees',
        duration: 4000,
      });
      navigate('/auth/login');
      return;
    }

    // Get all unhired employees
    const unhiredEmployees = employees.filter((emp) => !emp.isHired);

    if (unhiredEmployees.length === 0) {
      toast.info('All employees are already hired', {
        description: 'You have hired all available AI employees',
      });
      return;
    }

    setIsHiringAll(true);
    setHiringProgress({ current: 0, total: unhiredEmployees.length });

    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < unhiredEmployees.length; i++) {
      const employee = unhiredEmployees[i];

      try {
        // Check if already hired (double-check)
        const { data: existingHire } = await supabase
          .from('purchased_employees')
          .select('id')
          .eq('user_id', user.id)
          .eq('employee_id', employee.id)
          .single();

        if (!existingHire) {
          // Insert hire record
          const { error } = await supabase.from('purchased_employees').insert({
            user_id: user.id,
            employee_id: employee.id,
            name: employee.name,
            role: employee.role,
            provider: 'chatgpt', // Default provider
            is_active: true,
          });

          if (error && error.code !== '23505') {
            // Not a duplicate error
            console.error('[HireAll] Insert failed:', error);
            failureCount++;
          } else {
            successCount++;
            // Track successful hire
            trackEmployeeHire(employee.id, employee.name, {
              category: employee.category,
              skills: employee.skills,
              price: employee.price,
            });
          }
        } else {
          successCount++; // Already hired
        }
      } catch (error) {
        console.error('[HireAll] Unexpected error:', error);
        failureCount++;
      }

      setHiringProgress({ current: i + 1, total: unhiredEmployees.length });

      // Small delay to avoid rate limiting
      if (i < unhiredEmployees.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    setIsHiringAll(false);

    // Dispatch custom event for workforce sync
    window.dispatchEvent(new CustomEvent('team:refresh'));

    // Refresh the hired employees list
    await fetchHiredEmployees();
    queryClient.invalidateQueries({ queryKey: ['marketplace-employees'] });

    if (failureCount === 0) {
      toast.success(`Successfully hired all ${successCount} AI employees!`, {
        description: 'All employees are now part of your workforce',
        duration: 5000,
      });
    } else {
      toast.warning(`Hired ${successCount} employees, ${failureCount} failed`, {
        description: 'Some employees could not be hired. Please try again for failed employees.',
        duration: 5000,
      });
    }
  };

  return (
    <div className={cn('space-y-6 p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            AI Employee Marketplace
          </h1>
          <p className="text-muted-foreground">
            Browse and hire specialized AI employees for your projects.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="border-border text-sm">
            <Users className="mr-1 h-3 w-3" />
            {employees.length} Available
          </Badge>
          <Button
            onClick={handleHireAll}
            disabled={isHiringAll || employees.filter((e) => !e.isHired).length === 0}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isHiringAll ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Hiring {hiringProgress.current}/{hiringProgress.total}
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Hire All
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                <Input
                  placeholder="Search employees by name, role, or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-border bg-background pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <Button
                    key={category.id}
                    variant={
                      selectedCategory === category.id ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="whitespace-nowrap"
                  >
                    <Icon className="mr-1 h-4 w-4" />
                    {category.label}
                  </Button>
                );
              })}
            </div>

            {/* Sort */}
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setViewMode(viewMode === 'grid' ? 'list' : 'grid')
                }
                className="border-border"
              >
                {viewMode === 'grid' ? 'List View' : 'Grid View'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employees Grid/List */}
      {isLoading ? (
        <div
          className={cn(
            'grid gap-6',
            viewMode === 'grid'
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-1'
          )}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse border-border bg-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-muted"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/2 rounded bg-muted"></div>
                    <div className="h-3 w-1/3 rounded bg-muted"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : employees.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-10 w-10 text-primary" />
            </div>
            <h3 className="mb-2 text-2xl font-semibold text-foreground">
              No AI Employees Found
            </h3>
            <p className="mb-6 max-w-md text-center text-muted-foreground">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your search or filters to find AI employees.'
                : 'Our marketplace is currently being populated. AI employees will be available soon for hire.'}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="default"
                onClick={() => window.location.reload()}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Search className="mr-2 h-4 w-4" />
                Check Again
              </Button>
              <Button
                variant="outline"
                onClick={() => setSearchQuery('')}
                className="border-border hover:bg-accent hover:text-accent-foreground"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div
          className={cn(
            'grid gap-6',
            viewMode === 'grid'
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-1'
          )}
        >
          {employees.map((employee) => (
            <Card
              key={employee.id}
              className="border-border bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-lg"
            >
              <CardContent className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <AnimatedAvatar
                      src={employee.avatar}
                      alt={employee.name}
                      size="md"
                      className="h-12 w-12"
                    />
                    <div>
                      <h3 className="font-semibold text-card-foreground">
                        {employee.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {employee.role}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {employee.popular && (
                      <Badge variant="default" className="text-xs">
                        <TrendingUp className="mr-1 h-3 w-3" />
                        Popular
                      </Badge>
                    )}
                    {employee.fitLevel === 'excellent' && (
                      <Badge
                        variant="outline"
                        className="border-green-600 text-xs text-green-600 dark:border-green-500 dark:text-green-500"
                      >
                        Excellent Fit
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="mb-4 text-sm text-muted-foreground">
                  {employee.description}
                </p>

                <div className="space-y-3">
                  {/* Skills */}
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-card-foreground">
                      Skills
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {employee.skills.slice(0, 3).map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="text-xs"
                        >
                          {skill}
                        </Badge>
                      ))}
                      {employee.skills.length > 3 && (
                        <Badge
                          variant="outline"
                          className="border-border text-xs"
                        >
                          +{employee.skills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
                      <span className="text-foreground">{employee.rating}</span>
                      <span className="text-muted-foreground">
                        ({employee.reviews})
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {employee.originalPrice &&
                        employee.originalPrice > employee.price && (
                          <span className="text-sm text-muted-foreground line-through">
                            ${employee.originalPrice}/mo
                          </span>
                        )}
                      <span className="font-semibold text-foreground text-green-500">
                        ${employee.price}/mo
                      </span>
                      {employee.yearlyPrice && (
                        <span className="text-xs text-muted-foreground">
                          (${employee.yearlyPrice}/year)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                      <span className="text-foreground">
                        {employee.successRate}%
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                      <span className="text-foreground">
                        {employee.avgResponseTime}
                      </span>
                    </div>
                  </div>

                  {/* Examples */}
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-card-foreground">
                      Examples
                    </h4>
                    <div className="space-y-1">
                      {employee.examples.slice(0, 2).map((example, index) => (
                        <div
                          key={index}
                          className="text-xs text-muted-foreground"
                        >
                          • {example}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Navigate to employee details or show modal
                      // For now, just show a toast
                      toast.info(`Viewing details for ${employee.name}`);
                    }}
                    className="border-border hover:bg-accent hover:text-accent-foreground"
                  >
                    <Eye className="mr-1 h-4 w-4" />
                    View Details
                  </Button>

                  <HireButton
                    employeeId={employee.id}
                    employeeName={employee.name}
                    initialHired={employee.isHired}
                    onHired={() => {
                      // Track successful hire
                      trackEmployeeHire(employee.id, employee.name, {
                        category: employee.category,
                        skills: employee.skills,
                        price: employee.price,
                      });
                    }}
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
