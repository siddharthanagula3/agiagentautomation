import React from 'react';
import { useAuth } from '../../contexts/auth-hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Loader2 } from 'lucide-react';

const WidgetsPage: React.FC = () => {
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Widgets</h1>
        <p className="text-muted-foreground mt-2">
          Create and manage widgets for your AI workforce dashboard.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Widget Management</CardTitle>
          <CardDescription>
            Create, customize, and manage widgets for your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Grid className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Widget Center
            </h3>
            <p className="text-muted-foreground mb-6">
              This page will contain widget management with creation, customization, and dashboard integration.
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Widget
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WidgetsPage;
