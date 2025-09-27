import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Users, 
  Bot, 
  Settings, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Star,
  Zap,
  Shield,
  Database,
  Server,
  Globe,
  Wifi,
  WifiOff,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Edit3,
  Plus,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  Eye,
  EyeOff,
  Play,
  Pause,
  Stop,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Minimize2,
  X,
  Save,
  Copy,
  Share2,
  Bookmark,
  Flag,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Mail,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Camera,
  CameraOff,
  Phone,
  PhoneOff,
  Headphones,
  Speaker,
  Radio,
  Tv,
  Monitor,
  Laptop,
  Smartphone,
  Tablet,
  Watch,
  Gamepad2,
  Joystick,
  Controller
} from 'lucide-react';
import { useCompleteAIEmployeeStore } from '@/stores/complete-ai-employee-store';
import { completeRealtimeService } from '@/services/complete-realtime-service';
import { completePerformanceTrackingService } from '@/services/complete-performance-tracking';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { 
  AIEmployee, 
  EmployeeAnalytics, 
  PerformanceMetrics,
  ToolExecution,
  EmployeeNotification
} from '@/types/complete-ai-employee';

interface CompleteAdminDashboardProps {
  onClose?: () => void;
  isMinimized?: boolean;
  onMinimize?: () => void;
  onMaximize?: () => void;
}

const CompleteAdminDashboard: React.FC<CompleteAdminDashboardProps> = ({
  onClose,
  isMinimized = false,
  onMinimize,
  onMaximize
}) => {
  const { 
    employees, 
    employeeAnalytics, 
    loadEmployees, 
    loadAnalytics,
    updateEmployee,
    deleteEmployee,
    createEmployee
  } = useCompleteAIEmployeeStore();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedEmployee, setSelectedEmployee] = useState<AIEmployee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [realtimeStats, setRealtimeStats] = useState(completeRealtimeService.getStats());
  const [notifications, setNotifications] = useState<EmployeeNotification[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics[]>([]);
  const [toolExecutions, setToolExecutions] = useState<ToolExecution[]>([]);
  const [systemHealth, setSystemHealth] = useState({
    database: 'healthy',
    api: 'healthy',
    realtime: 'healthy',
    storage: 'healthy'
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Update real-time stats
  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeStats(completeRealtimeService.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadEmployees(),
        loadAnalytics()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort employees
  const filteredEmployees = Object.values(employees).filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || employee.category === filterCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name;
        bValue = b.name;
        break;
      case 'performance':
        aValue = a.performance?.rating || 0;
        bValue = b.performance?.rating || 0;
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'created':
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

  const handleEmployeeSelect = (employee: AIEmployee) => {
    setSelectedEmployee(employee);
  };

  const handleEmployeeUpdate = async (employeeId: string, updates: Partial<AIEmployee>) => {
    try {
      await updateEmployee(employeeId, updates);
      toast.success('Employee updated successfully');
    } catch (error) {
      toast.error('Failed to update employee');
    }
  };

  const handleEmployeeDelete = async (employeeId: string) => {
    try {
      await deleteEmployee(employeeId);
      toast.success('Employee deleted successfully');
      if (selectedEmployee?.id === employeeId) {
        setSelectedEmployee(null);
      }
    } catch (error) {
      toast.error('Failed to delete employee');
    }
  };

  const handleRefresh = () => {
    loadInitialData();
    toast.success('Dashboard refreshed');
  };

  const handleExportData = () => {
    const data = {
      employees: Object.values(employees),
      analytics: employeeAnalytics,
      stats: realtimeStats,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-employees-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Data exported successfully');
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onMinimize}
          className="rounded-full w-12 h-12"
          size="sm"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(
      "h-screen bg-background border rounded-lg shadow-lg flex flex-col",
      "fixed inset-4 z-50"
    )}>
      {/* Header */}
      <div className="border-b bg-card p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-primary to-purple-600 rounded-lg flex items-center justify-center">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">AI Employee Management</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
          >
            <Download className="h-4 w-4" />
          </Button>
          {onMinimize && (
            <Button variant="outline" size="sm" onClick={onMinimize}>
              <Minimize2 className="h-4 w-4" />
            </Button>
          )}
          {onMaximize && (
            <Button variant="outline" size="sm" onClick={onMaximize}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-64 border-r bg-muted/50 p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="overview" className="justify-start">
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="employees" className="justify-start">
                <Users className="h-4 w-4 mr-2" />
                Employees
              </TabsTrigger>
              <TabsTrigger value="analytics" className="justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="performance" className="justify-start">
                <Activity className="h-4 w-4 mr-2" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="tools" className="justify-start">
                <Zap className="h-4 w-4 mr-2" />
                Tools
              </TabsTrigger>
              <TabsTrigger value="system" className="justify-start">
                <Server className="h-4 w-4 mr-2" />
                System
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{Object.keys(employees).length}</div>
                    <p className="text-xs text-muted-foreground">
                      +2 from last month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
                    <Bot className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Object.values(employees).filter(e => e.status === 'available').length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round((Object.values(employees).filter(e => e.status === 'available').length / Object.keys(employees).length) * 100)}% availability
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$1,234</div>
                    <p className="text-xs text-muted-foreground">
                      +12% from last month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Performance</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">4.8</div>
                    <p className="text-xs text-muted-foreground">
                      +0.2 from last month
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Real-time Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Real-time Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {realtimeStats.activeConnections}
                      </div>
                      <div className="text-sm text-muted-foreground">Active Connections</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {realtimeStats.totalSubscriptions}
                      </div>
                      <div className="text-sm text-muted-foreground">Subscriptions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {realtimeStats.messagesPerSecond}
                      </div>
                      <div className="text-sm text-muted-foreground">Messages/sec</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {Math.round(realtimeStats.uptime / 1000)}s
                      </div>
                      <div className="text-sm text-muted-foreground">Uptime</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Health */}
              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(systemHealth).map(([service, status]) => (
                      <div key={service} className="flex items-center space-x-2">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          status === 'healthy' ? "bg-green-500" : "bg-red-500"
                        )} />
                        <span className="text-sm font-medium capitalize">{service}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Employees Tab */}
            <TabsContent value="employees" className="space-y-6">
              {/* Search and Filters */}
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="executive_leadership">Executive Leadership</SelectItem>
                    <SelectItem value="engineering_technology">Engineering & Technology</SelectItem>
                    <SelectItem value="ai_data_science">AI & Data Science</SelectItem>
                    <SelectItem value="product_management">Product Management</SelectItem>
                    <SelectItem value="design_ux">Design & UX</SelectItem>
                    <SelectItem value="marketing_growth">Marketing & Growth</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                >
                  {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
                </Button>
              </div>

              {/* Employee List */}
              <div className={cn(
                viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "space-y-4"
              )}>
                {filteredEmployees.map((employee) => (
                  <motion.div
                    key={employee.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    whileHover={{ y: -2 }}
                  >
                    <Card 
                      className={cn(
                        "cursor-pointer transition-all duration-200",
                        selectedEmployee?.id === employee.id && "ring-2 ring-primary"
                      )}
                      onClick={() => handleEmployeeSelect(employee)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-primary to-purple-600 rounded-lg flex items-center justify-center">
                              <Bot className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{employee.name}</CardTitle>
                              <p className="text-sm text-muted-foreground">{employee.role}</p>
                            </div>
                          </div>
                          <Badge 
                            variant={employee.status === 'available' ? 'default' : 'secondary'}
                            className={cn(
                              "text-xs",
                              employee.status === 'available' && "bg-green-100 text-green-800",
                              employee.status === 'working' && "bg-yellow-100 text-yellow-800"
                            )}
                          >
                            {employee.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Performance</span>
                            <span className="text-sm font-medium">
                              {employee.performance?.rating || 0}/5
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Efficiency</span>
                            <span className="text-sm font-medium">
                              {employee.performance?.efficiency || 0}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Tools</span>
                            <span className="text-sm font-medium">
                              {employee.tools?.length || 0}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Analytics charts will be displayed here</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Performance metrics will be displayed here</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tools Tab */}
            <TabsContent value="tools" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tool Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Tool management interface will be displayed here</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Tab */}
            <TabsContent value="system" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">System configuration will be displayed here</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CompleteAdminDashboard;
