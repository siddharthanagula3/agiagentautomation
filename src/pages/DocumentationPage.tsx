import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import { Particles } from '@/components/ui/particles';
import { BookOpen, Code, Rocket, Zap, ArrowRight, FileText, Video, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const DocumentationPage: React.FC = () => {
  const quickStart = [
    { title: 'Create Your First AI Employee', time: '5 min', icon: Rocket },
    { title: 'Build Your First Workflow', time: '10 min', icon: Zap },
    { title: 'Connect Integrations', time: '15 min', icon: Code },
    { title: 'Deploy to Production', time: '20 min', icon: FileText }
  ];

  const categories = [
    {
      title: 'Getting Started',
      description: 'Learn the basics and set up your account',
      icon: Rocket,
      articles: ['Quick Start Guide', 'Account Setup', 'Dashboard Overview', 'First AI Employee']
    },
    {
      title: 'AI Employees',
      description: 'Create and manage your AI workforce',
      icon: BookOpen,
      articles: ['Creating AI Employees', 'Training & Customization', 'Employee Management', 'Best Practices']
    },
    {
      title: 'Workflows',
      description: 'Automate tasks with visual workflows',
      icon: Zap,
      articles: ['Workflow Builder', 'Triggers & Actions', 'Conditional Logic', 'Error Handling']
    },
    {
      title: 'Integrations',
      description: 'Connect with your favorite tools',
      icon: Code,
      articles: ['Available Integrations', 'API Setup', 'Webhooks', 'Custom Integrations']
    },
    {
      title: 'API Reference',
      description: 'Build with our REST API',
      icon: FileText,
      articles: ['Authentication', 'Endpoints', 'SDKs', 'Rate Limits']
    },
    {
      title: 'Video Tutorials',
      description: 'Watch and learn',
      icon: Video,
      articles: ['Platform Overview', 'Advanced Workflows', 'Integration Tutorials', 'Tips & Tricks']
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Particles className="absolute inset-0 -z-10" quantity={40} />

      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 glass px-6 py-2">
              <BookOpen className="mr-2 h-4 w-4" />
              Documentation
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary">
              Everything You Need to Know
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Comprehensive guides, tutorials, and API documentation to help you build with AGI Agent
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="bg-gradient-to-r from-primary to-accent">
                <Link to="#quick-start">Quick Start Guide</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/api-reference">API Reference</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="quick-start" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Quick Start</h2>
            <p className="text-xl text-muted-foreground">Get up and running in minutes</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickStart.map((item, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}>
                <Card className="p-6 border-2 border-border/50 hover:border-primary/50 transition-all cursor-pointer group">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="secondary">{item.time}</Badge>
                  </div>
                  <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Browse Documentation</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}>
                <Card className="p-6 h-full border-2 border-border/50 hover:border-primary/50 transition-all group">
                  <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4 group-hover:scale-110 transition-transform">
                    <category.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{category.title}</h3>
                  <p className="text-muted-foreground mb-4">{category.description}</p>
                  <ul className="space-y-2">
                    {category.articles.map((article, i) => (
                      <li key={i} className="text-sm text-muted-foreground hover:text-primary cursor-pointer transition-colors flex items-center gap-2">
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

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <HelpCircle className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h2 className="text-4xl font-bold mb-4">Need Help?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
