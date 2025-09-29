/**
 * Settings Page - Real Functional Implementation with Supabase
 * NO MOCK DATA - All data comes from and saves to Supabase
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Settings,
  User,
  Bell,
  Shield,
  Camera,
  Save,
  Trash2,
  Copy,
  Plus,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Key,
  LogOut
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/unified-auth-store';
import settingsService, { UserProfile, UserSettings, APIKey } from '@/services/settingsService';

const SettingsPage: React.FC = () => {
  const { section } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Data states
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [apiKeys, setAPIKeys] = useState<APIKey[]>([]);
  
  // UI states
  const [activeSection, setActiveSection] = useState(section || 'profile');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showAPIKeyDialog, setShowAPIKeyDialog] = useState(false);
  const [newAPIKeyName, setNewAPIKeyName] = useState('');
  const [generatedAPIKey, setGeneratedAPIKey] = useState('');
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);

  // Load all data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      
      // Load profile
      const { data: profileData, error: profileError } = await settingsService.getProfile();
      if (profileError) {
        console.error('Error loading profile:', profileError);
        toast.error('Failed to load profile');
      } else {
        setProfile(profileData);
      }

      // Load settings
      const { data: settingsData, error: settingsError } = await settingsService.getSettings();
      if (settingsError) {
        console.error('Error loading settings:', settingsError);
        toast.error('Failed to load settings');
      } else {
        setSettings(settingsData);
      }

      // Load API keys
      const { data: keysData, error: keysError } = await settingsService.getAPIKeys();
      if (keysError) {
        console.error('Error loading API keys:', keysError);
      } else {
        setAPIKeys(keysData);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Profile handlers
  const handleProfileUpdate = (field: keyof UserProfile, value: any) => {
    if (profile) {
      setProfile({ ...profile, [field]: value });
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    try {
      setIsSaving(true);
      const { error } = await settingsService.updateProfile(profile);
      
      if (error) {
        toast.error('Failed to save profile');
        console.error('Error saving profile:', error);
      } else {
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('File must be an image');
      return;
    }

    try {
      toast.loading('Uploading avatar...');
      const { data: url, error } = await settingsService.uploadAvatar(file);
      
      if (error) {
        toast.error('Failed to upload avatar');
        console.error('Error uploading avatar:', error);
      } else if (url) {
        setProfile(prev => prev ? { ...prev, avatar_url: url } : null);
        toast.success('Avatar uploaded successfully');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    }
  };

  // Settings handlers
  const handleSettingsUpdate = (field: keyof UserSettings, value: any) => {
    if (settings) {
      setSettings({ ...settings, [field]: value });
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    
    try {
      setIsSaving(true);
      const { error } = await settingsService.updateSettings(settings);
      
      if (error) {
        toast.error('Failed to save settings');
        console.error('Error saving settings:', error);
      } else {
        toast.success('Settings updated successfully');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Password handlers
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setIsSaving(true);
      const { error } = await settingsService.changePassword(newPassword);
      
      if (error) {
        toast.error('Failed to change password');
        console.error('Error changing password:', error);
      } else {
        toast.success('Password changed successfully');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  // API Key handlers
  const handleGenerateAPIKey = async () => {
    if (!newAPIKeyName.trim()) {
      toast.error('Please enter a name for the API key');
      return;
    }

    try {
      setIsSaving(true);
      const { data, error, fullKey } = await settingsService.createAPIKey(newAPIKeyName);
      
      if (error || !data) {
        toast.error('Failed to generate API key');
        console.error('Error generating API key:', error);
      } else {
        setGeneratedAPIKey(fullKey || '');
        setAPIKeys(prev => [data, ...prev]);
        toast.success('API key generated successfully');
        setNewAPIKeyName('');
      }
    } catch (error) {
      console.error('Error generating API key:', error);
      toast.error('Failed to generate API key');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAPIKey = async () => {
    if (!keyToDelete) return;

    try {
      const { error } = await settingsService.deleteAPIKey(keyToDelete);
      
      if (error) {
        toast.error('Failed to delete API key');
        console.error('Error deleting API key:', error);
      } else {
        setAPIKeys(prev => prev.filter(k => k.id !== keyToDelete));
        toast.success('API key deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error('Failed to delete API key');
    } finally {
      setKeyToDelete(null);
    }
  };

  const handleCopyAPIKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('API key copied to clipboard');
  };

  // 2FA handlers
  const handleToggle2FA = async (enabled: boolean) => {
    try {
      setIsSaving(true);
      const { error } = enabled 
        ? await settingsService.enable2FA()
        : await settingsService.disable2FA();
      
      if (error) {
        toast.error(`Failed to ${enabled ? 'enable' : 'disable'} 2FA`);
        console.error('Error toggling 2FA:', error);
      } else {
        handleSettingsUpdate('two_factor_enabled', enabled);
        toast.success(`2FA ${enabled ? 'enabled' : 'disabled'} successfully`);
      }
    } catch (error) {
      console.error('Error toggling 2FA:', error);
      toast.error(`Failed to ${enabled ? 'enable' : 'disable'} 2FA`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <span className="text-slate-400">Loading settings...</span>
        </div>
      </div>
    );
  }

  if (!profile || !settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">Failed to load settings</p>
          <Button onClick={loadAllData} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
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
        <Badge variant="outline" className="border-green-500/50 text-green-400">
          <CheckCircle className="h-3 w-3 mr-1" />
          Real Data
        </Badge>
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
                {/* Avatar */}
                <div className="flex items-center space-x-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="bg-slate-700 text-slate-300 text-lg">
                      {profile.name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                    <Button 
                      variant="outline" 
                      className="border-slate-600 text-slate-300 hover:text-white"
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                    >
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
                      value={profile.name || ''}
                      onChange={(e) => handleProfileUpdate('name', e.target.value)}
                      className="mt-1 bg-slate-700/30 border-slate-600/30 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-slate-300">Email Address</Label>
                    <Input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="mt-1 bg-slate-700/30 border-slate-600/30 text-slate-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                  </div>
                  
                  <div>
                    <Label className="text-slate-300">Phone Number</Label>
                    <Input
                      value={profile.phone || ''}
                      onChange={(e) => handleProfileUpdate('phone', e.target.value)}
                      className="mt-1 bg-slate-700/30 border-slate-600/30 text-white"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-slate-300">Timezone</Label>
                    <Select 
                      value={profile.timezone} 
                      onValueChange={(value) => handleProfileUpdate('timezone', value)}
                    >
                      <SelectTrigger className="mt-1 bg-slate-700/30 border-slate-600/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                        <SelectItem value="Europe/London">GMT</SelectItem>
                        <SelectItem value="Europe/Paris">CET</SelectItem>
                        <SelectItem value="Asia/Tokyo">JST</SelectItem>
                        <SelectItem value="Asia/Shanghai">CST</SelectItem>
                        <SelectItem value="Australia/Sydney">AEST</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-slate-300">Language</Label>
                    <Select 
                      value={profile.language} 
                      onValueChange={(value) => handleProfileUpdate('language', value)}
                    >
                      <SelectTrigger className="mt-1 bg-slate-700/30 border-slate-600/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="zh">中文</SelectItem>
                        <SelectItem value="ja">日本語</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label className="text-slate-300">Bio</Label>
                  <Textarea
                    value={profile.bio || ''}
                    onChange={(e) => handleProfileUpdate('bio', e.target.value)}
                    className="mt-1 bg-slate-700/30 border-slate-600/30 text-white"
                    rows={3}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Profile
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
                  {[
                    { key: 'email_notifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                    { key: 'push_notifications', label: 'Push Notifications', desc: 'Browser push notifications' },
                    { key: 'workflow_alerts', label: 'Workflow Alerts', desc: 'Alerts when workflows complete or fail' },
                    { key: 'employee_updates', label: 'Employee Updates', desc: 'Updates about AI employee performance' },
                    { key: 'system_maintenance', label: 'System Maintenance', desc: 'Scheduled maintenance notifications' },
                    { key: 'marketing_emails', label: 'Marketing Emails', desc: 'Product updates and offers' },
                    { key: 'weekly_reports', label: 'Weekly Reports', desc: 'Weekly performance summaries' },
                    { key: 'instant_alerts', label: 'Instant Alerts', desc: 'Real-time critical alerts' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <Label className="text-slate-300">{label}</Label>
                        <p className="text-sm text-slate-500">{desc}</p>
                      </div>
                      <Switch
                        checked={settings[key as keyof UserSettings] as boolean}
                        onCheckedChange={(checked) => handleSettingsUpdate(key as keyof UserSettings, checked)}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveSettings} 
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
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
                      checked={settings.two_factor_enabled}
                      onCheckedChange={handleToggle2FA}
                      disabled={isSaving}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-slate-300">Session Timeout</Label>
                    <Select 
                      value={settings.session_timeout.toString()} 
                      onValueChange={(value) => handleSettingsUpdate('session_timeout', parseInt(value))}
                    >
                      <SelectTrigger className="mt-1 bg-slate-700/30 border-slate-600/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="240">4 hours</SelectItem>
                        <SelectItem value="1440">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Change Password */}
                  <div className="space-y-4 border-t border-slate-700 pt-4">
                    <Label className="text-slate-300">Change Password</Label>
                    
                    <div>
                      <Label className="text-slate-400 text-sm">New Password</Label>
                      <div className="relative mt-1">
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="bg-slate-700/30 border-slate-600/30 text-white pr-10"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-slate-400 text-sm">Confirm Password</Label>
                      <div className="relative mt-1">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="bg-slate-700/30 border-slate-600/30 text-white pr-10"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleChangePassword}
                      disabled={isSaving || !newPassword || !confirmPassword}
                      variant="outline"
                      className="w-full border-slate-600"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Key className="h-4 w-4 mr-2" />
                      )}
                      Change Password
                    </Button>
                  </div>

                  <div className="flex justify-end border-t border-slate-700 pt-4">
                    <Button 
                      onClick={handleSaveSettings} 
                      disabled={isSaving}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
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
                      onClick={() => setShowAPIKeyDialog(true)}
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
                    {apiKeys.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <Key className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No API keys yet</p>
                        <p className="text-sm">Generate your first API key to get started</p>
                      </div>
                    ) : (
                      apiKeys.map((apiKey) => (
                        <div key={apiKey.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{apiKey.name}</p>
                            <p className="text-sm text-slate-400 font-mono">{apiKey.key_prefix}...</p>
                            <p className="text-xs text-slate-500">
                              Created: {new Date(apiKey.created_at).toLocaleDateString()}
                              {apiKey.last_used_at && ` • Last used: ${new Date(apiKey.last_used_at).toLocaleDateString()}`}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-slate-400 hover:text-white"
                              onClick={() => handleCopyAPIKey(apiKey.key_prefix)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setKeyToDelete(apiKey.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
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
                      value={settings.theme} 
                      onValueChange={(value: 'dark' | 'light' | 'auto') => handleSettingsUpdate('theme', value)}
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
                  
                  {[
                    { key: 'auto_save', label: 'Auto Save', desc: 'Automatically save changes' },
                    { key: 'debug_mode', label: 'Debug Mode', desc: 'Show detailed error information' },
                    { key: 'analytics_enabled', label: 'Analytics', desc: 'Enable usage analytics' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <Label className="text-slate-300">{label}</Label>
                        <p className="text-sm text-slate-500">{desc}</p>
                      </div>
                      <Switch
                        checked={settings[key as keyof UserSettings] as boolean}
                        onCheckedChange={(checked) => handleSettingsUpdate(key as keyof UserSettings, checked)}
                      />
                    </div>
                  ))}
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
                      value={settings.cache_size} 
                      onValueChange={(value) => handleSettingsUpdate('cache_size', value)}
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
                      value={settings.backup_frequency} 
                      onValueChange={(value) => handleSettingsUpdate('backup_frequency', value)}
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
                      value={settings.retention_period}
                      onChange={(e) => handleSettingsUpdate('retention_period', parseInt(e.target.value) || 30)}
                      className="mt-1 bg-slate-700/30 border-slate-600/30 text-white"
                      min={1}
                      max={365}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-slate-300">Max Concurrent Jobs</Label>
                    <Input
                      type="number"
                      value={settings.max_concurrent_jobs}
                      onChange={(e) => handleSettingsUpdate('max_concurrent_jobs', parseInt(e.target.value) || 10)}
                      className="mt-1 bg-slate-700/30 border-slate-600/30 text-white"
                      min={1}
                      max={100}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={handleSaveSettings} 
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save System Settings
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* API Key Generation Dialog */}
      <AlertDialog open={showAPIKeyDialog} onOpenChange={setShowAPIKeyDialog}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {generatedAPIKey ? 'API Key Generated' : 'Generate New API Key'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {generatedAPIKey ? (
                <div className="space-y-4">
                  <p className="text-yellow-400">
                    <AlertTriangle className="h-4 w-4 inline mr-2" />
                    Save this key now. You won't be able to see it again!
                  </p>
                  <div className="bg-slate-900 p-3 rounded font-mono text-sm text-green-400 break-all">
                    {generatedAPIKey}
                  </div>
                  <Button 
                    onClick={() => handleCopyAPIKey(generatedAPIKey)}
                    className="w-full"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy to Clipboard
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 pt-4">
                  <div>
                    <Label className="text-slate-300">Key Name</Label>
                    <Input
                      value={newAPIKeyName}
                      onChange={(e) => setNewAPIKeyName(e.target.value)}
                      placeholder="e.g., Production API"
                      className="mt-1 bg-slate-700/30 border-slate-600/30 text-white"
                    />
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {generatedAPIKey ? (
              <AlertDialogAction 
                onClick={() => {
                  setShowAPIKeyDialog(false);
                  setGeneratedAPIKey('');
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Done
              </AlertDialogAction>
            ) : (
              <>
                <AlertDialogCancel className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleGenerateAPIKey}
                  disabled={isSaving || !newAPIKeyName.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Key className="h-4 w-4 mr-2" />
                  )}
                  Generate Key
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete API Key Confirmation */}
      <AlertDialog open={!!keyToDelete} onOpenChange={() => setKeyToDelete(null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete API Key</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete this API key? This action cannot be undone.
              Any applications using this key will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAPIKey}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SettingsPage;
