import React from 'react';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Target,
  Users,
  Zap,
  CheckCircle2,
  ArrowRight,
  Mail,
  Phone,
  BarChart3,
} from 'lucide-react';
import { Button } from '@shared/ui/button';
import { Particles } from '@shared/ui/particles';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@shared/stores/authentication-store';

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
      title: '99.7% Cost Savings',
      description:
        "Human SDR: $80K/year + $30K benefits + 20% commission = $120K+/year. AI SDR: $228/year. That's $119,772 saved per rep.",
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Mail,
      title: 'Unlimited Personalized Outreach',
      description:
        'Send thousands of personalized emails, LinkedIn messages, and follow-ups 24/7. No fatigue, no weekends off, no burnout.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: BarChart3,
      title: '3x More Pipeline for 1/100th Cost',
      description:
        'AI qualifies leads, scores prospects, predicts deal closure, and manages pipeline—freeing your closers to focus on revenue.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Zap,
      title: 'Instant Hiring, Zero Turnover',
      description:
        'Hire in 60 seconds vs 90 days. No recruiting fees, no ramp time, no resignations. Tell them what you need in natural language—they start working.',
      color: 'from-orange-500 to-red-500',
    },
  ];

  const useCases = [
    {
      title: 'Lead Qualification & Scoring',
      description:
        'AI analyzes incoming leads, enriches data from public sources, scores based on fit, and routes to the right rep.',
      metrics: [
        '90% accurate scoring',
        '10x faster qualification',
        'Zero lead leakage',
      ],
    },
    {
      title: 'Automated Outreach & Follow-ups',
      description:
        'Personalized email sequences, LinkedIn messages, and SMS campaigns that adapt based on prospect behavior.',
      metrics: [
        '5x more meetings booked',
        '35% email open rate',
        'Automated nurturing',
      ],
    },
    {
      title: 'CRM & Pipeline Management',
      description:
        'Auto-update deal stages, log activities, send reminders, and forecast revenue with AI precision.',
      metrics: [
        '100% CRM accuracy',
        'Real-time forecasts',
        '20 hours saved/week',
      ],
    },
    {
      title: 'Sales Intelligence & Insights',
      description:
        'AI surfaces buying signals, competitor mentions, org changes, and optimal outreach timing.',
      metrics: [
        'Real-time alerts',
        'Predictive analytics',
        'Win rate insights',
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
                <TrendingUp size={16} />
                For Sales Teams
              </div>
              <h1 className="mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-3xl font-bold text-transparent sm:text-4xl md:text-5xl lg:text-6xl">
                Replace $80K+ Sales Reps with $29/Month AI ($24.99/month if
                billed yearly)
              </h1>
              <p className="mb-4 text-2xl font-semibold text-foreground">
                Save 99.7% • Work 24/7 • No Commission Needed
              </p>
              <p className="mb-8 text-xl text-muted-foreground">
                Automate lead qualification, personalized outreach, follow-ups,
                and CRM management. AI sales reps work around the clock for less
                than a coffee subscription. Your human closers focus only on hot
                deals.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent"
                  onClick={handleStartTrial}
                >
                  {user ? 'Go to Dashboard' : 'Start Free Trial'}
                  <ArrowRight className="ml-2" />
                </Button>
                <Button size="lg" variant="outline" onClick={handleSeeDemo}>
                  See Demo
                </Button>
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
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 text-center text-2xl font-bold sm:mb-12 sm:text-3xl md:text-4xl"
          >
            Supercharge Your Sales Performance
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
            AI for the Entire Sales Cycle
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

      {/* Testimonial */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-border/40 bg-background/60 p-6 backdrop-blur-xl sm:p-8 md:p-12"
          >
            <div className="mb-6 text-4xl opacity-20">"</div>
            <p className="mb-8 text-2xl font-medium">
              Our AI sales reps handle all lead qualification and outreach. Our
              human team closes 3x more deals because they only talk to
              qualified, warmed-up prospects.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-4xl">👨‍💼</span>
              <div>
                <div className="font-bold">Marcus Chen</div>
                <div className="text-sm text-muted-foreground">
                  VP of Sales, CloudSync
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
              Save $119K+ Per Sales Rep Starting Today
            </h2>
            <p className="mb-2 text-2xl font-semibold opacity-95">
              Free Forever Plan • $29/month Pro ($24.99/month if billed yearly)
              • No Credit Card Required
            </p>
            <p className="mb-8 text-xl opacity-90">
              Hire your first AI SDR in 60 seconds. Join 2,000+ sales teams
              saving millions on payroll.
            </p>
            <Button size="lg" variant="secondary" onClick={handleStartTrial}>
              {user ? 'Go to Dashboard' : 'Start Free Forever'}
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

const SalesTeamsPageWithErrorBoundary: React.FC = () => (
  <ErrorBoundary componentName="SalesTeamsPage" showReportDialog>
    <SalesTeamsPage />
  </ErrorBoundary>
);

export default SalesTeamsPageWithErrorBoundary;
