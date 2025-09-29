/**
 * Settings Page - Application settings and configuration
 */

import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  User,
  Bell,
  Shield,
  Database,
  Palette,
  Globe,
  Key,
  Mail,
  Phone,
  Camera,
  Save,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Edit,
  Plus,
  X,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

interface SettingsPageProps {
  className?: string;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ className }) => {
  const { section } = useParams();
  const [activeSection, setActiveSection] = useState(section || 'profile');
  
  // Profile settings
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john.doe@company.com',
    phone: '+1 (555) 123-4567',
    bio: 'AI Platform Administrator',
    avatar: '/avatars/user.png',
    timezone: 'America/New_York',
    language: 'en'
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    workflowAlerts: true,
    employeeUpdates: false,
    systemMaintenance: true,
    marketingEmails: false,
    weeklyReports: true,
    instantAlerts: true
  });

  // Security settings
  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    sessionTimeout: '30',
    passwordLastChanged: new Date('2024-01-15'),
    activeSessions: 3,
    allowedIPs: ['192.168.1.100', '10.0.0.1'],
    apiKeys: [
      { id: '1', name: 'Production API', key: 'sk-...xyz123', created: new Date('2024-01-10'), lastUsed: new Date() },
      { id: '2', name: 'Development API', key: 'sk-...abc789', created: new Date('2024-01-20'), lastUsed: new Date('2024-01-25') }
    ]
  });

  // System settings
  const [system, setSystem] = useState({
    theme: 'dark',
    autoSave: true,
    debugMode: false,
    analyticsEnabled: true,
    cacheSize: '1GB',
    backupFrequency: 'daily',
    retentionPeriod: '30',
    maxConcurrentJobs: 10
  });

  const handleSaveProfile = () => {
    // Save profile changes
    toast.success('Profile updated successfully');
  };

  const handleSaveNotifications = () => {
    // Save notification preferences
    toast.success('Notification preferences updated');
  };

  const handleSaveSecurity = () => {
    // Save security settings
    toast.success('Security settings updated');
  };

  const handleSaveSystem = () => {
    // Save system settings
    toast.success('System settings updated');
  };

  const handleGenerateAPIKey = () => {
    const newKey = {
      id: Date.now().toString(),
      name: `API Key ${security.apiKeys.length + 1}`,
      key: `sk-${Math.random().toString(36).substr(2, 32)}`,
      created: new Date(),
      lastUsed: null
    };
    
    setSecurity(prev => ({
      ...prev,
      apiKeys: [...prev.apiKeys, newKey]
    }));
    
    toast.success('New API key generated');
  };

  const handleDeleteAPIKey = (keyId: string) => {
    setSecurity(prev => ({
      ...prev,
      apiKeys: prev.apiKeys.filter(key => key.id !== keyId)
    }));
    
    toast.success('API key deleted');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-slate-400 mt-1">
            Manage your account, preferences, and system configuration
          </p>
        </div>
      </motion.div>

      {/* Settings Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger value="profile" className="data-[state=active]:bg-slate-700">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-slate-700">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-slate-700">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-slate-700">
              <Settings className="h-4 w-4 mr-2" />
              System
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Picture */}
                <div className="flex items-center space-x-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={profile.avatar} />
                    <AvatarFallback className="bg-slate-700 text-slate-300 text-lg">
                      {profile.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Button variant="outline" className="border-slate-600 text-slate-300 hover:text-white">
                      <Camera className="h-4 w-4 mr-2" />
                      Change Photo
                    </Button>
                    <p className="text-xs text-slate-500">JPG, PNG up to 5MB</p>
                  </div>
                </div>

                {/* Profile Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-slate-300">Full Name</Label>
                    <Input
                      value={profile.name}
                      onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 bg-slate-700/30 border-slate-600/30 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-slate-300">Email Address</Label>
                    <Input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1 bg-slate-700/30 border-slate-600/30 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-slate-300">Phone Number</Label>
                    <Input
                      value={profile.phone}
                      onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                      className="mt-1 bg-slate-700/30 border-slate-600/30 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-slate-300">Timezone</Label>
                    <Select value={profile.timezone} onValueChange={(value) => setProfile(prev => ({ ...prev, timezone: value }))}>
                      <SelectTrigger className="mt-1 bg-slate-700/30 border-slate-600/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="Europe/London">GMT</SelectItem>
                        <SelectItem value="Europe/Paris">CET</SelectItem>
                        <SelectItem value="Asia/Tokyo">JST</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label className="text-slate-300">Bio</Label>
                  <Textarea
                    value={profile.bio}
                    onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                    className="mt-1 bg-slate-700/30 border-slate-600/30 text-white"
                    rows={3}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how and when you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-slate-300">Email Notifications</Label>
                      <p className="text-sm text-slate-500">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailNotifications: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-slate-300">Push Notifications</Label>
                      <p className="text-sm text-slate-500">Browser push notifications</p>
                    </div>
                    <Switch
                      checked={notifications.pushNotifications}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, pushNotifications: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-slate-300">Workflow Alerts</Label>
                      <p className="text-sm text-slate-500">Alerts when workflows complete or fail</p>
                    </div>
                    <Switch
                      checked={notifications.workflowAlerts}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, workflowAlerts: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-slate-300">Employee Updates</Label>
                      <p className="text-sm text-slate-500">Updates about AI employee performance</p>
                    </div>
                    <Switch
                      checked={notifications.employeeUpdates}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, employeeUpdates: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-slate-300">System Maintenance</Label>
                      <p className="text-sm text-slate-500">Scheduled maintenance notifications</p>
                    </div>
                    <Switch
                      checked={notifications.systemMaintenance}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, systemMaintenance: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-slate-300">Weekly Reports</Label>
                      <p className="text-sm text-slate-500">Weekly performance summaries</p>
                    </div>
                    <Switch
                      checked={notifications.weeklyReports}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, weeklyReports: checked }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveNotifications} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="h-4 w-4 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Security Settings */}
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Security Settings</CardTitle>
                  <CardDescription>
                    Manage your account security and authentication
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-slate-300">Two-Factor Authentication</Label>
                      <p className="text-sm text-slate-500">Add an extra layer of security</p>
                    </div>
                    <Switch
                      checked={security.twoFactorEnabled}
                      onCheckedChange={(checked) => setSecurity(prev => ({ ...prev, twoFactorEnabled: checked }))}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-slate-300">Session Timeout</Label>
                    <Select 
                      value={security.sessionTimeout} 
                      onValueChange={(value) => setSecurity(prev => ({ ...prev, sessionTimeout: value }))}
                    >
                      <SelectTrigger className="mt-1 bg-slate-700/30 border-slate-600/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="240">4 hours</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-slate-300">Password</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm text-slate-400">
                        Last changed: {security.passwordLastChanged.toLocaleDateString()}
                      </span>
                      <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
                        Change Password
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-slate-300">Active Sessions</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm text-slate-400">
                        {security.activeSessions} active sessions
                      </span>
                      <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
                        View All
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveSecurity} className="bg-blue-600 hover:bg-blue-700">
                      <Save className="h-4 w-4 mr-2" />
                      Save Security Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* API Keys */}
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">API Keys</CardTitle>
                      <CardDescription>
                        Manage API keys for external integrations
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={handleGenerateAPIKey}
                      className="bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Key
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {security.apiKeys.map((apiKey) => (
                      <div key={apiKey.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-white">{apiKey.name}</p>
                          <p className="text-sm text-slate-400 font-mono">{apiKey.key}</p>
                          <p className="text-xs text-slate-500">
                            Created: {apiKey.created.toLocaleDateString()}
                            {apiKey.lastUsed && ` • Last used: ${apiKey.lastUsed.toLocaleDateString()}`}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteAPIKey(apiKey.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* General System Settings */}
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white">General Settings</CardTitle>
                  <CardDescription>
                    Configure system behavior and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-slate-300">Theme</Label>
                    <Select 
                      value={system.theme} 
                      onValueChange={(value) => setSystem(prev => ({ ...prev, theme: value }))}
                    >
                      <SelectTrigger className="mt-1 bg-slate-700/30 border-slate-600/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="auto">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-slate-300">Auto Save</Label>
                      <p className="text-sm text-slate-500">Automatically save changes</p>
                    </div>
                    <Switch
                      checked={system.autoSave}
                      onCheckedChange={(checked) => setSystem(prev => ({ ...prev, autoSave: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-slate-300">Debug Mode</Label>
                      <p className="text-sm text-slate-500">Show detailed error information</p>
                    </div>
                    <Switch
                      checked={system.debugMode}
                      onCheckedChange={(checked) => setSystem(prev => ({ ...prev, debugMode: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-slate-300">Analytics</Label>
                      <p className="text-sm text-slate-500">Enable usage analytics</p>
                    </div>
                    <Switch
                      checked={system.analyticsEnabled}
                      onCheckedChange={(checked) => setSystem(prev => ({ ...prev, analyticsEnabled: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Advanced Settings */}
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Advanced Settings</CardTitle>
                  <CardDescription>
                    Advanced configuration options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-slate-300">Cache Size</Label>
                    <Select 
                      value={system.cacheSize} 
                      onValueChange={(value) => setSystem(prev => ({ ...prev, cacheSize: value }))}
                    >
                      <SelectTrigger className="mt-1 bg-slate-700/30 border-slate-600/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="256MB">256 MB</SelectItem>
                        <SelectItem value="512MB">512 MB</SelectItem>
                        <SelectItem value="1GB">1 GB</SelectItem>
                        <SelectItem value="2GB">2 GB</SelectItem>
                        <SelectItem value="4GB">4 GB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-slate-300">Backup Frequency</Label>
                    <Select 
                      value={system.backupFrequency} 
                      onValueChange={(value) => setSystem(prev => ({ ...prev, backupFrequency: value }))}
                    >
                      <SelectTrigger className="mt-1 bg-slate-700/30 border-slate-600/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-slate-300">Data Retention (days)</Label>
                    <Input
                      type="number"
                      value={system.retentionPeriod}
                      onChange={(e) => setSystem(prev => ({ ...prev, retentionPeriod: e.target.value }))}
                      className="mt-1 bg-slate-700/30 border-slate-600/30 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-slate-300">Max Concurrent Jobs</Label>
                    <Input
                      type="number"
                      value={system.maxConcurrentJobs}
                      onChange={(e) => setSystem(prev => ({ ...prev, maxConcurrentJobs: parseInt(e.target.value) }))}
                      className="mt-1 bg-slate-700/30 border-slate-600/30 text-white"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleSaveSystem} className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                Save System Settings
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default SettingsPage;