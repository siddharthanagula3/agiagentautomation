import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Filter, 
  Star, 
  Clock, 
  DollarSign, 
  Users, 
  Zap, 
  Shield, 
  Award,
  MessageSquare,
  ShoppingCart,
  Heart,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  RefreshCw,
  Eye,
  Play,
  Pause,
  Settings,
  MoreHorizontal,
  Download,
  Share2,
  Bookmark,
  Flag,
  ThumbsUp,
  ThumbsDown,
  Star as StarIcon,
  StarOff,
  StarHalf
} from 'lucide-react';
import { useAuthStore } from '@/stores/unified-auth-store';
import { completeAIEmployeeService } from '@/services/complete-ai-employee-service';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { 
  AIEmployee, 
  EmployeeSearchFilters, 
  EmployeeCategory, 
  EmployeeLevel, 
  EmployeeStatus 
} from '@/types/complete-ai-employee';

interface CompleteAIEmployeeMarketplaceProps {
  onEmployeeSelect?: (employee: AIEmployee) => void;
  onHireEmployee?: (employee: AIEmployee) => void;
  showHiredEmployees?: boolean;
}

const CompleteAIEmployeeMarketplace: React.FC<CompleteAIEmployeeMarketplaceProps> = ({
  onEmployeeSelect,
  onHireEmployee,
  showHiredEmployees = false
}) => {
  const { user } = useAuthStore();
  const [employees, setEmployees] = useState<AIEmployee[]>([]);
  const [hiredEmployees, setHiredEmployees] = useState<AIEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<EmployeeSearchFilters>({});
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'price' | 'recent'>('rating');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<EmployeeCategory | 'all'>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [ratingFilter, setRatingFilter] = useState<[number, number]>([0, 5]);
  const [showFilters, setShowFilters] = useState(false);
  const [hiringEmployee, setHiringEmployee] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Load employees
  useEffect(() => {
    loadEmployees();
  }, [filters, page, sortBy, sortOrder]);

  // Load hired employees if user is logged in
  useEffect(() => {
    if (user && showHiredEmployees) {
      loadHiredEmployees();
    }
  }, [user, showHiredEmployees]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await completeAIEmployeeService.getEmployees(filters, page, 20);
      
      if (response.success && response.data) {
        if (page === 1) {
          setEmployees(response.data.data);
        } else {
          setEmployees(prev => [...prev, ...response.data.data]);
        }
        setHasMore(response.data.hasMore);
      } else {
        toast.error('Failed to load employees');
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const loadHiredEmployees = async () => {
    if (!user) return;
    
    try {
      const response = await completeAIEmployeeService.getUserHiredEmployees(user.id);
      if (response.success && response.data) {
        setHiredEmployees(response.data);
      }
    } catch (error) {
      console.error('Error loading hired employees:', error);
    }
  };

  const handleHireEmployee = async (employee: AIEmployee) => {
    if (!user) {
      toast.error('Please log in to hire employees');
      return;
    }

    try {
      setHiringEmployee(employee.id);
      const response = await completeAIEmployeeService.hireEmployee(employee.id, user.id, 1.00);
      
      if (response.success) {
        toast.success(`Successfully hired ${employee.name}!`);
        setHiredEmployees(prev => [...prev, employee]);
        onHireEmployee?.(employee);
      } else {
        toast.error(response.error || 'Failed to hire employee');
      }
    } catch (error) {
      console.error('Error hiring employee:', error);
      toast.error('Failed to hire employee');
    } finally {
      setHiringEmployee(null);
    }
  };

  const handleEmployeeSelect = (employee: AIEmployee) => {
    onEmployeeSelect?.(employee);
  };

  // Filter and sort employees
  const filteredEmployees = useMemo(() => {
    let filtered = employees;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(employee =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(employee => employee.category === selectedCategory);
    }

    // Price range filter
    filtered = filtered.filter(employee => {
      const hourlyRate = employee.cost?.hourlyRate || 0;
      return hourlyRate >= priceRange[0] && hourlyRate <= priceRange[1];
    });

    // Rating filter
    filtered = filtered.filter(employee => {
      const rating = employee.performance?.rating || 0;
      return rating >= ratingFilter[0] && rating <= ratingFilter[1];
    });

    // Sort employees
    filtered.sort((a, b) => {
      let aValue: unknown, bValue: unknown;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'rating':
          aValue = a.performance?.rating || 0;
          bValue = b.performance?.rating || 0;
          break;
        case 'price':
          aValue = a.cost?.hourlyRate || 0;
          bValue = b.cost?.hourlyRate || 0;
          break;
        case 'recent':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [employees, searchTerm, selectedCategory, priceRange, ratingFilter, sortBy, sortOrder]);

  const categories: { value: EmployeeCategory | 'all'; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'All Categories', icon: <Grid3X3 className="h-4 w-4" /> },
    { value: 'executive_leadership', label: 'Executive Leadership', icon: <Award className="h-4 w-4" /> },
    { value: 'engineering_technology', label: 'Engineering & Technology', icon: <Zap className="h-4 w-4" /> },
    { value: 'ai_data_science', label: 'AI & Data Science', icon: <TrendingUp className="h-4 w-4" /> },
    { value: 'product_management', label: 'Product Management', icon: <Settings className="h-4 w-4" /> },
    { value: 'design_ux', label: 'Design & UX', icon: <Eye className="h-4 w-4" /> },
    { value: 'marketing_growth', label: 'Marketing & Growth', icon: <TrendingUp className="h-4 w-4" /> },
    { value: 'sales_business', label: 'Sales & Business', icon: <Users className="h-4 w-4" /> },
    { value: 'customer_success', label: 'Customer Success', icon: <MessageSquare className="h-4 w-4" /> },
    { value: 'human_resources', label: 'Human Resources', icon: <Users className="h-4 w-4" /> },
    { value: 'finance_accounting', label: 'Finance & Accounting', icon: <DollarSign className="h-4 w-4" /> },
    { value: 'legal_risk_compliance', label: 'Legal & Compliance', icon: <Shield className="h-4 w-4" /> },
    { value: 'specialized_niche', label: 'Specialized & Niche', icon: <Star className="h-4 w-4" /> }
  ];

  const renderEmployeeCard = (employee: AIEmployee) => {
    const isHired = hiredEmployees.some(hired => hired.id === employee.id);
    const isHiring = hiringEmployee === employee.id;
    const rating = employee.performance?.rating || 0;
    const hourlyRate = employee.cost?.hourlyRate || 0;

    return (
      <motion.div
        key={employee.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ y: -5 }}
        className="group"
      >
        <Card className="h-full overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                  {employee.name.charAt(0)}
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                    {employee.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{employee.role}</p>
                  <p className="text-xs text-muted-foreground">{employee.department}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon
                    key={i}
                    className={cn(
                      "h-4 w-4",
                      i < Math.floor(rating) ? "text-yellow-400 fill-current" : "text-gray-300"
                    )}
                  />
                ))}
                <span className="text-sm font-medium ml-1">{rating.toFixed(1)}</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Skills */}
              <div>
                <h4 className="text-sm font-medium mb-2">Key Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {employee.capabilities?.coreSkills?.slice(0, 3).map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {employee.capabilities?.coreSkills?.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{employee.capabilities.coreSkills.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {employee.performance?.efficiency || 0}%
                  </div>
                  <div className="text-xs text-green-600">Efficiency</div>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {employee.performance?.accuracy || 0}%
                  </div>
                  <div className="text-xs text-blue-600">Accuracy</div>
                </div>
              </div>

              {/* Tools Available */}
              <div>
                <h4 className="text-sm font-medium mb-2">Available Tools</h4>
                <div className="flex flex-wrap gap-1">
                  {employee.tools?.slice(0, 3).map((tool, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tool.name}
                    </Badge>
                  ))}
                  {employee.tools?.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{employee.tools.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Pricing */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    ${hourlyRate.toFixed(0)}/hr
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {employee.cost?.currency || 'USD'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {employee.performance?.totalTasksCompleted || 0} tasks
                  </div>
                  <div className="text-xs text-muted-foreground">
                    completed
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <Badge 
                  variant={employee.status === 'available' ? 'default' : 'secondary'}
                  className={cn(
                    "text-xs",
                    employee.status === 'available' && "bg-green-100 text-green-800",
                    employee.status === 'working' && "bg-yellow-100 text-yellow-800",
                    employee.status === 'busy' && "bg-red-100 text-red-800"
                  )}
                >
                  {employee.status === 'available' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                  {employee.status === 'working' && <Clock className="h-3 w-3 mr-1" />}
                  {employee.status === 'busy' && <AlertCircle className="h-3 w-3 mr-1" />}
                  {employee.status}
                </Badge>
                <div className="text-xs text-muted-foreground">
                  Level: {employee.level}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEmployeeSelect(employee)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
                {isHired ? (
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleEmployeeSelect(employee)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Start Chat
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleHireEmployee(employee)}
                    disabled={isHiring || employee.status !== 'available'}
                  >
                    {isHiring ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ShoppingCart className="h-4 w-4 mr-2" />
                    )}
                    {isHiring ? 'Hiring...' : 'Hire for $1'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">AI Employee Marketplace</h1>
            <p className="text-muted-foreground">
              Hire AI employees to help with your projects and tasks
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadEmployees}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search and Quick Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees by name, role, or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={sortBy} onValueChange={(value: unknown) => setSortBy(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="recent">Recent</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b bg-muted/50 p-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select value={selectedCategory} onValueChange={(value: unknown) => setSelectedCategory(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        <div className="flex items-center space-x-2">
                          {category.icon}
                          <span>{category.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Price Range: ${priceRange[0]} - ${priceRange[1]}
                </label>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={500}
                  min={0}
                  step={10}
                  className="w-full"
                />
              </div>

              {/* Rating Range */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Rating: {ratingFilter[0]} - {ratingFilter[1]} stars
                </label>
                <Slider
                  value={ratingFilter}
                  onValueChange={setRatingFilter}
                  max={5}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex-1 p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-muted-foreground">
                {filteredEmployees.length} employees found
              </div>
              <div className="text-sm text-muted-foreground">
                {hiredEmployees.length} hired
              </div>
            </div>

            {/* Employee Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence>
                  {filteredEmployees.map(renderEmployeeCard)}
                </AnimatePresence>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {filteredEmployees.map((employee) => (
                    <motion.div
                      key={employee.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-primary to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                            {employee.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-semibold">{employee.name}</h3>
                            <p className="text-sm text-muted-foreground">{employee.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="font-bold">${employee.cost?.hourlyRate || 0}/hr</div>
                            <div className="text-sm text-muted-foreground">
                              {employee.performance?.rating || 0} ⭐
                            </div>
                          </div>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleHireEmployee(employee)}
                            disabled={hiringEmployee === employee.id}
                          >
                            {hiringEmployee === employee.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Hire for $1'
                            )}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  onClick={() => setPage(prev => prev + 1)}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CompleteAIEmployeeMarketplace;
