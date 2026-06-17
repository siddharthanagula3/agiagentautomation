/**
 * Device Authorization Page
 * Handles OAuth device flow for AGI Agent Automation Desktop app.
 * Route: /device-auth?user_code=XXXX
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@shared/stores/authentication-store';
import { supabase } from '@shared/lib/supabase-client';
import { Button } from '@shared/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/ui/card';
import { Badge } from '@shared/ui/badge';
import {
  Loader2,
  Monitor,
  CheckCircle,
  XCircle,
  Shield,
  LogIn,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';

type DeviceAuthStatus = 'idle' | 'approving' | 'success' | 'error';

const DeviceAuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();

  const userCode = searchParams.get('user_code') || '';

  const [status, setStatus] = useState<DeviceAuthStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Redirect to login if not authenticated (after auth finishes loading)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth/login', {
        state: { from: { pathname: `/device-auth?user_code=${userCode}` } },
        replace: true,
      });
    }
  }, [authLoading, isAuthenticated, navigate, userCode]);

  const handleApprove = async () => {
    if (!user || !userCode.trim()) return;

    setStatus('approving');
    setErrorMessage('');

    try {
      const { error } = await supabase
        .from('device_authorization_codes')
        .update({
          user_id: user.id,
          is_used: false,
        })
        .eq('user_code', userCode.toUpperCase());

      if (error) {
        setStatus('error');
        setErrorMessage(
          error.code === 'PGRST116'
            ? 'Authorization code not found or expired. Please try again from the desktop app.'
            : `Failed to authorize: ${error.message}`
        );
        return;
      }

      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMessage('An unexpected error occurred. Please try again.');
    }
  };

  const handleDeny = () => {
    navigate('/dashboard');
  };

  // Show loading while auth state initializes
  if (authLoading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If not authenticated, the useEffect will redirect - show nothing
  if (!isAuthenticated) {
    return null;
  }

  // Missing user_code param
  if (!userCode.trim()) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="text-destructive mx-auto mb-4 h-12 w-12" />
            <CardTitle>Invalid Request</CardTitle>
            <CardDescription>
              No authorization code provided. Please start the device
              authorization flow from the AGI Agent Automation Desktop app.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="border-border/50 shadow-xl">
          <CardHeader className="text-center">
            <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <Monitor className="text-primary h-8 w-8" />
            </div>
            <CardTitle className="text-xl">Authorize Desktop App</CardTitle>
            <CardDescription>
              AGI Agent Automation Desktop is requesting access to your account
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* User code display */}
            <div className="border-border bg-muted/50 rounded-lg border p-4 text-center">
              <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
                Authorization Code
              </p>
              <p className="text-foreground font-mono text-2xl font-bold tracking-widest">
                {userCode.toUpperCase()}
              </p>
            </div>

            {/* Logged in as */}
            <div className="border-border flex items-center gap-3 rounded-lg border p-3">
              <Shield className="text-muted-foreground h-5 w-5" />
              <div className="flex-1 text-sm">
                <p className="text-muted-foreground">Signed in as</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              <Badge variant="secondary">Verified</Badge>
            </div>

            {/* Status-specific content */}
            {status === 'idle' && (
              <div className="space-y-3">
                <p className="text-muted-foreground text-center text-sm">
                  Confirm that this code matches what is shown on your desktop
                  application, then click Approve.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleDeny}
                  >
                    Deny
                  </Button>
                  <Button className="flex-1" onClick={handleApprove}>
                    <LogIn className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                </div>
              </div>
            )}

            {status === 'approving' && (
              <div className="py-4 text-center">
                <Loader2 className="text-primary mx-auto mb-3 h-8 w-8 animate-spin" />
                <p className="text-muted-foreground text-sm">
                  Authorizing desktop app...
                </p>
              </div>
            )}

            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4 text-center"
              >
                <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                <div>
                  <p className="text-foreground font-semibold">
                    Authorization Successful
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    You can now return to the desktop app. It will sign you in
                    automatically.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                >
                  Go to Dashboard
                </Button>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4 text-center"
              >
                <XCircle className="text-destructive mx-auto h-12 w-12" />
                <div>
                  <p className="text-foreground font-semibold">
                    Authorization Failed
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {errorMessage}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate('/dashboard')}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setStatus('idle');
                      setErrorMessage('');
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

const DeviceAuthPageWithErrorBoundary: React.FC = () => (
  <ErrorBoundary componentName="DeviceAuth" showReportDialog>
    <DeviceAuthPage />
  </ErrorBoundary>
);

export default DeviceAuthPageWithErrorBoundary;
