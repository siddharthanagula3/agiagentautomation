import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Particles } from '@/components/ui/particles';
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
    <div className="min-h-screen bg-background">
      <Particles className="absolute inset-0 -z-10" quantity={40} />

      <section className="px-4 pb-20 pt-32 sm:px-6 lg:px-8">
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
            <h1 className="mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-5xl font-bold text-transparent md:text-7xl">
              Everything You Need to Know
            </h1>
            <p className="mb-8 text-xl text-muted-foreground">
              Comprehensive guides, tutorials, and API documentation to help you
              build with AGI Agent
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                asChild
                className="bg-gradient-to-r from-primary to-accent"
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
            <h2 className="mb-4 text-4xl font-bold">Quick Start</h2>
            <p className="text-xl text-muted-foreground">
              Get up and running in minutes
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {quickStart.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="group cursor-pointer border-2 border-border/50 p-6 transition-all hover:border-primary/50">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2 transition-colors group-hover:bg-primary/20">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="secondary">{item.time}</Badge>
                  </div>
                  <h3 className="mb-2 font-semibold transition-colors group-hover:text-primary">
                    {item.title}
                  </h3>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
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
            <h2 className="mb-4 text-4xl font-bold">Browse Documentation</h2>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="group h-full border-2 border-border/50 p-6 transition-all hover:border-primary/50">
                  <div className="mb-4 w-fit rounded-xl bg-primary/10 p-3 transition-transform group-hover:scale-110">
                    <category.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold">{category.title}</h3>
                  <p className="mb-4 text-muted-foreground">
                    {category.description}
                  </p>
                  <ul className="space-y-2">
                    {category.articles.map((article, i) => (
                      <li
                        key={i}
                        className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
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

      <section className="bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <HelpCircle className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h2 className="mb-4 text-4xl font-bold">Need Help?</h2>
            <p className="mb-8 text-lg text-muted-foreground">
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

export default DocumentationPage;
