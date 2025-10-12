/**
 * AI Workforce Management Component
 * Manage AI employee teams, projects, and collaboration
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Play,
  Pause,
  Square,
  Calendar,
  Clock,
  Target,
  BarChart3,
  MessageSquare,
  Settings,
  UserPlus,
  UserMinus,
  Edit,
  Trash2,
  Eye,
  Share,
  Download,
  Upload,
  Zap,
  Brain,
  Activity,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  Star,
  Award,
  Briefcase,
  DollarSign,
  Globe,
  Network,
  Layers,
  GitBranch,
  Flag,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  FileText,
  Image,
  Video,
  Archive,
  Sparkles,
  Shield,
  Bot,
  Cpu,
  Database,
  Code,
  PenTool,
  Palette,
  Headphones,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { analyticsService } from '@/services/analytics-service';

// Types and Interfaces
export interface AIWorkforce {
  id: string;
  name: string;
  description: string;
  ceoEmployeeId: string;
  members: WorkforceMember[];
  structure: OrganizationStructure;
  projects: WorkforceProject[];
  status: 'active' | 'paused' | 'disbanded';
  performance: WorkforcePerformance;
  budget: WorkforceBudget;
  settings: WorkforceSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkforceMember {
  id: string;
  employeeId: string;
  employee: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
    rating: number;
    hourlyRate: number;
    status: 'available' | 'busy' | 'offline';
  };
  position: string;
  department: string;
  permissions: string[];
  joinedAt: Date;
  lastActive: Date;
  productivity: MemberProductivity;
}

export interface OrganizationStructure {
  departments: Department[];
  hierarchy: HierarchyNode[];
  reportingChain: ReportingRelation[];
}

export interface Department {
  id: string;
  name: string;
  description: string;
  leaderId?: string;
  memberIds: string[];
  budget: number;
  objectives: string[];
}

export interface HierarchyNode {
  employeeId: string;
  level: number;
  parentId?: string;
  children: string[];
}

export interface ReportingRelation {
  subordinateId: string;
  supervisorId: string;
  relationship: 'direct' | 'dotted' | 'functional';
}

export interface WorkforceProject {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedMembers: string[];
  budget: number;
  estimatedHours: number;
  actualHours: number;
  startDate: Date;
  dueDate: Date;
  completedAt?: Date;
  milestones: ProjectMilestone[];
  tasks: ProjectTask[];
  progress: number;
  tags: string[];
}

export interface ProjectMilestone {
  id: string;
  name: string;
  description: string;
  dueDate: Date;
  completedAt?: Date;
  dependencies: string[];
}

export interface ProjectTask {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  estimatedHours: number;
  actualHours: number;
  createdAt: Date;
  dueDate: Date;
  completedAt?: Date;
  tags: string[];
}

export interface WorkforcePerformance {
  overallScore: number;
  efficiency: number;
  qualityScore: number;
  collaborationScore: number;
  projectsCompleted: number;
  onTimeDelivery: number;
  clientSatisfaction: number;
  totalRevenue: number;
  costPerProject: number;
  utilizationRate: number;
}

export interface MemberProductivity {
  tasksCompleted: number;
  averageTaskTime: number;
  qualityScore: number;
  collaborationRating: number;
  availabilityHours: number;
  utilizedHours: number;
  revenue: number;
}

export interface WorkforceBudget {
  totalBudget: number;
  spentBudget: number;
  allocatedBudget: number;
  monthlyBurn: number;
  costPerMember: number;
  roi: number;
}

export interface WorkforceSettings {
  workingHours: {
    start: string;
    end: string;
    timezone: string;
    daysPerWeek: number;
  };
  communication: {
    defaultChannel: string;
    meetingFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    reportingSchedule: string[];
  };
  automation: {
    autoAssignment: boolean;
    workloadBalancing: boolean;
    performanceTracking: boolean;
    notificationSettings: Record<string, boolean>;
  };
}

interface WorkforceManagementProps {
  className?: string;
}

// Removed sampleWorkforces mock data. Using empty state until real data is wired.

export const WorkforceManagement: React.FC<WorkforceManagementProps> = ({
  className,
}) => {
  // State management
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedWorkforce, setSelectedWorkforce] =
    useState<AIWorkforce | null>(null);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const queryClient = useQueryClient();

  // Placeholder: return empty list for now (no mock data)
  const { data: workforces = [], isLoading } = useQuery({
    queryKey: ['workforces'],
    queryFn: async () => {
      // If there's a service later, hook it here. Empty state by default.
      return [] as AIWorkforce[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const createWorkforceMutation = useMutation({
    mutationFn: async (workforceData: Partial<AIWorkforce>) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { id: 'new-workforce', ...workforceData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workforces'] });
      setShowCreateTeam(false);
      toast.success('Workforce created successfully!');
    },
    onError: () => {
      toast.error('Failed to create workforce');
    },
  });

  // Handlers
  const handleCreateWorkforce = useCallback(
    (data: any) => {
      createWorkforceMutation.mutate(data);
    },
    [createWorkforceMutation]
  );

  const handleWorkforceSelect = useCallback((workforce: AIWorkforce) => {
    setSelectedWorkforce(workforce);
  }, []);

  // Calculated metrics
  const totalMetrics = useMemo(() => {
    return workforces.reduce(
      (acc, workforce) => ({
        totalMembers: acc.totalMembers + workforce.members.length,
        activeProjects:
          acc.activeProjects +
          workforce.projects.filter(p => p.status === 'active').length,
        totalRevenue: acc.totalRevenue + workforce.performance.totalRevenue,
        avgEfficiency: acc.avgEfficiency + workforce.performance.efficiency,
        avgSatisfaction:
          acc.avgSatisfaction + workforce.performance.clientSatisfaction,
      }),
      {
        totalMembers: 0,
        activeProjects: 0,
        totalRevenue: 0,
        avgEfficiency: 0,
        avgSatisfaction: 0,
      }
    );
  }, [workforces]);

  const avgMetrics = useMemo(
    () => ({
      ...totalMetrics,
      avgEfficiency:
        workforces.length > 0
          ? totalMetrics.avgEfficiency / workforces.length
          : 0,
      avgSatisfaction:
        workforces.length > 0
          ? totalMetrics.avgSatisfaction / workforces.length
          : 0,
    }),
    [totalMetrics, workforces]
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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
            AI Workforce Management
          </h1>
          <p className="mt-1 text-slate-400">
            Manage your AI teams, projects, and collaboration
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
            onClick={() => setShowCreateTeam(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Team
          </Button>
        </div>
      </motion.div>

      {/* Metrics Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5"
      >
        <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Team Members</p>
                <p className="text-xl font-semibold text-white">
                  {avgMetrics.totalMembers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                <Target className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Active Projects</p>
                <p className="text-xl font-semibold text-white">
                  {avgMetrics.activeProjects}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
                <DollarSign className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Revenue</p>
                <p className="text-xl font-semibold text-white">
                  {formatCurrency(avgMetrics.totalRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/20">
                <TrendingUp className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Avg Efficiency</p>
                <p className="text-xl font-semibold text-white">
                  {Math.round(avgMetrics.avgEfficiency)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/20">
                <Star className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Satisfaction</p>
                <p className="text-xl font-semibold text-white">
                  {avgMetrics.avgSatisfaction.toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="space-y-6"
        >
          <TabsList className="border border-slate-700/50 bg-slate-800/50">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-slate-700"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="teams"
              className="data-[state=active]:bg-slate-700"
            >
              Teams
            </TabsTrigger>
            <TabsTrigger
              value="projects"
              className="data-[state=active]:bg-slate-700"
            >
              Projects
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-slate-700"
            >
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Search and Filters */}
            <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-xl">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-slate-400" />
                    <Input
                      placeholder="Search teams, projects, or members..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="border-slate-600/30 bg-slate-700/30 pl-10 text-white placeholder:text-slate-400"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    className="text-slate-400 hover:text-white"
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Workforce Grid/List */}
            {isLoading ? (
              <div
                className={cn(
                  'grid gap-6',
                  viewMode === 'grid'
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                    : 'grid-cols-1'
                )}
              >
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card
                    key={i}
                    className="animate-pulse border-slate-700/50 bg-slate-800/50"
                  >
                    <CardContent className="p-6">
                      <div className="mb-4 h-4 w-3/4 rounded bg-slate-700"></div>
                      <div className="mb-3 h-3 w-1/2 rounded bg-slate-700"></div>
                      <div className="h-3 w-2/3 rounded bg-slate-700"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : workforces.length === 0 ? (
              <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-xl">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-700/50">
                    <Users className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white">
                    No teams yet
                  </h3>
                  <p className="mb-6 text-center text-slate-400">
                    Create your first AI workforce team to get started
                  </p>
                  <Button
                    onClick={() => setShowCreateTeam(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Team
                  </Button>
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
                  {workforces.map((workforce, index) => (
                    <motion.div
                      key={workforce.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      layout
                    >
                      <WorkforceCard
                        workforce={workforce}
                        viewMode={viewMode}
                        onClick={() => handleWorkforceSelect(workforce)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="teams" className="space-y-6">
            {selectedWorkforce ? (
              <TeamDetailView workforce={selectedWorkforce} />
            ) : (
              <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-xl">
                <CardContent className="py-12 text-center">
                  <Users className="mx-auto mb-4 h-12 w-12 text-slate-400" />
                  <p className="text-slate-400">
                    Select a team to view details
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            {selectedWorkforce ? (
              <ProjectManagementView workforce={selectedWorkforce} />
            ) : (
              <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-xl">
                <CardContent className="py-12 text-center">
                  <Target className="mx-auto mb-4 h-12 w-12 text-slate-400" />
                  <p className="text-slate-400">
                    Select a team to view projects
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsView workforces={workforces} />
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Create Team Dialog */}
      <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
        <DialogContent className="max-w-2xl border-slate-700 bg-slate-800">
          <CreateTeamDialog
            onSubmit={handleCreateWorkforce}
            onCancel={() => setShowCreateTeam(false)}
            isLoading={createWorkforceMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Workforce Card Component
interface WorkforceCardProps {
  workforce: AIWorkforce;
  viewMode: 'grid' | 'list';
  onClick: () => void;
}

const WorkforceCard: React.FC<WorkforceCardProps> = ({
  workforce,
  viewMode,
  onClick,
}) => {
  const getStatusColor = (status: AIWorkforce['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'disbanded':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card
      className="group cursor-pointer border-slate-700/50 bg-slate-800/50 backdrop-blur-xl transition-all duration-200 hover:bg-slate-800/70"
      onClick={onClick}
    >
      <CardContent className="p-6">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-white transition-colors group-hover:text-blue-400">
                {workforce.name}
              </h3>
              <div
                className={cn(
                  'h-2 w-2 rounded-full',
                  getStatusColor(workforce.status)
                )}
              />
            </div>
            <p className="line-clamp-2 text-sm text-slate-400">
              {workforce.description}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="border-slate-700 bg-slate-800">
              <DropdownMenuItem className="text-slate-300">
                <Edit className="mr-2 h-4 w-4" />
                Edit Team
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-300">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Member
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-300">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem className="text-red-400">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Team
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Team Members */}
        <div className="mb-4 flex items-center space-x-2">
          <div className="flex -space-x-2">
            {workforce.members.slice(0, 4).map(member => (
              <Avatar
                key={member.id}
                className="h-8 w-8 border-2 border-slate-800"
              >
                <AvatarImage
                  src={member.employee.avatar}
                  alt={member.employee.name}
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-xs text-white">
                  {member.employee.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
            ))}
            {workforce.members.length > 4 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-800 bg-slate-700">
                <span className="text-xs text-slate-300">
                  +{workforce.members.length - 4}
                </span>
              </div>
            )}
          </div>
          <span className="text-sm text-slate-400">
            {workforce.members.length} members
          </span>
        </div>

        {/* Metrics */}
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-400">Projects</p>
            <p className="text-sm font-medium text-white">
              {workforce.projects.filter(p => p.status === 'active').length}{' '}
              active
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Efficiency</p>
            <p className="text-sm font-medium text-white">
              {workforce.performance.efficiency}%
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Revenue</p>
            <p className="text-sm font-medium text-white">
              {formatCurrency(workforce.performance.totalRevenue)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Satisfaction</p>
            <div className="flex items-center space-x-1">
              <Star className="h-3 w-3 text-yellow-400" />
              <span className="text-sm font-medium text-white">
                {workforce.performance.clientSatisfaction}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
            <span>Monthly Budget</span>
            <span>
              {Math.round(
                (workforce.budget.spentBudget / workforce.budget.totalBudget) *
                  100
              )}
              %
            </span>
          </div>
          <Progress
            value={
              (workforce.budget.spentBudget / workforce.budget.totalBudget) *
              100
            }
            className="h-1.5"
          />
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 border border-slate-600 text-slate-400 hover:border-slate-500 hover:text-white"
          >
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Settings className="mr-2 h-4 w-4" />
            Manage
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Team Detail View Component
interface TeamDetailViewProps {
  workforce: AIWorkforce;
}

const TeamDetailView: React.FC<TeamDetailViewProps> = ({ workforce }) => {
  return (
    <div className="space-y-6">
      {/* Team Header */}
      <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-xl">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="mb-2 text-2xl font-bold text-white">
                {workforce.name}
              </h2>
              <p className="mb-4 text-slate-400">{workforce.description}</p>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-300">
                    {workforce.members.length} members
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Target className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-300">
                    {workforce.projects.length} projects
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-300">
                    Created {workforce.createdAt.toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                className="text-slate-400 hover:text-white"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Settings className="mr-2 h-4 w-4" />
                Team Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workforce.members.map(member => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg bg-slate-700/30 p-4"
              >
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={member.employee.avatar}
                      alt={member.employee.name}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {member.employee.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium text-white">
                      {member.employee.name}
                    </h4>
                    <p className="text-sm text-slate-400">
                      {member.position} • {member.department}
                    </p>
                    <div className="mt-1 flex items-center space-x-2">
                      <div
                        className={cn(
                          'h-2 w-2 rounded-full',
                          member.employee.status === 'available'
                            ? 'bg-green-500'
                            : member.employee.status === 'busy'
                              ? 'bg-yellow-500'
                              : 'bg-gray-500'
                        )}
                      />
                      <span className="text-xs capitalize text-slate-400">
                        {member.employee.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="mb-1 flex items-center space-x-1">
                    <Star className="h-3 w-3 text-yellow-400" />
                    <span className="text-sm text-white">
                      {member.employee.rating}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    ${member.employee.hourlyRate}/hr
                  </p>
                  <p className="text-xs text-slate-400">
                    {member.productivity.tasksCompleted} tasks
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Project Management View Component
interface ProjectManagementViewProps {
  workforce: AIWorkforce;
}

const ProjectManagementView: React.FC<ProjectManagementViewProps> = ({
  workforce,
}) => {
  return (
    <div className="space-y-6">
      {/* Projects Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Projects</h2>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-6">
        {workforce.projects.map(project => (
          <Card
            key={project.id}
            className="border-slate-700/50 bg-slate-800/50 backdrop-blur-xl"
          >
            <CardContent className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-white">
                      {project.name}
                    </h3>
                    <Badge
                      className={cn(
                        project.status === 'active'
                          ? 'border-green-500/30 bg-green-500/20 text-green-400'
                          : project.status === 'completed'
                            ? 'border-blue-500/30 bg-blue-500/20 text-blue-400'
                            : project.status === 'paused'
                              ? 'border-yellow-500/30 bg-yellow-500/20 text-yellow-400'
                              : 'border-slate-500/30 bg-slate-500/20 text-slate-400'
                      )}
                    >
                      {project.status}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        project.priority === 'urgent'
                          ? 'border-red-500/30 text-red-400'
                          : project.priority === 'high'
                            ? 'border-orange-500/30 text-orange-400'
                            : project.priority === 'medium'
                              ? 'border-yellow-500/30 text-yellow-400'
                              : 'border-slate-500/30 text-slate-400'
                      )}
                    >
                      {project.priority}
                    </Badge>
                  </div>
                  <p className="mb-4 text-slate-400">{project.description}</p>

                  <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div>
                      <p className="text-xs text-slate-400">Progress</p>
                      <p className="text-sm font-medium text-white">
                        {project.progress}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Budget</p>
                      <p className="text-sm font-medium text-white">
                        ${project.budget.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Team Size</p>
                      <p className="text-sm font-medium text-white">
                        {project.assignedMembers.length} members
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Due Date</p>
                      <p className="text-sm font-medium text-white">
                        {project.dueDate.toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {project.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-white"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-white"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-white"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="border-slate-700 bg-slate-800">
                      <DropdownMenuItem className="text-slate-300">
                        <Play className="mr-2 h-4 w-4" />
                        Resume Project
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-slate-300">
                        <Pause className="mr-2 h-4 w-4" />
                        Pause Project
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-700" />
                      <DropdownMenuItem className="text-red-400">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Analytics View Component
interface AnalyticsViewProps {
  workforces: AIWorkforce[];
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ workforces }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Workforce Analytics</h2>

      <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-xl">
        <CardContent className="py-12 text-center">
          <BarChart3 className="mx-auto mb-4 h-12 w-12 text-slate-400" />
          <p className="text-slate-400">
            Analytics dashboard will be displayed here
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

// Create Team Dialog Component
interface CreateTeamDialogProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const CreateTeamDialog: React.FC<CreateTeamDialogProps> = ({
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department: 'marketing',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle className="text-white">Create New Team</DialogTitle>
        <DialogDescription className="text-slate-400">
          Set up a new AI workforce team for your organization
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-slate-300">
            Team Name *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={e =>
              setFormData(prev => ({ ...prev, name: e.target.value }))
            }
            placeholder="e.g., Marketing Team"
            className="mt-2 border-slate-600/30 bg-slate-700/30 text-white placeholder:text-slate-400"
            required
          />
        </div>

        <div>
          <Label htmlFor="description" className="text-slate-300">
            Description
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={e =>
              setFormData(prev => ({ ...prev, description: e.target.value }))
            }
            placeholder="Describe the team's purpose and objectives..."
            className="mt-2 min-h-[100px] border-slate-600/30 bg-slate-700/30 text-white placeholder:text-slate-400"
          />
        </div>

        <div>
          <Label htmlFor="department" className="text-slate-300">
            Department
          </Label>
          <Select
            value={formData.department}
            onValueChange={value =>
              setFormData(prev => ({ ...prev, department: value }))
            }
          >
            <SelectTrigger className="mt-2 border-slate-600/30 bg-slate-700/30 text-slate-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-slate-700 bg-slate-800">
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="engineering">Engineering</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="support">Support</SelectItem>
              <SelectItem value="analytics">Analytics</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="text-slate-400 hover:text-white"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !formData.name.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Create Team
          </Button>
        </div>
      </form>
    </div>
  );
};

export default WorkforceManagement;
