/**
 * AI Employee Marketplace Component
 * Browse, search, and hire AI employees for your workforce
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { aiEmployeeService } from '@/services/ai-employee-service';

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
  { id: 'content', name: 'Content Creation', icon: FileText, count: 15 }
];

export const AIEmployeeMarketplace: React.FC<AIEmployeeMarketplaceProps> = ({
  className,
  onEmployeeSelect,
  onEmployeeHire
}) => {
  // State management
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'experience' | 'availability'>('rating');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedEmployee, setSelectedEmployee] = useState<AIEmployee | null>(null);
  const [showEmployeeDetails, setShowEmployeeDetails] = useState(false);
  const [showHireDialog, setShowHireDialog] = useState(false);
  const [filters, setFilters] = useState<Partial<EmployeeFilters>>({
    minRating: 0,
    maxHourlyRate: 1000,
    skills: [],
    availability: 'all',
    experience: 'all'
  });
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const queryClient = useQueryClient();

  // Real API call via service
  const { data: employeesData, isLoading } = useQuery({
    queryKey: ['employees', selectedCategory, filters],
    queryFn: async () => {
      const { data, error } = await aiEmployeeService.getEmployees({
        department: selectedCategory === 'all' ? undefined : selectedCategory,
        available: filters.availability === 'available'
      } as any);
      if (error) {
        toast.error('Failed to load employees');
        return [] as AIEmployee[];
      }
      return (data as unknown as AIEmployee[]) || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const employees = employeesData || [];

  const hireMutation = useMutation({
    mutationFn: async (employee: AIEmployee) => {
      // Simulate hire process
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, employeeId: employee.id };
    },
    onSuccess: (data, employee) => {
      toast.success(`Successfully hired ${employee.name}!`);
      queryClient.invalidateQueries({ queryKey: ['my-employees'] });
      setShowHireDialog(false);
      onEmployeeHire?.(employee);
    },
    onError: () => {
      toast.error('Failed to hire employee. Please try again.');
    }
  });

  // Filter and sort employees
  const filteredEmployees = useMemo(() => {
    let filtered = employees.filter(employee => {
      // Category filter
      if (selectedCategory !== 'all' && employee.department.toLowerCase() !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = employee.name.toLowerCase().includes(query);
        const matchesRole = employee.role.toLowerCase().includes(query);
        const matchesSkills = employee.skills.some(skill => 
          skill.name.toLowerCase().includes(query)
        );
        const matchesSpecialties = employee.specialties.some(specialty =>
          specialty.toLowerCase().includes(query)
        );
        
        if (!(matchesName || matchesRole || matchesSkills || matchesSpecialties)) {
          return false;
        }
      }

      // Rating filter
      if (filters.minRating && employee.rating < filters.minRating) {
        return false;
      }

      // Price filter
      if (filters.maxHourlyRate && employee.hourlyRate > filters.maxHourlyRate) {
        return false;
      }

      // Availability filter
      if (filters.availability && filters.availability !== 'all') {
        if (filters.availability === 'available' && employee.status !== 'available') {
          return false;
        }
      }

      return true;
    });

    // Sort employees
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

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
  }, [employees, selectedCategory, searchQuery, sortBy, sortOrder, filters]);

  // Handlers
  const handleEmployeeClick = useCallback((employee: AIEmployee) => {
    setSelectedEmployee(employee);
    setShowEmployeeDetails(true);
    onEmployeeSelect?.(employee);
  }, [onEmployeeSelect]);

  const handleHireClick = useCallback((employee: AIEmployee) => {
    setSelectedEmployee(employee);
    setShowHireDialog(true);
  }, []);

  const handleHireConfirm = useCallback(() => {
    if (selectedEmployee) {
      hireMutation.mutate(selectedEmployee);
    }
  }, [selectedEmployee, hireMutation]);

  const toggleFavorite = useCallback((employeeId: string) => {
    setFavorites(prev => {
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
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      case 'in_training': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: AIEmployee['status']) => {
    switch (status) {
      case 'available': return 'Available';
      case 'busy': return 'Busy';
      case 'offline': return 'Offline';
      case 'in_training': return 'In Training';
      default: return 'Unknown';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };

  return (
    <div className={cn('p-6 space-y-6', className)}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">AI Employee Marketplace</h1>
          <p className="text-slate-400 mt-1">
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
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Users className="h-4 w-4 mr-2" />
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
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {employeeCategories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "ghost"}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      "flex items-center space-x-2",
                      selectedCategory === category.id
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-700/50"
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
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by name, role, or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-700/30 border-slate-600/30 text-white placeholder:text-slate-400"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-2">
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-40 bg-slate-700/30 border-slate-600/30 text-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="experience">Experience</SelectItem>
                    <SelectItem value="availability">Availability</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="text-slate-400 hover:text-white"
                >
                  {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>

                <Button variant="ghost" className="text-slate-400 hover:text-white">
                  <Filter className="h-4 w-4 mr-2" />
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
            {isLoading ? 'Loading...' : `${filteredEmployees.length} employees found`}
          </p>
          <div className="flex items-center space-x-2 text-sm text-slate-400">
            <Sparkles className="h-4 w-4" />
            <span>AI-powered matching</span>
          </div>
        </div>

        {/* Employee Grid/List */}
        {isLoading ? (
          <div className={cn(
            "grid gap-6",
            viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
          )}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-slate-800/50 border-slate-700/50 animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-slate-700 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-700 rounded"></div>
                    <div className="h-3 bg-slate-700 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredEmployees.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No employees found</h3>
              <p className="text-slate-400 text-center">
                Try adjusting your search criteria or browse different categories
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className={cn(
            "grid gap-6",
            viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
          )}>
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
        <DialogContent className="bg-slate-800 border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedEmployee && (
            <EmployeeDetailsView
              employee={selectedEmployee}
              onHire={() => handleHireClick(selectedEmployee)}
              onClose={() => setShowEmployeeDetails(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Hire Confirmation Dialog */}
      <Dialog open={showHireDialog} onOpenChange={setShowHireDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
          {selectedEmployee && (
            <HireConfirmationDialog
              employee={selectedEmployee}
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
  onToggleFavorite: () => void;
  onClick: () => void;
  onHire: () => void;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  viewMode,
  isFavorite,
  onToggleFavorite,
  onClick,
  onHire
}) => {
  const getStatusColor = (status: AIEmployee['status']) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      case 'in_training': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };

  if (viewMode === 'list') {
    return (
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl hover:bg-slate-800/70 transition-all duration-200 group cursor-pointer">
        <CardContent className="p-6" onClick={onClick}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={employee.avatar} alt={employee.name} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-semibold">
                    {employee.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-800",
                  getStatusColor(employee.status)
                )} />
                {employee.verified && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {employee.name}
                  </h3>
                  {employee.featured && (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  {employee.premium && (
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
                <p className="text-slate-400 text-sm mb-2">{employee.title}</p>
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
              <div className="flex flex-wrap gap-1 max-w-xs">
                {employee.skills.slice(0, 3).map((skill) => (
                  <Badge
                    key={skill.id}
                    variant="outline"
                    className="text-xs border-slate-600 text-slate-300"
                  >
                    {skill.name}
                  </Badge>
                ))}
                {employee.skills.length > 3 && (
                  <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
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
                      <Heart className={cn("h-4 w-4", isFavorite && "fill-red-400 text-red-400")} />
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
                  disabled={employee.status !== 'available'}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Hire Now
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
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl hover:bg-slate-800/70 transition-all duration-200 group cursor-pointer">
      <CardContent className="p-6" onClick={onClick}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="w-12 h-12">
                <AvatarImage src={employee.avatar} alt={employee.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                  {employee.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className={cn(
                "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-800",
                getStatusColor(employee.status)
              )} />
              {employee.verified && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-2.5 w-2.5 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
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
            className="text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Heart className={cn("h-4 w-4", isFavorite && "fill-red-400 text-red-400")} />
          </Button>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1 mb-4">
          {employee.featured && (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
              <Star className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
          {employee.premium && (
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          )}
        </div>

        {/* Rating & Stats */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-400" />
              <span className="text-white font-medium">{employee.rating}</span>
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
                className="text-xs border-slate-600 text-slate-300"
              >
                {skill.name}
              </Badge>
            ))}
            {employee.skills.length > 3 && (
              <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                +{employee.skills.length - 3}
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-lg font-semibold text-white">
              {formatCurrency(employee.hourlyRate)}/hr
            </p>
            <p className="text-xs text-slate-400">{employee.availability.workingHours}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">Experience</p>
            <p className="font-medium text-white">{employee.experience} years</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            className="flex-1 text-slate-400 hover:text-white border border-slate-600 hover:border-slate-500"
            onClick={(e) => {
              e.stopPropagation();
              // View profile action
            }}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Profile
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onHire();
            }}
            disabled={employee.status !== 'available'}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Hire
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Employee Details View Component
interface EmployeeDetailsViewProps {
  employee: AIEmployee;
  onHire: () => void;
  onClose: () => void;
}

const EmployeeDetailsView: React.FC<EmployeeDetailsViewProps> = ({
  employee,
  onHire,
  onClose
}) => {
  const getStatusColor = (status: AIEmployee['status']) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      case 'in_training': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Avatar className="w-20 h-20">
              <AvatarImage src={employee.avatar} alt={employee.name} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-semibold">
                {employee.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className={cn(
              "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-slate-800",
              getStatusColor(employee.status)
            )} />
            {employee.verified && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <h2 className="text-2xl font-bold text-white">{employee.name}</h2>
              {employee.featured && (
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  <Star className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              )}
              {employee.premium && (
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
            <p className="text-lg text-slate-300">{employee.title}</p>
            <p className="text-slate-400">{employee.department}</p>
            <div className="flex items-center space-x-4 mt-2 text-sm">
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-400" />
                <span className="text-white font-medium">{employee.rating}</span>
                <span className="text-slate-400">({employee.reviewCount} reviews)</span>
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
            disabled={employee.status !== 'available'}
            className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Hire Now
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-slate-800/50 border border-slate-700/50">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">
            Overview
          </TabsTrigger>
          <TabsTrigger value="skills" className="data-[state=active]:bg-slate-700">
            Skills & Tools
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="data-[state=active]:bg-slate-700">
            Portfolio
          </TabsTrigger>
          <TabsTrigger value="reviews" className="data-[state=active]:bg-slate-700">
            Reviews
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Description */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 leading-relaxed">{employee.description}</p>
            </CardContent>
          </Card>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  {employee.tasksCompleted}
                </div>
                <div className="text-sm text-slate-400">Tasks Completed</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  {employee.successRate}%
                </div>
                <div className="text-sm text-slate-400">Success Rate</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  {employee.responseTime}h
                </div>
                <div className="text-sm text-slate-400">Avg Response</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  {employee.experience}
                </div>
                <div className="text-sm text-slate-400">Years Experience</div>
              </CardContent>
            </Card>
          </div>

          {/* Personality & Work Style */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Personality & Work Style</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Traits</h4>
                <div className="flex flex-wrap gap-2">
                  {employee.personality.traits.map((trait, index) => (
                    <Badge key={index} variant="outline" className="border-slate-600 text-slate-300">
                      {trait}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-1">Work Style</h4>
                <p className="text-slate-400">{employee.personality.workStyle}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-1">Communication</h4>
                <p className="text-slate-400">{employee.personality.communication}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          {/* Skills */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employee.skills.map((skill) => (
                  <div key={skill.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-white font-medium">{skill.name}</span>
                      <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                        {skill.category}
                      </Badge>
                      {skill.verified && (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress value={skill.level * 20} className="w-20 h-2" />
                      <span className="text-sm text-slate-400">{skill.level}/5</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tools */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Tools & Technologies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employee.tools.map((tool) => (
                  <div key={tool.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-white font-medium">{tool.name}</span>
                      <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                        {tool.category}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress value={tool.proficiency} className="w-20 h-2" />
                      <span className="text-sm text-slate-400">{tool.proficiency}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Certifications */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Certifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employee.certifications.map((cert) => (
                  <div key={cert.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-white">{cert.name}</h4>
                        {cert.verified && (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        )}
                      </div>
                      <p className="text-sm text-slate-400">Issued by {cert.issuer}</p>
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
              <Card key={item.id} className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                      <p className="text-slate-400">{item.description}</p>
                    </div>
                    <Badge variant="outline" className="border-slate-600 text-slate-300">
                      {item.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
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
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto text-slate-400 mb-4" />
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
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

const HireConfirmationDialog: React.FC<HireConfirmationDialogProps> = ({
  employee,
  onConfirm,
  onCancel,
  isLoading
}) => {
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
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
        <Card className="bg-slate-700/30 border-slate-600/30">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={employee.avatar} alt={employee.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                  {employee.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-white">{employee.name}</h3>
                <p className="text-sm text-slate-400">{employee.title}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <Star className="h-3 w-3 text-yellow-400" />
                  <span className="text-xs text-slate-300">{employee.rating}</span>
                  <span className="text-xs text-slate-400">({employee.reviewCount} reviews)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <div className="bg-slate-700/30 rounded-lg p-4">
          <h4 className="font-medium text-white mb-3">Pricing Options</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Hourly Rate</span>
              <span className="text-white font-medium">{formatCurrency(employee.pricing.hourly)}/hr</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Daily Rate</span>
              <span className="text-white font-medium">{formatCurrency(employee.pricing.daily)}/day</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Weekly Rate</span>
              <span className="text-white font-medium">{formatCurrency(employee.pricing.weekly)}/week</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Monthly Rate</span>
              <span className="text-white font-medium">{formatCurrency(employee.pricing.monthly)}/month</span>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="text-sm text-slate-400 space-y-1">
          <p>• You can start working with {employee.name} immediately after hiring</p>
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
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ShoppingCart className="h-4 w-4 mr-2" />
          )}
          Confirm & Hire
        </Button>
      </div>
    </div>
  );
};

export default AIEmployeeMarketplace;