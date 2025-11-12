import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { Particles } from '@shared/ui/particles';
import { SEOHead } from '@shared/components/seo/SEOHead';
import {
  Target,
  Rocket,
  Users,
  Heart,
  Globe,
  TrendingUp,
  Award,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutPage: React.FC = () => {
  const stats = [
    { label: 'Cost Savings vs Humans', value: '99.8%', icon: TrendingUp },
    { label: 'AI Employees Hired', value: '50,000+', icon: Users },
    { label: 'Money Saved for Businesses', value: '$500M+', icon: Award },
    { label: 'Countries Served', value: '120+', icon: Globe },
  ];

  const values = [
    {
      icon: Target,
      title: 'Cost Savings First',
      description:
        '99.8% reduction in payroll costs - Hire Free AI Employees, pay only for tokens. Free: 1M tokens/month. Pro: 10M tokens/month for $29/month',
    },
    {
      icon: Zap,
      title: 'Instant Results',
      description:
        'Hire in 60 seconds, not 60 days. Natural language interface—no coding required',
    },
    {
      icon: Heart,
      title: 'Transparent Pricing',
      description:
        'Market-rate tokens. No hidden fees. Free Forever plan to start.',
    },
    {
      icon: Award,
      title: 'Enterprise Security',
      description:
        'Supabase-powered infrastructure with SOC 2 compliance and end-to-end encryption',
    },
  ];

  const team = [
    {
      name: 'Siddhartha Nagula',
      role: 'Founder & CEO',
      bio: 'On a mission to end the $100K employee era. Former AI researcher with 10+ years making AI accessible and affordable for businesses of all sizes.',
      avatar: '👨‍💼',
    },
    {
      name: 'Alex Chen',
      role: 'CTO',
      bio: 'Built the Supabase-powered infrastructure enabling 50,000+ AI employees to work 24/7 at enterprise scale with bank-level security.',
      avatar: '👨‍💻',
    },
    {
      name: 'Sarah Johnson',
      role: 'Head of Product',
      bio: 'Designed the natural language chat interface that makes hiring AI employees as easy as sending a text message—no coding required.',
      avatar: '👩‍🎨',
    },
    {
      name: 'Michael Rodriguez',
      role: 'Head of Engineering',
      bio: 'Architected the multi-LLM routing system that delivers GPT-4, Claude, and Gemini intelligence at market rates with full cost transparency.',
      avatar: '👨‍🔧',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="About Us | Replace $100K Employees with $19/mo AI | Save 99.8%"
        description="We're on a mission to replace expensive human employees with affordable AI employees. Save 99.8% on payroll costs. 50,000+ AI employees created, $500M+ saved for businesses worldwide."
        keywords={[
          'about agi agent automation',
          'replace human employees with ai',
          'ai workforce cost savings',
          'save money on employees',
          'ai employees cheaper than humans',
          'workforce replacement platform',
          'ai automation company',
          'payroll cost reduction ai',
        ]}
        ogType="website"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'About AGI Agent Automation',
          description:
            'Replace expensive human employees with affordable AI employees - save 99.8% on payroll costs',
          mainEntity: {
            '@type': 'Organization',
            name: 'AGI Agent Automation',
            description:
              'Complete Workforce Replacement Platform - AI Employees at 1/100th the cost',
            foundingDate: '2024',
            numberOfEmployees: '50+',
            location: {
              '@type': 'Place',
              name: 'United States',
            },
          },
        }}
      />
      <Particles
        className="absolute inset-0 -z-10"
        quantity={50}
        staticity={50}
      />

      {/* Hero Section */}
      <section className="px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl text-center"
          >
            <Badge className="glass mb-6 px-6 py-2">
              <Rocket className="mr-2 h-4 w-4" />
              About Us
            </Badge>
            <h1 className="mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-5xl font-bold text-transparent md:text-7xl">
              Replacing $100K Employees with $29/Month AI ($24.99/month if
              billed yearly)
            </h1>
            <p className="mb-8 text-xl leading-relaxed text-muted-foreground">
              We're on a mission to make world-class talent accessible to every
              business. No more $100K salaries, benefits, or sick days. Just{' '}
              <span className="font-bold text-primary">24/7 AI employees</span>{' '}
              at{' '}
              <span className="font-bold text-primary">1/100th the cost</span>.
              Simply tell them what you need in natural language—they handle
              everything.
            </p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-16 grid grid-cols-2 gap-6 md:grid-cols-4"
          >
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
                className="glass rounded-2xl border border-border/50 p-6 text-center transition-all hover:border-primary/50"
              >
                <stat.icon className="mx-auto mb-3 h-8 w-8 text-primary" />
                <div className="mb-1 text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid items-center gap-12 md:grid-cols-2"
          >
            <div>
              <Badge className="glass mb-4 px-4 py-2">
                <Target className="mr-2 h-4 w-4" />
                Our Mission
              </Badge>
              <h2 className="mb-6 text-4xl font-bold md:text-5xl">
                End the $100K Employee Era
              </h2>
              <p className="mb-6 text-lg leading-relaxed text-muted-foreground">
                We believe the old workforce model is broken. Why pay
                $100,000+/year for a human employee who works 40 hours/week when
                you can hire FREE AI employees (no cost to hire) and only pay
                for tokens used. Free plan includes 1M tokens/month, Pro plan
                ($29/month) includes 10M tokens/month. They work 24/7, never
                gets sick, and delivers expert-level work instantly?
              </p>
              <p className="mb-6 text-lg leading-relaxed text-muted-foreground">
                Our platform makes it possible to{' '}
                <span className="font-semibold text-foreground">
                  hire specialized AI employees in under 60 seconds
                </span>
                —no interviews, no onboarding, no training. Just tell them what
                you need in natural language via our chat interface, and watch
                them work.
              </p>
              <p className="text-lg leading-relaxed text-muted-foreground">
                From solo founders to Fortune 500 enterprises, we're enabling
                businesses to save 99%+ on payroll while getting better results.
                Powered by Supabase for bank-level security and the world's best
                LLMs for unmatched intelligence.
              </p>
            </div>
            <div className="relative">
              <div className="glass rounded-3xl border border-border/50 p-8">
                <div className="space-y-4">
                  {values.map((value, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-4 rounded-xl p-4 transition-colors hover:bg-accent/5"
                    >
                      <div className="rounded-lg bg-primary/10 p-2">
                        <value.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="mb-1 font-semibold">{value.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {value.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <Badge className="glass mb-4 px-4 py-2">
              <Users className="mr-2 h-4 w-4" />
              Our Team
            </Badge>
            <h2 className="mb-4 text-4xl font-bold md:text-5xl">
              Meet the Minds Behind AGI Agent
            </h2>
            <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
              A team of AI experts, engineers, and visionaries working to
              transform the future of work
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {team.map((member, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glass group rounded-2xl border border-border/50 p-6 transition-all hover:border-primary/50"
              >
                <div className="mb-4 text-6xl transition-transform group-hover:scale-110">
                  {member.avatar}
                </div>
                <h3 className="mb-1 text-xl font-bold">{member.name}</h3>
                <p className="mb-3 text-sm text-primary">{member.role}</p>
                <p className="text-sm text-muted-foreground">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-6 text-4xl font-bold md:text-5xl">
              Ready to Save 99%+ on Payroll?
            </h2>
            <p className="mb-4 text-2xl font-semibold text-foreground">
              Start Free Forever (1M tokens/month) • Upgrade to Pro ($29/month
              for 10M tokens/month)
            </p>
            <p className="mb-8 text-xl text-muted-foreground">
              Hire your first AI employee in under 60 seconds. No credit card
              required. Just tell them what you need in natural language—they
              handle everything.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                asChild
                className="bg-gradient-to-r from-primary to-accent"
              >
                <Link to="/auth/register">Start Free Forever</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
