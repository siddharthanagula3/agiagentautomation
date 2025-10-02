import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  BookOpen,
  FileText,
  Video,
  Download,
  ArrowRight,
  Zap,
  Layers,
  Code,
  Briefcase,
  Users,
  TrendingUp,
  Settings,
  PlayCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import { Particles } from '@/components/ui/particles';

interface Resource {
  id: number;
  title: string;
  description: string;
  type: 'Guide' | 'Template' | 'Video' | 'Ebook' | 'Webinar';
  category: string;
  duration?: string;
  downloadCount?: string;
  icon: React.ElementType;
  color: string;
  thumbnail?: string;
}

const ResourcesPage: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string>('All');

  const resourceTypes = [
    { name: 'All', count: 18 },
    { name: 'Guide', count: 8 },
    { name: 'Template', count: 4 },
    { name: 'Video', count: 3 },
    { name: 'Ebook', count: 2 },
    { name: 'Webinar', count: 1 }
  ];

  const resources: Resource[] = [
    {
      id: 1,
      title: 'The Complete Guide to AI Employee Implementation',
      description: 'Step-by-step framework for integrating AI employees into your organization, from planning to scaling.',
      type: 'Ebook',
      category: 'Getting Started',
      downloadCount: '2.4k',
      icon: BookOpen,
      color: 'from-blue-500 to-cyan-500',
      thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop'
    },
    {
      id: 2,
      title: 'AI Workflow Automation Templates',
      description: 'Pre-built templates for common workflows: customer support, sales outreach, data processing, and more.',
      type: 'Template',
      category: 'Automation',
      downloadCount: '1.8k',
      icon: Layers,
      color: 'from-purple-500 to-pink-500',
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop'
    },
    {
      id: 3,
      title: 'Getting Started with AI Chat',
      description: 'Learn how to configure and deploy AI chat agents for customer support and internal communication.',
      type: 'Guide',
      category: 'AI Chat',
      duration: '15 min read',
      icon: Zap,
      color: 'from-green-500 to-emerald-500',
      thumbnail: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=600&h=400&fit=crop'
    },
    {
      id: 4,
      title: 'Building Custom Integrations',
      description: 'Developer guide to integrating AGI Agent with your existing tech stack using our API and webhooks.',
      type: 'Guide',
      category: 'Development',
      duration: '25 min read',
      icon: Code,
      color: 'from-orange-500 to-red-500',
      thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop'
    },
    {
      id: 5,
      title: 'AI Project Management Best Practices',
      description: 'Maximize your AI project manager\'s effectiveness with proven strategies and configuration tips.',
      type: 'Guide',
      category: 'Project Management',
      duration: '12 min read',
      icon: Briefcase,
      color: 'from-indigo-500 to-purple-500',
      thumbnail: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=400&fit=crop'
    },
    {
      id: 6,
      title: 'Sales Team Onboarding Template',
      description: 'Complete onboarding package for sales teams adopting AI employees, including training materials and workflows.',
      type: 'Template',
      category: 'Sales',
      downloadCount: '956',
      icon: TrendingUp,
      color: 'from-yellow-500 to-orange-500',
      thumbnail: 'https://images.unsplash.com/photo-1553484771-371a605b060b?w=600&h=400&fit=crop'
    },
    {
      id: 7,
      title: 'Dashboard Configuration Masterclass',
      description: 'Video walkthrough of creating custom AI dashboards with advanced analytics and real-time insights.',
      type: 'Video',
      category: 'Analytics',
      duration: '42 min',
      icon: PlayCircle,
      color: 'from-teal-500 to-cyan-500',
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop'
    },
    {
      id: 8,
      title: 'Team Collaboration Playbook',
      description: 'Strategies for seamless human-AI team collaboration, communication protocols, and task delegation.',
      type: 'Guide',
      category: 'Team Management',
      duration: '18 min read',
      icon: Users,
      color: 'from-pink-500 to-rose-500',
      thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop'
    },
    {
      id: 9,
      title: 'IT Service Automation Template Pack',
      description: 'Ready-to-deploy templates for IT teams: ticket routing, system monitoring, incident response.',
      type: 'Template',
      category: 'IT Operations',
      downloadCount: '742',
      icon: Settings,
      color: 'from-gray-500 to-slate-500',
      thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&h=400&fit=crop'
    },
    {
      id: 10,
      title: 'Advanced Workflow Optimization',
      description: 'Deep dive into optimizing AI workflows for maximum efficiency, error handling, and performance.',
      type: 'Guide',
      category: 'Automation',
      duration: '30 min read',
      icon: Zap,
      color: 'from-violet-500 to-purple-500',
      thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop'
    },
    {
      id: 11,
      title: 'ROI Calculator Template',
      description: 'Calculate the financial impact of AI employees on your business with this comprehensive spreadsheet.',
      type: 'Template',
      category: 'Business',
      downloadCount: '1.2k',
      icon: TrendingUp,
      color: 'from-green-500 to-teal-500',
      thumbnail: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&h=400&fit=crop'
    },
    {
      id: 12,
      title: 'AI Security & Compliance Guide',
      description: 'Ensure your AI implementation meets security standards and regulatory compliance requirements.',
      type: 'Guide',
      category: 'Security',
      duration: '20 min read',
      icon: FileText,
      color: 'from-red-500 to-orange-500',
      thumbnail: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop'
    },
    {
      id: 13,
      title: 'Scaling AI Operations Webinar',
      description: 'Live webinar recording: Lessons from companies that scaled from 10 to 1000+ AI employees.',
      type: 'Webinar',
      category: 'Scaling',
      duration: '65 min',
      icon: Video,
      color: 'from-blue-500 to-indigo-500',
      thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop'
    },
    {
      id: 14,
      title: 'Integration Setup Video Tutorial',
      description: 'Visual guide to connecting AGI Agent with Slack, Salesforce, HubSpot, and 50+ other tools.',
      type: 'Video',
      category: 'Integrations',
      duration: '28 min',
      icon: PlayCircle,
      color: 'from-cyan-500 to-blue-500',
      thumbnail: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=400&fit=crop'
    },
    {
      id: 15,
      title: 'Customer Success Playbook',
      description: 'Comprehensive guide for customer success teams leveraging AI to deliver exceptional experiences.',
      type: 'Ebook',
      category: 'Customer Success',
      downloadCount: '892',
      icon: BookOpen,
      color: 'from-purple-500 to-violet-500',
      thumbnail: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=600&h=400&fit=crop'
    },
    {
      id: 16,
      title: 'Quick Start Guide for Startups',
      description: 'Get up and running in 48 hours: Essential setup steps for startup founders.',
      type: 'Guide',
      category: 'Getting Started',
      duration: '10 min read',
      icon: Zap,
      color: 'from-yellow-500 to-amber-500',
      thumbnail: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&h=400&fit=crop'
    },
    {
      id: 17,
      title: 'Consulting Business Template Suite',
      description: 'Everything consulting businesses need: client onboarding, project templates, reporting dashboards.',
      type: 'Template',
      category: 'Consulting',
      downloadCount: '567',
      icon: Briefcase,
      color: 'from-slate-500 to-gray-500',
      thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop'
    },
    {
      id: 18,
      title: 'Troubleshooting Common Issues',
      description: 'Solutions to the most frequently encountered problems when working with AI employees.',
      type: 'Guide',
      category: 'Support',
      duration: '8 min read',
      icon: FileText,
      color: 'from-orange-500 to-yellow-500',
      thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop'
    }
  ];

  const filteredResources = selectedType === 'All'
    ? resources
    : resources.filter(r => r.type === selectedType);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Particles className="absolute inset-0 -z-10" quantity={40} staticity={40} />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary">
              Resources & Learning Center
            </h1>
            <p className="text-xl text-muted-foreground">
              Everything you need to master AI automation and build your AI workforce
            </p>
          </motion.div>
        </div>
      </section>

      {/* Resource Type Filters */}
      <section className="pb-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-wrap gap-3 justify-center"
          >
            {resourceTypes.map((type, idx) => (
              <motion.button
                key={type.name}
                onClick={() => setSelectedType(type.name)}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
                  selectedType === type.name
                    ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg scale-105'
                    : 'bg-background/60 backdrop-blur-xl border border-border/40 text-foreground/80 hover:border-primary/50'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                {type.name}
                <span className="ml-2 text-xs opacity-70">({type.count})</span>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Resource */}
      <section className="pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <FeaturedResourceCard resource={resources[0]} />
        </div>
      </section>

      {/* Resource Grid */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredResources.slice(1).map((resource, idx) => (
              <ResourceCard key={resource.id} resource={resource} index={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 backdrop-blur-xl border border-border/40 p-12 text-center"
          >
            <h2 className="text-3xl font-bold mb-4">Need Custom Resources?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Our team can create tailored guides, templates, and training materials for your specific use case.
            </p>
            <Button className="bg-gradient-to-r from-primary to-accent" size="lg">
              Contact Our Team
              <ArrowRight className="ml-2" size={18} />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

const FeaturedResourceCard: React.FC<{ resource: Resource }> = ({ resource }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const Icon = resource.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-3xl bg-background/60 backdrop-blur-xl border border-border/40 hover:border-primary/50 transition-all group"
    >
      <div className="grid md:grid-cols-2 gap-0">
        <div className="relative h-64 md:h-full overflow-hidden">
          {resource.thumbnail && (
            <img
              src={resource.thumbnail}
              alt={resource.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-primary to-accent text-white">
              Featured
            </span>
          </div>
        </div>
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${resource.color} text-white`}>
              <Icon size={24} />
            </div>
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              {resource.type}
            </span>
          </div>
          <h2 className="text-3xl font-bold mb-4 group-hover:text-primary transition-colors">
            {resource.title}
          </h2>
          <p className="text-muted-foreground mb-6">
            {resource.description}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            <span className="flex items-center gap-1">
              <Download size={14} />
              {resource.downloadCount} downloads
            </span>
          </div>
          <Button className="w-fit bg-gradient-to-r from-primary to-accent">
            Download Now
            <Download className="ml-2" size={16} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

const ResourceCard: React.FC<{ resource: Resource; index: number }> = ({ resource, index }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const Icon = resource.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="relative overflow-hidden rounded-2xl bg-background/60 backdrop-blur-xl border border-border/40 hover:border-primary/50 transition-all group cursor-pointer"
      whileHover={{ y: -8 }}
    >
      <div className="relative h-40 overflow-hidden">
        {resource.thumbnail && (
          <img
            src={resource.thumbnail}
            alt={resource.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-60" />
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 rounded-full bg-background/80 backdrop-blur-xl text-xs font-medium text-foreground">
            {resource.type}
          </span>
        </div>
        <div className={`absolute bottom-3 right-3 p-2 rounded-lg bg-gradient-to-br ${resource.color} text-white`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {resource.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {resource.description}
        </p>
        <div className="flex items-center justify-between pt-4 border-t border-border/40">
          <div className="text-xs text-muted-foreground">
            {resource.duration && (
              <span className="flex items-center gap-1">
                <FileText size={12} />
                {resource.duration}
              </span>
            )}
            {resource.downloadCount && (
              <span className="flex items-center gap-1">
                <Download size={12} />
                {resource.downloadCount}
              </span>
            )}
          </div>
          <ArrowRight size={18} className="text-primary group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </motion.div>
  );
};

export default ResourcesPage;
