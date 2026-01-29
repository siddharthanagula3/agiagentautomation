import React from 'react';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';
import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import { Card } from '@shared/ui/card';
import {
  Rocket,
  Users,
  Brain,
  ShieldCheck,
  Sparkles,
  Laptop,
  Umbrella,
  HeartHandshake,
  Globe2,
  Mail,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';

const MAILTO =
  'mailto:contact@agiagentautomation.com?subject=Career%20Enquiry%20-%20AGI%20Agent%20Automation';

const roles = [
  {
    title: 'AI Engineer',
    location: 'Remote',
    type: 'Full-time',
    highlights: ['LLMs', 'Tooling', 'TypeScript/Node', 'RAG'],
  },
  {
    title: 'Frontend Engineer',
    location: 'Remote',
    type: 'Full-time',
    highlights: ['React', 'TypeScript', 'shadcn/ui', 'Vite'],
  },
  {
    title: 'Product Designer',
    location: 'Remote',
    type: 'Contract / Full-time',
    highlights: ['Design Systems', 'Prototyping', 'Motion'],
  },
];

const benefits = [
  {
    icon: <Umbrella className="h-5 w-5" />,
    title: 'Flexible PTO',
    text: 'Rest and recharge when you need it.',
  },
  {
    icon: <Laptop className="h-5 w-5" />,
    title: 'Remote First',
    text: 'Work from anywhere, async-friendly.',
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: 'Top-tier Equipment',
    text: 'We provide a great setup.',
  },
  {
    icon: <HeartHandshake className="h-5 w-5" />,
    title: 'Wellbeing',
    text: 'Health-first culture and support.',
  },
  {
    icon: <Globe2 className="h-5 w-5" />,
    title: 'Global Team',
    text: 'Collaborate with diverse experts.',
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: 'Growth',
    text: 'Conference, courses, and learning budget.',
  },
];

const steps = [
  { title: 'Apply', text: 'Send us your resume and portfolio / GitHub.' },
  {
    title: 'Intro Call',
    text: 'Quick alignment on role, interests, and timing.',
  },
  {
    title: 'Practical Exercise',
    text: 'Role-relevant task or paired session.',
  },
  { title: 'Team Chat', text: 'Meet future collaborators and leadership.' },
  { title: 'Offer', text: 'We move fast—clear, transparent offers.' },
];

const Careers: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-20">
        <div className="gradient-primary absolute inset-0 opacity-10" />
        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Badge className="glass mb-4 px-4 py-2">
              <Rocket className="mr-2 h-4 w-4" />
              We&apos;re hiring
            </Badge>
            <h1 className="mx-auto mb-4 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
              Build the Future of AI Employees
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
              Join a product-led, remote-first team shipping delightful AI
              experiences at scale.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button asChild size="lg" className="gradient-primary text-white">
                <a href={MAILTO}>
                  <Mail className="mr-2 h-4 w-4" />
                  Mail your resume
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="glass">
                <a href="/about">
                  Learn about us
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Open Roles */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">Open Roles</h2>
              <p className="text-muted-foreground">
                We hire exceptional people. Don&apos;t see a fit? Send a general
                application.
              </p>
            </div>
            <Badge variant="secondary" className="hidden md:inline-flex">
              <Users className="mr-2 h-4 w-4" />
              Remote-friendly
            </Badge>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <Card
                key={role.title}
                className="group h-full border-2 border-border/50 p-6 transition-colors hover:border-primary/40"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{role.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {role.location} • {role.type}
                    </p>
                  </div>
                  <Badge className="bg-primary/10 text-primary">Hiring</Badge>
                </div>
                <div className="mb-5 flex flex-wrap gap-2">
                  {role.highlights.map((h) => (
                    <span
                      key={h}
                      className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground"
                    >
                      {h}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Brain className="h-4 w-4" />
                    Impact-focused
                  </div>
                  <Button
                    asChild
                    size="sm"
                    className="btn-glow gradient-primary text-white"
                  >
                    <a href={MAILTO}>Apply via Email</a>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-3xl font-bold">Benefits & Culture</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => (
              <Card
                key={b.title}
                className="h-full border-2 border-border/50 p-6"
              >
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {b.icon}
                </div>
                <h3 className="mb-1 text-base font-semibold">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-3xl font-bold">Hiring Process</h2>
          <div className="grid gap-6 md:grid-cols-5">
            {steps.map((s, idx) => (
              <Card
                key={s.title}
                className="h-full border-2 border-border/50 p-6"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-semibold">{s.title}</span>
                </div>
                <p className="text-sm text-muted-foreground">{s.text}</p>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button asChild size="lg" className="gradient-primary text-white">
              <a href={MAILTO}>
                <Mail className="mr-2 h-4 w-4" />
                Mail your resume to contact@agiagentautomation.com
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

const CareersWithErrorBoundary: React.FC = () => (
  <ErrorBoundary componentName="Careers" showReportDialog>
    <Careers />
  </ErrorBoundary>
);

export default CareersWithErrorBoundary;
