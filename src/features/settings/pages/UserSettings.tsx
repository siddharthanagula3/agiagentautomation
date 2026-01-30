/**
 * Settings Page - Real Functional Implementation with Supabase
 * NO MOCK DATA - All data comes from and saves to Supabase
 * Uses React Query for server state management
 * Form validation powered by react-hook-form + Zod with XSS sanitization
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui/tabs';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@shared/ui/form';
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
  Bot,
  Play,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@shared/lib/utils';
import { useAuthStore } from '@shared/stores/authentication-store';
import { useAgentMetricsStore } from '@shared/stores/agent-metrics-store';
import { backgroundChatService } from '@features/mission-control/services/background-conversation-handler';
import {
  useAllSettingsData,
  useUpdateProfile,
  useUpdateSettings,
  useUploadAvatar,
  useChangePassword,
  useCreateAPIKey,
  useDeleteAPIKey,
  useToggle2FA,
  type CreateAPIKeyResult,
} from '@features/settings/hooks/use-settings-queries';
import type {
  UserProfile,
  UserSettings,
  APIKey,
} from '@features/settings/services/user-preferences';
import { InteractiveHoverCard } from '@shared/ui/interactive-hover-card';
import { Particles } from '@shared/ui/particles';
import {
  profileSettingsSchema,
  changePasswordSchema,
  notificationPreferencesSchema,
  securitySettingsSchema,
  systemSettingsSchema,
  createApiKeySchema,
  type ProfileSettingsFormData,
  type ChangePasswordFormData,
  type NotificationPreferencesFormData,
  type SecuritySettingsFormData,
  type SystemSettingsFormData,
  type CreateApiKeyFormData,
} from '@features/settings/schemas/settings-validation';

const SettingsPageContent: React.FC = () => {
  const { section } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const metricsStore = useAgentMetricsStore();

  // React Query hooks for server state
  const {
    profile: serverProfile,
    settings: serverSettings,
    apiKeys,
    isLoading,
    isError,
    refetch,
  } = useAllSettingsData();

  // Mutations
  const updateProfileMutation = useUpdateProfile();
  const updateSettingsMutation = useUpdateSettings();
  const uploadAvatarMutation = useUploadAvatar();
  const changePasswordMutation = useChangePassword();
  const createAPIKeyMutation = useCreateAPIKey();
  const deleteAPIKeyMutation = useDeleteAPIKey();
  const toggle2FAMutation = useToggle2FA();

  // ============================================================================
  // FORM INSTANCES WITH ZOD VALIDATION
  // ============================================================================

  // Profile Form
  const profileForm = useForm<ProfileSettingsFormData>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      name: '',
      phone: '',
      timezone: 'America/New_York',
      language: 'en',
      bio: '',
      avatar_url: undefined,
    },
    mode: 'onBlur', // Validate on blur for better UX
  });

  // Password Change Form
  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onBlur',
  });

  // Notification Preferences Form
  const notificationForm = useForm<NotificationPreferencesFormData>({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: {
      email_notifications: true,
      push_notifications: true,
      workflow_alerts: true,
      employee_updates: true,
      system_maintenance: true,
      marketing_emails: false,
      weekly_reports: true,
      instant_alerts: true,
    },
  });

  // Security Settings Form
  const securityForm = useForm<SecuritySettingsFormData>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      two_factor_enabled: false,
      session_timeout: 60,
    },
  });

  // System Settings Form
  const systemForm = useForm<SystemSettingsFormData>({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: {
      theme: 'dark',
      auto_save: true,
      debug_mode: false,
      analytics_enabled: true,
      cache_size: '1GB',
      backup_frequency: 'daily',
      retention_period: 30,
      max_concurrent_jobs: 10,
    },
  });

  // API Key Form
  const apiKeyForm = useForm<CreateApiKeyFormData>({
    resolver: zodResolver(createApiKeySchema),
    defaultValues: {
      name: '',
    },
  });

  // Sync server data to forms when loaded
  useEffect(() => {
    if (serverProfile) {
      profileForm.reset({
        name: serverProfile.name || '',
        phone: serverProfile.phone || '',
        timezone: (serverProfile.timezone as ProfileSettingsFormData['timezone']) || 'America/New_York',
        language: (serverProfile.language as ProfileSettingsFormData['language']) || 'en',
        bio: serverProfile.bio || '',
        avatar_url: serverProfile.avatar_url || undefined,
      });
    }
  }, [serverProfile, profileForm]);

  useEffect(() => {
    if (serverSettings) {
      notificationForm.reset({
        email_notifications: serverSettings.email_notifications ?? true,
        push_notifications: serverSettings.push_notifications ?? true,
        workflow_alerts: serverSettings.workflow_alerts ?? true,
        employee_updates: serverSettings.employee_updates ?? true,
        system_maintenance: serverSettings.system_maintenance ?? true,
        marketing_emails: serverSettings.marketing_emails ?? false,
        weekly_reports: serverSettings.weekly_reports ?? true,
        instant_alerts: serverSettings.instant_alerts ?? true,
      });

      securityForm.reset({
        two_factor_enabled: serverSettings.two_factor_enabled ?? false,
        session_timeout: serverSettings.session_timeout ?? 60,
      });

      systemForm.reset({
        theme: (serverSettings.theme as SystemSettingsFormData['theme']) ?? 'dark',
        auto_save: serverSettings.auto_save ?? true,
        debug_mode: serverSettings.debug_mode ?? false,
        analytics_enabled: serverSettings.analytics_enabled ?? true,
        cache_size: (serverSettings.cache_size as SystemSettingsFormData['cache_size']) ?? '1GB',
        backup_frequency: (serverSettings.backup_frequency as SystemSettingsFormData['backup_frequency']) ?? 'daily',
        retention_period: serverSettings.retention_period ?? 30,
        max_concurrent_jobs: serverSettings.max_concurrent_jobs ?? 10,
      });
    }
  }, [serverSettings, notificationForm, securityForm, systemForm]);

  // Derived state
  const profile = serverProfile;
  const settings = serverSettings;
  const isSaving =
    updateProfileMutation.isPending ||
    updateSettingsMutation.isPending ||
    uploadAvatarMutation.isPending ||
    changePasswordMutation.isPending ||
    createAPIKeyMutation.isPending ||
    deleteAPIKeyMutation.isPending ||
    toggle2FAMutation.isPending;

  // UI states
  const [activeSection, setActiveSection] = useState(section || 'profile');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAPIKeyDialog, setShowAPIKeyDialog] = useState(false);
  const [generatedAPIKey, setGeneratedAPIKey] = useState('');
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);

  // Update active section when URL changes
  useEffect(() => {
    if (section && section !== activeSection) {
      setActiveSection(section);
    }
  }, [section, activeSection]);

  // ============================================================================
  // FORM SUBMIT HANDLERS
  // ============================================================================

  // Profile submit handler
  const handleSaveProfile = useCallback(
    (data: ProfileSettingsFormData) => {
      updateProfileMutation.mutate({
        name: data.name,
        phone: data.phone,
        timezone: data.timezone,
        language: data.language,
        bio: data.bio,
        avatar_url: data.avatar_url,
      });
    },
    [updateProfileMutation]
  );

  // Avatar upload handler
  const handleAvatarUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      uploadAvatarMutation.mutate(file, {
        onSuccess: (url) => {
          profileForm.setValue('avatar_url', url, { shouldDirty: true });
        },
      });
    },
    [uploadAvatarMutation, profileForm]
  );

  // Password change handler
  const handlePasswordChange = useCallback(
    (data: ChangePasswordFormData) => {
      changePasswordMutation.mutate(
        { newPassword: data.newPassword, confirmPassword: data.confirmPassword },
        {
          onSuccess: () => {
            passwordForm.reset();
          },
        }
      );
    },
    [changePasswordMutation, passwordForm]
  );

  // Notification preferences handler
  const handleSaveNotifications = useCallback(
    (data: NotificationPreferencesFormData) => {
      updateSettingsMutation.mutate(data);
    },
    [updateSettingsMutation]
  );

  // Security settings handler
  const handleSaveSecurity = useCallback(
    (data: SecuritySettingsFormData) => {
      updateSettingsMutation.mutate(data);
    },
    [updateSettingsMutation]
  );

  // System settings handler
  const handleSaveSystem = useCallback(
    (data: SystemSettingsFormData) => {
      updateSettingsMutation.mutate(data);
    },
    [updateSettingsMutation]
  );

  // API Key handlers
  const handleGenerateAPIKey = useCallback(
    (data: CreateApiKeyFormData) => {
      createAPIKeyMutation.mutate(data.name, {
        onSuccess: (result: CreateAPIKeyResult) => {
          setGeneratedAPIKey(result.fullKey);
          apiKeyForm.reset();
        },
      });
    },
    [createAPIKeyMutation, apiKeyForm]
  );

  const handleDeleteAPIKey = useCallback(() => {
    if (!keyToDelete) return;

    deleteAPIKeyMutation.mutate(keyToDelete, {
      onSettled: () => {
        setKeyToDelete(null);
      },
    });
  }, [keyToDelete, deleteAPIKeyMutation]);

  const handleCopyAPIKey = useCallback((key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('API key copied to clipboard');
  }, []);

  // 2FA handlers
  const handleToggle2FA = useCallback(
    (enabled: boolean) => {
      toggle2FAMutation.mutate(enabled, {
        onSuccess: () => {
          securityForm.setValue('two_factor_enabled', enabled);
        },
      });
    },
    [toggle2FAMutation, securityForm]
  );

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

  if (isError || !profile || !settings) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
          <p className="mb-4 text-muted-foreground">Failed to load settings</p>
          <Button onClick={() => refetch()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen space-y-4 p-4 md:space-y-6 md:p-6">
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
        className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            Manage your account, preferences, and system configuration
          </p>
        </div>
        <Badge
          variant="outline"
          className="w-fit border-green-500/50 text-green-400"
        >
          <CheckCircle className="mr-1 h-3 w-3" />
          <span className="hidden sm:inline">Real Data</span>
          <span className="sm:hidden">Live</span>
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
          <TabsList className="grid grid-cols-2 border border-border/50 bg-card/50 p-1 shadow-lg backdrop-blur-xl md:grid-cols-4">
            <TabsTrigger
              value="profile"
              className="text-xs transition-all duration-300 hover:bg-accent/40 data-[state=active]:bg-accent/80 data-[state=active]:backdrop-blur-sm md:text-sm"
            >
              <User className="h-4 w-4 md:mr-2" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="text-xs transition-all duration-300 hover:bg-accent/40 data-[state=active]:bg-accent/80 data-[state=active]:backdrop-blur-sm md:text-sm"
            >
              <Bell className="h-4 w-4 md:mr-2" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="text-xs transition-all duration-300 hover:bg-accent/40 data-[state=active]:bg-accent/80 data-[state=active]:backdrop-blur-sm md:text-sm"
            >
              <Shield className="h-4 w-4 md:mr-2" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger
              value="system"
              className="text-xs transition-all duration-300 hover:bg-accent/40 data-[state=active]:bg-accent/80 data-[state=active]:backdrop-blur-sm md:text-sm"
            >
              <Settings className="h-4 w-4 md:mr-2" />
              <span className="hidden sm:inline">System</span>
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
                <CardContent>
                  <Form {...profileForm}>
                    <form
                      onSubmit={profileForm.handleSubmit(handleSaveProfile)}
                      className="space-y-6"
                    >
                      {/* Avatar with 3D Hover Effect */}
                      <div className="flex items-center space-x-4">
                        <InteractiveHoverCard>
                          <Avatar className="h-20 w-20 ring-2 ring-primary/20 transition-all duration-300 hover:ring-primary/40">
                            <AvatarImage src={profileForm.watch('avatar_url')} />
                            <AvatarFallback className="bg-accent text-lg text-foreground">
                              {profileForm
                                .watch('name')
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
                            type="button"
                            variant="outline"
                            className="border-border text-foreground transition-transform duration-200 hover:scale-105 hover:text-foreground"
                            onClick={() =>
                              document.getElementById('avatar-upload')?.click()
                            }
                            disabled={uploadAvatarMutation.isPending}
                          >
                            {uploadAvatarMutation.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Camera className="mr-2 h-4 w-4" />
                            )}
                            Change Photo
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            JPG, PNG up to 5MB
                          </p>
                        </div>
                      </div>

                      {/* Profile Form Fields */}
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField
                          control={profileForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground">
                                Full Name
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="border-border bg-background text-foreground"
                                  placeholder="Enter your full name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div>
                          <Label className="text-foreground">Email Address</Label>
                          <Input
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="mt-2 cursor-not-allowed border-border bg-muted text-muted-foreground"
                          />
                          <p className="mt-1 text-xs text-muted-foreground">
                            Email cannot be changed
                          </p>
                        </div>

                        <FormField
                          control={profileForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground">
                                Phone Number
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ''}
                                  className="border-border bg-background text-foreground"
                                  placeholder="+1 (555) 000-0000"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="timezone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground">
                                Timezone
                              </FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger className="border-border bg-background text-foreground">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
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
                                  <SelectItem value="Australia/Sydney">
                                    AEST
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="language"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground">
                                Language
                              </FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger className="border-border bg-background text-foreground">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="border-border bg-popover">
                                  <SelectItem value="en">English</SelectItem>
                                  <SelectItem value="es">Espanol</SelectItem>
                                  <SelectItem value="fr">Francais</SelectItem>
                                  <SelectItem value="de">Deutsch</SelectItem>
                                  <SelectItem value="zh">Chinese</SelectItem>
                                  <SelectItem value="ja">Japanese</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={profileForm.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Bio</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                value={field.value || ''}
                                className="border-border bg-background text-foreground"
                                rows={3}
                                placeholder="Tell us about yourself..."
                              />
                            </FormControl>
                            <FormDescription>
                              {(field.value?.length || 0)}/500 characters
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          {profileForm.formState.isDirty && (
                            <span className="text-yellow-500">
                              You have unsaved changes
                            </span>
                          )}
                        </div>
                        <Button
                          type="submit"
                          disabled={
                            isSaving ||
                            !profileForm.formState.isDirty ||
                            !profileForm.formState.isValid
                          }
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {updateProfileMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          Save Profile
                        </Button>
                      </div>
                    </form>
                  </Form>
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
              <CardContent>
                <Form {...notificationForm}>
                  <form
                    onSubmit={notificationForm.handleSubmit(handleSaveNotifications)}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      {[
                        {
                          key: 'email_notifications' as const,
                          label: 'Email Notifications',
                          desc: 'Receive notifications via email',
                        },
                        {
                          key: 'push_notifications' as const,
                          label: 'Push Notifications',
                          desc: 'Browser push notifications',
                        },
                        {
                          key: 'workflow_alerts' as const,
                          label: 'Workflow Alerts',
                          desc: 'Alerts when workflows complete or fail',
                        },
                        {
                          key: 'employee_updates' as const,
                          label: 'Employee Updates',
                          desc: 'Updates about AI employee performance',
                        },
                        {
                          key: 'system_maintenance' as const,
                          label: 'System Maintenance',
                          desc: 'Scheduled maintenance notifications',
                        },
                        {
                          key: 'marketing_emails' as const,
                          label: 'Marketing Emails',
                          desc: 'Product updates and offers',
                        },
                        {
                          key: 'weekly_reports' as const,
                          label: 'Weekly Reports',
                          desc: 'Weekly performance summaries',
                        },
                        {
                          key: 'instant_alerts' as const,
                          label: 'Instant Alerts',
                          desc: 'Real-time critical alerts',
                        },
                      ].map(({ key, label, desc }) => (
                        <FormField
                          key={key}
                          control={notificationForm.control}
                          name={key}
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-foreground">
                                  {label}
                                </FormLabel>
                                <FormDescription>{desc}</FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {notificationForm.formState.isDirty && (
                          <span className="text-yellow-500">
                            You have unsaved changes
                          </span>
                        )}
                      </div>
                      <Button
                        type="submit"
                        disabled={isSaving || !notificationForm.formState.isDirty}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {updateSettingsMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Save Preferences
                      </Button>
                    </div>
                  </form>
                </Form>
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
                  <Form {...securityForm}>
                    <form
                      onSubmit={securityForm.handleSubmit(handleSaveSecurity)}
                      className="space-y-6"
                    >
                      <FormField
                        control={securityForm.control}
                        name="two_factor_enabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-foreground">
                                Two-Factor Authentication
                              </FormLabel>
                              <FormDescription>
                                Add an extra layer of security
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  handleToggle2FA(checked);
                                }}
                                disabled={toggle2FAMutation.isPending}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={securityForm.control}
                        name="session_timeout"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">
                              Session Timeout
                            </FormLabel>
                            <Select
                              value={field.value.toString()}
                              onValueChange={(value) =>
                                field.onChange(parseInt(value))
                              }
                            >
                              <FormControl>
                                <SelectTrigger className="border-border bg-background text-foreground">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="border-border bg-popover">
                                <SelectItem value="15">15 minutes</SelectItem>
                                <SelectItem value="30">30 minutes</SelectItem>
                                <SelectItem value="60">1 hour</SelectItem>
                                <SelectItem value="240">4 hours</SelectItem>
                                <SelectItem value="1440">Never</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          disabled={isSaving || !securityForm.formState.isDirty}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {updateSettingsMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          Save Security Settings
                        </Button>
                      </div>
                    </form>
                  </Form>

                  {/* Change Password - Separate Form */}
                  <div className="border-t border-border pt-6">
                    <Form {...passwordForm}>
                      <form
                        onSubmit={passwordForm.handleSubmit(handlePasswordChange)}
                        className="space-y-4"
                      >
                        <h4 className="font-medium text-foreground">
                          Change Password
                        </h4>

                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm text-muted-foreground">
                                New Password
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    {...field}
                                    type={showNewPassword ? 'text' : 'password'}
                                    className="border-border bg-background pr-10 text-foreground"
                                    placeholder="Enter new password"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowNewPassword(!showNewPassword)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                  >
                                    {showNewPassword ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              </FormControl>
                              <FormDescription className="text-xs">
                                Min 8 characters with uppercase, lowercase, number,
                                and special character
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm text-muted-foreground">
                                Confirm Password
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    {...field}
                                    type={showConfirmPassword ? 'text' : 'password'}
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
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          disabled={
                            changePasswordMutation.isPending ||
                            !passwordForm.formState.isValid ||
                            !passwordForm.formState.isDirty
                          }
                          variant="outline"
                          className="w-full border-border"
                        >
                          {changePasswordMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Key className="mr-2 h-4 w-4" />
                          )}
                          Change Password
                        </Button>
                      </form>
                    </Form>
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
            <Form {...systemForm}>
              <form
                onSubmit={systemForm.handleSubmit(handleSaveSystem)}
                className="space-y-6"
              >
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
                      <FormField
                        control={systemForm.control}
                        name="theme"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">
                              Theme
                            </FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger className="border-border bg-background text-foreground">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="border-border bg-popover">
                                <SelectItem value="dark">Dark</SelectItem>
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="auto">Auto</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {[
                        {
                          key: 'auto_save' as const,
                          label: 'Auto Save',
                          desc: 'Automatically save changes',
                        },
                        {
                          key: 'debug_mode' as const,
                          label: 'Debug Mode',
                          desc: 'Show detailed error information',
                        },
                        {
                          key: 'analytics_enabled' as const,
                          label: 'Analytics',
                          desc: 'Enable usage analytics',
                        },
                      ].map(({ key, label, desc }) => (
                        <FormField
                          key={key}
                          control={systemForm.control}
                          name={key}
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-foreground">
                                  {label}
                                </FormLabel>
                                <FormDescription>{desc}</FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
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
                      <FormField
                        control={systemForm.control}
                        name="cache_size"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">
                              Cache Size
                            </FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger className="border-border bg-background text-foreground">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="border-border bg-popover">
                                <SelectItem value="256MB">256 MB</SelectItem>
                                <SelectItem value="512MB">512 MB</SelectItem>
                                <SelectItem value="1GB">1 GB</SelectItem>
                                <SelectItem value="2GB">2 GB</SelectItem>
                                <SelectItem value="4GB">4 GB</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={systemForm.control}
                        name="backup_frequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">
                              Backup Frequency
                            </FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger className="border-border bg-background text-foreground">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="border-border bg-popover">
                                <SelectItem value="hourly">Hourly</SelectItem>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={systemForm.control}
                        name="retention_period"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">
                              Data Retention (days)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value) || 30)
                                }
                                className="border-border bg-background text-foreground"
                                min={1}
                                max={365}
                              />
                            </FormControl>
                            <FormDescription>
                              Between 1 and 365 days
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={systemForm.control}
                        name="max_concurrent_jobs"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">
                              Max Concurrent Jobs
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value) || 10)
                                }
                                className="border-border bg-background text-foreground"
                                min={1}
                                max={100}
                              />
                            </FormControl>
                            <FormDescription>
                              Between 1 and 100 jobs
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {systemForm.formState.isDirty && (
                      <span className="text-yellow-500">
                        You have unsaved changes
                      </span>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={isSaving || !systemForm.formState.isDirty}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {updateSettingsMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save System Settings
                  </Button>
                </div>
              </form>
            </Form>
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
            <AlertDialogDescription asChild>
              <div className="text-muted-foreground">
                {generatedAPIKey ? (
                  <div className="space-y-4">
                    <p className="text-yellow-400">
                      <AlertTriangle className="mr-2 inline h-4 w-4" />
                      Save this key now. You will not be able to see it again!
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
                  <Form {...apiKeyForm}>
                    <form
                      onSubmit={apiKeyForm.handleSubmit(handleGenerateAPIKey)}
                      className="space-y-4 pt-4"
                    >
                      <FormField
                        control={apiKeyForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">
                              Key Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="e.g., Production API"
                                className="border-border bg-background text-foreground"
                              />
                            </FormControl>
                            <FormDescription>
                              A descriptive name to identify this API key
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowAPIKeyDialog(false);
                            apiKeyForm.reset();
                          }}
                          className="border-border bg-secondary text-foreground hover:bg-secondary/80"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={
                            createAPIKeyMutation.isPending ||
                            !apiKeyForm.formState.isValid
                          }
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {createAPIKeyMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Key className="mr-2 h-4 w-4" />
                          )}
                          Generate Key
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          {generatedAPIKey && (
            <AlertDialogFooter>
              <AlertDialogAction
                onClick={() => {
                  setShowAPIKeyDialog(false);
                  setGeneratedAPIKey('');
                  apiKeyForm.reset();
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Done
              </AlertDialogAction>
            </AlertDialogFooter>
          )}
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

const SettingsPageWithErrorBoundary: React.FC = () => (
  <ErrorBoundary componentName="SettingsPage" showReportDialog>
    <SettingsPageContent />
  </ErrorBoundary>
);

export default SettingsPageWithErrorBoundary;
