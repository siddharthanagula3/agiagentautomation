import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { 
  Settings, 
  Palette, 
  Globe, 
  Bell, 
  Shield, 
  Database, 
  Zap, 
  Lock,
  Loader2,
  Save,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react';
import { useAuth } from '../../contexts/auth-hooks';

const SettingsPage: React.FC = () => {
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
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    general: {
      theme: 'system',
      language: 'en',
      timezone: 'UTC',
      currency: 'USD',
      autoSave: true,
      notifications: true
    },
    notifications: {
      jobUpdates: true,
      newEmployees: true,
      systemAlerts: true
    },
    emailNotifications: {
      jobCompleted: true,
      billingAlerts: true,
      securityAlerts: true
    },
    security: {
      twoFactorAuth: false,
      loginAlerts: true,
      sessionTimeout: 30
    }
  });

  const [apiKeys, setApiKeys] = useState([
    {
      id: '1',
      name: 'Production API Key',
      key: 'sk-prod-...',
      permissions: ['read', 'write'],
      lastUsed: '2 hours ago',
      created: '2024-01-15'
    },
    {
      id: '2',
      name: 'Development API Key',
      key: 'sk-dev-...',
      permissions: ['read'],
      lastUsed: '1 day ago',
      created: '2024-01-10'
    }
  ]);

  const [webhooks, setWebhooks] = useState([
    {
      id: '1',
      url: 'https://api.example.com/webhook',
      events: ['job.completed', 'job.failed'],
      status: 'active',
      lastTriggered: '1 hour ago'
    }
  ]);

  const handleSettingChange = (category: string, key: string, value: unknown) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      // Here you would save settings to the backend
       // Simulate API call
      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateApiKey = () => {
    const newKey = {
      id: Date.now().toString(),
      name: 'New API Key',
      key: 'sk-new-' + Math.random().toString(36).substr(2, 9),
      permissions: ['read'],
      lastUsed: 'Never',
      created: new Date().toISOString().split('T')[0]
    };
    setApiKeys(prev => [...prev, newKey]);
  };

  const handleDeleteApiKey = (id: string) => {
    setApiKeys(prev => prev.filter(key => key.id !== id));
  };

  const handleCreateWebhook = () => {
    const newWebhook = {
      id: Date.now().toString(),
      url: 'https://api.example.com/webhook',
      events: ['job.completed'],
      status: 'active',
      lastTriggered: 'Never'
    };
    setWebhooks(prev => [...prev, newWebhook]);
  };

  const handleDeleteWebhook = (id: string) => {
    setWebhooks(prev => prev.filter(webhook => webhook.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading settings...</span>
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
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings, preferences, and integrations.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSaveSettings} disabled={saving}>
            {saving ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </div>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Basic application preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="theme">Theme</Label>
              <select
                value={settings.general.theme}
                onChange={(e) => handleSettingChange('general', 'theme', e.target.value)}
                className="w-full mt-2 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>

            <div>
              <Label htmlFor="language">Language</Label>
              <select
                value={settings.general.language}
                onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
                className="w-full mt-2 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>

            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <select
                value={settings.general.timezone}
                onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                className="w-full mt-2 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>

            <div>
              <Label htmlFor="currency">Currency</Label>
              <select
                value={settings.general.currency}
                onChange={(e) => handleSettingChange('general', 'currency', e.target.value)}
                className="w-full mt-2 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD (C$)</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-save</Label>
                <p className="text-sm text-muted-foreground">Automatically save changes</p>
              </div>
              <input
                type="checkbox"
                checked={settings.general.autoSave}
                onChange={(e) => handleSettingChange('general', 'autoSave', e.target.checked)}
                className="h-4 w-4 text-primary rounded focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Notifications</Label>
                <p className="text-sm text-muted-foreground">Show browser notifications</p>
              </div>
              <input
                type="checkbox"
                checked={settings.general.notifications}
                onChange={(e) => handleSettingChange('general', 'notifications', e.target.checked)}
                className="h-4 w-4 text-primary rounded focus:ring-primary"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>Configure how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium mb-4">Job Notifications</h4>
              <div className="space-y-4">
                {Object.entries(settings.notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">
                        {key === 'jobUpdates' && 'Job Updates'}
                        {key === 'newEmployees' && 'New Employees'}
                        {key === 'systemAlerts' && 'System Alerts'}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {key === 'jobUpdates' && 'Get notified when jobs are updated'}
                        {key === 'newEmployees' && 'Alert when new AI employees are available'}
                        {key === 'systemAlerts' && 'Receive critical system alerts'}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={value as boolean}
                      onChange={(e) => handleSettingChange('notifications', key, e.target.checked)}
                      className="h-4 w-4 text-primary rounded focus:ring-primary"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-4">Email Notifications</h4>
              <div className="space-y-4">
                {Object.entries(settings.emailNotifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">
                        {key === 'jobCompleted' && 'Job Completed'}
                        {key === 'billingAlerts' && 'Billing Alerts'}
                        {key === 'securityAlerts' && 'Security Alerts'}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {key === 'jobCompleted' && 'Notify when jobs are completed'}
                        {key === 'billingAlerts' && 'Receive alerts for billing and payments'}
                        {key === 'securityAlerts' && 'Get notified of security-related events'}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={value as boolean}
                      onChange={(e) => handleSettingChange('emailNotifications', key, e.target.checked)}
                      className="h-4 w-4 text-primary rounded focus:ring-primary"
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
              </div>
              <input
                type="checkbox"
                checked={settings.security.twoFactorAuth}
                onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
                className="h-4 w-4 text-primary rounded focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Login Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified of new sign-ins</p>
              </div>
              <input
                type="checkbox"
                checked={settings.security.loginAlerts}
                onChange={(e) => handleSettingChange('security', 'loginAlerts', e.target.checked)}
                className="h-4 w-4 text-primary rounded focus:ring-primary"
              />
            </div>

            <div>
              <Label>Session Timeout</Label>
              <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
              <select
                value={settings.security.sessionTimeout}
                onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                className="w-full mt-2 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
              </select>
            </div>

            <Button variant="outline" className="text-destructive hover:text-destructive/80">
              <Lock className="mr-2 h-4 w-4" />
              Delete Account
            </Button>
          </CardContent>
        </Card>

        {/* API Keys */}
        <Card>
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>Manage your API keys for integrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <div key={key.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{key.name}</p>
                    <p className="text-sm text-muted-foreground">{key.key}</p>
                    <p className="text-xs text-muted-foreground">Last used: {key.lastUsed}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline">
                      <Zap className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive/80" onClick={() => handleDeleteApiKey(key.id)}>
                      <Lock className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={handleCreateApiKey} className="w-full">
                <Zap className="mr-2 h-4 w-4" />
                Create New API Key
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Webhooks */}
        <Card>
          <CardHeader>
            <CardTitle>Webhooks</CardTitle>
            <CardDescription>Configure webhook endpoints for real-time updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{webhook.url}</p>
                    <p className="text-sm text-muted-foreground">Events: {webhook.events.join(', ')}</p>
                    <p className="text-xs text-muted-foreground">Last triggered: {webhook.lastTriggered}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive/80" onClick={() => handleDeleteWebhook(webhook.id)}>
                      <Lock className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={handleCreateWebhook} className="w-full">
                <Zap className="mr-2 h-4 w-4" />
                Add Webhook
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card>
          <CardHeader>
            <CardTitle>Data & Privacy</CardTitle>
            <CardDescription>Manage your data and privacy settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Data Export</Label>
                <p className="text-sm text-muted-foreground">Download your data</p>
              </div>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Data Import</Label>
                <p className="text-sm text-muted-foreground">Import data from other sources</p>
              </div>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import Data
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Delete All Data</Label>
                <p className="text-sm text-muted-foreground">Permanently delete all your data</p>
              </div>
              <Button variant="outline" className="text-destructive hover:text-destructive/80">
                <Database className="mr-2 h-4 w-4" />
                Delete All Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;