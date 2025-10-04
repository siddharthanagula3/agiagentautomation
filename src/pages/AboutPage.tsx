import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Particles } from '@/components/ui/particles';
import {
  Target,
  Rocket,
  Users,
  Heart,
  Globe,
  TrendingUp,
  Award,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutPage: React.FC = () => {
  const stats = [
    { label: 'AI Employees Created', value: '50,000+', icon: Users },
    { label: 'Hours Saved', value: '1M+', icon: TrendingUp },
    { label: 'Countries Served', value: '120+', icon: Globe },
    { label: 'Customer Satisfaction', value: '98%', icon: Heart }
  ];

  const values = [
    {
      icon: Target,
      title: 'Mission-Driven',
      description: 'Democratize AI workforce automation for businesses of all sizes'
    },
    {
      icon: Zap,
      title: 'Innovation First',
      description: 'Pushing boundaries with cutting-edge AI technology'
    },
    {
      icon: Heart,
      title: 'Customer-Centric',
      description: 'Your success is our success. We build for you.'
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'Committed to delivering the highest quality solutions'
    }
  ];

  const team = [
    {
      name: 'Sarah Chen',
      role: 'CEO & Co-Founder',
      bio: 'Former Google AI Lead with 15+ years in ML',
      avatar: '👩‍💼'
    },
    {
      name: 'Michael Rodriguez',
      role: 'CTO & Co-Founder',
      bio: 'Ex-OpenAI Engineer, AI Systems Architect',
      avatar: '👨‍💻'
    },
    {
      name: 'Emily Watson',
      role: 'Head of Product',
      bio: 'Product leader from Microsoft, UX expert',
      avatar: '👩‍🎨'
    },
    {
      name: 'David Kim',
      role: 'Head of Engineering',
      bio: 'Engineering leader from Tesla, scaling expert',
      avatar: '👨‍🔧'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Particles className="absolute inset-0 -z-10" quantity={50} staticity={50} />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge className="mb-6 glass px-6 py-2">
              <Rocket className="mr-2 h-4 w-4" />
              About Us
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary">
              Building the Future of Work
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              We're on a mission to empower every business with AI employees that work 24/7,
              transforming how teams operate and scale in the digital age.
            </p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16"
          >
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
                className="glass p-6 rounded-2xl text-center border border-border/50 hover:border-primary/50 transition-all"
              >
                <stat.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <div>
              <Badge className="mb-4 glass px-4 py-2">
                <Target className="mr-2 h-4 w-4" />
                Our Mission
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Democratizing AI for Every Business
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                We believe that every business, regardless of size, should have access to
                world-class AI automation. Our platform makes it possible to hire specialized
                AI employees in minutes, not months.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                From startups to enterprises, we're leveling the playing field and enabling
                teams to focus on what truly matters: innovation, creativity, and growth.
              </p>
            </div>
            <div className="relative">
              <div className="glass p-8 rounded-3xl border border-border/50">
                <div className="space-y-4">
                  {values.map((value, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-4 p-4 rounded-xl hover:bg-accent/5 transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-primary/10">
                        <value.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{value.title}</h3>
                        <p className="text-sm text-muted-foreground">{value.description}</p>
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
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 glass px-4 py-2">
              <Users className="mr-2 h-4 w-4" />
              Our Team
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Meet the Minds Behind AGI Agent
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A team of AI experts, engineers, and visionaries working to transform the future of work
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glass p-6 rounded-2xl border border-border/50 hover:border-primary/50 transition-all group"
              >
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                  {member.avatar}
                </div>
                <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                <p className="text-primary text-sm mb-3">{member.role}</p>
                <p className="text-sm text-muted-foreground">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Join Us on This Journey
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Ready to transform your business with AI employees?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="bg-gradient-to-r from-primary to-accent">
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
