/**
 * AI Employee Marketplace Page
 * Browse, search, and hire specialized AI employees
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Gamepad2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIEmployee {
  id: string;
  name: string;
  role: string;
  category: string;
  description: string;
  skills: string[];
  rating: number;
  reviews: number;
  price: number;
  isHired: boolean;
  isPopular: boolean;
  isNew: boolean;
  avatar: string;
  examples: string[];
  tools: string[];
  experience: string;
  successRate: number;
  avgResponseTime: string;
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

export const MarketplacePage: React.FC<MarketplacePageProps> = ({ className }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const queryClient = useQueryClient();

  // Fetch AI employees
  const { data: employees = [], isLoading } = useQuery<AIEmployee[]>({
    queryKey: ['marketplace-employees', searchQuery, selectedCategory, sortBy],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Return empty array - no mock data
      // In production, this would be replaced with: 
      // const response = await fetch('/api/marketplace/employees');
      // return response.json();
      return [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Hire employee mutation
  const hireEmployeeMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, employeeId };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['marketplace-employees'], (old: AIEmployee[] = []) =>
        old.map(emp => emp.id === data.employeeId ? { ...emp, isHired: true } : emp)
      );
    },
  });

  const handleHireEmployee = (employeeId: string) => {
    hireEmployeeMutation.mutate(employeeId);
  };

  return (
    <div className={cn('p-6 space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">AI Employee Marketplace</h1>
          <p className="text-muted-foreground">
            Browse and hire specialized AI employees for your projects.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm border-border">
            <Users className="h-3 w-3 mr-1" />
            {employees.length} Available
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees by name, role, or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background border-border"
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
                    variant={selectedCategory === category.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="whitespace-nowrap"
                  >
                    <Icon className="h-4 w-4 mr-1" />
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
                className="px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground"
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
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
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
        <div className={cn(
          'grid gap-6',
          viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
        )}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse border-border bg-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-3 bg-muted rounded w-1/3"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : employees.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Bot className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-2 text-foreground">No AI Employees Yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Our marketplace is currently being populated. AI employees will be available soon for hire.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="default"
                onClick={() => window.location.reload()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Search className="h-4 w-4 mr-2" />
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
        <div className={cn(
          'grid gap-6',
          viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
        )}>
          {employees.map((employee) => (
            <Card key={employee.id} className="hover:shadow-lg transition-all duration-300 border-border bg-card hover:border-primary/50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={employee.avatar}
                      alt={employee.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <h3 className="font-semibold text-card-foreground">{employee.name}</h3>
                      <p className="text-sm text-muted-foreground">{employee.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {employee.isPopular && (
                      <Badge variant="default" className="text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Popular
                      </Badge>
                    )}
                    {employee.isNew && (
                      <Badge variant="outline" className="text-xs border-green-600 text-green-600 dark:border-green-500 dark:text-green-500">
                        New
                      </Badge>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">{employee.description}</p>
                
                <div className="space-y-3">
                  {/* Skills */}
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-card-foreground">Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {employee.skills.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {employee.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs border-border">
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
                      <span className="text-muted-foreground">({employee.reviews})</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-4 w-4 text-green-500 dark:text-green-400" />
                      <span className="text-foreground">${employee.price}/hr</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                      <span className="text-foreground">{employee.successRate}%</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                      <span className="text-foreground">{employee.avgResponseTime}</span>
                    </div>
                  </div>
                  
                  {/* Examples */}
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-card-foreground">Examples</h4>
                    <div className="space-y-1">
                      {employee.examples.slice(0, 2).map((example, index) => (
                        <div key={index} className="text-xs text-muted-foreground">
                          • {example}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => console.log('View details', employee.id)}
                    className="border-border hover:bg-accent hover:text-accent-foreground"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                  
                  <Button
                    onClick={() => handleHireEmployee(employee.id)}
                    disabled={employee.isHired || hireEmployeeMutation.isPending}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {employee.isHired ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Hired
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-1" />
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
