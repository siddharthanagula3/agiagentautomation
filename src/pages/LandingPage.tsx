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
  Sparkles,
  Clock,
  Brain,
  CheckCircle,
  DollarSign,
  FileText,
  MessageSquare,
  Activity,
  Lock,
  Server,
  Award,
  Rocket
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

  const useCases = [
    {
      icon: <FileText className="h-8 w-8" />,
      title: "Content Creation Pipeline",
      description: "Automated research, writing, editing, and publishing workflow",
      tags: ["Research", "Writing", "Publishing"]
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Daily Analytics Reports",
      description: "Automatic data collection, analysis, and distribution",
      tags: ["Analytics", "Reporting", "Insights"]
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Lead Nurturing",
      description: "Intelligent lead scoring, segmentation, and personalization",
      tags: ["Sales", "Marketing", "Automation"]
    },
    {
      icon: <Activity className="h-8 w-8" />,
      title: "System Monitoring",
      description: "24/7 health checks with intelligent alerting",
      tags: ["Monitoring", "DevOps", "Alerts"]
    }
  ];

  const trustIndicators = [
    { icon: <Shield />, text: "SOC 2 Compliant" },
    { icon: <Lock />, text: "Bank-Level Encryption" },
    { icon: <Award />, text: "GDPR Compliant" },
    { icon: <Server />, text: "99.9% Uptime" }
  ];

  return (
    <div className="min-h-screen bg-background">

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-6 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
              <Sparkles className="mr-1 h-3 w-3" />
              Now Available - Full AI Workforce Automation
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              Your Complete
              <span className="bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent"> AI Workforce</span>
              <br />
              Ready to Work 24/7
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Hire specialized AI employees, create autonomous workflows, and delegate complex projects 
              to an AI CEO that orchestrates your entire workforce. Scale your operations without scaling headcount.
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

      {/* Autonomous Workflows Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                <Workflow className="mr-1 h-3 w-3" />
                Autonomous Workflows
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                Set It and Forget It
                <br />
                <span className="bg-gradient-to-r from-purple-600 to-primary bg-clip-text text-transparent">
                  Automation
                </span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Create proactive AI workflows that work 24/7 on recurring tasks. From daily reports to lead nurturing campaigns, 
                your AI workforce handles it all automatically.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">Scheduled Automation</h4>
                    <p className="text-sm text-muted-foreground">Run workflows hourly, daily, weekly, or on custom schedules</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">Smart Task Delegation</h4>
                    <p className="text-sm text-muted-foreground">Automatically assigns tasks to the best AI employee for each job</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">Real-time Monitoring</h4>
                    <p className="text-sm text-muted-foreground">Track execution status, success rates, and performance metrics</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">Error Handling</h4>
                    <p className="text-sm text-muted-foreground">Built-in retry logic and intelligent error recovery</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-purple-600/10 to-primary/10 border border-purple-500/20 rounded-2xl p-8 backdrop-blur-sm">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 p-4 bg-card/50 rounded-lg border border-border">
                    <Clock className="h-6 w-6 text-primary" />
                    <div className="flex-1">
                      <div className="font-semibold text-foreground">Daily Analytics Report</div>
                      <div className="text-sm text-muted-foreground">Runs every day at 9:00 AM</div>
                    </div>
                    <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">Active</Badge>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-card/50 rounded-lg border border-border">
                    <Workflow className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    <div className="flex-1">
                      <div className="font-semibold text-foreground">Lead Nurturing Campaign</div>
                      <div className="text-sm text-muted-foreground">Runs hourly</div>
                    </div>
                    <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">Active</Badge>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-card/50 rounded-lg border border-border">
                    <Activity className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    <div className="flex-1">
                      <div className="font-semibold text-foreground">System Health Monitor</div>
                      <div className="text-sm text-muted-foreground">Runs every 5 minutes</div>
                    </div>
                    <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">Active</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Workforce Orchestration Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-gradient-to-br from-primary/10 to-blue-600/10 border border-primary/20 rounded-2xl p-8 backdrop-blur-sm">
                <div className="space-y-4">
                  <div className="text-center pb-4 border-b border-border">
                    <div className="inline-flex items-center space-x-2 bg-primary/20 px-4 py-2 rounded-full">
                      <Brain className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-primary">CEO Agent</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Analyzing project...</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 p-3 bg-card/50 rounded-lg border border-border">
                      <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">1</div>
                      <span className="text-sm text-foreground">Task: Research competitors</span>
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500 ml-auto" />
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-card/50 rounded-lg border border-border">
                      <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">2</div>
                      <span className="text-sm text-foreground">Task: Create content strategy</span>
                      <div className="ml-auto h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-card/50 rounded-lg border border-border opacity-60">
                      <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">3</div>
                      <span className="text-sm text-foreground">Task: Generate blog posts</span>
                      <Clock className="h-4 w-4 text-muted-foreground ml-auto" />
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-card/50 rounded-lg border border-border opacity-60">
                      <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">4</div>
                      <span className="text-sm text-foreground">Task: Publish content</span>
                      <Clock className="h-4 w-4 text-muted-foreground ml-auto" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <Badge className="mb-4 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                <Brain className="mr-1 h-3 w-3" />
                AI Workforce
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                Your AI CEO That
                <br />
                <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  Orchestrates Everything
                </span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Submit complex projects and watch as your AI CEO breaks them down, delegates tasks to specialized 
                employees, and manages execution from start to finish. No micromanagement needed.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">Intelligent Project Analysis</h4>
                    <p className="text-sm text-muted-foreground">CEO agent analyzes requirements and creates optimal task plans</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">Automatic Task Delegation</h4>
                    <p className="text-sm text-muted-foreground">Tasks assigned to the most qualified AI employees automatically</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">Inter-Agent Communication</h4>
                    <p className="text-sm text-muted-foreground">AI employees collaborate and share context seamlessly</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">Real-time Progress Tracking</h4>
                    <p className="text-sm text-muted-foreground">Monitor every step with detailed execution logs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Built for Real Business Use Cases
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See how businesses like yours are using AI automation to scale operations
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {useCases.map((useCase, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-all duration-300 border-border bg-card hover:border-primary/50">
                <div className="flex items-start space-x-4 mb-4">
                  <div className="p-3 bg-primary/10 rounded-xl text-primary">
                    {useCase.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-card-foreground mb-2">{useCase.title}</h3>
                    <p className="text-muted-foreground mb-4">{useCase.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {useCase.tags.map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Get Started in Minutes
            </h2>
            <p className="text-xl text-muted-foreground">
              Simple 3-step process to build your AI workforce
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">1. Hire AI Employees</h3>
              <p className="text-muted-foreground mb-4">
                Browse our marketplace and hire specialized AI agents for just $1 each. Choose from 6+ roles including developers, analysts, writers, and more.
              </p>
              <Button variant="link" className="text-primary" asChild>
                <Link to="/marketplace">View Marketplace →</Link>
              </Button>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 dark:bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">2. Create Jobs or Workflows</h3>
              <p className="text-muted-foreground mb-4">
                Set up one-time tasks or recurring automation workflows. Your AI workforce works 24/7 to complete them efficiently with minimal oversight.
              </p>
              <Button variant="link" className="text-primary" asChild>
                <Link to="/auth/register">Start Creating →</Link>
              </Button>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 dark:bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">3. Scale & Grow</h3>
              <p className="text-muted-foreground mb-4">
                Monitor performance with real-time analytics, optimize costs, and scale your operations. Add more employees as your needs grow.
              </p>
              <Button variant="link" className="text-primary" asChild>
                <Link to="/auth/register">View Analytics →</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground">
              Only pay for what you use. No hidden fees.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="p-8 border-2 border-border hover:border-primary/50 transition-all">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2 text-foreground">Free Trial</h3>
                <div className="text-4xl font-bold text-primary mb-4">$0</div>
                <p className="text-muted-foreground mb-6">14 days • No credit card</p>
                <Button className="w-full" variant="outline" asChild>
                  <Link to="/auth/register">Start Free Trial</Link>
                </Button>
                <div className="mt-6 space-y-3 text-sm text-left">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0" />
                    <span className="text-foreground">2 AI employees included</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0" />
                    <span className="text-foreground">5,000 tokens free</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0" />
                    <span className="text-foreground">Basic analytics</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-8 border-2 border-primary bg-primary/5 relative">
              <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">Popular</Badge>
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2 text-foreground">Pay As You Go</h3>
                <div className="text-4xl font-bold text-primary mb-4">$1<span className="text-lg text-muted-foreground">/employee</span></div>
                <p className="text-muted-foreground mb-6">One-time hire • Pay for usage</p>
                <Button className="w-full" asChild>
                  <Link to="/marketplace">Browse Employees</Link>
                </Button>
                <div className="mt-6 space-y-3 text-sm text-left">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0" />
                    <span className="text-foreground">$1 per AI employee (one-time)</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0" />
                    <span className="text-foreground">Pay only for tokens used</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0" />
                    <span className="text-foreground">Full analytics & monitoring</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0" />
                    <span className="text-foreground">Unlimited workflows</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-8 border-2 border-border hover:border-primary/50 transition-all">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2 text-foreground">Enterprise</h3>
                <div className="text-4xl font-bold text-primary mb-4">Custom</div>
                <p className="text-muted-foreground mb-6">Tailored to your needs</p>
                <Button className="w-full" variant="outline" asChild>
                  <Link to="/auth/register">Contact Sales</Link>
                </Button>
                <div className="mt-6 space-y-3 text-sm text-left">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0" />
                    <span className="text-foreground">Unlimited AI employees</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0" />
                    <span className="text-foreground">Volume discounts</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0" />
                    <span className="text-foreground">Priority support</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0" />
                    <span className="text-foreground">Custom integrations</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust & Security Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Enterprise-Grade Security
            </h2>
            <p className="text-xl text-muted-foreground">
              Your data is protected with industry-leading security standards
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {trustIndicators.map((indicator, index) => (
              <div key={index} className="flex flex-col items-center text-center p-6 bg-card rounded-lg border border-border">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3 text-primary">
                  {indicator.icon}
                </div>
                <span className="text-sm font-medium text-foreground">{indicator.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary dark:bg-primary/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Build Your AI Workforce?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join businesses already using AGI Agent Automation to scale operations and reduce costs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
            size="lg" 
            variant="secondary" 
            className="bg-background hover:bg-background/90 text-foreground font-semibold"
            asChild
            >
            <Link to="/auth/register">
            Start Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            </Button>
            <Button 
            size="lg" 
            variant="outline" 
            className="border-primary-foreground/30 bg-transparent hover:bg-primary-foreground/10 text-primary-foreground hover:text-primary-foreground font-semibold" 
            asChild
            >
            <Link to="/marketplace">
            <Rocket className="mr-2 h-5 w-5" />
            Browse AI Employees
            </Link>
            </Button>
          </div>
          <p className="text-sm text-primary-foreground/80 mt-6">
            14-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
