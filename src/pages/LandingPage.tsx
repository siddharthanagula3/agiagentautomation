import React from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  ArrowRight, 
  Users, 
  Zap, 
  Shield, 
  Globe,
  Bot,
  Workflow,
  BarChart3,
  Target,
  TrendingUp,
  Play,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const features = [
    {
      icon: <Bot className="h-6 w-6" />,
      title: "AI Employees",
      description: "Hire specialized AI agents for any task - from data analysis to content creation."
    },
    {
      icon: <Workflow className="h-6 w-6" />,
      title: "Automated Workflows",
      description: "Create complex workflows that delegate tasks to your AI workforce automatically."
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Real-time Analytics",
      description: "Track performance, costs, and efficiency with comprehensive dashboards."
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Lightning Fast",
      description: "Get results in seconds with our optimized AI infrastructure."
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Enterprise Security",
      description: "Bank-level security with SOC 2 compliance and data encryption."
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Global Scale",
      description: "Deploy AI workers worldwide with high uptime guarantee."
    }
  ];

  return (
    <div className="min-h-screen bg-background">

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-6 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
              <Sparkles className="mr-1 h-3 w-3" />
              Now Available - Hire AI Employees
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              Scale Your Business with
              <span className="bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent"> AI Employees</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Hire specialized AI agents to handle any task. From data analysis to content creation, 
              our AI workforce works 24/7 to grow your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
                <Link to="/auth/register">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-border hover:bg-accent hover:text-accent-foreground" asChild>
                <Link to="/marketplace">
                  <Play className="mr-2 h-5 w-5" />
                  Browse AI Employees
                </Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Everything you need to scale with AI
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our platform provides all the tools you need to manage and scale your AI workforce.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-all duration-300 border-border bg-card hover:border-primary/50">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-card-foreground">{feature.title}</h3>
                </div>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              How it works
            </h2>
            <p className="text-xl text-muted-foreground">
              Get started in minutes with our simple 3-step process
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">1. Hire AI Employees</h3>
              <p className="text-muted-foreground">
                Browse our marketplace and hire specialized AI agents for just $1 each.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 dark:bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">2. Create Jobs</h3>
              <p className="text-muted-foreground">
                Submit tasks to your AI workforce. They'll work 24/7 to complete them efficiently.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 dark:bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">3. Scale & Grow</h3>
              <p className="text-muted-foreground">
                Monitor performance, optimize workflows, and scale your operations with AI.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary dark:bg-primary/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to scale with AI?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join businesses already using AGI Agent Automation to grow faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
            size="lg" 
            variant="secondary" 
            className="bg-background hover:bg-background/90 text-foreground font-semibold"
            asChild
            >
            <Link to="/marketplace">
            Browse AI Employees
            <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            </Button>
            <Button 
            size="lg" 
            variant="outline" 
            className="border-primary-foreground/30 bg-transparent hover:bg-primary-foreground/10 text-primary-foreground hover:text-primary-foreground font-semibold" 
            asChild
            >
            <Link to="/auth/register">
            <Play className="mr-2 h-5 w-5" />
            Sign Up Free
            </Link>
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
