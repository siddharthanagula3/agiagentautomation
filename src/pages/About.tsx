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
    { label: 'AI Employees Created', value: '50,000+', icon: Users },
    { label: 'Hours Saved', value: '1M+', icon: TrendingUp },
    { label: 'Countries Served', value: '120+', icon: Globe },
    { label: 'Customer Satisfaction', value: '98%', icon: Heart },
  ];

  const values = [
    {
      icon: Target,
      title: 'Mission-Driven',
      description:
        'Democratize AI workforce automation for businesses of all sizes',
    },
    {
      icon: Zap,
      title: 'Innovation First',
      description: 'Pushing boundaries with cutting-edge AI technology',
    },
    {
      icon: Heart,
      title: 'Customer-Centric',
      description: 'Your success is our success. We build for you.',
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'Committed to delivering the highest quality solutions',
    },
  ];

  const team = [
    {
      name: 'Siddhartha Nagula',
      role: 'Founder & CEO',
      bio: 'Visionary leader building the future of AI workforce automation. Former AI researcher with 10+ years in machine learning and automation.',
      avatar: '👨‍💼',
    },
    {
      name: 'Alex Chen',
      role: 'CTO',
      bio: 'Full-stack architect and AI systems expert. Led engineering teams at major tech companies, specializing in scalable AI infrastructure.',
      avatar: '👨‍💻',
    },
    {
      name: 'Sarah Johnson',
      role: 'Head of Product',
      bio: 'Product strategy and user experience visionary. Former product manager at leading SaaS companies with expertise in AI product development.',
      avatar: '👩‍🎨',
    },
    {
      name: 'Michael Rodriguez',
      role: 'Head of Engineering',
      bio: 'Engineering excellence and scaling specialist. Expert in distributed systems and AI model deployment at enterprise scale.',
      avatar: '👨‍🔧',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="About AGI Agent Automation | Leading AI Workforce Platform"
        description="Learn about AGI Agent Automation - the leading AI employee platform. Meet our team of AI experts building the future of work with 50,000+ AI employees created and 1M+ hours saved."
        keywords={[
          'about agi agent automation',
          'ai workforce team',
          'ai automation company',
          'ai employees platform',
          'artificial intelligence workforce',
          'ai automation experts',
          'machine learning team',
          'ai workforce automation',
        ]}
        ogType="website"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'About AGI Agent Automation',
          description:
            'Learn about AGI Agent Automation - the leading AI employee platform',
          mainEntity: {
            '@type': 'Organization',
            name: 'AGI Agent Automation',
            description: 'Leading AI Employee and Automation Platform',
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
              Building the Future of Work
            </h1>
            <p className="mb-8 text-xl leading-relaxed text-muted-foreground">
              We're on a mission to empower every business with AI employees
              that work 24/7, transforming how teams operate and scale in the
              digital age.
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
                Democratizing AI for Every Business
              </h2>
              <p className="mb-6 text-lg leading-relaxed text-muted-foreground">
                We believe that every business, regardless of size, should have
                access to world-class AI automation. Our platform makes it
                possible to hire specialized AI employees in minutes, not
                months.
              </p>
              <p className="text-lg leading-relaxed text-muted-foreground">
                From startups to enterprises, we're leveling the playing field
                and enabling teams to focus on what truly matters: innovation,
                creativity, and growth.
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
              Join Us on This Journey
            </h2>
            <p className="mb-8 text-xl text-muted-foreground">
              Ready to transform your business with AI employees?
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                asChild
                className="bg-gradient-to-r from-primary to-accent"
              >
                <Link to="/auth/register">Start Free Trial</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/careers">View Open Positions</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
