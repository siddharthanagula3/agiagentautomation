import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Server,
  Shield,
  Zap,
  Clock,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import { Button } from '@shared/ui/button';
import { Particles } from '@shared/ui/particles';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@shared/stores/authentication-store';

const ITServiceProvidersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleStartTrial = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  const handleScheduleDemo = () => {
    navigate('/demo');
  };
  const benefits = [
    {
      icon: Clock,
      title: 'Resolve Tickets 5x Faster',
      description:
        'AI employees instantly categorize, prioritize, and resolve tier-1 tickets with 95% accuracy.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Server,
      title: '24/7 System Monitoring',
      description:
        'Never miss an incident. AI monitors infrastructure and alerts your team before issues escalate.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Shield,
      title: 'Proactive Security',
      description:
        'Automated threat detection, vulnerability scanning, and compliance monitoring.',
      color: 'from-red-500 to-orange-500',
    },
    {
      icon: BarChart3,
      title: 'Real-Time Analytics',
      description:
        'AI-powered dashboards with predictive insights on system health and resource utilization.',
      color: 'from-green-500 to-emerald-500',
    },
  ];

  const useCases = [
    {
      title: 'Help Desk Automation',
      description:
        'AI employees handle password resets, software installations, VPN access, and common IT requests.',
      metrics: [
        '80% ticket auto-resolution',
        '<2 min avg response',
        '95% user satisfaction',
      ],
    },
    {
      title: 'Incident Management',
      description:
        'Automatically detect, categorize, route, and track incidents with intelligent escalation protocols.',
      metrics: ['60% faster MTTR', 'Zero missed alerts', 'Full audit trails'],
    },
    {
      title: 'Asset & License Management',
      description:
        'Track hardware, software licenses, renewals, and compliance automatically.',
      metrics: [
        '100% asset visibility',
        '$50K+ license savings',
        'Zero compliance gaps',
      ],
    },
    {
      title: 'Security Operations',
      description:
        'Continuous security monitoring, threat detection, patch management, and vulnerability assessments.',
      metrics: [
        '24/7 monitoring',
        '99.9% threat detection',
        'Automated patching',
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
                <Server size={16} />
                For IT Service Providers
              </div>
              <h1 className="mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-3xl font-bold text-transparent sm:text-4xl md:text-5xl lg:text-6xl">
                Replace $75K IT Techs with $29/Month AI ($24.99/month if billed
                yearly)
              </h1>
              <p className="mb-4 text-2xl font-semibold text-foreground">
                Save 99.7% • Serve 10x More Clients • 24/7 Coverage
              </p>
              <p className="mb-8 text-xl text-muted-foreground">
                Why pay $75K+/year per tech when AI employees handle tier-1
                support, monitoring, and incident management for $29/month
                ($24.99/month if billed yearly)? Scale your MSP infinitely
                without hiring. Your human experts focus only on complex
                escalations.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent"
                  onClick={handleStartTrial}
                  aria-label={
                    user
                      ? 'Go to your dashboard'
                      : 'Start free trial of AI employees for IT service providers'
                  }
                >
                  {user ? 'Go to Dashboard' : 'Start Free Trial'}
                  <ArrowRight className="ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleScheduleDemo}
                  aria-label="Schedule a demonstration of AI employees for IT services"
                >
                  Schedule Demo
                </Button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <img
                src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=600&fit=crop"
                alt="IT professionals managing server infrastructure and network operations"
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
            Transform Your IT Operations
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
            AI for Every IT Function
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
              Ready to Scale Your IT Services?
            </h2>
            <p className="mb-8 text-xl opacity-90">
              Join 500+ IT providers using AI to deliver better service at lower
              cost
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={handleStartTrial}
              aria-label={
                user
                  ? 'Go to your dashboard'
                  : 'Start free trial to scale your IT services'
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

export default ITServiceProvidersPage;
