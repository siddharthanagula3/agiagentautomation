import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Users, Zap, CheckCircle2, ArrowRight, Mail, Phone, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Particles } from '@/components/ui/particles';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/unified-auth-store';

const SalesTeamsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleStartTrial = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  const handleSeeDemo = () => {
    navigate('/demo');
  };
  const benefits = [
    {
      icon: Target,
      title: '3x More Qualified Leads',
      description: 'AI employees analyze and score leads automatically, ensuring your team focuses on high-value prospects.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Mail,
      title: 'Personalized Outreach at Scale',
      description: 'Send thousands of personalized emails, follow-ups, and messages that actually convert.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: BarChart3,
      title: '50% Higher Conversion Rates',
      description: 'AI predicts deal closure probability, suggests next-best actions, and automates pipeline management.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Zap,
      title: 'Zero Manual Data Entry',
      description: 'Automatically update CRM, log calls, track interactions, and generate reports.',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const useCases = [
    {
      title: 'Lead Qualification & Scoring',
      description: 'AI analyzes incoming leads, enriches data from public sources, scores based on fit, and routes to the right rep.',
      metrics: ['90% accurate scoring', '10x faster qualification', 'Zero lead leakage']
    },
    {
      title: 'Automated Outreach & Follow-ups',
      description: 'Personalized email sequences, LinkedIn messages, and SMS campaigns that adapt based on prospect behavior.',
      metrics: ['5x more meetings booked', '35% email open rate', 'Automated nurturing']
    },
    {
      title: 'CRM & Pipeline Management',
      description: 'Auto-update deal stages, log activities, send reminders, and forecast revenue with AI precision.',
      metrics: ['100% CRM accuracy', 'Real-time forecasts', '20 hours saved/week']
    },
    {
      title: 'Sales Intelligence & Insights',
      description: 'AI surfaces buying signals, competitor mentions, org changes, and optimal outreach timing.',
      metrics: ['Real-time alerts', 'Predictive analytics', 'Win rate insights']
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
                <TrendingUp size={16} />
                For Sales Teams
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary">
                Close More Deals with AI Sales Reps
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Automate lead qualification, outreach, follow-ups, and CRM management. Your human reps focus on closing deals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-gradient-to-r from-primary to-accent" onClick={handleStartTrial}>
                  {user ? 'Go to Dashboard' : 'Start Free Trial'}
                  <ArrowRight className="ml-2" />
                </Button>
                <Button size="lg" variant="outline" onClick={handleSeeDemo}>See Demo</Button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <img
                src="https://images.unsplash.com/photo-1553484771-371a605b060b?w=800&h=600&fit=crop"
                alt="Sales Team"
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
            Supercharge Your Sales Performance
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
            AI for the Entire Sales Cycle
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
              Our AI sales reps handle all lead qualification and outreach. Our human team closes 3x more deals because they only talk to qualified, warmed-up prospects.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-4xl">👨‍💼</span>
              <div>
                <div className="font-bold">Marcus Chen</div>
                <div className="text-sm text-muted-foreground">VP of Sales, CloudSync</div>
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
            <h2 className="text-4xl font-bold mb-4">Ready to Hit Your Sales Targets?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join 2,000+ sales teams using AI to crush their quotas
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

export default SalesTeamsPage;
