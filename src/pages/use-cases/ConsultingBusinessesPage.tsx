import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, FileText, Users, Clock, CheckCircle2, ArrowRight, BarChart3, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Particles } from '@/components/ui/particles';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/unified-auth-store';

const ConsultingBusinessesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleStartTrial = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  const handleWatchDemo = () => {
    navigate('/demo');
  };
  const benefits = [
    {
      icon: Clock,
      title: 'Serve 3x More Clients',
      description: 'AI employees handle research, data analysis, report generation, and client communication.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Briefcase,
      title: 'Deliver Projects Faster',
      description: 'Automate proposal creation, project tracking, deliverable generation, and invoicing.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: BarChart3,
      title: 'Increase Profit Margins',
      description: 'Reduce project overhead by 60% while maintaining high-quality deliverables.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Lightbulb,
      title: 'Focus on Strategy',
      description: 'Let AI handle operations while your consultants focus on high-value strategic work.',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const useCases = [
    {
      title: 'Client Onboarding & Management',
      description: 'Automated intake forms, kickoff decks, client portal setup, and ongoing communication.',
      metrics: ['50% faster onboarding', 'Zero manual admin', '24/7 client support']
    },
    {
      title: 'Research & Analysis',
      description: 'AI conducts market research, competitive analysis, data collection, and preliminary insights.',
      metrics: ['10x faster research', 'Comprehensive reports', 'Real-time updates']
    },
    {
      title: 'Proposal & Report Generation',
      description: 'Auto-generate proposals, executive summaries, detailed reports, and presentations from templates.',
      metrics: ['90% time savings', 'Consistent quality', 'On-brand deliverables']
    },
    {
      title: 'Project & Time Tracking',
      description: 'Automated time logging, milestone tracking, budget monitoring, and client billing.',
      metrics: ['100% billable capture', 'Real-time dashboards', 'Automated invoicing']
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Particles className="absolute inset-0 -z-10" quantity={50} staticity={40} />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Briefcase size={16} />
                For Consulting Businesses
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary">
                Scale Your Consulting Practice with AI
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Automate research, reporting, client management, and operations. Serve more clients without growing headcount.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-gradient-to-r from-primary to-accent" onClick={handleStartTrial}>
                  {user ? 'Go to Dashboard' : 'Start Free Trial'}
                  <ArrowRight className="ml-2" />
                </Button>
                <Button size="lg" variant="outline" onClick={handleWatchDemo}>Watch Demo</Button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <img
                src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop"
                alt="Consulting"
                className="rounded-3xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-16"
          >
            Why Consultants Choose AI Employees
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="rounded-2xl bg-background/60 backdrop-blur-xl border border-border/40 p-8"
                  whileHover={{ y: -8 }}
                >
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${benefit.color} text-white mb-4`}>
                    <Icon size={28} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-accent/5">
        <div className="container mx-auto max-w-7xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-16"
          >
            AI for Every Consulting Function
          </motion.h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {useCases.map((useCase, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-2xl bg-background/60 backdrop-blur-xl border border-border/40 p-6"
              >
                <h3 className="text-xl font-bold mb-3">{useCase.title}</h3>
                <p className="text-muted-foreground mb-4">{useCase.description}</p>
                <div className="space-y-2">
                  {useCase.metrics.map((metric, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 size={16} className="text-green-500" />
                      <span>{metric}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Consulting Types */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-16"
          >
            Perfect for All Consulting Types
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { type: 'Management Consulting', use: 'Strategy decks, market analysis, financial models' },
              { type: 'IT Consulting', use: 'System audits, tech stack reports, implementation plans' },
              { type: 'HR Consulting', use: 'Employee surveys, org charts, training materials' },
              { type: 'Marketing Consulting', use: 'Campaign analysis, content calendars, performance reports' },
              { type: 'Financial Consulting', use: 'Financial models, audit reports, compliance docs' },
              { type: 'Operations Consulting', use: 'Process maps, efficiency reports, SOP documentation' }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-2xl bg-background/60 backdrop-blur-xl border border-border/40 p-6"
              >
                <h3 className="text-lg font-bold mb-2">{item.type}</h3>
                <p className="text-sm text-muted-foreground">{item.use}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl bg-background/60 backdrop-blur-xl border border-border/40 p-12"
          >
            <div className="text-4xl mb-6 opacity-20">"</div>
            <p className="text-2xl font-medium mb-8">
              AI employees create all our client reports, research briefs, and project documentation. We tripled our client base without hiring a single analyst.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-4xl">👩‍💼</span>
              <div>
                <div className="font-bold">Jennifer Adams</div>
                <div className="text-sm text-muted-foreground">Managing Partner, Apex Consulting</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl bg-gradient-to-r from-primary via-accent to-secondary p-12 text-center text-white"
          >
            <h2 className="text-4xl font-bold mb-4">Ready to Scale Your Practice?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join 800+ consulting firms using AI to serve more clients profitably
            </p>
            <Button size="lg" variant="secondary" onClick={handleStartTrial}>
              {user ? 'Go to Dashboard' : 'Start Free Trial'}
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ConsultingBusinessesPage;
