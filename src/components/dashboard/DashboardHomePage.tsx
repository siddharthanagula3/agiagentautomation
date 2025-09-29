/**
 * Dashboard Home Page Component
 * Comprehensive dashboard showcasing workforce analytics, automation metrics, recent activities, and quick actions
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Bot,
  Zap,
  Activity,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  LineChart,
  PieChart,
  Target,
  Sparkles,
  Brain,
  Network,
  Settings,
  Plus,
  Play,
  Pause,
  Square,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Download,
  Share,
  Filter,
  Calendar,
  MapPin,
  Globe,
  Cpu,
  Database,
  Cloud,
  Shield,
  Lock,
  Unlock,
  Bell,
  BellOff,
  Star,
  Bookmark,
  MessageSquare,
  FileText,
  Image,
  Video,
  Code,
  Search,
  RefreshCw,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Info,
  Warning,
  X,
  ChevronRight,
  ChevronLeft,
  Home,
  Building,
  Briefcase,
  GraduationCap,
  Award,
  Trophy,
  Flame,
  Zoomn,
  Mail,
  Phone,
  Calendar as CalendarIcon,
  MapPinIcon,
  Headphones,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Monitor,
  Smartphone,
  Tablet,
  Laptop
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart as RechartsLineChart,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  Legend,
  CartesianGrid
} from 'recharts';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Types
interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalWorkflows: number;
  activeWorkflows: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalCosts: number;
  monthlyCosts: number;
  successRate: number;
  avgResponseTime: number;
  tasksCompleted: number;
  customerSatisfaction: number;
}

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  status: 'active' | 'busy' | 'offline' | 'maintenance';
  performance: number;
  tasksCompleted: number;
  revenue: number;
  avatar?: string;
  lastActive: Date;
  currentTask?: string;
  utilization: number;
  skills: string[];
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  progress: number;
  startTime: Date;
  estimatedCompletion?: Date;
  assignedEmployees: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  metrics: {
    success_rate: number;
    avg_execution_time: number;
    cost_per_run: number;
  };
}

interface Activity {
  id: string;
  type: 'employee_action' | 'workflow_update' | 'system_event' | 'user_action';
  title: string;
  description: string;
  timestamp: Date;
  employeeId?: string;
  workflowId?: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  metadata?: Record<string, any>;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  action: () => void;
  badge?: string;
  disabled?: boolean;
}

interface DashboardHomePageProps {
  className?: string;
}

export const DashboardHomePage: React.FC<DashboardHomePageProps> = ({ className }) => {
  // State management
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const queryClient = useQueryClient();

  // Fetch dashboard data
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', timeRange],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      return generateMockStats();
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000
  });

  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ['dashboard-employees'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 600));
      return generateMockEmployees();
    },
    staleTime: 30 * 1000
  });

  const { data: workflows = [], isLoading: workflowsLoading } = useQuery<Workflow[]>({
    queryKey: ['dashboard-workflows'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 700));
      return generateMockWorkflows();
    },
    staleTime: 30 * 1000
  });

  const { data: activities = [], isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ['dashboard-activities', timeRange],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return generateMockActivities();
    },
    staleTime: 15 * 1000
  });

  // Mock data generators
  const generateMockStats = (): DashboardStats => ({
    totalEmployees: 24,
    activeEmployees: 18,
    totalWorkflows: 47,
    activeWorkflows: 12,
    totalRevenue: 2847500,
    monthlyRevenue: 284750,
    totalCosts: 89250,
    monthlyCosts: 8925,
    successRate: 94.7,
    avgResponseTime: 2.3,
    tasksCompleted: 1847,
    customerSatisfaction: 4.8
  });

  const generateMockEmployees = (): Employee[] => [
    {
      id: 'emp-001',
      name: 'Alex Chen',
      role: 'Senior Data Analyst',
      department: 'Analytics',
      status: 'active',
      performance: 96,
      tasksCompleted: 143,
      revenue: 45000,
      avatar: '/avatars/alex.png',
      lastActive: new Date(),
      currentTask: 'Processing Q4 sales report',
      utilization: 87,
      skills: ['Data Analysis', 'Python', 'Machine Learning', 'Visualization']
    },
    {
      id: 'emp-002',
      name: 'Sarah Rodriguez',
      role: 'UX Design Lead',
      department: 'Design',
      status: 'busy',
      performance: 98,
      tasksCompleted: 89,
      revenue: 38500,
      avatar: '/avatars/sarah.png',
      lastActive: new Date(Date.now() - 300000),
      currentTask: 'Designing user onboarding flow',
      utilization: 92,
      skills: ['UI/UX Design', 'Figma', 'User Research', 'Prototyping']
    },
    {
      id: 'emp-003',
      name: 'Marcus Johnson',
      role: 'DevOps Engineer',
      department: 'Engineering',
      status: 'active',
      performance: 94,
      tasksCompleted: 76,
      revenue: 42000,
      avatar: '/avatars/marcus.png',
      lastActive: new Date(Date.now() - 120000),
      currentTask: 'Optimizing deployment pipeline',
      utilization: 78,
      skills: ['DevOps', 'Kubernetes', 'AWS', 'CI/CD', 'Monitoring']
    },
    {
      id: 'emp-004',
      name: 'Emma Thompson',
      role: 'Marketing Strategist',
      department: 'Marketing',
      status: 'offline',
      performance: 91,
      tasksCompleted: 234,
      revenue: 56000,
      avatar: '/avatars/emma.png',
      lastActive: new Date(Date.now() - 3600000),
      utilization: 85,
      skills: ['Digital Marketing', 'Campaign Strategy', 'Analytics', 'Content']
    },
    {
      id: 'emp-005',
      name: 'David Kim',
      role: 'Full Stack Developer',
      department: 'Engineering',
      status: 'active',
      performance: 95,
      tasksCompleted: 187,
      revenue: 48500,
      avatar: '/avatars/david.png',
      lastActive: new Date(Date.now() - 60000),
      currentTask: 'Building new API endpoints',
      utilization: 89,
      skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'GraphQL']
    },
    {
      id: 'emp-006',
      name: 'Lisa Wang',
      role: 'AI Research Scientist',
      department: 'Research',
      status: 'busy',
      performance: 99,
      tasksCompleted: 67,
      revenue: 62000,
      avatar: '/avatars/lisa.png',
      lastActive: new Date(Date.now() - 180000),
      currentTask: 'Training new language model',
      utilization: 95,
      skills: ['Machine Learning', 'Deep Learning', 'NLP', 'Python', 'TensorFlow']
    }
  ];

  const generateMockWorkflows = (): Workflow[] => [
    {
      id: 'wf-001',
      name: 'Customer Data Analysis Pipeline',
      description: 'Automated analysis of customer behavior and preferences',
      status: 'running',
      progress: 67,
      startTime: new Date(Date.now() - 7200000),
      estimatedCompletion: new Date(Date.now() + 3600000),
      assignedEmployees: ['emp-001', 'emp-005'],
      priority: 'high',
      category: 'Analytics',
      metrics: {
        success_rate: 96,
        avg_execution_time: 45,
        cost_per_run: 125
      }
    },
    {
      id: 'wf-002',
      name: 'Marketing Campaign Optimization',
      description: 'Real-time optimization of marketing campaigns across channels',
      status: 'running',
      progress: 89,
      startTime: new Date(Date.now() - 14400000),
      estimatedCompletion: new Date(Date.now() + 1800000),
      assignedEmployees: ['emp-004'],
      priority: 'medium',
      category: 'Marketing',
      metrics: {
        success_rate: 91,
        avg_execution_time: 32,
        cost_per_run: 89
      }
    },
    {
      id: 'wf-003',
      name: 'Code Quality Assessment',
      description: 'Automated code review and quality assessment',
      status: 'paused',
      progress: 34,
      startTime: new Date(Date.now() - 10800000),
      assignedEmployees: ['emp-003', 'emp-005'],
      priority: 'low',
      category: 'Development',
      metrics: {
        success_rate: 98,
        avg_execution_time: 18,
        cost_per_run: 45
      }
    },
    {
      id: 'wf-004',
      name: 'User Experience Research',
      description: 'Comprehensive UX research and analysis workflow',
      status: 'completed',
      progress: 100,
      startTime: new Date(Date.now() - 86400000),
      assignedEmployees: ['emp-002'],
      priority: 'high',
      category: 'Design',
      metrics: {
        success_rate: 94,
        avg_execution_time: 120,
        cost_per_run: 200
      }
    }
  ];

  const generateMockActivities = (): Activity[] => [
    {
      id: 'act-001',
      type: 'employee_action',
      title: 'Data Analysis Completed',
      description: 'Alex Chen completed Q4 customer segmentation analysis',
      timestamp: new Date(Date.now() - 300000),
      employeeId: 'emp-001',
      severity: 'success'
    },
    {
      id: 'act-002',
      type: 'workflow_update',
      title: 'Marketing Campaign Updated',
      description: 'Campaign performance improved by 23%',
      timestamp: new Date(Date.now() - 600000),
      workflowId: 'wf-002',
      severity: 'info'
    },
    {
      id: 'act-003',
      type: 'system_event',
      title: 'System Health Check',
      description: 'All systems operating normally',
      timestamp: new Date(Date.now() - 900000),
      severity: 'success'
    },
    {
      id: 'act-004',
      type: 'employee_action',
      title: 'New Feature Deployed',
      description: 'David Kim deployed chat interface improvements',
      timestamp: new Date(Date.now() - 1200000),
      employeeId: 'emp-005',
      severity: 'success'
    },
    {
      id: 'act-005',
      type: 'user_action',
      title: 'Workflow Paused',
      description: 'Code Quality Assessment workflow paused for review',
      timestamp: new Date(Date.now() - 1800000),
      workflowId: 'wf-003',
      severity: 'warning'
    }
  ];

  // Chart data
  const revenueData = [
    { name: 'Jan', revenue: 245000, costs: 89000 },
    { name: 'Feb', revenue: 267000, costs: 92000 },
    { name: 'Mar', revenue: 289000, costs: 87000 },
    { name: 'Apr', revenue: 234000, costs: 94000 },
    { name: 'May', revenue: 312000, costs: 88000 },
    { name: 'Jun', revenue: 298000, costs: 91000 },
    { name: 'Jul', revenue: 345000, costs: 85000 }
  ];

  const performanceData = [
    { name: 'Analytics', performance: 96, efficiency: 94 },
    { name: 'Marketing', performance: 91, efficiency: 89 },
    { name: 'Engineering', performance: 94, efficiency: 92 },
    { name: 'Design', performance: 98, efficiency: 96 },
    { name: 'Research', performance: 99, efficiency: 97 }
  ];

  const utilizationData = [
    { name: 'Active', value: 75, color: '#10B981' },
    { name: 'Idle', value: 15, color: '#F59E0B' },
    { name: 'Maintenance', value: 10, color: '#6B7280' }
  ];

  // Quick actions
  const quickActions: QuickAction[] = [
    {
      id: 'new-employee',
      title: 'Hire AI Employee',
      description: 'Add a new AI employee to your workforce',
      icon: Bot,
      color: 'blue',
      action: () => toast.info('Opening employee marketplace...'),
      badge: 'New'
    },
    {
      id: 'create-workflow',
      title: 'Create Workflow',
      description: 'Build a new automation workflow',
      icon: Zap,
      color: 'purple',
      action: () => toast.info('Opening workflow designer...')
    },
    {
      id: 'analyze-data',
      title: 'Quick Analysis',
      description: 'Run instant data analysis',
      icon: BarChart3,
      color: 'green',
      action: () => toast.info('Starting analysis...')
    },
    {
      id: 'chat-ai',
      title: 'Chat with AI',
      description: 'Start a conversation with an AI employee',
      icon: MessageSquare,
      color: 'orange',
      action: () => toast.info('Opening chat interface...')
    },
    {
      id: 'view-reports',
      title: 'View Reports',
      description: 'Access detailed performance reports',
      icon: FileText,
      color: 'cyan',
      action: () => toast.info('Opening reports...')
    },
    {
      id: 'manage-integrations',
      title: 'Integrations',
      description: 'Manage external tool integrations',
      icon: Network,
      color: 'indigo',
      action: () => toast.info('Opening integrations...')
    }
  ];

  // Handlers
  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    setTimeout(() => setRefreshing(false), 1000);
    toast.success('Dashboard refreshed');
  };

  const handleEmployeeClick = (employee: Employee) => {
    setSelectedEmployee(employee);
  };

  const handleWorkflowClick = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
  };

  // Utility functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'running': case 'completed': case 'success':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'busy': case 'paused': case 'warning':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'offline': case 'failed': case 'error':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'maintenance': case 'info':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default:
        return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low': return 'text-green-400 bg-green-500/20 border-green-500/30';
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };

  const getActionColor = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30';
      case 'purple': return 'bg-purple-500/20 border-purple-500/30 text-purple-400 hover:bg-purple-500/30';
      case 'green': return 'bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30';
      case 'orange': return 'bg-orange-500/20 border-orange-500/30 text-orange-400 hover:bg-orange-500/30';
      case 'cyan': return 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30';
      case 'indigo': return 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/30';
      default: return 'bg-slate-500/20 border-slate-500/30 text-slate-400 hover:bg-slate-500/30';
    }
  };

  return (
    <div className={cn("space-y-6 p-6", className)}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Welcome back! Here's what's happening with your AI workforce.
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 bg-slate-800/50 border-slate-700/50 text-slate-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative text-slate-400 hover:text-white"
          >
            <Bell className="h-5 w-5" />
            {notifications.filter(n => !n.read).length > 0 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-slate-400 hover:text-white"
          >
            <RefreshCw className={cn("h-5 w-5", refreshing && "animate-spin")} />
          </Button>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Active Employees</p>
                <p className="text-2xl font-bold text-white">
                  {statsLoading ? '...' : stats?.activeEmployees}
                  <span className="text-sm text-slate-400 font-normal">
                    /{statsLoading ? '...' : stats?.totalEmployees}
                  </span>
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400">+12% this week</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Active Workflows</p>
                <p className="text-2xl font-bold text-white">
                  {statsLoading ? '...' : stats?.activeWorkflows}
                  <span className="text-sm text-slate-400 font-normal">
                    /{statsLoading ? '...' : stats?.totalWorkflows}
                  </span>
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400">+8% this week</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Zap className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Monthly Revenue</p>
                <p className="text-2xl font-bold text-white">
                  {statsLoading ? '...' : formatCurrency(stats?.monthlyRevenue || 0)}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400">+23% vs last month</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Success Rate</p>
                <p className="text-2xl font-bold text-white">
                  {statsLoading ? '...' : `${stats?.successRate || 0}%`}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400">+2.1% this week</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Revenue & Costs</CardTitle>
                    <CardDescription>Monthly performance trends</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-slate-800 border-slate-700" align="end">
                      <DropdownMenuItem className="text-slate-300">
                        <Download className="h-4 w-4 mr-2" />
                        Export Data
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-slate-300">
                        <Share className="h-4 w-4 mr-2" />
                        Share Report
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stackId="1"
                        stroke="#10B981"
                        fill="#10B981"
                        fillOpacity={0.3}
                        name="Revenue"
                      />
                      <Area
                        type="monotone"
                        dataKey="costs"
                        stackId="2"
                        stroke="#EF4444"
                        fill="#EF4444"
                        fillOpacity={0.3}
                        name="Costs"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Performance Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Department Performance</CardTitle>
                <CardDescription>Performance vs efficiency by department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="performance" fill="#3B82F6" name="Performance" />
                      <Bar dataKey="efficiency" fill="#8B5CF6" name="Efficiency" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
                <CardDescription>Common tasks and operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {quickActions.map((action) => {
                    const IconComponent = action.icon;
                    return (
                      <motion.button
                        key={action.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={action.action}
                        disabled={action.disabled}
                        className={cn(
                          "relative p-4 rounded-lg border transition-all duration-200 text-left group",
                          getActionColor(action.color),
                          action.disabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 rounded-lg bg-current/20 flex items-center justify-center">
                            <IconComponent className="h-5 w-5" />
                          </div>
                          {action.badge && (
                            <Badge className="text-xs bg-current/20">
                              {action.badge}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-medium text-white mb-1 group-hover:text-current transition-colors">
                          {action.title}
                        </h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          {action.description}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Workforce Utilization */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Workforce Utilization</CardTitle>
                <CardDescription>Current resource allocation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={utilizationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {utilizationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {utilizationData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-slate-300">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium text-white">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Performers */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Top Performers</CardTitle>
                <CardDescription>Highest performing AI employees</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employees
                    .sort((a, b) => b.performance - a.performance)
                    .slice(0, 5)
                    .map((employee, index) => (
                      <motion.div
                        key={employee.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        onClick={() => handleEmployeeClick(employee)}
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-700/30 cursor-pointer transition-colors group"
                      >
                        <div className="relative">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={employee.avatar} />
                            <AvatarFallback className="bg-slate-700 text-slate-300 text-sm">
                              {employee.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className={cn(
                            "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-800 flex items-center justify-center text-xs font-bold text-white",
                            index === 0 && "bg-yellow-500",
                            index === 1 && "bg-slate-400",
                            index === 2 && "bg-orange-600",
                            index > 2 && "bg-slate-600"
                          )}>
                            {index + 1}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                            {employee.name}
                          </p>
                          <p className="text-xs text-slate-400 truncate">{employee.role}</p>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium text-white">
                              {employee.performance}
                            </span>
                          </div>
                          <Badge className={cn('text-xs border mt-1', getStatusColor(employee.status))}>
                            {employee.status}
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Recent Activity</CardTitle>
                    <CardDescription>Latest system events and updates</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  <div className="space-y-4">
                    {activitiesLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex space-x-3 animate-pulse">
                          <div className="w-8 h-8 bg-slate-700 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-700 rounded w-3/4" />
                            <div className="h-3 bg-slate-700 rounded w-1/2" />
                          </div>
                        </div>
                      ))
                    ) : (
                      activities.map((activity, index) => (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 * index }}
                          className="flex space-x-3 p-2 rounded-lg hover:bg-slate-700/30 transition-colors"
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                            activity.severity === 'success' && "bg-green-500/20 text-green-400",
                            activity.severity === 'warning' && "bg-yellow-500/20 text-yellow-400",
                            activity.severity === 'error' && "bg-red-500/20 text-red-400",
                            activity.severity === 'info' && "bg-blue-500/20 text-blue-400"
                          )}>
                            {activity.type === 'employee_action' && <Bot className="h-4 w-4" />}
                            {activity.type === 'workflow_update' && <Zap className="h-4 w-4" />}
                            {activity.type === 'system_event' && <Settings className="h-4 w-4" />}
                            {activity.type === 'user_action' && <User className="h-4 w-4" />}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {activity.title}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                              {activity.description}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {activity.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Employee Detail Dialog */}
      <Dialog open={!!selectedEmployee} onOpenChange={(open) => !open && setSelectedEmployee(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={selectedEmployee?.avatar} />
                <AvatarFallback className="bg-slate-700 text-slate-300">
                  {selectedEmployee?.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <span>{selectedEmployee?.name}</span>
                <p className="text-sm text-slate-400 font-normal">{selectedEmployee?.role}</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedEmployee && (
            <div className="space-y-6 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Department</p>
                  <p className="text-white font-medium">{selectedEmployee.department}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Status</p>
                  <Badge className={cn('text-xs border', getStatusColor(selectedEmployee.status))}>
                    {selectedEmployee.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Performance</p>
                  <p className="text-white font-medium">{selectedEmployee.performance}%</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Utilization</p>
                  <p className="text-white font-medium">{selectedEmployee.utilization}%</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Tasks Completed</p>
                  <p className="text-white font-medium">{selectedEmployee.tasksCompleted}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Revenue Generated</p>
                  <p className="text-white font-medium">{formatCurrency(selectedEmployee.revenue)}</p>
                </div>
              </div>
              
              {selectedEmployee.currentTask && (
                <div>
                  <p className="text-sm text-slate-400 mb-2">Current Task</p>
                  <p className="text-white">{selectedEmployee.currentTask}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-slate-400 mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {selectedEmployee.skills.map((skill) => (
                    <Badge key={skill} variant="outline" className="text-slate-300 border-slate-600">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="ghost" onClick={() => setSelectedEmployee(null)}>
                  Close
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat with {selectedEmployee.name}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Workflow Detail Dialog */}
      <Dialog open={!!selectedWorkflow} onOpenChange={(open) => !open && setSelectedWorkflow(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">{selectedWorkflow?.name}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedWorkflow?.description}
            </DialogDescription>
          </DialogHeader>
          
          {selectedWorkflow && (
            <div className="space-y-6 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Status</p>
                  <Badge className={cn('text-xs border', getStatusColor(selectedWorkflow.status))}>
                    {selectedWorkflow.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Priority</p>
                  <Badge className={cn('text-xs border', getPriorityColor(selectedWorkflow.priority))}>
                    {selectedWorkflow.priority}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Category</p>
                  <p className="text-white font-medium">{selectedWorkflow.category}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Progress</p>
                  <p className="text-white font-medium">{selectedWorkflow.progress}%</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-slate-400 mb-2">Progress</p>
                <Progress value={selectedWorkflow.progress} className="h-2" />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Success Rate</p>
                  <p className="text-white font-medium">{selectedWorkflow.metrics.success_rate}%</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Avg Time</p>
                  <p className="text-white font-medium">{selectedWorkflow.metrics.avg_execution_time}m</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Cost per Run</p>
                  <p className="text-white font-medium">${selectedWorkflow.metrics.cost_per_run}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-slate-400 mb-2">Assigned Employees</p>
                <div className="flex space-x-2">
                  {selectedWorkflow.assignedEmployees.map((employeeId) => {
                    const employee = employees.find(e => e.id === employeeId);
                    return employee ? (
                      <div key={employeeId} className="flex items-center space-x-2 bg-slate-700/30 rounded-lg p-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={employee.avatar} />
                          <AvatarFallback className="bg-slate-700 text-slate-300 text-xs">
                            {employee.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-white">{employee.name}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="ghost" onClick={() => setSelectedWorkflow(null)}>
                  Close
                </Button>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Workflow
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardHomePage;