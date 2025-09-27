import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { 
  Calendar, 
  Plus, 
  Clock,
  Users,
  Target,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Edit,
  Save,
  Trash2,
  Search,
  Filter,
  Loader2,
  CalendarDays,
  MapPin,
  Flag,
  Zap,
  Brain,
  Rocket,
  Timer,
  Bell,
  Repeat,
  Settings
} from 'lucide-react';
import { useAuth } from '../../contexts/auth-hooks';

interface Schedule {
  id: string;
  title: string;
  description: string;
  type: 'meeting' | 'task' | 'reminder' | 'deadline' | 'event';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startTime: string;
  endTime: string;
  date: string;
  duration: number; // in minutes
  attendees: string[];
  location?: string;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
  };
  reminders: Reminder[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Reminder {
  id: string;
  time: number; // minutes before event
  type: 'email' | 'notification' | 'popup';
  sent: boolean;
}

const SchedulingPage: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">Authentication Required</h3>
          <p className="text-muted-foreground">Please log in to access this page.</p>
        </div>
      </div>
    );
  }
  
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  
  const [newSchedule, setNewSchedule] = useState({
    title: '',
    description: '',
    type: 'meeting' as const,
    priority: 'medium' as const,
    date: '',
    startTime: '',
    endTime: '',
    duration: 60,
    location: '',
    attendees: '',
    tags: ''
  });

  useEffect(() => {
    if (user) {
      loadSchedules();
    }
  }, [user]);

  useEffect(() => {
    filterSchedules();
  }, [schedules, searchTerm, typeFilter, statusFilter, dateFilter]);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Simulate loading schedules from API
      
      
      
      
      setSchedules(mockSchedules);
    } catch (error) {
      console.error('Error loading schedules:', error);
      setError('Failed to load schedules.');
    } finally {
      setLoading(false);
    }
  };

  const filterSchedules = useCallback(() => {
    let filtered = schedules;

    if (searchTerm) {
      filtered = filtered.filter(schedule =>
        schedule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(schedule => schedule.type === typeFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(schedule => schedule.status === statusFilter);
    }

    if (dateFilter) {
      filtered = filtered.filter(schedule => schedule.date === dateFilter);
    }

    setFilteredSchedules(filtered);
  }, [schedules, searchTerm, typeFilter, statusFilter, dateFilter]);

  const createSchedule = async () => {
    try {
      const schedule: Schedule = {
        id: Date.now().toString(),
        title: newSchedule.title,
        description: newSchedule.description,
        type: newSchedule.type,
        status: 'scheduled',
        priority: newSchedule.priority,
        startTime: newSchedule.startTime,
        endTime: newSchedule.endTime,
        date: newSchedule.date,
        duration: newSchedule.duration,
        attendees: newSchedule.attendees.split(',').map(a => a.trim()).filter(a => a),
        location: newSchedule.location,
        reminders: [
          { id: 'r' + Date.now(), time: 15, type: 'notification', sent: false }
        ],
        tags: newSchedule.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setSchedules(prev => [schedule, ...prev]);
      setNewSchedule({
        title: '',
        description: '',
        type: 'meeting',
        priority: 'medium',
        date: '',
        startTime: '',
        endTime: '',
        duration: 60,
        location: '',
        attendees: '',
        tags: ''
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating schedule:', error);
    }
  };

  const updateScheduleStatus = async (scheduleId: string, status: Schedule['status']) => {
    setSchedules(prev => prev.map(schedule => 
      schedule.id === scheduleId 
        ? { ...schedule, status, updatedAt: new Date().toISOString() }
        : schedule
    ));
  };

  const deleteSchedule = async (scheduleId: string) => {
    setSchedules(prev => prev.filter(schedule => schedule.id !== scheduleId));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'task':
        return <Target className="h-4 w-4 text-green-500" />;
      case 'reminder':
        return <Bell className="h-4 w-4 text-yellow-500" />;
      case 'deadline':
        return <Flag className="h-4 w-4 text-red-500" />;
      case 'event':
        return <Calendar className="h-4 w-4 text-purple-500" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'scheduled':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'in_progress':
        return <Play className="h-4 w-4 text-yellow-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-500" />;
    }
  };

  const scheduleStats = {
    total: schedules.length,
    scheduled: schedules.filter(s => s.status === 'scheduled').length,
    inProgress: schedules.filter(s => s.status === 'in_progress').length,
    completed: schedules.filter(s => s.status === 'completed').length,
    overdue: schedules.filter(s => s.status === 'overdue').length,
    today: schedules.filter(s => s.date === new Date().toISOString().split('T')[0]).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading schedules...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Empty state for new users */}
      {data.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No data yet</h3>
          <p className="text-muted-foreground mb-4">
            This page will show your data once you start using the system.
          </p>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Scheduling</h1>
          <p className="text-muted-foreground mt-2">
            Manage and schedule activities for your AI workforce platform.
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Event
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground">{scheduleStats.total}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600">{scheduleStats.scheduled}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">{scheduleStats.inProgress}</p>
              </div>
              <Play className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{scheduleStats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{scheduleStats.overdue}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search schedules..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Types</option>
                <option value="meeting">Meeting</option>
                <option value="task">Task</option>
                <option value="reminder">Reminder</option>
                <option value="deadline">Deadline</option>
                <option value="event">Event</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="overdue">Overdue</option>
              </select>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedules List */}
      <div className="space-y-4">
        {filteredSchedules.map((schedule) => (
          <Card key={schedule.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getTypeIcon(schedule.type)}
                    <h3 className="font-semibold text-foreground">{schedule.title}</h3>
                    <Badge className={getStatusColor(schedule.status)}>
                      {schedule.status.replace('_', ' ')}
                    </Badge>
                    <Badge className={getPriorityColor(schedule.priority)}>
                      {schedule.priority}
                    </Badge>
                    {schedule.recurring && (
                      <Badge variant="outline" className="text-xs">
                        <Repeat className="h-3 w-3 mr-1" />
                        {schedule.recurring.frequency}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{schedule.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div className="flex items-center space-x-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">{new Date(schedule.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Time:</span>
                      <span className="font-medium">{schedule.startTime} - {schedule.endTime}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Attendees:</span>
                      <span className="font-medium">{schedule.attendees.length}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-medium">{schedule.location || 'Virtual'}</span>
                    </div>
                  </div>

                  {/* Attendees */}
                  {schedule.attendees.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-foreground mb-2">Attendees</h4>
                      <div className="flex flex-wrap gap-2">
                        {schedule.attendees.map((attendee, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {attendee}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reminders */}
                  {schedule.reminders.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-foreground mb-2">Reminders</h4>
                      <div className="flex flex-wrap gap-2">
                        {schedule.reminders.map((reminder) => (
                          <Badge key={reminder.id} variant="outline" className="text-xs">
                            <Bell className="h-3 w-3 mr-1" />
                            {reminder.time}min {reminder.type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Tags:</span>
                    <div className="flex space-x-1">
                      {schedule.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {getStatusIcon(schedule.status)}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Created {new Date(schedule.createdAt).toLocaleDateString()}
                </div>
                <div className="flex space-x-2">
                  {schedule.status === 'scheduled' && (
                    <Button size="sm" variant="outline" onClick={() => updateScheduleStatus(schedule.id, 'in_progress')}>
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                  {schedule.status === 'in_progress' && (
                    <Button size="sm" variant="outline" onClick={() => updateScheduleStatus(schedule.id, 'completed')}>
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setSelectedSchedule(schedule)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive hover:text-destructive/80" onClick={() => deleteSchedule(schedule.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredSchedules.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No schedules found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || typeFilter || statusFilter || dateFilter
                ? 'Try adjusting your search criteria.'
                : 'Start by creating your first schedule.'}
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Schedule Event
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Schedule Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Schedule New Event</CardTitle>
              <CardDescription>
                Add a new event to your schedule.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newSchedule.title}
                  onChange={(e) => setNewSchedule({...newSchedule, title: e.target.value})}
                  placeholder="Enter event title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newSchedule.description}
                  onChange={(e) => setNewSchedule({...newSchedule, description: e.target.value})}
                  placeholder="Enter event description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    value={newSchedule.type}
                    onChange={(e) => setNewSchedule({...newSchedule, type: e.target.value as any})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="meeting">Meeting</option>
                    <option value="task">Task</option>
                    <option value="reminder">Reminder</option>
                    <option value="deadline">Deadline</option>
                    <option value="event">Event</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    value={newSchedule.priority}
                    onChange={(e) => setNewSchedule({...newSchedule, priority: e.target.value as any})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newSchedule.date}
                    onChange={(e) => setNewSchedule({...newSchedule, date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={newSchedule.duration}
                    onChange={(e) => setNewSchedule({...newSchedule, duration: parseInt(e.target.value) || 60})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={newSchedule.startTime}
                    onChange={(e) => setNewSchedule({...newSchedule, startTime: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={newSchedule.endTime}
                    onChange={(e) => setNewSchedule({...newSchedule, endTime: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newSchedule.location}
                  onChange={(e) => setNewSchedule({...newSchedule, location: e.target.value})}
                  placeholder="Enter location or 'Virtual'"
                />
              </div>
              <div>
                <Label htmlFor="attendees">Attendees (comma-separated)</Label>
                <Input
                  id="attendees"
                  value={newSchedule.attendees}
                  onChange={(e) => setNewSchedule({...newSchedule, attendees: e.target.value})}
                  placeholder="John Doe, Jane Smith"
                />
              </div>
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={newSchedule.tags}
                  onChange={(e) => setNewSchedule({...newSchedule, tags: e.target.value})}
                  placeholder="meeting, ai, review"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button onClick={createSchedule}>
                  <Save className="mr-2 h-4 w-4" />
                  Schedule Event
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SchedulingPage;