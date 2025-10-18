/**
 * AI Employee Marketplace Component
 * Browse, search, and hire AI employees for your workforce
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { Input } from '@shared/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui/avatar';
import { Progress } from '@shared/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui/tabs';
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Star,
  Clock,
  DollarSign,
  Users,
  Brain,
  Code,
  BarChart3,
  MessageSquare,
  Zap,
  Globe,
  Shield,
  Award,
  Briefcase,
  Target,
  TrendingUp,
  Heart,
  Eye,
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  Bot,
  Cpu,
  Database,
  FileText,
  Image,
  Music,
  Video,
  Mic,
  Camera,
  Calculator,
  PenTool,
  Palette,
  Headphones,
  BookOpen,
  GraduationCap,
  Building,
  MapPin,
  Calendar,
  Phone,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { toast } from 'sonner';
import { aiEmployeeService } from '@core/ai/employees/employee-management';
import { useAuthStore } from '@shared/stores/authentication-store';
import {
  listPurchasedEmployees,
  purchaseEmployee,
} from '@features/workforce/services/employee-database';

// Types and Interfaces
export interface AIEmployee {
  id: string;
  name: string;
  role: string;
  title: string;
  department: string;
  avatar?: string;
  status: 'available' | 'busy' | 'offline' | 'in_training';
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  currency: string;
  experience: number; // years
  tasksCompleted: number;
  successRate: number;
  responseTime: number; // hours
  availability: {
    timezone: string;
    workingHours: string;
    daysPerWeek: number;
  };
  skills: Skill[];
  specialties: string[];
  tools: Tool[];
  languages: Language[];
  certifications: Certification[];
  portfolio: PortfolioItem[];
  description: string;
  personality: {
    traits: string[];
    workStyle: string;
    communication: string;
  };
  pricing: {
    hourly: number;
    daily: number;
    weekly: number;
    monthly: number;
  };
  metrics: {
    totalEarnings: number;
    clientSatisfaction: number;
    onTimeDelivery: number;
    qualityScore: number;
  };
  featured?: boolean;
  verified?: boolean;
  premium?: boolean;
  createdAt: Date;
  lastActive: Date;
}

export interface Skill {
  id: string;
  name: string;
  level: 1 | 2 | 3 | 4 | 5; // 1=Beginner, 5=Expert
  category: string;
  verified: boolean;
}

export interface Tool {
  id: string;
  name: string;
  proficiency: number; // 0-100
  category: string;
  icon?: string;
}

export interface Language {
  code: string;
  name: string;
  fluency: 'basic' | 'conversational' | 'fluent' | 'native';
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: Date;
  expiryDate?: Date;
  verified: boolean;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  type: 'project' | 'case_study' | 'testimonial';
  images?: string[];
  links?: string[];
  tags: string[];
  completedAt: Date;
}

export interface EmployeeFilters {
  category: string;
  role: string;
  department: string;
  minRating: number;
  maxHourlyRate: number;
  skills: string[];
  availability: string;
  experience: string;
  location: string;
}

interface AIEmployeeMarketplaceProps {
  className?: string;
  onEmployeeSelect?: (employee: AIEmployee) => void;
  onEmployeeHire?: (employee: AIEmployee) => void;
}

// Removed sampleEmployees mock data. Using real data from aiEmployeeService.

const employeeCategories = [
  { id: 'all', name: 'All Categories', icon: Users, count: 245 },
  { id: 'engineering', name: 'Engineering', icon: Code, count: 89 },
  { id: 'analytics', name: 'Data & Analytics', icon: BarChart3, count: 67 },
  { id: 'design', name: 'Design & Creative', icon: Palette, count: 45 },
  { id: 'marketing', name: 'Marketing', icon: MessageSquare, count: 34 },
  { id: 'finance', name: 'Finance', icon: DollarSign, count: 23 },
  { id: 'support', name: 'Customer Support', icon: Headphones, count: 19 },
  { id: 'content', name: 'Content Creation', icon: FileText, count: 15 },
];

export const AIEmployeeMarketplace: React.FC<AIEmployeeMarketplaceProps> = ({
  className,
  onEmployeeSelect,
  onEmployeeHire,
}) => {
  // State management
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<
    'rating' | 'price' | 'experience' | 'availability'
  >('rating');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedEmployee, setSelectedEmployee] = useState<AIEmployee | null>(
    null
  );
  const [showEmployeeDetails, setShowEmployeeDetails] = useState(false);
  const [showHireDialog, setShowHireDialog] = useState(false);
  const [filters, setFilters] = useState<Partial<EmployeeFilters>>({
    minRating: 0,
    maxHourlyRate: 1000,
    skills: [],
    availability: 'all',
    experience: 'all',
  });
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: purchasedEmployees = [] } = useQuery({
    queryKey: ['purchased-employees', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await listPurchasedEmployees(user.id);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const purchasedEmployeeIds = useMemo(
    () => new Set(purchasedEmployees.map((emp) => emp.employee_id)),
    [purchasedEmployees]
  );

  // Real API call via service
  const { data: employeesData, isLoading } = useQuery({
    queryKey: ['employees', selectedCategory, filters],
    queryFn: async () => {
      const { data, error } = await aiEmployeeService.getEmployees({
        department: selectedCategory === 'all' ? undefined : selectedCategory,
        available: filters.availability === 'available',
      });
      if (error) {
        toast.error('Failed to load employees');
        return [] as AIEmployee[];
      }
      return (data as unknown as AIEmployee[]) || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const hireMutation = useMutation({
    mutationFn: async (employee: AIEmployee) => {
      if (!user?.id) {
        throw new Error('AUTH_REQUIRED');
      }

      const record = await purchaseEmployee(user.id, employee);
      return record;
    },
    onMutate: (employee) => {
      if (employee) {
        toast.loading(`Hiring ${employee.name}...`, { id: 'hire-employee' });
      }
    },
    onSuccess: async (_record, employee) => {
      toast.success(`${employee.name} hired successfully!`, {
        id: 'hire-employee',
      });
      setShowHireDialog(false);
      onEmployeeHire?.(employee);
      await queryClient.invalidateQueries({
        queryKey: ['purchased-employees', user?.id],
      });
      await queryClient.invalidateQueries({ queryKey: ['my-employees'] });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'Failed to hire employee';

      if (message === 'AUTH_REQUIRED') {
        toast.error('Please sign in to hire an AI employee.', {
          id: 'hire-employee',
        });
      } else if (message.includes('DATABASE_SETUP_REQUIRED')) {
        toast.error(
          'Database setup required for hiring. Please complete Supabase setup.',
          { id: 'hire-employee' }
        );
      } else {
        toast.error(message || 'Failed to hire employee. Please try again.', {
          id: 'hire-employee',
        });
      }
    },
    onSettled: () => {
      toast.dismiss('hire-employee');
    },
  });

  // Filter and sort employees
  const filteredEmployees = useMemo(() => {
    const sourceEmployees = employeesData ?? [];
    const filtered = sourceEmployees.filter((employee) => {
      // Category filter
      if (
        selectedCategory !== 'all' &&
        employee.department.toLowerCase() !== selectedCategory
      ) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = employee.name.toLowerCase().includes(query);
        const matchesRole = employee.role.toLowerCase().includes(query);
        const matchesSkills = employee.skills.some((skill) =>
          skill.name.toLowerCase().includes(query)
        );
        const matchesSpecialties = employee.specialties.some((specialty) =>
          specialty.toLowerCase().includes(query)
        );

        if (
          !(matchesName || matchesRole || matchesSkills || matchesSpecialties)
        ) {
          return false;
        }
      }

      // Rating filter
      if (filters.minRating && employee.rating < filters.minRating) {
        return false;
      }

      // Price filter
      if (
        filters.maxHourlyRate &&
        employee.hourlyRate > filters.maxHourlyRate
      ) {
        return false;
      }

      // Availability filter
      if (filters.availability && filters.availability !== 'all') {
        if (
          filters.availability === 'available' &&
          employee.status !== 'available'
        ) {
          return false;
        }
      }

      return true;
    });

    // Sort employees
    filtered.sort((a, b) => {
      let aValue: unknown, bValue: unknown;

      switch (sortBy) {
        case 'rating':
          aValue = a.rating;
          bValue = b.rating;
          break;
        case 'price':
          aValue = a.hourlyRate;
          bValue = b.hourlyRate;
          break;
        case 'experience':
          aValue = a.experience;
          bValue = b.experience;
          break;
        case 'availability':
          aValue = a.status === 'available' ? 1 : 0;
          bValue = b.status === 'available' ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'desc') {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });

    return filtered;
  }, [
    employeesData,
    selectedCategory,
    searchQuery,
    sortBy,
    sortOrder,
    filters,
  ]);

  // Handlers
  const handleEmployeeClick = useCallback(
    (employee: AIEmployee) => {
      setSelectedEmployee(employee);
      setShowEmployeeDetails(true);
      onEmployeeSelect?.(employee);
    },
    [onEmployeeSelect]
  );

  const handleHireClick = useCallback(
    (employee: AIEmployee) => {
      if (!user?.id) {
        toast.error('Please sign in to hire an AI employee.');
        return;
      }

      if (purchasedEmployeeIds.has(employee.id)) {
        toast.info('This AI employee is already part of your team.');
        return;
      }

      setSelectedEmployee(employee);
      setShowHireDialog(true);
    },
    [user?.id, purchasedEmployeeIds]
  );

  const handleHireConfirm = useCallback(() => {
    if (!selectedEmployee) {
      return;
    }

    if (!user?.id) {
      toast.error('Please sign in to hire an AI employee.');
      return;
    }

    if (purchasedEmployeeIds.has(selectedEmployee.id)) {
      toast.info('This AI employee is already part of your team.');
      setShowHireDialog(false);
      return;
    }

    hireMutation.mutate(selectedEmployee);
  }, [selectedEmployee, hireMutation, user?.id, purchasedEmployeeIds]);

  const toggleFavorite = useCallback((employeeId: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(employeeId)) {
        newFavorites.delete(employeeId);
        toast.success('Removed from favorites');
      } else {
        newFavorites.add(employeeId);
        toast.success('Added to favorites');
      }
      return newFavorites;
    });
  }, []);

  const getStatusColor = (status: AIEmployee['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-500';
      case 'in_training':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: AIEmployee['status']) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'busy':
        return 'Busy';
      case 'offline':
        return 'Offline';
      case 'in_training':
        return 'In Training';
      default:
        return 'Unknown';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  return (
    <div className={cn('space-y-6 p-6', className)}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">
            AI Employee Marketplace
          </h1>
          <p className="mt-1 text-slate-400">
            Discover and hire specialized AI employees for your workforce
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="text-slate-400 hover:text-white"
          >
            {viewMode === 'grid' ? 'List View' : 'Grid View'}
          </Button>
          <Button
            onClick={() => (window.location.href = '/workforce')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Users className="mr-2 h-4 w-4" />
            My Team
          </Button>
        </div>
      </motion.div>

      {/* Categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {employeeCategories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <Button
                    key={category.id}
                    variant={
                      selectedCategory === category.id ? 'default' : 'ghost'
                    }
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      'flex items-center space-x-2',
                      selectedCategory === category.id
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                    )}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{category.name}</span>
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {category.count}
                    </Badge>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 lg:flex-row">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-slate-400" />
                <Input
                  placeholder="Search by name, role, or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-slate-600/30 bg-slate-700/30 pl-10 text-white placeholder:text-slate-400"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-2">
                <Select
                  value={sortBy}
                  onValueChange={(value: unknown) => setSortBy(value)}
                >
                  <SelectTrigger className="w-40 border-slate-600/30 bg-slate-700/30 text-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-slate-700 bg-slate-800">
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="experience">Experience</SelectItem>
                    <SelectItem value="availability">Availability</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                  }
                  className="text-slate-400 hover:text-white"
                >
                  {sortOrder === 'asc' ? (
                    <SortAsc className="h-4 w-4" />
                  ) : (
                    <SortDesc className="h-4 w-4" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  className="text-slate-400 hover:text-white"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        {/* Results Header */}
        <div className="flex items-center justify-between">
          <p className="text-slate-400">
            {isLoading
              ? 'Loading...'
              : `${filteredEmployees.length} employees found`}
          </p>
          <div className="flex items-center space-x-2 text-sm text-slate-400">
            <Sparkles className="h-4 w-4" />
            <span>AI-powered matching</span>
          </div>
        </div>

        {/* Employee Grid/List */}
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
              <Card
                key={i}
                className="animate-pulse border-slate-700/50 bg-slate-800/50"
              >
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-slate-700"></div>
                    <div className="flex-1">
                      <div className="mb-2 h-4 w-3/4 rounded bg-slate-700"></div>
                      <div className="h-3 w-1/2 rounded bg-slate-700"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 rounded bg-slate-700"></div>
                    <div className="h-3 w-5/6 rounded bg-slate-700"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredEmployees.length === 0 ? (
          <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-700/50">
                <Search className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                No employees found
              </h3>
              <p className="text-center text-slate-400">
                Try adjusting your search criteria or browse different
                categories
              </p>
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
            <AnimatePresence mode="popLayout">
              {filteredEmployees.map((employee, index) => (
                <motion.div
                  key={employee.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <EmployeeCard
                    employee={employee}
                    viewMode={viewMode}
                    isFavorite={favorites.has(employee.id)}
                    isHired={purchasedEmployeeIds.has(employee.id)}
                    onToggleFavorite={() => toggleFavorite(employee.id)}
                    onClick={() => handleEmployeeClick(employee)}
                    onHire={() => handleHireClick(employee)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Employee Details Dialog */}
      <Dialog open={showEmployeeDetails} onOpenChange={setShowEmployeeDetails}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto border-slate-700 bg-slate-800">
          {selectedEmployee && (
            <EmployeeDetailsView
              employee={selectedEmployee}
              isHired={purchasedEmployeeIds.has(selectedEmployee.id)}
              onHire={() => handleHireClick(selectedEmployee)}
              onClose={() => setShowEmployeeDetails(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Hire Confirmation Dialog */}
      <Dialog open={showHireDialog} onOpenChange={setShowHireDialog}>
        <DialogContent className="max-w-md border-slate-700 bg-slate-800">
          {selectedEmployee && (
            <HireConfirmationDialog
              employee={selectedEmployee}
              isHired={purchasedEmployeeIds.has(selectedEmployee.id)}
              onConfirm={handleHireConfirm}
              onCancel={() => setShowHireDialog(false)}
              isLoading={hireMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Employee Card Component
interface EmployeeCardProps {
  employee: AIEmployee;
  viewMode: 'grid' | 'list';
  isFavorite: boolean;
  isHired: boolean;
  onToggleFavorite: () => void;
  onClick: () => void;
  onHire: () => void;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  viewMode,
  isFavorite,
  isHired,
  onToggleFavorite,
  onClick,
  onHire,
}) => {
  const getStatusColor = (status: AIEmployee['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-500';
      case 'in_training':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  if (viewMode === 'list') {
    return (
      <Card className="group cursor-pointer border-slate-700/50 bg-slate-800/50 backdrop-blur-xl transition-all duration-200 hover:bg-slate-800/70">
        <CardContent className="p-6" onClick={onClick}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={employee.avatar} alt={employee.name} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-semibold text-white">
                    {employee.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    'absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-slate-800',
                    getStatusColor(employee.status)
                  )}
                />
                {employee.verified && (
                  <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-1">
                <div className="mb-1 flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-white transition-colors group-hover:text-blue-400">
                    {employee.name}
                  </h3>
                  {employee.featured && (
                    <Badge className="border-yellow-500/30 bg-yellow-500/20 text-yellow-400">
                      <Star className="mr-1 h-3 w-3" />
                      Featured
                    </Badge>
                  )}
                  {employee.premium && (
                    <Badge className="border-purple-500/30 bg-purple-500/20 text-purple-400">
                      <Sparkles className="mr-1 h-3 w-3" />
                      Premium
                    </Badge>
                  )}
                </div>
                <p className="mb-2 text-sm text-slate-400">{employee.title}</p>
                <div className="flex items-center space-x-4 text-sm text-slate-400">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span>{employee.rating}</span>
                    <span>({employee.reviewCount} reviews)</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{employee.responseTime}h response</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Target className="h-4 w-4" />
                    <span>{employee.successRate}% success</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills & Pricing */}
            <div className="flex items-center space-x-6">
              <div className="flex max-w-xs flex-wrap gap-1">
                {employee.skills.slice(0, 3).map((skill) => (
                  <Badge
                    key={skill.id}
                    variant="outline"
                    className="border-slate-600 text-xs text-slate-300"
                  >
                    {skill.name}
                  </Badge>
                ))}
                {employee.skills.length > 3 && (
                  <Badge
                    variant="outline"
                    className="border-slate-600 text-xs text-slate-300"
                  >
                    +{employee.skills.length - 3} more
                  </Badge>
                )}
              </div>

              <div className="text-right">
                <p className="text-lg font-semibold text-white">
                  {formatCurrency(employee.hourlyRate)}/hr
                </p>
                <p className="text-sm text-slate-400">
                  {employee.availability.workingHours}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite();
                      }}
                      className="text-slate-400 hover:text-red-400"
                    >
                      <Heart
                        className={cn(
                          'h-4 w-4',
                          isFavorite && 'fill-red-400 text-red-400'
                        )}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  </TooltipContent>
                </Tooltip>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onHire();
                  }}
                  disabled={isHired || employee.status !== 'available'}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isHired ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Hired
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Hire Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view
  return (
    <Card className="group cursor-pointer border-slate-700/50 bg-slate-800/50 backdrop-blur-xl transition-all duration-200 hover:bg-slate-800/70">
      <CardContent className="p-6" onClick={onClick}>
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={employee.avatar} alt={employee.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 font-semibold text-white">
                  {employee.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  'absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-slate-800',
                  getStatusColor(employee.status)
                )}
              />
              {employee.verified && (
                <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500">
                  <CheckCircle className="h-2.5 w-2.5 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white transition-colors group-hover:text-blue-400">
                {employee.name}
              </h3>
              <p className="text-sm text-slate-400">{employee.title}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className="text-slate-400 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
          >
            <Heart
              className={cn(
                'h-4 w-4',
                isFavorite && 'fill-red-400 text-red-400'
              )}
            />
          </Button>
        </div>

        {/* Badges */}
        <div className="mb-4 flex flex-wrap gap-1">
          {employee.featured && (
            <Badge className="border-yellow-500/30 bg-yellow-500/20 text-xs text-yellow-400">
              <Star className="mr-1 h-3 w-3" />
              Featured
            </Badge>
          )}
          {employee.premium && (
            <Badge className="border-purple-500/30 bg-purple-500/20 text-xs text-purple-400">
              <Sparkles className="mr-1 h-3 w-3" />
              Premium
            </Badge>
          )}
        </div>

        {/* Rating & Stats */}
        <div className="mb-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-400" />
              <span className="font-medium text-white">{employee.rating}</span>
              <span className="text-slate-400">({employee.reviewCount})</span>
            </div>
            <div className="flex items-center space-x-1 text-slate-400">
              <Target className="h-4 w-4" />
              <span>{employee.successRate}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-400">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{employee.responseTime}h response</span>
            </div>
            <div className="flex items-center space-x-1">
              <Briefcase className="h-4 w-4" />
              <span>{employee.tasksCompleted} jobs</span>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {employee.skills.slice(0, 3).map((skill) => (
              <Badge
                key={skill.id}
                variant="outline"
                className="border-slate-600 text-xs text-slate-300"
              >
                {skill.name}
              </Badge>
            ))}
            {employee.skills.length > 3 && (
              <Badge
                variant="outline"
                className="border-slate-600 text-xs text-slate-300"
              >
                +{employee.skills.length - 3}
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-white">
              {formatCurrency(employee.hourlyRate)}/hr
            </p>
            <p className="text-xs text-slate-400">
              {employee.availability.workingHours}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">Experience</p>
            <p className="font-medium text-white">
              {employee.experience} years
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            className="flex-1 border border-slate-600 text-slate-400 hover:border-slate-500 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              // View profile action
            }}
          >
            <Eye className="mr-2 h-4 w-4" />
            View Profile
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onHire();
            }}
            disabled={isHired || employee.status !== 'available'}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
          >
            {isHired ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Hired
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Hire
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Employee Details View Component
interface EmployeeDetailsViewProps {
  employee: AIEmployee;
  isHired: boolean;
  onHire: () => void;
  onClose: () => void;
}

const EmployeeDetailsView: React.FC<EmployeeDetailsViewProps> = ({
  employee,
  isHired,
  onHire,
  onClose,
}) => {
  const getStatusColor = (status: AIEmployee['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-500';
      case 'in_training':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={employee.avatar} alt={employee.name} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-2xl font-semibold text-white">
                {employee.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
            <div
              className={cn(
                'absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-2 border-slate-800',
                getStatusColor(employee.status)
              )}
            />
            {employee.verified && (
              <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
          <div>
            <div className="mb-1 flex items-center space-x-2">
              <h2 className="text-2xl font-bold text-white">{employee.name}</h2>
              {employee.featured && (
                <Badge className="border-yellow-500/30 bg-yellow-500/20 text-yellow-400">
                  <Star className="mr-1 h-3 w-3" />
                  Featured
                </Badge>
              )}
              {employee.premium && (
                <Badge className="border-purple-500/30 bg-purple-500/20 text-purple-400">
                  <Sparkles className="mr-1 h-3 w-3" />
                  Premium
                </Badge>
              )}
            </div>
            <p className="text-lg text-slate-300">{employee.title}</p>
            <p className="text-slate-400">{employee.department}</p>
            <div className="mt-2 flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-400" />
                <span className="font-medium text-white">
                  {employee.rating}
                </span>
                <span className="text-slate-400">
                  ({employee.reviewCount} reviews)
                </span>
              </div>
              <div className="flex items-center space-x-1 text-slate-400">
                <MapPin className="h-4 w-4" />
                <span>{employee.availability.timezone}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-white">
            {formatCurrency(employee.hourlyRate)}/hr
          </p>
          <p className="text-slate-400">{employee.availability.workingHours}</p>
          <Button
            onClick={onHire}
            disabled={isHired || employee.status !== 'available'}
            className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isHired ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Already Hired
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Hire Now
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="border border-slate-700/50 bg-slate-800/50">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-slate-700"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="skills"
            className="data-[state=active]:bg-slate-700"
          >
            Skills & Tools
          </TabsTrigger>
          <TabsTrigger
            value="portfolio"
            className="data-[state=active]:bg-slate-700"
          >
            Portfolio
          </TabsTrigger>
          <TabsTrigger
            value="reviews"
            className="data-[state=active]:bg-slate-700"
          >
            Reviews
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Description */}
          <Card className="border-slate-700/50 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white">About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed text-slate-300">
                {employee.description}
              </p>
            </CardContent>
          </Card>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card className="border-slate-700/50 bg-slate-800/50">
              <CardContent className="p-4 text-center">
                <div className="mb-1 text-2xl font-bold text-white">
                  {employee.tasksCompleted}
                </div>
                <div className="text-sm text-slate-400">Tasks Completed</div>
              </CardContent>
            </Card>
            <Card className="border-slate-700/50 bg-slate-800/50">
              <CardContent className="p-4 text-center">
                <div className="mb-1 text-2xl font-bold text-white">
                  {employee.successRate}%
                </div>
                <div className="text-sm text-slate-400">Success Rate</div>
              </CardContent>
            </Card>
            <Card className="border-slate-700/50 bg-slate-800/50">
              <CardContent className="p-4 text-center">
                <div className="mb-1 text-2xl font-bold text-white">
                  {employee.responseTime}h
                </div>
                <div className="text-sm text-slate-400">Avg Response</div>
              </CardContent>
            </Card>
            <Card className="border-slate-700/50 bg-slate-800/50">
              <CardContent className="p-4 text-center">
                <div className="mb-1 text-2xl font-bold text-white">
                  {employee.experience}
                </div>
                <div className="text-sm text-slate-400">Years Experience</div>
              </CardContent>
            </Card>
          </div>

          {/* Personality & Work Style */}
          <Card className="border-slate-700/50 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white">
                Personality & Work Style
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="mb-2 text-sm font-medium text-slate-300">
                  Traits
                </h4>
                <div className="flex flex-wrap gap-2">
                  {employee.personality.traits.map((trait, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="border-slate-600 text-slate-300"
                    >
                      {trait}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="mb-1 text-sm font-medium text-slate-300">
                  Work Style
                </h4>
                <p className="text-slate-400">
                  {employee.personality.workStyle}
                </p>
              </div>
              <div>
                <h4 className="mb-1 text-sm font-medium text-slate-300">
                  Communication
                </h4>
                <p className="text-slate-400">
                  {employee.personality.communication}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          {/* Skills */}
          <Card className="border-slate-700/50 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white">Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employee.skills.map((skill) => (
                  <div
                    key={skill.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-white">
                        {skill.name}
                      </span>
                      <Badge
                        variant="outline"
                        className="border-slate-600 text-xs text-slate-400"
                      >
                        {skill.category}
                      </Badge>
                      {skill.verified && (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress value={skill.level * 20} className="h-2 w-20" />
                      <span className="text-sm text-slate-400">
                        {skill.level}/5
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tools */}
          <Card className="border-slate-700/50 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white">Tools & Technologies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employee.tools.map((tool) => (
                  <div
                    key={tool.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-white">
                        {tool.name}
                      </span>
                      <Badge
                        variant="outline"
                        className="border-slate-600 text-xs text-slate-400"
                      >
                        {tool.category}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress value={tool.proficiency} className="h-2 w-20" />
                      <span className="text-sm text-slate-400">
                        {tool.proficiency}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Certifications */}
          <Card className="border-slate-700/50 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white">Certifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employee.certifications.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-center justify-between rounded-lg bg-slate-700/30 p-3"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-white">{cert.name}</h4>
                        {cert.verified && (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        )}
                      </div>
                      <p className="text-sm text-slate-400">
                        Issued by {cert.issuer}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-300">
                        {cert.date.toLocaleDateString()}
                      </p>
                      {cert.expiryDate && (
                        <p className="text-xs text-slate-400">
                          Expires {cert.expiryDate.toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-6">
          <div className="grid gap-6">
            {employee.portfolio.map((item) => (
              <Card
                key={item.id}
                className="border-slate-700/50 bg-slate-800/50"
              >
                <CardContent className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="mb-2 text-lg font-semibold text-white">
                        {item.title}
                      </h3>
                      <p className="text-slate-400">{item.description}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-slate-600 text-slate-300"
                    >
                      {item.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {item.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-slate-400">
                    Completed {item.completedAt.toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          <div className="py-8 text-center">
            <MessageSquare className="mx-auto mb-4 h-12 w-12 text-slate-400" />
            <p className="text-slate-400">Reviews will be displayed here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Hire Confirmation Dialog Component
interface HireConfirmationDialogProps {
  employee: AIEmployee;
  isHired: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

const HireConfirmationDialog: React.FC<HireConfirmationDialogProps> = ({
  employee,
  isHired,
  onConfirm,
  onCancel,
  isLoading,
}) => {
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle className="text-white">Hire {employee.name}</DialogTitle>
        <DialogDescription className="text-slate-400">
          You're about to hire this AI employee for your workforce
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {/* Employee Summary */}
        <Card className="border-slate-600/30 bg-slate-700/30">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={employee.avatar} alt={employee.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 font-semibold text-white">
                  {employee.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-white">{employee.name}</h3>
                <p className="text-sm text-slate-400">{employee.title}</p>
                <div className="mt-1 flex items-center space-x-1">
                  <Star className="h-3 w-3 text-yellow-400" />
                  <span className="text-xs text-slate-300">
                    {employee.rating}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({employee.reviewCount} reviews)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <div className="rounded-lg bg-slate-700/30 p-4">
          <h4 className="mb-3 font-medium text-white">Pricing Options</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Hourly Rate</span>
              <span className="font-medium text-white">
                {formatCurrency(employee.pricing.hourly)}/hr
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Daily Rate</span>
              <span className="font-medium text-white">
                {formatCurrency(employee.pricing.daily)}/day
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Weekly Rate</span>
              <span className="font-medium text-white">
                {formatCurrency(employee.pricing.weekly)}/week
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Monthly Rate</span>
              <span className="font-medium text-white">
                {formatCurrency(employee.pricing.monthly)}/month
              </span>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="space-y-1 text-sm text-slate-400">
          <p>
            • You can start working with {employee.name} immediately after
            hiring
          </p>
          <p>• Billing starts when work begins</p>
          <p>• You can modify or end the engagement at any time</p>
          <p>• All work is protected by our quality guarantee</p>
        </div>
      </div>

      <div className="flex space-x-3 pt-4">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="flex-1 text-slate-400 hover:text-white"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          disabled={isLoading || isHired}
        >
          {isHired ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Already Hired
            </>
          ) : isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ShoppingCart className="mr-2 h-4 w-4" />
          )}
          {!isHired && 'Confirm & Hire'}
        </Button>
      </div>
    </div>
  );
};

export default AIEmployeeMarketplace;
