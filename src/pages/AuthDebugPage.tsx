// Debug component for testing without auth
import React from 'react';
import { useAuthStore } from '../stores/unified-auth-store';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export const AuthDebugPage: React.FC = () => {
  const {
    user,
    isLoading,
    error,
    isAuthenticated,
    initialized,
    initialize,
    fetchUser,
    login
  } = useAuthStore();

  const handleDemoLogin = async () => {
    try {
      await login({ email: 'demo@example.com', password: 'demo123' });
    } catch (error) {
      console.error('Demo login failed:', error);
    }
  };

  const handleForceInit = async () => {
    await initialize();
  };

  const handleFetchUser = async () => {
    await fetchUser();
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Auth Debug Panel</CardTitle>
            <CardDescription>
              Debug authentication state and test auth functions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-white font-semibold mb-2">Auth State:</h3>
                <div className="space-y-1 text-sm text-gray-300">
                  <div>Initialized: {initialized ? '✅ Yes' : '❌ No'}</div>
                  <div>Loading: {isLoading ? '⏳ Yes' : '✅ No'}</div>
                  <div>Authenticated: {isAuthenticated ? '✅ Yes' : '❌ No'}</div>
                  <div>User: {user?.email || 'None'}</div>
                  <div>Error: {error || 'None'}</div>
                </div>
              </div>
              
              <div>
                <h3 className="text-white font-semibold mb-2">Environment:</h3>
                <div className="space-y-1 text-sm text-gray-300">
                  <div>Mode: {import.meta.env.MODE}</div>
                  <div>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing'}</div>
                  <div>Demo Mode: {import.meta.env.VITE_DEMO_MODE || 'false'}</div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleForceInit} variant="outline">
                Force Initialize
              </Button>
              <Button onClick={handleFetchUser} variant="outline">
                Fetch User
              </Button>
              <Button onClick={handleDemoLogin} className="bg-blue-600 hover:bg-blue-700">
                Demo Login
              </Button>
              <Button onClick={() => window.location.href = '/dashboard'} variant="secondary">
                Go to Dashboard
              </Button>
              <Button onClick={() => window.location.href = '/'} variant="secondary">
                Go to Landing
              </Button>
            </div>

            {error && (
              <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg">
                <h4 className="text-red-400 font-semibold">Error Details:</h4>
                <pre className="text-red-300 text-xs mt-2 overflow-auto">{error}</pre>
              </div>
            )}

            {user && (
              <div className="p-4 bg-green-900/20 border border-green-900/50 rounded-lg">
                <h4 className="text-green-400 font-semibold">User Details:</h4>
                <pre className="text-green-300 text-xs mt-2 overflow-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
