import React from 'react';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';
import { motion } from 'framer-motion';
import { Badge } from '@shared/ui/badge';
import { Card } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Particles } from '@shared/ui/particles';
import {
  BookOpen,
  Code,
  Rocket,
  Zap,
  ArrowRight,
  FileText,
  Video,
  HelpCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DocumentationPage: React.FC = () => {
  const quickStart = [
    { title: 'Create Your First AI Employee', time: '5 min', icon: Rocket },
    { title: 'Build Your First Workflow', time: '10 min', icon: Zap },
    { title: 'Connect Integrations', time: '15 min', icon: Code },
    { title: 'Deploy to Production', time: '20 min', icon: FileText },
  ];

  const categories = [
    {
      title: 'Getting Started',
      description: 'Learn the basics and set up your account',
      icon: Rocket,
      articles: [
        'Quick Start Guide',
        'Account Setup',
        'Dashboard Overview',
        'First AI Employee',
      ],
    },
    {
      title: 'AI Employees',
      description: 'Create and manage your AI workforce',
      icon: BookOpen,
      articles: [
        'Creating AI Employees',
        'Training & Customization',
        'Employee Management',
        'Best Practices',
      ],
    },
    {
      title: 'Workflows',
      description: 'Automate tasks with visual workflows',
      icon: Zap,
      articles: [
        'Workflow Builder',
        'Triggers & Actions',
        'Conditional Logic',
        'Error Handling',
      ],
    },
    {
      title: 'Integrations',
      description: 'Connect with your favorite tools',
      icon: Code,
      articles: [
        'Available Integrations',
        'API Setup',
        'Webhooks',
        'Custom Integrations',
      ],
    },
    {
      title: 'API Reference',
      description: 'Build with our REST API',
      icon: FileText,
      articles: ['Authentication', 'Endpoints', 'SDKs', 'Rate Limits'],
    },
    {
      title: 'Video Tutorials',
      description: 'Watch and learn',
      icon: Video,
      articles: [
        'Platform Overview',
        'Advanced Workflows',
        'Integration Tutorials',
        'Tips & Tricks',
      ],
    },
  ];

  return (
    <div className="bg-background min-h-screen">
      <Particles className="absolute inset-0 -z-10" quantity={40} />

      <section className="px-4 pt-32 pb-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-4xl text-center"
          >
            <Badge className="glass mb-6 px-6 py-2">
              <BookOpen className="mr-2 h-4 w-4" />
              Documentation
            </Badge>
            <h1 className="from-primary via-accent to-secondary mb-6 bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
              Everything You Need to Know
            </h1>
            <p className="text-muted-foreground mb-8 text-xl">
              Comprehensive guides, tutorials, and API documentation to help you
              build with AGI Agent Automation
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                asChild
                className="from-primary to-accent bg-gradient-to-r"
              >
                <Link to="#quick-start">Quick Start Guide</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/api-reference">API Reference</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section
        id="quick-start"
        className="bg-muted/30 px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-2xl font-bold sm:text-3xl md:text-4xl">
              Quick Start
            </h2>
            <p className="text-muted-foreground text-xl">
              Get up and running in minutes
            </p>
          </motion.div>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
            {quickStart.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="group border-border/50 hover:border-primary/50 cursor-pointer border-2 p-6 transition-all">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="bg-primary/10 group-hover:bg-primary/20 rounded-lg p-2 transition-colors">
                      <item.icon className="text-primary h-5 w-5" />
                    </div>
                    <Badge variant="secondary">{item.time}</Badge>
                  </div>
                  <h3 className="group-hover:text-primary mb-2 font-semibold transition-colors">
                    {item.title}
                  </h3>
                  <ArrowRight className="text-muted-foreground h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-2xl font-bold sm:text-3xl md:text-4xl">
              Browse Documentation
            </h2>
          </motion.div>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
            {categories.map((category, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="group border-border/50 hover:border-primary/50 h-full border-2 p-6 transition-all">
                  <div className="bg-primary/10 mb-4 w-fit rounded-xl p-3 transition-transform group-hover:scale-110">
                    <category.icon className="text-primary h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold">{category.title}</h3>
                  <p className="text-muted-foreground mb-4">
                    {category.description}
                  </p>
                  <ul className="space-y-2">
                    {category.articles.map((article, i) => (
                      <li
                        key={i}
                        className="text-muted-foreground hover:text-primary flex cursor-pointer items-center gap-2 text-sm transition-colors"
                      >
                        <ArrowRight className="h-3 w-3" />
                        {article}
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="from-primary/10 via-accent/10 to-secondary/10 bg-gradient-to-br px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <HelpCircle className="text-primary mx-auto mb-4 h-12 w-12" />
            <h2 className="mb-4 text-2xl font-bold sm:text-3xl md:text-4xl">
              Need Help?
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Can't find what you're looking for? Our support team is here to
              help.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link to="/help">Visit Help Center</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/contact-sales">Contact Support</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

const DocumentationPageWithErrorBoundary: React.FC = () => (
  <ErrorBoundary componentName="DocumentationPage" showReportDialog>
    <DocumentationPage />
  </ErrorBoundary>
);

export default DocumentationPageWithErrorBoundary;
