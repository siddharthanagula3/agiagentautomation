import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Rocket, Zap, TrendingUp, Users, DollarSign, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Particles } from '@/components/ui/particles';
import { BentoGrid, BentoCard } from '@/components/ui/bento-grid';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/unified-auth-store';

const StartupsPage: React.FC = () => {
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

  const handleTalkToFounders = () => {
    navigate('/contact-sales');
  };
  const benefits = [
    {
      icon: DollarSign,
      title: 'Reduce Operating Costs by 70%',
      description: 'Scale your operations without the overhead of traditional hiring. AI employees work 24/7 at a fraction of the cost.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Zap,
      title: 'Launch Features 10x Faster',
      description: 'Automate repetitive tasks and focus your human team on high-value strategic work.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: TrendingUp,
      title: 'Scale Without Limits',
      description: 'Grow from 10 to 10,000 customers without proportionally increasing headcount.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Users,
      title: 'Lean Team, Maximum Output',
      description: 'Build a lean, efficient team augmented by specialized AI employees for every function.',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const useCases = [
    {
      title: 'Customer Support',
      description: 'AI employees handle tier-1 support tickets, respond to common questions instantly, and escalate complex issues to humans.',
      metrics: ['90% faster response time', '24/7 availability', '75% ticket auto-resolution']
    },
    {
      title: 'Sales & Lead Qualification',
      description: 'Automatically qualify leads, send personalized outreach, schedule demos, and follow up with prospects.',
      metrics: ['3x more qualified leads', '50% higher conversion', 'Zero manual data entry']
    },
    {
      title: 'Product Development',
      description: 'AI assists with code reviews, bug triaging, documentation, testing, and deployment automation.',
      metrics: ['40% faster sprints', '60% fewer bugs', 'Continuous deployment']
    },
    {
      title: 'Operations & Admin',
      description: 'Automate invoicing, expense tracking, meeting scheduling, email management, and routine reporting.',
      metrics: ['20 hours saved/week', '99% accuracy', 'Real-time insights']
    }
  ];

  const testimonial = {
    quote: "We went from 5 employees to serving 500+ customers without hiring more support staff. AI employees handle 90% of our customer inquiries, and our human team focuses on product innovation.",
    author: 'Sarah Chen',
    role: 'Co-Founder, TechStart',
    avatar: '👩‍💼',
    metrics: [
      { label: 'Cost Savings', value: '$120K/year' },
      { label: 'Response Time', value: '< 30 seconds' },
      { label: 'Team Size', value: '5 people' }
    ]
  };

  const startupStages = [
    {
      stage: 'Pre-Seed / Idea',
      focus: 'Validate & Build MVP',
      aiEmployees: ['AI Developer', 'AI Designer', 'AI Researcher'],
      benefit: 'Build your MVP 5x faster without a full team'
    },
    {
      stage: 'Seed / Early Stage',
      focus: 'Find Product-Market Fit',
      aiEmployees: ['AI Support Agent', 'AI Sales Rep', 'AI Analyst'],
      benefit: 'Scale customer acquisition and support efficiently'
    },
    {
      stage: 'Series A / Growth',
      focus: 'Scale Operations',
      aiEmployees: ['AI Project Manager', 'AI Marketing Manager', 'AI Operations'],
      benefit: 'Grow revenue 10x without 10x headcount'
    },
    {
      stage: 'Series B+',
      focus: 'Optimize & Dominate',
      aiEmployees: ['AI Strategy Consultant', 'AI Data Scientist', 'Full AI Workforce'],
      benefit: 'Maintain startup agility at enterprise scale'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Particles className="absolute inset-0 -z-10" quantity={60} staticity={30} />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Rocket size={16} />
                For Startups
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary">
                Build Your Startup with an AI Workforce
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Scale faster, spend less, and compete with companies 10x your size. AI employees give you the leverage to move at hyperspeed.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-gradient-to-r from-primary to-accent text-lg" onClick={handleStartTrial}>
                  {user ? 'Go to Dashboard' : 'Start Free Trial'}
                  <ArrowRight className="ml-2" size={20} />
                </Button>
                <Button size="lg" variant="outline" onClick={handleWatchDemo}>
                  Watch Demo
                </Button>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-500" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-500" />
                  14-day free trial
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 backdrop-blur-xl border border-border/40 p-8">
                <img
                  src="https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=600&fit=crop"
                  alt="Startup team"
                  className="rounded-2xl w-full h-auto"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Why Startups Choose AI Employees</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Move faster and compete with anyone, regardless of your team size or budget
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, idx) => (
              <BenefitCard key={idx} benefit={benefit} index={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-accent/5">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">AI Employees for Every Function</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From support to sales to development, automate every part of your startup
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {useCases.map((useCase, idx) => (
              <UseCaseCard key={idx} useCase={useCase} index={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* Startup Stages */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">AI for Every Stage of Your Journey</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Whether you're validating your idea or scaling to Series B, we have you covered
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {startupStages.map((stage, idx) => (
              <StageCard key={idx} stage={stage} index={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          <TestimonialCard testimonial={testimonial} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-accent to-secondary p-12 text-center text-white"
          >
            <h2 className="text-4xl font-bold mb-4">Ready to Build the Future?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join 1,000+ startups using AI employees to move faster than ever
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-lg" onClick={handleStartTrial}>
                {user ? 'Go to Dashboard' : 'Start Free Trial'}
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20" onClick={handleTalkToFounders}>
                Talk to Founders
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

const BenefitCard: React.FC<{ benefit: any; index: number }> = ({ benefit, index }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const Icon = benefit.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="relative overflow-hidden rounded-2xl bg-background/60 backdrop-blur-xl border border-border/40 hover:border-primary/50 transition-all p-8 group"
      whileHover={{ y: -8 }}
    >
      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${benefit.color} text-white mb-4`}>
        <Icon size={28} />
      </div>
      <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
        {benefit.title}
      </h3>
      <p className="text-muted-foreground leading-relaxed">
        {benefit.description}
      </p>
    </motion.div>
  );
};

const UseCaseCard: React.FC<{ useCase: any; index: number }> = ({ useCase, index }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="relative overflow-hidden rounded-2xl bg-background/60 backdrop-blur-xl border border-border/40 p-6"
    >
      <h3 className="text-xl font-bold mb-3">{useCase.title}</h3>
      <p className="text-muted-foreground mb-4">
        {useCase.description}
      </p>
      <div className="space-y-2">
        {useCase.metrics.map((metric: string, idx: number) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            <CheckCircle2 size={16} className="text-green-500" />
            <span className="text-foreground/80">{metric}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const StageCard: React.FC<{ stage: any; index: number }> = ({ stage, index }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="relative overflow-hidden rounded-2xl bg-background/60 backdrop-blur-xl border border-border/40 p-6 hover:border-primary/50 transition-all"
    >
      <div className="text-xs font-bold text-primary mb-2">{stage.stage}</div>
      <h3 className="text-lg font-bold mb-3">{stage.focus}</h3>
      <div className="space-y-2 mb-4">
        {stage.aiEmployees.map((employee: string, idx: number) => (
          <div key={idx} className="text-sm text-muted-foreground">• {employee}</div>
        ))}
      </div>
      <p className="text-sm text-foreground/70 italic">
        {stage.benefit}
      </p>
    </motion.div>
  );
};

const TestimonialCard: React.FC<{ testimonial: any }> = ({ testimonial }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-3xl bg-background/60 backdrop-blur-xl border border-border/40 p-12"
    >
      <div className="text-4xl mb-6 opacity-20">"</div>
      <p className="text-2xl font-medium mb-8 leading-relaxed">
        {testimonial.quote}
      </p>
      <div className="flex items-center justify-between flex-wrap gap-6">
        <div className="flex items-center gap-4">
          <span className="text-4xl">{testimonial.avatar}</span>
          <div>
            <div className="font-bold">{testimonial.author}</div>
            <div className="text-sm text-muted-foreground">{testimonial.role}</div>
          </div>
        </div>
        <div className="flex gap-6">
          {testimonial.metrics.map((metric: any, idx: number) => (
            <div key={idx} className="text-center">
              <div className="text-2xl font-bold text-primary">{metric.value}</div>
              <div className="text-xs text-muted-foreground">{metric.label}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default StartupsPage;
