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

// Helper function to check if employee is hired using local storage
const isEmployeeHiredLocally = (userId: string, employeeId: string): boolean => {
  const hiredEmployees = JSON.parse(localStorage.getItem('hired_employees') || '[]');
  return hiredEmployees.some((h: unknown) => h.employee_id === employeeId && h.user_id === userId);
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
      const hiredEmployees = JSON.parse(localStorage.getItem('hired_employees') || '[]');
      return hiredEmployees.filter((h: unknown) => h.user_id === user.id);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const purchasedEmployeeIds = new Set(
    purchasedEmployees.map(emp => emp.employee_id)
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
      await new Promise(resolve => setTimeout(resolve, 300));

      let filteredEmployees = AI_EMPLOYEES.map(transformEmployeeData);

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredEmployees = filteredEmployees.filter(
          emp =>
            emp.name.toLowerCase().includes(query) ||
            emp.role.toLowerCase().includes(query) ||
            emp.skills.some(skill => skill.toLowerCase().includes(query)) ||
            emp.description.toLowerCase().includes(query)
        );
      }

      // Apply category filter
      if (selectedCategory !== 'all') {
        filteredEmployees = filteredEmployees.filter(
          emp => emp.category.toLowerCase() === selectedCategory.toLowerCase()
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
      if (!user) {
        throw new Error('You must be logged in to hire employees');
      }

      // Find the employee data
      const employee = AI_EMPLOYEES.find(emp => emp.id === employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }

      // Check if already hired using local storage
      const hiredEmployees = JSON.parse(localStorage.getItem('hired_employees') || '[]');
      const alreadyHired = hiredEmployees.find((h: unknown) => h.employee_id === employeeId && h.user_id === user.id);
      
      if (alreadyHired) {
        throw new Error('Employee already hired');
      }

      // Create hire record in local storage (bypassing database for now)
      const hireRecord = {
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
      
      hiredEmployees.push(hireRecord);
      localStorage.setItem('hired_employees', JSON.stringify(hiredEmployees));

      return { success: true, employeeId, userId: user.id, result: hireRecord };
    },
    onSuccess: data => {
      // Update the query cache to mark employee as hired
      queryClient.setQueryData(
        ['marketplace-employees'],
        (old: AIEmployee[] = []) =>
          old.map(emp =>
            emp.id === data.employeeId ? { ...emp, isHired: true } : emp
          )
      );

      // Refresh the purchased employees list
      queryClient.invalidateQueries({ queryKey: ['purchased-employees'] });
    },
  });

  const handleHireEmployee = async (employeeId: string) => {
    if (!user) {
      toast.error('Please log in to hire AI employees');
      navigate('/auth/login');
      return;
    }

    try {
      await hireEmployeeMutation.mutateAsync(employeeId);
      
      // Track successful hire
      const employee = AI_EMPLOYEES.find(emp => emp.id === employeeId);
      if (employee) {
        trackEmployeeHire(employeeId, employee.name, {
          category: employee.category,
          skills: employee.skills,
          price: employee.price,
        });
      }
      
      toast.success('AI Employee hired successfully! Redirecting to chat...');
      setTimeout(() => {
        navigate(`/chat?employee=${employeeId}`);
      }, 1500);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to hire employee';
      toast.error(errorMessage);
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
                  onChange={e => setSearchQuery(e.target.value)}
                  className="border-border bg-background pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto">
              {categories.map(category => {
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
                onChange={e => setSortBy(e.target.value)}
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
          {employees.map(employee => (
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
                      {employee.skills.slice(0, 3).map(skill => (
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

                  <Button
                    onClick={() => handleHireEmployee(employee.id)}
                    disabled={
                      employee.isHired || hireEmployeeMutation.isPending
                    }
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {employee.isHired ? (
                      <>
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Hired
                      </>
                    ) : (
                      <>
                        <Plus className="mr-1 h-4 w-4" />
                        Hire Now
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
