/**
 * Settings Page - Real Functional Implementation with Supabase
 * NO MOCK DATA - All data comes from and saves to Supabase
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Switch } from '@shared/ui/switch';
import { Textarea } from '@shared/ui/textarea';
import { Badge } from '@shared/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@shared/ui/alert-dialog';
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
  LogOut,
  Bot,
  Play,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@shared/stores/authentication-store';
import { useAgentMetricsStore } from '@shared/stores/employee-metrics-store';
import { backgroundChatService } from '@features/mission-control/services/background-conversation-handler';
import settingsService, {
  UserProfile,
  UserSettings,
  APIKey,
} from '@features/settings/services/user-preferences';
import { InteractiveHoverCard } from '@shared/ui/interactive-hover-card';
import { Particles } from '@shared/ui/particles';

const SettingsPage: React.FC = () => {
  const { section } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const metricsStore = useAgentMetricsStore();

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

  // Update active section when URL changes
  useEffect(() => {
    if (section && section !== activeSection) {
      setActiveSection(section);
    }
  }, [section, activeSection]);

  const loadAllData = async () => {
    try {
      setIsLoading(true);

      // Load profile
      const { data: profileData, error: profileError } =
        await settingsService.getProfile();
      if (profileError) {
        console.error('Error loading profile:', profileError);
        toast.error('Failed to load profile');
      } else {
        setProfile(profileData);
      }

      // Load settings
      const { data: settingsData, error: settingsError } =
        await settingsService.getSettings();
      if (settingsError) {
        console.error('Error loading settings:', settingsError);
        toast.error('Failed to load settings');
      } else {
        setSettings(settingsData);
      }

      // Load API keys
      const { data: keysData, error: keysError } =
        await settingsService.getAPIKeys();
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
  const handleProfileUpdate = (
    field: keyof UserProfile,
    value: string | number | boolean
  ) => {
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

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
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
        setProfile((prev) => (prev ? { ...prev, avatar_url: url } : null));
        toast.success('Avatar uploaded successfully');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    }
  };

  // Settings handlers
  const handleSettingsUpdate = (
    field: keyof UserSettings,
    value: string | number | boolean
  ) => {
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
      const { data, error, fullKey } =
        await settingsService.createAPIKey(newAPIKeyName);

      if (error || !data) {
        toast.error('Failed to generate API key');
        console.error('Error generating API key:', error);
      } else {
        setGeneratedAPIKey(fullKey || '');
        setAPIKeys((prev) => [data, ...prev]);
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
        setAPIKeys((prev) => prev.filter((k) => k.id !== keyToDelete));
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <span className="text-muted-foreground">Loading settings...</span>
        </div>
      </div>
    );
  }

  if (!profile || !settings) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
          <p className="mb-4 text-muted-foreground">Failed to load settings</p>
          <Button onClick={loadAllData} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen space-y-6 p-6">
      {/* Subtle Background Particles */}
      <Particles
        className="pointer-events-none absolute inset-0 opacity-20"
        quantity={30}
        ease={80}
        staticity={50}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your account, preferences, and system configuration
          </p>
        </div>
        <Badge variant="outline" className="border-green-500/50 text-green-400">
          <CheckCircle className="mr-1 h-3 w-3" />
          Real Data
        </Badge>
      </motion.div>

      {/* Settings Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <Tabs
          value={activeSection}
          onValueChange={(value) => {
            setActiveSection(value);
            navigate(`/settings/${value}`, { replace: true });
          }}
          className="space-y-6"
        >
          {/* Glassmorphism Tabs with enhanced styling */}
          <TabsList className="border border-border/50 bg-card/50 p-1 shadow-lg backdrop-blur-xl">
            <TabsTrigger
              value="profile"
              className="transition-all duration-300 hover:bg-accent/40 data-[state=active]:bg-accent/80 data-[state=active]:backdrop-blur-sm"
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="transition-all duration-300 hover:bg-accent/40 data-[state=active]:bg-accent/80 data-[state=active]:backdrop-blur-sm"
            >
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="transition-all duration-300 hover:bg-accent/40 data-[state=active]:bg-accent/80 data-[state=active]:backdrop-blur-sm"
            >
              <Shield className="mr-2 h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger
              value="system"
              className="transition-all duration-300 hover:bg-accent/40 data-[state=active]:bg-accent/80 data-[state=active]:backdrop-blur-sm"
            >
              <Settings className="mr-2 h-4 w-4" />
              System
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6">
            {!profile ? (
              <Card className="border-border bg-card">
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">Loading profile...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground">
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal information and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar with 3D Hover Effect */}
                  <div className="flex items-center space-x-4">
                    <InteractiveHoverCard>
                      <Avatar className="h-20 w-20 ring-2 ring-primary/20 transition-all duration-300 hover:ring-primary/40">
                        <AvatarImage src={profile?.avatar_url} />
                        <AvatarFallback className="bg-accent text-lg text-foreground">
                          {profile?.name
                            ?.split(' ')
                            .map((n) => n[0])
                            .join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </InteractiveHoverCard>
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
                        className="border-border text-foreground transition-transform duration-200 hover:scale-105 hover:text-foreground"
                        onClick={() =>
                          document.getElementById('avatar-upload')?.click()
                        }
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Change Photo
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG up to 5MB
                      </p>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <Label className="text-foreground">Full Name</Label>
                      <Input
                        value={profile?.name || ''}
                        onChange={(e) =>
                          handleProfileUpdate('name', e.target.value)
                        }
                        className="mt-1 border-border bg-background text-foreground"
                      />
                    </div>

                    <div>
                      <Label className="text-foreground">Email Address</Label>
                      <Input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="mt-1 cursor-not-allowed border-border bg-muted text-muted-foreground"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Email cannot be changed
                      </p>
                    </div>

                    <div>
                      <Label className="text-foreground">Phone Number</Label>
                      <Input
                        value={profile?.phone || ''}
                        onChange={(e) =>
                          handleProfileUpdate('phone', e.target.value)
                        }
                        className="mt-1 border-border bg-background text-foreground"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>

                    <div>
                      <Label className="text-foreground">Timezone</Label>
                      <Select
                        value={profile?.timezone || 'America/New_York'}
                        onValueChange={(value) =>
                          handleProfileUpdate('timezone', value)
                        }
                      >
                        <SelectTrigger className="mt-1 border-border bg-background text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-border bg-popover">
                          <SelectItem value="America/New_York">
                            Eastern Time (ET)
                          </SelectItem>
                          <SelectItem value="America/Chicago">
                            Central Time (CT)
                          </SelectItem>
                          <SelectItem value="America/Denver">
                            Mountain Time (MT)
                          </SelectItem>
                          <SelectItem value="America/Los_Angeles">
                            Pacific Time (PT)
                          </SelectItem>
                          <SelectItem value="Europe/London">GMT</SelectItem>
                          <SelectItem value="Europe/Paris">CET</SelectItem>
                          <SelectItem value="Asia/Tokyo">JST</SelectItem>
                          <SelectItem value="Asia/Shanghai">CST</SelectItem>
                          <SelectItem value="Australia/Sydney">AEST</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-foreground">Language</Label>
                      <Select
                        value={profile?.language || 'en'}
                        onValueChange={(value) =>
                          handleProfileUpdate('language', value)
                        }
                      >
                        <SelectTrigger className="mt-1 border-border bg-background text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-border bg-popover">
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
                    <Label className="text-foreground">Bio</Label>
                    <Textarea
                      value={profile?.bio || ''}
                      onChange={(e) =>
                        handleProfileUpdate('bio', e.target.value)
                      }
                      className="mt-1 border-border bg-background text-foreground"
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
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose how and when you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {[
                    {
                      key: 'email_notifications',
                      label: 'Email Notifications',
                      desc: 'Receive notifications via email',
                    },
                    {
                      key: 'push_notifications',
                      label: 'Push Notifications',
                      desc: 'Browser push notifications',
                    },
                    {
                      key: 'workflow_alerts',
                      label: 'Workflow Alerts',
                      desc: 'Alerts when workflows complete or fail',
                    },
                    {
                      key: 'employee_updates',
                      label: 'Employee Updates',
                      desc: 'Updates about AI employee performance',
                    },
                    {
                      key: 'system_maintenance',
                      label: 'System Maintenance',
                      desc: 'Scheduled maintenance notifications',
                    },
                    {
                      key: 'marketing_emails',
                      label: 'Marketing Emails',
                      desc: 'Product updates and offers',
                    },
                    {
                      key: 'weekly_reports',
                      label: 'Weekly Reports',
                      desc: 'Weekly performance summaries',
                    },
                    {
                      key: 'instant_alerts',
                      label: 'Instant Alerts',
                      desc: 'Real-time critical alerts',
                    },
                  ].map(({ key, label, desc }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <Label className="text-foreground">{label}</Label>
                        <p className="text-sm text-muted-foreground">{desc}</p>
                      </div>
                      <Switch
                        checked={settings[key as keyof UserSettings] as boolean}
                        onCheckedChange={(checked) =>
                          handleSettingsUpdate(
                            key as keyof UserSettings,
                            checked
                          )
                        }
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
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Security Settings */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground">
                    Security Settings
                  </CardTitle>
                  <CardDescription>
                    Manage your account security and authentication
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-foreground">
                        Two-Factor Authentication
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security
                      </p>
                    </div>
                    <Switch
                      checked={settings.two_factor_enabled || false}
                      onCheckedChange={handleToggle2FA}
                      disabled={isSaving}
                    />
                  </div>

                  <div>
                    <Label className="text-foreground">Session Timeout</Label>
                    <Select
                      value={settings.session_timeout?.toString() || '60'}
                      onValueChange={(value) =>
                        handleSettingsUpdate('session_timeout', parseInt(value))
                      }
                    >
                      <SelectTrigger className="mt-1 border-border bg-background text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-popover">
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="240">4 hours</SelectItem>
                        <SelectItem value="1440">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Change Password */}
                  <div className="space-y-4 border-t border-border pt-4">
                    <Label className="text-foreground">Change Password</Label>

                    <div>
                      <Label className="text-sm text-muted-foreground">
                        New Password
                      </Label>
                      <div className="relative mt-1">
                        <Input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="border-border bg-background pr-10 text-foreground"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm text-muted-foreground">
                        Confirm Password
                      </Label>
                      <div className="relative mt-1">
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="border-border bg-background pr-10 text-foreground"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <Button
                      onClick={handleChangePassword}
                      disabled={isSaving || !newPassword || !confirmPassword}
                      variant="outline"
                      className="w-full border-border"
                    >
                      {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Key className="mr-2 h-4 w-4" />
                      )}
                      Change Password
                    </Button>
                  </div>

                  <div className="flex justify-end border-t border-border pt-4">
                    <Button
                      onClick={handleSaveSettings}
                      disabled={isSaving}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save Security Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* API Keys */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-foreground">
                        API Keys
                      </CardTitle>
                      <CardDescription>
                        Manage API keys for external integrations
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => setShowAPIKeyDialog(true)}
                      className="bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      New Key
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {apiKeys.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">
                        <Key className="mx-auto mb-2 h-12 w-12 opacity-50" />
                        <p>No API keys yet</p>
                        <p className="text-sm">
                          Generate your first API key to get started
                        </p>
                      </div>
                    ) : (
                      apiKeys.map((apiKey) => (
                        <div
                          key={apiKey.id}
                          className="flex items-center justify-between rounded-lg border border-border bg-accent/50 p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-foreground">
                              {apiKey.name}
                            </p>
                            <p className="font-mono text-sm text-muted-foreground">
                              {apiKey.key_prefix}...
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Created:{' '}
                              {new Date(apiKey.created_at).toLocaleDateString()}
                              {apiKey.last_used_at &&
                                ` • Last used: ${new Date(apiKey.last_used_at).toLocaleDateString()}`}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() =>
                                handleCopyAPIKey(apiKey.key_prefix)
                              }
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
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* General System Settings */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground">
                    General Settings
                  </CardTitle>
                  <CardDescription>
                    Configure system behavior and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-foreground">Theme</Label>
                    <Select
                      value={settings.theme || 'dark'}
                      onValueChange={(value: 'dark' | 'light' | 'auto') =>
                        handleSettingsUpdate('theme', value)
                      }
                    >
                      <SelectTrigger className="mt-1 border-border bg-background text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-popover">
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="auto">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {[
                    {
                      key: 'auto_save',
                      label: 'Auto Save',
                      desc: 'Automatically save changes',
                    },
                    {
                      key: 'debug_mode',
                      label: 'Debug Mode',
                      desc: 'Show detailed error information',
                    },
                    {
                      key: 'analytics_enabled',
                      label: 'Analytics',
                      desc: 'Enable usage analytics',
                    },
                  ].map(({ key, label, desc }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <Label className="text-foreground">{label}</Label>
                        <p className="text-sm text-muted-foreground">{desc}</p>
                      </div>
                      <Switch
                        checked={settings[key as keyof UserSettings] as boolean}
                        onCheckedChange={(checked) =>
                          handleSettingsUpdate(
                            key as keyof UserSettings,
                            checked
                          )
                        }
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Advanced Settings */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground">
                    Advanced Settings
                  </CardTitle>
                  <CardDescription>
                    Advanced configuration options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-foreground">Cache Size</Label>
                    <Select
                      value={settings.cache_size || '1GB'}
                      onValueChange={(value) =>
                        handleSettingsUpdate('cache_size', value)
                      }
                    >
                      <SelectTrigger className="mt-1 border-border bg-background text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-popover">
                        <SelectItem value="256MB">256 MB</SelectItem>
                        <SelectItem value="512MB">512 MB</SelectItem>
                        <SelectItem value="1GB">1 GB</SelectItem>
                        <SelectItem value="2GB">2 GB</SelectItem>
                        <SelectItem value="4GB">4 GB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-foreground">Backup Frequency</Label>
                    <Select
                      value={settings.backup_frequency || 'daily'}
                      onValueChange={(value) =>
                        handleSettingsUpdate('backup_frequency', value)
                      }
                    >
                      <SelectTrigger className="mt-1 border-border bg-background text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-popover">
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-foreground">
                      Data Retention (days)
                    </Label>
                    <Input
                      type="number"
                      value={settings.retention_period || 30}
                      onChange={(e) =>
                        handleSettingsUpdate(
                          'retention_period',
                          parseInt(e.target.value) || 30
                        )
                      }
                      className="mt-1 border-border bg-background text-foreground"
                      min={1}
                      max={365}
                    />
                  </div>

                  <div>
                    <Label className="text-foreground">
                      Max Concurrent Jobs
                    </Label>
                    <Input
                      type="number"
                      value={settings.max_concurrent_jobs || 10}
                      onChange={(e) =>
                        handleSettingsUpdate(
                          'max_concurrent_jobs',
                          parseInt(e.target.value) || 10
                        )
                      }
                      className="mt-1 border-border bg-background text-foreground"
                      min={1}
                      max={100}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Agent & Metrics Settings */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Bot className="h-5 w-5 text-primary" />
                  Agent & Metrics
                </CardTitle>
                <CardDescription>
                  Manage background services and metrics tracking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Background Service Status */}
                <div className="rounded-lg border border-border/50 bg-accent/20 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'h-2 w-2 rounded-full',
                          metricsStore.isBackgroundServiceRunning
                            ? 'animate-pulse bg-green-500'
                            : 'bg-gray-500'
                        )}
                      />
                      <span className="font-medium">Background Service</span>
                    </div>
                    <Badge
                      variant={
                        metricsStore.isBackgroundServiceRunning
                          ? 'default'
                          : 'outline'
                      }
                    >
                      {metricsStore.isBackgroundServiceRunning
                        ? 'Running'
                        : 'Stopped'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enables agents to continue working when you navigate away
                  </p>
                </div>

                {/* Metrics Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
                    <p className="text-xs text-muted-foreground">
                      Active Agents
                    </p>
                    <p className="text-2xl font-bold text-blue-400">
                      {metricsStore.activeAgents}
                    </p>
                  </div>
                  <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-3">
                    <p className="text-xs text-muted-foreground">
                      Completed Tasks
                    </p>
                    <p className="text-2xl font-bold text-green-400">
                      {metricsStore.completedTasks}
                    </p>
                  </div>
                  <div className="rounded-lg border border-purple-500/20 bg-purple-500/10 p-3">
                    <p className="text-xs text-muted-foreground">
                      Total Tokens
                    </p>
                    <p className="text-2xl font-bold text-purple-400">
                      {metricsStore.totalTokensUsed.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 p-3">
                    <p className="text-xs text-muted-foreground">
                      Success Rate
                    </p>
                    <p className="text-2xl font-bold text-orange-400">
                      {metricsStore.getSuccessRate().toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      metricsStore.reset();
                      toast.success('Metrics reset successfully');
                    }}
                    className="flex-1"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Reset Metrics
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (metricsStore.isBackgroundServiceRunning) {
                        backgroundChatService.stop();
                        toast.info('Background service stopped');
                      } else {
                        backgroundChatService.start();
                        toast.success('Background service started');
                      }
                    }}
                    className="flex-1"
                  >
                    {metricsStore.isBackgroundServiceRunning ? (
                      <>
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Stop Service
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Start Service
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save System Settings
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* API Key Generation Dialog */}
      <AlertDialog open={showAPIKeyDialog} onOpenChange={setShowAPIKeyDialog}>
        <AlertDialogContent className="border-border bg-popover">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              {generatedAPIKey ? 'API Key Generated' : 'Generate New API Key'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {generatedAPIKey ? (
                <div className="space-y-4">
                  <p className="text-yellow-400">
                    <AlertTriangle className="mr-2 inline h-4 w-4" />
                    Save this key now. You won't be able to see it again!
                  </p>
                  <div className="break-all rounded border border-border bg-background/50 p-3 font-mono text-sm text-green-400">
                    {generatedAPIKey}
                  </div>
                  <Button
                    onClick={() => handleCopyAPIKey(generatedAPIKey)}
                    className="w-full"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy to Clipboard
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 pt-4">
                  <div>
                    <Label className="text-foreground">Key Name</Label>
                    <Input
                      value={newAPIKeyName}
                      onChange={(e) => setNewAPIKeyName(e.target.value)}
                      placeholder="e.g., Production API"
                      className="mt-1 border-border bg-background text-foreground"
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
                <AlertDialogCancel className="border-border bg-secondary text-foreground hover:bg-secondary/80">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleGenerateAPIKey}
                  disabled={isSaving || !newAPIKeyName.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Key className="mr-2 h-4 w-4" />
                  )}
                  Generate Key
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete API Key Confirmation */}
      <AlertDialog
        open={!!keyToDelete}
        onOpenChange={() => setKeyToDelete(null)}
      >
        <AlertDialogContent className="border-border bg-popover">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Delete API Key
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this API key? This action cannot
              be undone. Any applications using this key will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border bg-secondary text-foreground hover:bg-secondary/80">
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
