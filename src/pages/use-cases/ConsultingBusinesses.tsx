import React from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase,
  FileText,
  Users,
  Clock,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@shared/ui/button';
import { Particles } from '@shared/ui/particles';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@shared/stores/authentication-store';

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
      description:
        'AI employees handle research, data analysis, report generation, and client communication.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Briefcase,
      title: 'Deliver Projects Faster',
      description:
        'Automate proposal creation, project tracking, deliverable generation, and invoicing.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: BarChart3,
      title: 'Increase Profit Margins',
      description:
        'Reduce project overhead by 60% while maintaining high-quality deliverables.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Lightbulb,
      title: 'Focus on Strategy',
      description:
        'Let AI handle operations while your consultants focus on high-value strategic work.',
      color: 'from-orange-500 to-red-500',
    },
  ];

  const useCases = [
    {
      title: 'Client Onboarding & Management',
      description:
        'Automated intake forms, kickoff decks, client portal setup, and ongoing communication.',
      metrics: [
        '50% faster onboarding',
        'Zero manual admin',
        '24/7 client support',
      ],
    },
    {
      title: 'Research & Analysis',
      description:
        'AI conducts market research, competitive analysis, data collection, and preliminary insights.',
      metrics: [
        '10x faster research',
        'Comprehensive reports',
        'Real-time updates',
      ],
    },
    {
      title: 'Proposal & Report Generation',
      description:
        'Auto-generate proposals, executive summaries, detailed reports, and presentations from templates.',
      metrics: [
        '90% time savings',
        'Consistent quality',
        'On-brand deliverables',
      ],
    },
    {
      title: 'Project & Time Tracking',
      description:
        'Automated time logging, milestone tracking, budget monitoring, and client billing.',
      metrics: [
        '100% billable capture',
        'Real-time dashboards',
        'Automated invoicing',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Particles
        className="absolute inset-0 -z-10"
        quantity={50}
        staticity={40}
      />

      {/* Hero */}
      <section className="px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Briefcase size={16} />
                For Consulting Businesses
              </div>
              <h1 className="mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-3xl font-bold text-transparent sm:text-4xl md:text-5xl lg:text-6xl">
                Replace $120K Consultants with $29/Month AI ($24.99/month if
                billed yearly)
              </h1>
              <p className="mb-4 text-2xl font-semibold text-foreground">
                Save 99.8% • Serve 3x More Clients • Boost Margins 60%
              </p>
              <p className="mb-8 text-xl text-muted-foreground">
                Junior analysts cost $120K+/year. AI employees do research, data
                analysis, reports, and client comms for $29/month ($24.99/month
                if billed yearly). Keep senior partners billable while AI
                handles the grunt work. Tell them what you need in natural
                language—they deliver.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent"
                  onClick={handleStartTrial}
                  aria-label={
                    user
                      ? 'Go to your dashboard'
                      : 'Start free trial of AI employees for consulting businesses'
                  }
                >
                  {user ? 'Go to Dashboard' : 'Start Free Trial'}
                  <ArrowRight className="ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleWatchDemo}
                  aria-label="Watch demonstration video of AI employees for consulting"
                >
                  Watch Demo
                </Button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <img
                src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop"
                alt="Professional consulting team collaborating on business strategy and analysis"
                className="rounded-3xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 text-center text-2xl font-bold sm:mb-12 sm:text-3xl md:text-4xl"
          >
            Why Consultants Choose AI Employees
          </motion.h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="rounded-2xl border border-border/40 bg-background/60 p-8 backdrop-blur-xl"
                  whileHover={{ y: -8 }}
                >
                  <div
                    className={`inline-flex rounded-xl bg-gradient-to-br p-3 ${benefit.color} mb-4 text-white`}
                  >
                    <Icon size={28} />
                  </div>
                  <h3 className="mb-3 text-2xl font-bold">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="bg-gradient-to-b from-background to-accent/5 px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 text-center text-2xl font-bold sm:mb-12 sm:text-3xl md:text-4xl"
          >
            AI for Every Consulting Function
          </motion.h2>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {useCases.map((useCase, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur-xl"
              >
                <h3 className="mb-3 text-xl font-bold">{useCase.title}</h3>
                <p className="mb-4 text-muted-foreground">
                  {useCase.description}
                </p>
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
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 text-center text-2xl font-bold sm:mb-12 sm:text-3xl md:text-4xl"
          >
            Perfect for All Consulting Types
          </motion.h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                type: 'Management Consulting',
                use: 'Strategy decks, market analysis, financial models',
              },
              {
                type: 'IT Consulting',
                use: 'System audits, tech stack reports, implementation plans',
              },
              {
                type: 'HR Consulting',
                use: 'Employee surveys, org charts, training materials',
              },
              {
                type: 'Marketing Consulting',
                use: 'Campaign analysis, content calendars, performance reports',
              },
              {
                type: 'Financial Consulting',
                use: 'Financial models, audit reports, compliance docs',
              },
              {
                type: 'Operations Consulting',
                use: 'Process maps, efficiency reports, SOP documentation',
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur-xl"
              >
                <h3 className="mb-2 text-lg font-bold">{item.type}</h3>
                <p className="text-sm text-muted-foreground">{item.use}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-border/40 bg-background/60 p-12 backdrop-blur-xl"
          >
            <div className="mb-6 text-4xl opacity-20">"</div>
            <p className="mb-8 text-2xl font-medium">
              AI employees create all our client reports, research briefs, and
              project documentation. We tripled our client base without hiring a
              single analyst.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-4xl">👩‍💼</span>
              <div>
                <div className="font-bold">Jennifer Adams</div>
                <div className="text-sm text-muted-foreground">
                  Managing Partner, Apex Consulting
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl bg-gradient-to-r from-primary via-accent to-secondary p-6 text-center text-white sm:p-8 md:p-12"
          >
            <h2 className="mb-4 text-2xl font-bold sm:text-3xl md:text-4xl">
              Ready to Scale Your Practice?
            </h2>
            <p className="mb-8 text-xl opacity-90">
              Join 800+ consulting firms using AI to serve more clients
              profitably
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={handleStartTrial}
              aria-label={
                user
                  ? 'Go to your dashboard'
                  : 'Start free trial to scale your consulting practice'
              }
            >
              {user ? 'Go to Dashboard' : 'Start Free Trial'}
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ConsultingBusinessesPage;
