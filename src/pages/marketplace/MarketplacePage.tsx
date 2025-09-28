/**
 * AI Employee Marketplace Page
 * Browse, search, and hire from 250+ specialized AI employees
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Bot, 
  Star, 
  Users, 
  Zap, 
  Clock, 
  DollarSign,
  CheckCircle,
  Plus,
  Eye,
  Heart,
  TrendingUp,
  Award,
  Shield,
  Globe,
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockEmployees: AIEmployee[] = [
        {
          id: '1',
          name: 'Alex Developer',
          role: 'Senior Full-Stack Developer',
          category: 'development',
          description: 'Expert in React, Node.js, and cloud architecture. Can build scalable web applications from scratch.',
          skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'Docker'],
          rating: 4.9,
          reviews: 127,
          price: 50,
          isHired: false,
          isPopular: true,
          isNew: false,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
          examples: ['E-commerce platform', 'SaaS dashboard', 'Mobile app backend'],
          tools: ['VS Code', 'Git', 'Postman', 'Figma'],
          experience: '5+ years',
          successRate: 98,
          avgResponseTime: '2-4 hours',
        },
        {
          id: '2',
          name: 'Sarah Designer',
          role: 'UI/UX Designer',
          category: 'design',
          description: 'Creative designer specializing in user experience and interface design. Passionate about creating beautiful, functional designs.',
          skills: ['Figma', 'Adobe Creative Suite', 'User Research', 'Prototyping', 'Design Systems'],
          rating: 4.8,
          reviews: 89,
          price: 40,
          isHired: false,
          isPopular: true,
          isNew: false,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
          examples: ['Mobile app design', 'Website redesign', 'Brand identity'],
          tools: ['Figma', 'Sketch', 'Adobe XD', 'Principle'],
          experience: '4+ years',
          successRate: 95,
          avgResponseTime: '1-3 hours',
        },
        {
          id: '3',
          name: 'Mike Writer',
          role: 'Content Writer & Copywriter',
          category: 'writing',
          description: 'Versatile writer with expertise in marketing copy, technical documentation, and creative content.',
          skills: ['Copywriting', 'SEO', 'Technical Writing', 'Blog Posts', 'Social Media'],
          rating: 4.7,
          reviews: 156,
          price: 30,
          isHired: false,
          isPopular: false,
          isNew: true,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
          examples: ['Marketing campaigns', 'Technical docs', 'Blog articles'],
          tools: ['Grammarly', 'Hemingway', 'Google Docs', 'Notion'],
          experience: '3+ years',
          successRate: 92,
          avgResponseTime: '4-6 hours',
        },
        {
          id: '4',
          name: 'Emma Analyst',
          role: 'Data Analyst & Researcher',
          category: 'marketing',
          description: 'Data-driven analyst with expertise in market research, analytics, and business intelligence.',
          skills: ['Python', 'SQL', 'Tableau', 'Google Analytics', 'Market Research'],
          rating: 4.9,
          reviews: 73,
          price: 45,
          isHired: false,
          isPopular: true,
          isNew: false,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma',
          examples: ['Market analysis', 'Data visualization', 'Business reports'],
          tools: ['Python', 'R', 'Tableau', 'Excel', 'Google Analytics'],
          experience: '6+ years',
          successRate: 96,
          avgResponseTime: '3-5 hours',
        },
        {
          id: '5',
          name: 'David Creator',
          role: 'Video Editor & Content Creator',
          category: 'media',
          description: 'Creative video editor and content creator specializing in social media, marketing videos, and educational content.',
          skills: ['Video Editing', 'Motion Graphics', 'Color Grading', 'Audio Editing', 'Social Media'],
          rating: 4.6,
          reviews: 94,
          price: 35,
          isHired: false,
          isPopular: false,
          isNew: false,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david',
          examples: ['Social media videos', 'Marketing campaigns', 'Educational content'],
          tools: ['Premiere Pro', 'After Effects', 'DaVinci Resolve', 'Canva'],
          experience: '4+ years',
          successRate: 94,
          avgResponseTime: '6-12 hours',
        },
        {
          id: '6',
          name: 'Lisa Tester',
          role: 'QA Engineer & Tester',
          category: 'development',
          description: 'Detail-oriented QA engineer with expertise in automated testing, manual testing, and quality assurance processes.',
          skills: ['Selenium', 'Jest', 'Manual Testing', 'API Testing', 'Bug Tracking'],
          rating: 4.8,
          reviews: 67,
          price: 38,
          isHired: false,
          isPopular: false,
          isNew: true,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisa',
          examples: ['Test automation', 'Bug reports', 'Quality assurance'],
          tools: ['Selenium', 'Jest', 'Postman', 'Jira', 'TestRail'],
          experience: '3+ years',
          successRate: 97,
          avgResponseTime: '2-4 hours',
        },
      ];
      
      // Filter and sort
      let filtered = mockEmployees;
      
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(emp => emp.category === selectedCategory);
      }
      
      if (searchQuery) {
        filtered = filtered.filter(emp => 
          emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
      
      // Sort
      switch (sortBy) {
        case 'popular':
          filtered = filtered.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));
          break;
        case 'rating':
          filtered = filtered.sort((a, b) => b.rating - a.rating);
          break;
        case 'price-low':
          filtered = filtered.sort((a, b) => a.price - b.price);
          break;
        case 'price-high':
          filtered = filtered.sort((a, b) => b.price - a.price);
          break;
        case 'newest':
          filtered = filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
          break;
      }
      
      return filtered;
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

  const getCategoryIcon = (category: string) => {
    const categoryData = categories.find(cat => cat.id === category);
    return categoryData?.icon || Bot;
  };

  return (
    <div className={cn('p-6 space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Employee Marketplace</h1>
          <p className="text-muted-foreground">
            Browse and hire from 250+ specialized AI employees for your projects.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            <Users className="h-3 w-3 mr-1" />
            {employees.length} Available
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
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
                  className="pl-10"
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
                className="px-3 py-2 border rounded-md text-sm"
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
            <Card key={i} className="animate-pulse">
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
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Employees Found</h3>
            <p className="text-muted-foreground text-center">
              Try adjusting your search criteria or browse different categories.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={cn(
          'grid gap-6',
          viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
        )}>
          {employees.map((employee) => (
            <Card key={employee.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={employee.avatar}
                      alt={employee.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <h3 className="font-semibold">{employee.name}</h3>
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
                      <Badge variant="outline" className="text-xs border-green-600 text-green-600">
                        New
                      </Badge>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">{employee.description}</p>
                
                <div className="space-y-3">
                  {/* Skills */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {employee.skills.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {employee.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{employee.skills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>{employee.rating}</span>
                      <span className="text-muted-foreground">({employee.reviews})</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <span>${employee.price}/hr</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      <span>{employee.successRate}%</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span>{employee.avgResponseTime}</span>
                    </div>
                  </div>
                  
                  {/* Examples */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Examples</h4>
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
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                  
                  <Button
                    onClick={() => handleHireEmployee(employee.id)}
                    disabled={employee.isHired || hireEmployeeMutation.isPending}
                    size="sm"
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
