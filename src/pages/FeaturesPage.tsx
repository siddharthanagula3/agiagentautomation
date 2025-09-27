import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
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
import { Link } from 'react-router-dom';

const FeaturesPage: React.FC = () => {
  const mainFeatures = [
    {
      icon: <Users className="h-8 w-8" />,
      title: "250+ AI Employees",
      description: "Hire specialized AI agents for any task - from data analysis to content creation, customer service to software development.",
      benefits: [
        "Specialized expertise in 50+ domains",
        "24/7 availability and reliability", 
        "Scalable from 1 to 1000+ employees",
        "Continuous learning and improvement"
      ]
    },
    {
      icon: <Workflow className="h-8 w-8" />,
      title: "Automated Workflows",
      description: "Create complex workflows that automatically delegate tasks to your AI workforce based on triggers, schedules, and conditions.",
      benefits: [
        "Visual workflow builder",
        "Conditional logic and branching",
        "Integration with 100+ tools",
        "Real-time monitoring and alerts"
      ]
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Advanced Analytics",
      description: "Track performance, costs, and efficiency with comprehensive dashboards and detailed reporting across your entire AI workforce.",
      benefits: [
        "Real-time performance metrics",
        "Cost analysis and optimization",
        "Predictive analytics and insights",
        "Custom reports and exports"
      ]
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Enterprise Security",
      description: "Bank-level security with SOC 2 compliance, end-to-end encryption, and comprehensive audit trails for enterprise peace of mind.",
      benefits: [
        "SOC 2 Type II compliance",
        "End-to-end encryption",
        "Role-based access control",
        "Comprehensive audit logs"
      ]
    }
  ];

  const additionalFeatures = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Lightning Fast",
      description: "Get results in seconds with our optimized AI infrastructure and global edge computing network."
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Global Scale",
      description: "Deploy AI workers worldwide with 99.9% uptime guarantee and multi-region support."
    },
    {
      icon: <Key className="h-6 w-6" />,
      title: "API Access",
      description: "Integrate with your existing tools using our comprehensive REST API and webhooks."
    },
    {
      icon: <Database className="h-6 w-6" />,
      title: "Data Management",
      description: "Secure data storage, processing, and analysis with built-in compliance and governance."
    },
    {
      icon: <Headphones className="h-6 w-6" />,
      title: "24/7 Support",
      description: "Round-the-clock support via email, phone, and live chat with dedicated account managers."
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Custom Training",
      description: "Train AI employees on your specific data and processes for maximum effectiveness."
    }
  ];

  const useCases = [
    {
      title: "Content Creation",
      description: "Generate blog posts, social media content, marketing copy, and technical documentation at scale.",
      icon: <Bot className="h-6 w-6" />,
      examples: ["Blog writing", "Social media posts", "Email campaigns", "Product descriptions"]
    },
    {
      title: "Data Analysis",
      description: "Process large datasets, generate insights, create visualizations, and build predictive models.",
      icon: <BarChart3 className="h-6 w-6" />,
      examples: ["Sales forecasting", "Customer segmentation", "Performance analysis", "Risk assessment"]
    },
    {
      title: "Customer Service",
      description: "Handle customer inquiries, provide support, and resolve issues with natural language understanding.",
      icon: <Headphones className="h-6 w-6" />,
      examples: ["Live chat support", "Email responses", "FAQ generation", "Ticket routing"]
    },
    {
      title: "Software Development",
      description: "Write code, debug issues, create documentation, and assist with software architecture decisions.",
      icon: <Workflow className="h-6 w-6" />,
      examples: ["Code generation", "Bug fixing", "Code reviews", "Documentation"]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-6 bg-blue-100 text-blue-800 border-blue-200">
              <Sparkles className="mr-1 h-3 w-3" />
              Powerful Features
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Everything you need to
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> scale with AI</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Our comprehensive platform provides all the tools you need to hire, manage, 
              and scale your AI workforce effectively.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/auth/register">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/chat">Try Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Core Features
            </h2>
            <p className="text-xl text-gray-600">
              The essential capabilities that make AGI Agent Automation powerful
            </p>
          </div>
          <div className="space-y-16">
            {mainFeatures.map((feature, index) => (
              <div key={index} className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}>
                <div className={index % 2 === 1 ? 'lg:col-start-2' : ''}>
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 text-blue-600">
                    {feature.icon}
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-lg text-gray-600 mb-6">{feature.description}</p>
                  <ul className="space-y-3">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={index % 2 === 1 ? 'lg:col-start-1' : ''}>
                  <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8 h-80 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        {feature.icon}
                      </div>
                      <p className="text-gray-600">Feature Preview</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Additional Features
            </h2>
            <p className="text-xl text-gray-600">
              Everything else you need for a complete AI workforce solution
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {additionalFeatures.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-blue-600">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Use Cases
            </h2>
            <p className="text-xl text-gray-600">
              See how businesses are using AGI Agent Automation
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {useCases.map((useCase, index) => (
              <Card key={index} className="p-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                    {useCase.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{useCase.title}</h3>
                </div>
                <p className="text-gray-600 mb-6">{useCase.description}</p>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Examples:</h4>
                  <div className="flex flex-wrap gap-2">
                    {useCase.examples.map((example, exampleIndex) => (
                      <Badge key={exampleIndex} variant="secondary">
                        {example}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to experience these features?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Start your free trial today and see how AGI Agent Automation can transform your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/auth/register">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-white text-blue-600 hover:bg-gray-100" asChild>
              <Link to="/contact">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FeaturesPage;