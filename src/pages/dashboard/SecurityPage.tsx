import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Switch } from '../../components/ui/switch';
import { Progress } from '../../components/ui/progress';
import { 
  Shield,
  Lock,
  Key,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  User,
  Users,
  Eye,
  EyeOff,
  Settings,
  Activity,
  FileText,
  Download,
  RefreshCw,
  Search,
  Filter,
  Clock,
  Zap,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  UserX,
  UserCheck,
  Fingerprint,
  Smartphone,
  Globe,
  Server,
  Database,
  Loader2,
  Ban,
  CheckSquare,
  Square
} from 'lucide-react';
import { useAuth } from '../../contexts/auth-hooks';
import { toast } from '../../hooks/use-toast';

interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'access_denied' | 'permission_change' | 'suspicious_activity' | 'data_breach' | 'api_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  user?: string;
  ipAddress?: string;
  location?: string;
  timestamp: string;
  resolved: boolean;
  details?: Record<string, unknown>;
}

interface AccessRule {
  id: string;
  name: string;
  description: string;
  type: 'role' | 'ip' | 'time' | 'location' | 'device';
  enabled: boolean;
  conditions: Record<string, unknown>;
  affectedUsers: number;
  createdAt: string;
  lastModified: string;
}

interface SecurityPolicy {
  id: string;
  name: string;
  category: 'authentication' | 'authorization' | 'data_protection' | 'compliance' | 'network';
  status: 'active' | 'inactive' | 'pending';
  description: string;
  requirements: string[];
  complianceLevel: number; // percentage
  lastAudit?: string;
}

interface UserSession {
  id: string;
  userId: string;
  userName: string;
  email: string;
  ipAddress: string;
  location: string;
  device: string;
  startTime: string;
  lastActivity: string;
  status: 'active' | 'idle' | 'expired';
  riskScore: number; // 0-100
}

