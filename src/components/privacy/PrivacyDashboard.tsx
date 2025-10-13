/**
 * Privacy Dashboard Component
 * Provides interface for managing privacy settings and GDPR compliance
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Shield,
  Eye,
  Trash2,
  Download,
  Settings,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  User,
  Database,
  History,
  RefreshCw,
} from 'lucide-react';
import { privacyService } from '@/services/privacy-service';
import { monitoringService } from '@/services/monitoring-service';
import { toast } from 'sonner';

interface ConsentPreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
  thirdParty: boolean;
}

interface DataSubjectRequest {
  id: string;
  userId: string;
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  requestedAt: Date;
  completedAt?: Date;
  details: any;
}

interface PrivacyDashboardProps {
  className?: string;
}

const PrivacyDashboard: React.FC<PrivacyDashboardProps> = ({ className }) => {
  const [consentPreferences, setConsentPreferences] = useState<ConsentPreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    personalization: false,
    thirdParty: false,
  });
  const [dataRequests, setDataRequests] = useState<DataSubjectRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedRequestType, setSelectedRequestType] = useState<string>('');
  const [requestDetails, setRequestDetails] = useState<string>('');

  useEffect(() => {
    loadPrivacyData();
  }, []);

  const loadPrivacyData = async () => {
    setIsLoading(true);
    try {
      const preferences = privacyService.getConsentPreferences();
      if (preferences) {
        setConsentPreferences(preferences);
      }
      
      // In a real implementation, you would load data requests from the service
      // const requests = await privacyService.getDataSubjectRequests(userId);
      // setDataRequests(requests);
    } catch (error) {
      console.error('Error loading privacy data:', error);
      toast.error('Failed to load privacy data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConsentChange = (category: keyof ConsentPreferences, value: boolean) => {
    const newPreferences = { ...consentPreferences, [category]: value };
    setConsentPreferences(newPreferences);
    privacyService.saveConsentPreferences(newPreferences);
    toast.success('Consent preferences updated');
  };

  const handleDataRequest = async () => {
    if (!selectedRequestType) return;

    setIsLoading(true);
    try {
      // In a real implementation, you would make the actual request
      // await privacyService.requestDataAccess(userId);
      // or other request types based on selectedRequestType
      
      toast.success('Data request submitted successfully');
      setRequestDialogOpen(false);
      setSelectedRequestType('');
      setRequestDetails('');
      await loadPrivacyData();
    } catch (error) {
      console.error('Error submitting data request:', error);
      toast.error('Failed to submit data request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, you would export the actual data
      // const userData = await privacyService.exportUserData(userId);
      // const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      // const url = URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = 'my-data-export.json';
      // a.click();
      
      toast.success('Data export initiated. You will receive an email when ready.');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      // In a real implementation, you would delete the actual data
      // await privacyService.deleteUserData(userId);
      
      toast.success('Account deletion initiated. You will receive a confirmation email.');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    } finally {
      setIsLoading(false);
    }
  };

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'access': return <Eye className="w-4 h-4" />;
      case 'rectification': return <FileText className="w-4 h-4" />;
      case 'erasure': return <Trash2 className="w-4 h-4" />;
      case 'portability': return <Download className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getRequestTypeDescription = (type: string) => {
    switch (type) {
      case 'access': return 'Request access to your personal data';
      case 'rectification': return 'Request correction of inaccurate data';
      case 'erasure': return 'Request deletion of your personal data';
      case 'portability': return 'Request a copy of your data';
      case 'restriction': return 'Request restriction of data processing';
      case 'objection': return 'Object to data processing';
      default: return 'Data subject request';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'pending': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  if (isLoading && !consentPreferences) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading privacy settings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Tabs defaultValue="consent" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="consent">Consent</TabsTrigger>
          <TabsTrigger value="requests">Data Requests</TabsTrigger>
          <TabsTrigger value="export">Data Export</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="consent" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Consent Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>Your Privacy Rights</AlertTitle>
                <AlertDescription>
                  You have the right to control how your personal data is used. You can update your consent preferences at any time.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="essential">Essential Cookies</Label>
                    <p className="text-sm text-muted-foreground">
                      Required for the website to function properly
                    </p>
                  </div>
                  <Switch
                    id="essential"
                    checked={consentPreferences.essential}
                    onCheckedChange={(checked) => handleConsentChange('essential', checked)}
                    disabled
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="analytics">Analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Help us understand how you use our website
                    </p>
                  </div>
                  <Switch
                    id="analytics"
                    checked={consentPreferences.analytics}
                    onCheckedChange={(checked) => handleConsentChange('analytics', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="marketing">Marketing</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow us to send you promotional content
                    </p>
                  </div>
                  <Switch
                    id="marketing"
                    checked={consentPreferences.marketing}
                    onCheckedChange={(checked) => handleConsentChange('marketing', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="personalization">Personalization</Label>
                    <p className="text-sm text-muted-foreground">
                      Customize your experience based on your preferences
                    </p>
                  </div>
                  <Switch
                    id="personalization"
                    checked={consentPreferences.personalization}
                    onCheckedChange={(checked) => handleConsentChange('personalization', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="thirdParty">Third Party</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow third-party services to access your data
                    </p>
                  </div>
                  <Switch
                    id="thirdParty"
                    checked={consentPreferences.thirdParty}
                    onCheckedChange={(checked) => handleConsentChange('thirdParty', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Data Subject Requests
                </div>
                <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <FileText className="w-4 h-4 mr-2" />
                      New Request
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Submit Data Request</DialogTitle>
                      <DialogDescription>
                        Choose the type of data request you want to submit.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="request-type">Request Type</Label>
                        <Select value={selectedRequestType} onValueChange={setSelectedRequestType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select request type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="access">Data Access</SelectItem>
                            <SelectItem value="rectification">Data Rectification</SelectItem>
                            <SelectItem value="erasure">Data Erasure</SelectItem>
                            <SelectItem value="portability">Data Portability</SelectItem>
                            <SelectItem value="restriction">Processing Restriction</SelectItem>
                            <SelectItem value="objection">Object to Processing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {selectedRequestType && (
                        <div>
                          <Label htmlFor="request-details">Additional Details</Label>
                          <textarea
                            id="request-details"
                            value={requestDetails}
                            onChange={(e) => setRequestDetails(e.target.value)}
                            placeholder="Provide any additional details for your request..."
                            className="w-full p-2 border rounded-md"
                            rows={3}
                          />
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleDataRequest} disabled={!selectedRequestType || isLoading}>
                        {isLoading ? 'Submitting...' : 'Submit Request'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dataRequests.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No data requests found</p>
                  <p className="text-sm text-muted-foreground">Submit a new request to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dataRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        {getRequestTypeIcon(request.type)}
                        <div>
                          <div className="font-medium capitalize">{request.type}</div>
                          <div className="text-sm text-muted-foreground">
                            {getRequestTypeDescription(request.type)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Requested: {request.requestedAt.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(request.status)}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1 capitalize">{request.status}</span>
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Data Export & Deletion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Download className="h-4 w-4" />
                <AlertTitle>Export Your Data</AlertTitle>
                <AlertDescription>
                  You can request a copy of all your personal data in a machine-readable format.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Export All Data</h3>
                      <p className="text-sm text-muted-foreground">
                        Download a complete copy of your personal data
                      </p>
                    </div>
                    <Button onClick={handleExportData} disabled={isLoading}>
                      <Download className="w-4 h-4 mr-2" />
                      {isLoading ? 'Exporting...' : 'Export Data'}
                    </Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg border-red-200 dark:border-red-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-red-600 dark:text-red-400">Delete Account</h3>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all associated data
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={isLoading}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {isLoading ? 'Deleting...' : 'Delete Account'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Privacy Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="audit-logging">Audit Logging</Label>
                    <p className="text-sm text-muted-foreground">
                      Log privacy-related activities for compliance
                    </p>
                  </div>
                  <Switch id="audit-logging" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="data-retention">Data Retention</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically delete old data according to retention policies
                    </p>
                  </div>
                  <Switch id="data-retention" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="anonymization">Data Anonymization</Label>
                    <p className="text-sm text-muted-foreground">
                      Anonymize personal data before deletion
                    </p>
                  </div>
                  <Switch id="anonymization" defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PrivacyDashboard;
