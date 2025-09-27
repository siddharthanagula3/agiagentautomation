import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth-hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Loader2 } from 'lucide-react';

const TeamPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<unknown[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // TODO: Replace with actual Supabase data fetching
        setData([]);
      } catch (err) {
        setError("Failed to load team data.");
        console.error("Error fetching team data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading team data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">Error</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Team Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage your team members, roles, and permissions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Overview</CardTitle>
          <CardDescription>
            View and manage your team members and their roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No team members yet</h3>
            <p className="text-muted-foreground mb-6">
              This page will show your team members once you start adding them.
            </p>
            <Button>
              Add Team Member
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamPage;