import React from 'react';
import { useAuth } from '../../contexts/auth-hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  Bot, 
  Workflow, 
  BarChart3, 
  Shield, 
  Zap, 
  Users,
  Target,
  Clock,
  DollarSign,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Globe,
  Key,
  Database,
  Headphones
} from 'lucide-react';

const DashboardFeaturesPage: React.FC = () => {
  const { user } = useAuth();
  const features = [
    {
      icon: <Users className="h-6 w-6" />,
      title: "AI Employee Management",
      description: "Hire, manage, and scale your AI workforce with specialized agents for any task.",
      status: "Active",
      usage: "12 employees hired"
    },
    {
      icon: <Workflow className="h-6 w-6" />,
      title: "Workflow Automation",
      description: "Create automated workflows that delegate tasks to your AI employees.",
      status: "Active",
      usage: "5 workflows running"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Analytics Dashboard",
      description: "Track performance, costs, and efficiency across your AI workforce.",
      status: "Active",
      usage: "Real-time monitoring"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Enterprise Security",
      description: "Bank-level security with SOC 2 compliance and end-to-end encryption.",
      status: "Active",
      usage: "SOC 2 compliant"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Lightning Fast",
      description: "Get results in seconds with our optimized AI infrastructure.",
      status: "Active",
      usage: "99.9% uptime"
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Global Scale",
      description: "Deploy AI workers worldwide with multi-region support.",
      status: "Active",
      usage: "Global deployment"
    }
  ];

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
        <h1 className="text-3xl font-bold text-foreground">Platform Features</h1>
        <p className="text-muted-foreground mt-2">
          Overview of all available features and their current status in your account.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-primary">
                  {feature.icon}
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {feature.status}
                </Badge>
              </div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{feature.usage}</span>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DashboardFeaturesPage;