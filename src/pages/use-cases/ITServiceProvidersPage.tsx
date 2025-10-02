import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Server, Shield, Zap, Clock, CheckCircle2, ArrowRight, AlertTriangle, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import { Particles } from '@/components/ui/particles';

const ITServiceProvidersPage: React.FC = () => {
  const benefits = [
    {
      icon: Clock,
      title: 'Resolve Tickets 5x Faster',
      description: 'AI employees instantly categorize, prioritize, and resolve tier-1 tickets with 95% accuracy.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Server,
      title: '24/7 System Monitoring',
      description: 'Never miss an incident. AI monitors infrastructure and alerts your team before issues escalate.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Shield,
      title: 'Proactive Security',
      description: 'Automated threat detection, vulnerability scanning, and compliance monitoring.',
      color: 'from-red-500 to-orange-500'
    },
    {
      icon: BarChart3,
      title: 'Real-Time Analytics',
      description: 'AI-powered dashboards with predictive insights on system health and resource utilization.',
      color: 'from-green-500 to-emerald-500'
    }
  ];

  const useCases = [
    {
      title: 'Help Desk Automation',
      description: 'AI employees handle password resets, software installations, VPN access, and common IT requests.',
      metrics: ['80% ticket auto-resolution', '<2 min avg response', '95% user satisfaction']
    },
    {
      title: 'Incident Management',
      description: 'Automatically detect, categorize, route, and track incidents with intelligent escalation protocols.',
      metrics: ['60% faster MTTR', 'Zero missed alerts', 'Full audit trails']
    },
    {
      title: 'Asset & License Management',
      description: 'Track hardware, software licenses, renewals, and compliance automatically.',
      metrics: ['100% asset visibility', '$50K+ license savings', 'Zero compliance gaps']
    },
    {
      title: 'Security Operations',
      description: 'Continuous security monitoring, threat detection, patch management, and vulnerability assessments.',
      metrics: ['24/7 monitoring', '99.9% threat detection', 'Automated patching']
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
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
                <Server size={16} />
                For IT Service Providers
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary">
                Automate IT Operations End-to-End
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Handle 10x more clients with the same team. AI employees manage help desk, monitoring, security, and operations 24/7.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-gradient-to-r from-primary to-accent">
                  Start Free Trial
                  <ArrowRight className="ml-2" />
                </Button>
                <Button size="lg" variant="outline">Schedule Demo</Button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <img
                src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=600&fit=crop"
                alt="IT Operations"
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
            Transform Your IT Operations
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
            AI for Every IT Function
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

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl bg-gradient-to-r from-primary via-accent to-secondary p-12 text-center text-white"
          >
            <h2 className="text-4xl font-bold mb-4">Ready to Scale Your IT Services?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join 500+ IT providers using AI to deliver better service at lower cost
            </p>
            <Button size="lg" variant="secondary">Start Free Trial</Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ITServiceProvidersPage;
