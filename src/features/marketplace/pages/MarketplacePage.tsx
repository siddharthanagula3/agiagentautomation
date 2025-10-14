/**
 * AI Employee Marketplace Page
 * Browse, search, and hire specialized AI employees
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AI_EMPLOYEES,
  type AIEmployee as BaseAIEmployee,
} from '@/data/ai-employees';
import { useAuthStore } from '@shared/stores/unified-auth-store';
import {
  purchaseEmployee,
  isEmployeePurchased,
  listPurchasedEmployees,
} from '@features/workforce/services/supabase-employees';
import { useBusinessMetrics } from '@shared/hooks/useAnalytics';

// Types for locally stored hires
interface HireRecord {
  id: string;
  user_id: string;
  employee_id: string;
  name?: string;
  provider?: string;
  role?: string;
  is_active?: boolean;
  purchased_at?: string;
  created_at?: string;
}

// Safe localStorage access helpers with enhanced validation
const getHiredEmployeesSafe = (): HireRecord[] => {
  try {
    if (typeof window === 'undefined') {
      console.warn('[getHiredEmployeesSafe] ⚠️ Window is undefined (SSR)');
      return [];
    }

    // Check if localStorage is available
    if (!window.localStorage) {
      console.error('[getHiredEmployeesSafe] ❌ localStorage not available');
      return [];
    }

    const raw = window.localStorage.getItem('hired_employees');
    if (!raw) {
      console.log('[getHiredEmployeesSafe] ℹ️ No hired employees in storage');
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.error(
        '[getHiredEmployeesSafe] ❌ Invalid data format (not array):',
        parsed
      );
      return [];
    }

    // Validate each record
    const validated = parsed.filter((h) => {
      const isValid =
        h &&
        typeof h === 'object' &&
        'user_id' in h &&
        'employee_id' in h &&
        typeof h.user_id === 'string' &&
        typeof h.employee_id === 'string';

      if (!isValid) {
        console.warn(
          '[getHiredEmployeesSafe] ⚠️ Invalid record filtered out:',
          h
        );
      }

      return isValid;
    }) as HireRecord[];

    console.log(
      '[getHiredEmployeesSafe] ✅ Retrieved records:',
      validated.length
    );
    return validated;
  } catch (error) {
    console.error(
      '[getHiredEmployeesSafe] ❌ Error reading localStorage:',
      error
    );
    return [];
  }
};

const setHiredEmployeesSafe = (entries: HireRecord[]): void => {
  try {
    if (typeof window === 'undefined') {
      console.warn('[setHiredEmployeesSafe] ⚠️ Window is undefined (SSR)');
      return;
    }

    // Check if localStorage is available
    if (!window.localStorage) {
      console.error('[setHiredEmployeesSafe] ❌ localStorage not available');
      throw new Error('localStorage is not available in this browser');
    }

    // Validate entries before saving
    if (!Array.isArray(entries)) {
      console.error('[setHiredEmployeesSafe] ❌ Invalid entries (not array)');
      throw new Error('Invalid data format');
    }

    const jsonString = JSON.stringify(entries);
    console.log(
      '[setHiredEmployeesSafe] 💾 Saving records:',
      entries.length,
      'size:',
      jsonString.length,
      'bytes'
    );

    window.localStorage.setItem('hired_employees', jsonString);
    console.log('[setHiredEmployeesSafe] ✅ Records saved successfully');
  } catch (error) {
    console.error(
      '[setHiredEmployeesSafe] ❌ Error writing to localStorage:',
      error
    );

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded');
      } else if (error.message.includes('not available')) {
        throw new Error('localStorage is disabled in your browser');
      }
    }

    throw error;
  }
};

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
  { id: 'development', label: 'Development', icon: Code },
  { id: 'design', label: 'Design', icon: Palette },
  { id: 'marketing', label: 'Marketing', icon: BarChart3 },
  { id: 'writing', label: 'Writing', icon: FileText },
  { id: 'media', label: 'Media', icon: Camera },
  { id: 'entertainment', label: 'Entertainment', icon: Music },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
];

export const MarketplacePage: React.FC<MarketplacePageProps> = ({
  className,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { trackMarketplaceView, trackEmployeeHire } = useBusinessMetrics();

  // Track marketplace view on component mount
  useEffect(() => {
    trackMarketplaceView(undefined, selectedCategory, {
      searchQuery,
      sortBy,
      viewMode,
    });
  }, [trackMarketplaceView, selectedCategory, searchQuery, sortBy, viewMode]);

  // Fetch purchased employees to check which are already hired (using local storage for now)
  const { data: purchasedEmployees = [] } = useQuery({
    queryKey: ['purchased-employees', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Use local storage instead of database for now
      const hiredEmployees = getHiredEmployeesSafe();
      return hiredEmployees.filter((h) => h.user_id === user.id);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const purchasedEmployeeIds = new Set(
    purchasedEmployees.map((emp) => emp.employee_id)
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

  // Fetch AI employees
  const { data: employees = [], isLoading } = useQuery<AIEmployee[]>({
    queryKey: [
      'marketplace-employees',
      searchQuery,
      selectedCategory,
      sortBy,
      purchasedEmployeeIds.size,
    ],
    queryFn: async () => {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      let filteredEmployees = AI_EMPLOYEES.map(transformEmployeeData);

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredEmployees = filteredEmployees.filter(
          (emp) =>
            emp.name.toLowerCase().includes(query) ||
            emp.role.toLowerCase().includes(query) ||
            emp.skills.some((skill) => skill.toLowerCase().includes(query)) ||
            emp.description.toLowerCase().includes(query)
        );
      }

      // Apply category filter
      if (selectedCategory !== 'all') {
        filteredEmployees = filteredEmployees.filter(
          (emp) => emp.category.toLowerCase() === selectedCategory.toLowerCase()
        );
      }

      // Apply sorting
      switch (sortBy) {
        case 'rating':
          filteredEmployees.sort((a, b) => b.rating - a.rating);
          break;
        case 'price-low':
          filteredEmployees.sort((a, b) => a.price - b.price);
          break;
        case 'price-high':
          filteredEmployees.sort((a, b) => b.price - a.price);
          break;
        case 'newest':
          // Sort by ID (assuming newer employees have higher IDs)
          filteredEmployees.sort((a, b) => b.id.localeCompare(a.id));
          break;
        case 'popular':
        default:
          // Sort by popularity (popular flag + rating)
          filteredEmployees.sort((a, b) => {
            const aScore = (a.popular ? 1 : 0) + a.rating;
            const bScore = (b.popular ? 1 : 0) + b.rating;
            return bScore - aScore;
          });
          break;
      }

      return filteredEmployees;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Hire employee mutation - Simplified for immediate hiring without payment
  const hireEmployeeMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      console.log(
        '[MarketplacePage] 🚀 Starting hire process for employee:',
        employeeId
      );

      // Validate user authentication
      if (!user) {
        console.error('[MarketplacePage] ❌ User not authenticated');
        throw new Error('You must be logged in to hire employees');
      }

      console.log('[MarketplacePage] ✅ User authenticated:', {
        userId: user.id,
        email: user.email,
      });

      // Find the employee data
      const employee = AI_EMPLOYEES.find((emp) => emp.id === employeeId);
      if (!employee) {
        console.error('[MarketplacePage] ❌ Employee not found:', employeeId);
        throw new Error('Employee not found');
      }

      console.log('[MarketplacePage] ✅ Employee found:', {
        id: employee.id,
        name: employee.name,
      });

      // Check if already hired using local storage
      let hiredEmployees: HireRecord[] = [];
      try {
        hiredEmployees = getHiredEmployeesSafe();
        console.log(
          '[MarketplacePage] 📋 Retrieved hired employees:',
          hiredEmployees.length
        );
      } catch (error) {
        console.error(
          '[MarketplacePage] ⚠️ Failed to retrieve hired employees:',
          error
        );
        throw new Error(
          'Failed to access storage. Please check browser settings.'
        );
      }

      const alreadyHired = hiredEmployees.find(
        (h) => h.employee_id === employeeId && h.user_id === user.id
      );

      if (alreadyHired) {
        console.warn(
          '[MarketplacePage] ⚠️ Employee already hired:',
          employeeId
        );
        throw new Error('You have already hired this employee');
      }

      // Create hire record in local storage (bypassing database for now)
      const hireRecord: HireRecord = {
        id: `hire_${Date.now()}_${employeeId}`,
        user_id: user.id,
        employee_id: employeeId,
        name: employee.name,
        provider: employee.provider,
        role: employee.role,
        is_active: true,
        purchased_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      console.log('[MarketplacePage] 📝 Creating hire record:', hireRecord);

      try {
        hiredEmployees.push(hireRecord);
        setHiredEmployeesSafe(hiredEmployees);
        console.log('[MarketplacePage] ✅ Hire record saved successfully');
      } catch (error) {
        console.error(
          '[MarketplacePage] ❌ Failed to save hire record:',
          error
        );

        // Check if it's a quota exceeded error
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          throw new Error(
            'Storage quota exceeded. Please clear some browser data and try again.'
          );
        }

        throw new Error('Failed to save hire record. Please try again.');
      }

      console.log('[MarketplacePage] 🎉 Hire process completed successfully');
      return { success: true, employeeId, userId: user.id, result: hireRecord };
    },
    onSuccess: (data) => {
      console.log(
        '[MarketplacePage] 🔄 Invalidating query cache after successful hire'
      );
      // Update the query cache to mark employee as hired
      queryClient.invalidateQueries({ queryKey: ['marketplace-employees'] });

      // Refresh the purchased employees list
      queryClient.invalidateQueries({ queryKey: ['purchased-employees'] });
    },
    onError: (error) => {
      console.error('[MarketplacePage] ❌ Hire mutation failed:', error);
    },
  });

  const handleHireEmployee = async (employeeId: string) => {
    console.log(
      '[handleHireEmployee] 🎯 Attempting to hire employee:',
      employeeId
    );

    if (!user) {
      console.warn(
        '[handleHireEmployee] ⚠️ User not authenticated, redirecting to login'
      );
      toast.error('Please log in to hire AI employees', {
        description: 'You need to be signed in to hire AI employees',
        duration: 4000,
      });
      navigate('/auth/login');
      return;
    }

    try {
      console.log('[handleHireEmployee] 📤 Calling mutation...');
      await hireEmployeeMutation.mutateAsync(employeeId);

      // Track successful hire
      const employee = AI_EMPLOYEES.find((emp) => emp.id === employeeId);
      if (employee) {
        console.log('[handleHireEmployee] 📊 Tracking hire event');
        trackEmployeeHire(employeeId, employee.name, {
          category: employee.category,
          skills: employee.skills,
          price: employee.price,
        });
      }

      console.log(
        '[handleHireEmployee] ✅ Hire successful, showing success message'
      );
      toast.success('AI Employee hired successfully!', {
        description: 'Redirecting to chat...',
        duration: 3000,
      });

      setTimeout(() => {
        console.log('[handleHireEmployee] 🔄 Navigating to chat');
        navigate(`/chat?employee=${employeeId}`);
      }, 1500);
    } catch (error: unknown) {
      console.error('[handleHireEmployee] ❌ Error occurred:', error);

      // Provide specific error messages based on error type
      let errorTitle = 'Failed to hire employee';
      let errorDescription = 'Please try again';

      if (error instanceof Error) {
        const message = error.message.toLowerCase();

        if (
          message.includes('not authenticated') ||
          message.includes('logged in')
        ) {
          errorTitle = 'Authentication required';
          errorDescription = 'Please sign in to hire AI employees';
        } else if (message.includes('already hired')) {
          errorTitle = 'Already hired';
          errorDescription =
            'You have already hired this employee. Check your workforce page.';
        } else if (message.includes('not found')) {
          errorTitle = 'Employee not found';
          errorDescription = 'This AI employee is no longer available';
        } else if (message.includes('storage') || message.includes('quota')) {
          errorTitle = 'Storage error';
          errorDescription =
            'Unable to save hire data. Try clearing browser cache.';
        } else {
          errorTitle = 'Hiring failed';
          errorDescription = error.message || 'An unexpected error occurred';
        }
      }

      console.error('[handleHireEmployee] 📢 Showing error toast:', {
        errorTitle,
        errorDescription,
      });
      toast.error(errorTitle, {
        description: errorDescription,
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
                    <img
                      src={employee.avatar}
                      alt={employee.name}
                      className="h-12 w-12 rounded-full"
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
                    onClick={() => console.log('View details', employee.id)}
                    className="border-border hover:bg-accent hover:text-accent-foreground"
                  >
                    <Eye className="mr-1 h-4 w-4" />
                    View Details
                  </Button>

                  {employee.isHired ? (
                    <Button
                      onClick={() => navigate(`/chat?employee=${employee.id}`)}
                      size="sm"
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Open Chat
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleHireEmployee(employee.id)}
                      disabled={hireEmployeeMutation.isPending}
                      size="sm"
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Hire Now
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