interface ComplianceStandard {
  id: string;
  name: string;
  acronym: string;
  description: string;
  requirements: number;
  met: number;
  status: 'compliant' | 'partial' | 'non-compliant';
  lastAssessment: string;
  nextAssessment: string;
}

  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [accessRules, setAccessRules] = useState<AccessRule[]>([]);
  const [policies, setPolicies] = useState<SecurityPolicy[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [complianceStandards, setComplianceStandards] = useState<ComplianceStandard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [apiAccessEnabled, setApiAccessEnabled] = useState(true);
  const [auditLogEnabled, setAuditLogEnabled] = useState(true);
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  useEffect(() => {
const SecurityPage: React.FC = () => {
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
  

    if (user) {
      loadSecurityData();
    }
  }, [user]);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Simulate loading delay
      
      
      // Mock security events
      

      

      

      

      
      
      setSecurityEvents(mockEvents);
      setAccessRules(mockAccessRules);
      setPolicies(mockPolicies);
      setSessions(mockSessions);
      setComplianceStandards(mockComplianceStandards);
    } catch (error) {
      console.error('Error loading security data:', error);
      setError('Failed to load security data.');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'high':
        return <ShieldAlert className="h-4 w-4 text-orange-500" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'compliant':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'inactive':
      case 'idle':
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'expired':
      case 'non-compliant':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getRiskColor = (score: number) => {
    if (score <= 30) return 'text-green-600';
    if (score <= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const handleResolveEvent = async (eventId: string) => {
    try {
      setSecurityEvents(prev => prev.map(event => 
        event.id === eventId ? { ...event, resolved: true } : event
      ));
      toast({
        title: "Event Resolved",
        description: "Security event has been marked as resolved",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resolve security event",
        variant: "destructive",
      });
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      toast({
        title: "Session Terminated",
        description: "User session has been terminated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to terminate session",
        variant: "destructive",
      });
    }
  };

  const handleToggleRule = async (ruleId: string) => {
    try {
      setAccessRules(prev => prev.map(rule => 
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      ));
      toast({
        title: "Rule Updated",
        description: "Access rule has been updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update access rule",
        variant: "destructive",
      });
    }
  };

  const securityScore = {
    overall: 85,
    authentication: 92,
    authorization: 88,
    dataProtection: 90,
    compliance: 78,
    network: 82
  };

  const securityStats = {
    totalEvents: securityEvents.length,
    unresolvedEvents: securityEvents.filter(e => !e.resolved).length,
    criticalEvents: securityEvents.filter(e => e.severity === 'critical').length,
    activeSessions: sessions.filter(s => s.status === 'active').length,
    enabledRules: accessRules.filter(r => r.enabled).length,
    compliancePolicies: policies.filter(p => p.status === 'active').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading security data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">{error}</p>
          <Button variant="outline" onClick={loadSecurityData}>Retry</Button>
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
          <h1 className="text-3xl font-bold text-foreground">Security Center</h1>
          <p className="text-muted-foreground mt-2">
            Monitor security events, manage access controls, and ensure compliance.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button>
            <Settings className="mr-2 h-4 w-4" />
            Security Settings
          </Button>
        </div>
      </div>

      {/* Security Score */}
      <Card>
        <CardHeader>
          <CardTitle>Security Score</CardTitle>
          <CardDescription>Overall security posture and compliance status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-blue-500 p-1">
                    <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                      <span className="text-2xl font-bold">{securityScore.overall}%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Overall Security Score</h3>
                  <p className="text-sm text-muted-foreground">Based on policies, events, and compliance</p>
                </div>
              </div>
              <ShieldCheck className="h-12 w-12 text-green-500" />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Authentication</span>
                  <span className="text-sm font-medium">{securityScore.authentication}%</span>
                </div>
                <Progress value={securityScore.authentication} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Authorization</span>
                  <span className="text-sm font-medium">{securityScore.authorization}%</span>
                </div>
                <Progress value={securityScore.authorization} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Data Protection</span>
                  <span className="text-sm font-medium">{securityScore.dataProtection}%</span>
                </div>
                <Progress value={securityScore.dataProtection} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Compliance</span>
                  <span className="text-sm font-medium">{securityScore.compliance}%</span>
                </div>
                <Progress value={securityScore.compliance} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Network</span>
                  <span className="text-sm font-medium">{securityScore.network}%</span>
                </div>
                <Progress value={securityScore.network} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Security Events</p>
                <p className="text-2xl font-bold text-foreground">{securityStats.totalEvents}</p>
                <p className="text-sm text-red-600">{securityStats.unresolvedEvents} unresolved</p>
              </div>
              <ShieldAlert className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                <p className="text-2xl font-bold text-green-600">{securityStats.activeSessions}</p>
                <p className="text-sm text-muted-foreground">Users online</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Access Rules</p>
                <p className="text-2xl font-bold text-blue-600">{securityStats.enabledRules}</p>
                <p className="text-sm text-muted-foreground">Enabled</p>
              </div>
              <Lock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Policies</p>
                <p className="text-2xl font-bold text-purple-600">{securityStats.compliancePolicies}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Features */}
      <Card>
        <CardHeader>
          <CardTitle>Security Features</CardTitle>
          <CardDescription>Core security features and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center space-x-3">
                <Fingerprint className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Multi-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Require MFA for all users</p>
                </div>
              </div>
              <Switch
                checked={mfaEnabled}
                onCheckedChange={setMfaEnabled}
              />
            </div>
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center space-x-3">
                <Key className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">API Access Control</p>
                  <p className="text-sm text-muted-foreground">Manage API key permissions</p>
                </div>
              </div>
              <Switch
                checked={apiAccessEnabled}
                onCheckedChange={setApiAccessEnabled}
              />
            </div>
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center space-x-3">
                <Activity className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Audit Logging</p>
                  <p className="text-sm text-muted-foreground">Track all system activities</p>
                </div>
              </div>
              <Switch
                checked={auditLogEnabled}
                onCheckedChange={setAuditLogEnabled}
              />
            </div>
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">End-to-End Encryption</p>
                  <p className="text-sm text-muted-foreground">Encrypt all data transmissions</p>
                </div>
              </div>
              <Switch
                checked={encryptionEnabled}
                onCheckedChange={setEncryptionEnabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Security Events</CardTitle>
              <CardDescription>Monitor and respond to security incidents</CardDescription>
            </div>
            {securityStats.unresolvedEvents > 0 && (
              <Badge variant="destructive">
                {securityStats.unresolvedEvents} Unresolved
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {securityEvents.map((event) => (
              <div key={event.id} className="flex items-start justify-between p-4 border border-border rounded-lg">
                <div className="flex items-start space-x-3">
                  {getSeverityIcon(event.severity)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-foreground">{event.title}</h4>
                      <Badge className={getSeverityColor(event.severity)}>
                        {event.severity}
                      </Badge>
                      {event.resolved && (
                        <Badge variant="outline" className="text-green-600">
                          Resolved
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {event.user && (
                        <span className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{event.user}</span>
                        </span>
                      )}
                      {event.ipAddress && (
                        <span className="flex items-center space-x-1">
                          <Globe className="h-3 w-3" />
                          <span>{event.ipAddress}</span>
                        </span>
                      )}
                      {event.location && (
                        <span className="flex items-center space-x-1">
                          <Globe className="h-3 w-3" />
                          <span>{event.location}</span>
                        </span>
                      )}
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimeAgo(event.timestamp)}</span>
                      </span>
                    </div>
                  </div>
                </div>
                {!event.resolved && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleResolveEvent(event.id)}
                  >
                    Resolve
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>Monitor user sessions and terminate suspicious activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-foreground">{session.userName}</h4>
                      <Badge className={getStatusColor(session.status)}>
                        {session.status}
                      </Badge>
                      <span className={`text-sm font-medium ${getRiskColor(session.riskScore)}`}>
                        Risk: {session.riskScore}%
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>{session.email}</span>
                      <span>•</span>
                      <span>{session.ipAddress}</span>
                      <span>•</span>
                      <span>{session.location}</span>
                      <span>•</span>
                      <span>{session.device}</span>
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                      <span>Started: {formatTimeAgo(session.startTime)}</span>
                      <span>•</span>
                      <span>Last activity: {formatTimeAgo(session.lastActivity)}</span>
                    </div>
                  </div>
                </div>
                {session.status === 'active' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-destructive hover:text-destructive/80"
                    onClick={() => handleTerminateSession(session.id)}
                  >
                    Terminate
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Standards */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Standards</CardTitle>
          <CardDescription>Track compliance with industry standards and regulations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {complianceStandards.map((standard) => (
              <div key={standard.id} className="p-4 border border-border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-foreground">{standard.acronym}</h4>
                      <Badge className={getStatusColor(standard.status)}>
                        {standard.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{standard.name}</p>
                  </div>
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-3">{standard.description}</p>
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Compliance</span>
                    <span>{standard.met}/{standard.requirements} requirements</span>
                  </div>
                  <Progress value={(standard.met / standard.requirements) * 100} className="h-2" />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Last: {new Date(standard.lastAssessment).toLocaleDateString()}</span>
                  <span>Next: {new Date(standard.nextAssessment).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityPage;
