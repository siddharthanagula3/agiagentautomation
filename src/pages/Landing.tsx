import React, { useState, useEffect, useRef } from 'react';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { Card } from '@shared/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@shared/ui/accordion';
import {
  ArrowRight,
  Sparkles,
  Zap,
  Brain,
  MessageSquare,
  BarChart3,
  Shield,
  CheckCircle2,
  Play,
  Workflow,
  FileText,
  Users,
  Clock,
  Star,
  Quote,
  TrendingUp,
  Rocket,
  Target,
  Lock,
  Code,
  Database,
  GitBranch,
  Palette,
  Bot,
  Briefcase,
  LineChart,
  Search,
  ShoppingCart,
  Video,
  Globe,
  Layers,
  Package,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { Particles } from '@shared/ui/particles';
import { Spotlight, MouseSpotlight } from '@shared/ui/spotlight';
import { BentoGrid, BentoCard } from '@shared/ui/bento-grid';
import { InteractiveHoverCard } from '@shared/ui/interactive-hover-card';
import { AnimatedGradientText } from '@shared/ui/animated-gradient-text';
import { SEOHead } from '@shared/components/seo/SEOHead';
import { useAuthStore } from '@shared/stores/authentication-store';
import {
  AI_EMPLOYEES,
  providerInfo,
  type AIProvider,
} from '@/data/marketplace-employees';
import { DollarSign } from 'lucide-react';

// Features data
const features = [
  {
    icon: <Brain className="h-6 w-6" />,
    title: 'AI-Powered Automation',
    description:
      'Automate complex workflows with advanced AI that understands context and makes intelligent decisions',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: 'Lightning Fast',
    description:
      'Deploy AI employees in seconds. See results in minutes, not days or weeks',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: 'Enterprise Security',
    description:
      'Bank-level encryption, SOC 2 compliant, and GDPR ready. Your data is safe with us',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: <Workflow className="h-6 w-6" />,
    title: 'Custom Workflows',
    description:
      'Build and deploy custom workflows tailored to your business needs',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: 'Real-time Analytics',
    description:
      'Track performance, costs, and efficiency with comprehensive analytics dashboard',
    gradient: 'from-indigo-500 to-violet-500',
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: 'Team Collaboration',
    description:
      'Share AI employees across your team and collaborate on workflows seamlessly',
    gradient: 'from-yellow-500 to-amber-500',
  },
];

// FAQ data
const faqs = [
  {
    question: 'How much money will I save compared to hiring humans?',
    answer:
      "Massive savings! A human developer costs $100K+/year ($8,333/month) plus benefits. AI Employees are FREE to hire - you only pay for tokens used. Free plan includes 1M tokens/month (250K each for OpenAI, Claude, Perplexity, Gemini). Pro plan ($29/month) includes 10M tokens/month (2.5M each). That's a 99.7%+ cost reduction. For a team of 10, you save over $1M/year while getting 24/7 productivity with zero downtime, no sick days, and instant expertise.",
  },
  {
    question: 'How quickly can I get started?',
    answer:
      'Hire your first FREE AI employee in under 60 seconds! No interviews, no onboarding, no training, no cost to hire. Simply sign up, select from 165+ specialized AI employees in our marketplace, and start delegating tasks immediately in natural language. Free plan includes 1M tokens/month (250K each for OpenAI, Claude, Perplexity, Gemini).',
  },
  {
    question: 'What tasks can AI employees handle?',
    answer:
      'Everything from software development, design, data analysis, content creation, customer support, to marketing and sales. Each AI employee has expert-level capabilities in their specialty - better than hiring a junior, at 1/100th the cost of a senior employee. They collaborate seamlessly to solve complex multi-step projects.',
  },
  {
    question: 'How does pricing work for token usage?',
    answer:
      'AI Employees are FREE to hire! You only pay for tokens used. Free plan includes 1M tokens/month (250K each for OpenAI, Claude, Perplexity, Gemini). Pro plan ($29/month) includes 10M tokens/month (2.5M each). We charge market rates for API usage - the same as OpenAI, Anthropic, and Google directly. You get full cost transparency with real-time usage tracking. Most customers save 95%+ vs hiring human employees while getting superior 24/7 output.',
  },
  {
    question: 'Is my data secure?',
    answer:
      "Bank-level security guaranteed. We're SOC 2 compliant, GDPR ready with end-to-end encryption. Your data is completely isolated and never used to train models. Built on Supabase with enterprise-grade infrastructure. More secure than having human contractors with USB drives.",
  },
  {
    question: 'Can I customize AI employees?',
    answer:
      "Absolutely! Customize skills, workflows, integrations, and behavior to match your exact needs. Advanced users can create entirely custom AI employees from scratch. It's like training a human employee, except it takes 5 minutes instead of 3 months.",
  },
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth/register');
    }
  };
  const [activeFeature, setActiveFeature] = useState(0);
  const [stats, setStats] = useState({ tasks: 0, time: 0, cost: 0 });
  const [activeEmployee, setActiveEmployee] = useState(0);

  const employeesRef = useRef(null);
  const featuresRef = useRef(null);
  const employeesInView = useInView(employeesRef, { once: true, amount: 0.3 });
  const featuresInView = useInView(featuresRef, { once: true, amount: 0.2 });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        tasks: Math.min(prev.tasks + 247, 50000),
        time: Math.min(prev.time + 1.3, 98),
        cost: Math.min(prev.cost + 2.1, 89),
      }));
    }, 10);
    setTimeout(() => clearInterval(interval), 2000);
    return () => clearInterval(interval);
  }, []);

  // Use only 6 employees for landing page display
  const displayedEmployees = AI_EMPLOYEES.slice(0, 6);

  const getProviderGradient = (provider: AIProvider) => {
    const gradients = {
      chatgpt: 'from-green-500 to-emerald-500',
      claude: 'from-purple-500 to-pink-500',
      gemini: 'from-blue-500 to-cyan-500',
      perplexity: 'from-orange-500 to-red-500',
    };
    return gradients[provider] || 'from-gray-500 to-gray-600';
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveEmployee((prev) => (prev + 1) % displayedEmployees.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [displayedEmployees.length]);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden">
      <SEOHead
        title="AGI Workforce | #1 AI Employees Platform USA | Hire 165+ AI Agents"
        description="Hire Free AI Employees. Free plan: 1M tokens/month (250K per provider). Pro plan: 10M tokens/month (2.5M per provider). 165+ specialized AI agents. Best AI workforce platform. 24/7 operation. Start free today!"
        keywords={[
          'ai employees',
          'hire ai employees',
          'ai agents',
          'ai automation',
          'agi workforce',
          'cheapest ai employees',
          'best ai employees usa',
          'no 1 in usa',
          'ai workforce',
          'agi',
          'asi',
          'hiring ai employees',
        ]}
        ogImage="https://agiagentautomation.vercel.app/og-landing.jpg"
      />

      {/* Hero Section */}
      <section className="relative flex min-h-screen w-full max-w-full items-center justify-center overflow-hidden pt-16">
        <Particles className="absolute inset-0 z-0" quantity={100} />
        <Spotlight className="absolute inset-0 z-0" />
        <div className="gradient-mesh absolute inset-0"></div>

        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="bg-primary/10 absolute top-20 left-4 h-32 w-32 rounded-full blur-3xl sm:left-20 sm:h-72 sm:w-72"
          />
          <motion.div
            animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            className="bg-accent/10 absolute right-4 bottom-20 h-40 w-40 rounded-full blur-3xl sm:right-20 sm:h-96 sm:w-96"
          />
          <motion.div
            animate={{ y: [0, -15, 0], x: [0, -15, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            className="bg-secondary/10 absolute top-1/2 right-1/3 h-24 w-24 rounded-full blur-3xl sm:h-64 sm:w-64"
          />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <Badge className="glass mb-8 px-6 py-2 text-base font-medium">
              <Sparkles className="mr-2 h-4 w-4" />
              Your Complete AI Workforce - Available Now
            </Badge>

            <h1 className="mb-8 text-3xl leading-tight font-bold sm:text-5xl md:text-6xl lg:text-8xl">
              <motion.span
                className="mb-2 block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Hire
              </motion.span>
              <motion.span
                className="block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <AnimatedGradientText>AI Employees</AnimatedGradientText>
              </motion.span>
            </h1>

            <p className="text-muted-foreground mx-auto mb-8 max-w-4xl text-xl leading-relaxed md:text-2xl">
              Replace $100K+/year human employees with
              <span className="text-primary font-bold">
                {' '}
                Hire Free AI Employees - Pay Only for Tokens
              </span>
              .
              <span className="text-foreground font-semibold">
                {' '}
                Save 99%+ on costs
              </span>
              , get 24/7 productivity, zero downtime. Just tell them what you
              need in natural language - they handle everything.
            </p>

            {/* Limited Time Offer timer removed per request */}

            <div className="mb-16 flex flex-col justify-center gap-4 sm:flex-row">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  className="btn-glow gradient-primary px-10 py-7 text-lg text-white shadow-xl"
                  onClick={handleGetStarted}
                >
                  {user ? 'Go to Dashboard' : 'Get Started Free'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="glass px-10 py-7 text-lg"
                  asChild
                >
                  <Link to="/demo">
                    <Play className="mr-2 h-5 w-5" />
                    Watch Demo
                  </Link>
                </Button>
              </motion.div>
            </div>

            <BentoGrid className="mx-auto max-w-4xl">
              <BentoCard
                className="border-primary/20 bg-background/40 backdrop-blur-xl"
                hover={true}
              >
                <InteractiveHoverCard>
                  <div className="text-center">
                    <motion.div
                      className="text-primary mb-2 text-4xl font-bold"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      {stats.tasks.toLocaleString()}+
                    </motion.div>
                    <div className="text-muted-foreground text-sm">
                      Tasks Completed Daily
                    </div>
                  </div>
                </InteractiveHoverCard>
              </BentoCard>

              <BentoCard
                className="border-accent/20 bg-background/40 backdrop-blur-xl"
                hover={true}
              >
                <InteractiveHoverCard>
                  <div className="text-center">
                    <motion.div
                      className="text-accent mb-2 text-4xl font-bold"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                    >
                      {stats.time.toFixed(0)}%
                    </motion.div>
                    <div className="text-muted-foreground text-sm">
                      Time Saved
                    </div>
                  </div>
                </InteractiveHoverCard>
              </BentoCard>

              <BentoCard
                className="border-secondary/20 bg-background/40 backdrop-blur-xl"
                hover={true}
              >
                <InteractiveHoverCard>
                  <div className="text-center">
                    <motion.div
                      className="text-secondary mb-2 text-4xl font-bold"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                    >
                      {stats.cost.toFixed(0)}%
                    </motion.div>
                    <div className="text-muted-foreground text-sm">
                      Cost Reduction
                    </div>
                  </div>
                </InteractiveHoverCard>
              </BentoCard>
            </BentoGrid>
          </motion.div>
        </div>
      </section>

      {/* AI Employees Marketplace Preview */}
      <section
        ref={employeesRef}
        className="relative w-full max-w-full overflow-hidden py-12 sm:py-20"
      >
        <Particles className="absolute inset-0 opacity-20" quantity={50} />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={employeesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="mb-16 text-center"
          >
            <Badge className="glass mb-4 px-4 py-2">
              <Users className="mr-2 h-4 w-4" />
              AI Marketplace
            </Badge>
            <h2 className="mb-6 text-3xl font-bold sm:text-4xl md:text-5xl lg:text-6xl">
              <AnimatedGradientText>Hire Your AI Team</AnimatedGradientText>
            </h2>
            <p className="text-muted-foreground mx-auto max-w-3xl text-xl">
              Browse our marketplace of specialized AI employees. Each one
              brings expert-level skills and works 24/7 without breaks,
              vacations, or overhead costs.
            </p>
          </motion.div>

          <div className="grid w-full max-w-full grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {displayedEmployees.map((employee, idx) => (
              <motion.div
                key={employee.id}
                initial={{ opacity: 0, y: 50 }}
                animate={employeesInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="w-full max-w-full"
              >
                <Card
                  className={cn(
                    'glass-strong card-hover group relative h-full w-full max-w-full overflow-hidden border-2 transition-all duration-300',
                    'hover:shadow-primary/20 hover:shadow-2xl',
                    activeEmployee === idx
                      ? 'border-primary/50'
                      : 'border-border/50'
                  )}
                >
                  <div
                    className={cn(
                      'absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-10',
                      getProviderGradient(employee.provider)
                    )}
                  />
                  <div className="relative z-10 flex h-full flex-col p-6">
                    {/* Header */}
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex min-w-0 flex-1 items-center space-x-3">
                        <motion.div
                          className="ring-border h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl ring-2"
                          whileHover={{ scale: 1.1 }}
                          animate={
                            activeEmployee === idx
                              ? {
                                  scale: [1, 1.1, 1],
                                  rotate: [0, 5, -5, 0],
                                }
                              : {}
                          }
                          transition={{ duration: 0.5 }}
                        >
                          <img
                            src={employee.avatar}
                            alt={`Profile picture of ${employee.role}`}
                            className="h-full w-full object-cover"
                          />
                        </motion.div>
                        <div className="min-w-0 flex-1">
                          <h3 className="mb-1 truncate text-lg font-semibold">
                            {employee.role}
                          </h3>
                          <p className="text-muted-foreground truncate text-xs">
                            {employee.specialty}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={cn(
                          'flex-shrink-0 border-0 bg-gradient-to-r text-white',
                          getProviderGradient(employee.provider)
                        )}
                      >
                        {providerInfo[employee.provider]?.name ||
                          'Unknown Provider'}
                      </Badge>
                    </div>

                    {/* Description */}
                    <p className="text-muted-foreground mb-4 line-clamp-2 flex-grow text-sm">
                      {employee.description}
                    </p>

                    {/* Skills */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {employee.skills.slice(0, 4).map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="text-xs"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {employee.skills.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{employee.skills.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Fit Level */}
                    <div className="border-border mb-4 flex items-center gap-2 border-b pb-4">
                      {employee.fitLevel === 'excellent' ? (
                        <>
                          <Zap className="text-primary h-4 w-4" />
                          <span className="text-primary text-xs font-medium">
                            Excellent Fit
                          </span>
                        </>
                      ) : (
                        <>
                          <TrendingUp className="text-accent h-4 w-4" />
                          <span className="text-accent text-xs font-medium">
                            Great Fit
                          </span>
                        </>
                      )}
                      <Star className="ml-auto h-4 w-4 fill-yellow-500 text-yellow-500" />
                    </div>

                    {/* Price and CTA */}
                    <div className="space-y-3">
                      {/* Two-column layout for desktop, stacked for mobile */}
                      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
                        {/* Left column: Price */}
                        <div className="flex flex-col items-start sm:items-start">
                          <div className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-2xl font-bold text-transparent">
                            $0
                          </div>
                          <div className="text-muted-foreground text-sm">
                            per month
                          </div>
                        </div>

                        {/* Right column: Offers (right-aligned on desktop) */}
                        <div className="flex flex-col items-end text-right sm:items-end">
                          <div className="mb-1">
                            <Badge className="animate-pulse border-0 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-xs text-white">
                              <Sparkles className="mr-1 h-3 w-3" />
                              Limited time offer
                            </Badge>
                          </div>
                          <div className="text-muted-foreground text-xs italic">
                            🎉 Introductory offer
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        className="btn-glow gradient-primary w-full text-white"
                        asChild
                      >
                        <Link to="/marketplace">
                          <Bot className="mr-2 h-4 w-4" />
                          Hire Free
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <Button size="lg" variant="outline" className="glass" asChild>
              <Link to="/marketplace">
                Browse All {AI_EMPLOYEES.length} AI Employees
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section
        ref={featuresRef}
        className="bg-muted/30 relative w-full max-w-full overflow-hidden py-12 sm:py-20"
      >
        <div className="absolute inset-0">
          <div className="from-primary/5 to-accent/5 absolute inset-0 bg-gradient-to-br via-transparent" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            className="mb-16 text-center"
          >
            <Badge className="glass mb-4 px-4 py-2">
              <Zap className="mr-2 h-4 w-4" />
              Powerful Features
            </Badge>
            <h2 className="mb-6 text-3xl font-bold sm:text-4xl md:text-5xl lg:text-6xl">
              Everything You Need to Scale
            </h2>
            <p className="text-muted-foreground mx-auto max-w-3xl text-xl">
              Enterprise-grade features that make AI workforce management
              simple, secure, and scalable.
            </p>
          </motion.div>

          <div className="grid w-full max-w-full grid-cols-1 gap-4 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 50 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="w-full max-w-full"
              >
                <Card className="group border-border/50 hover:border-primary/50 hover:shadow-primary/10 h-full border-2 p-6 transition-all hover:shadow-xl">
                  <motion.div
                    className={cn(
                      'mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white',
                      feature.gradient
                    )}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    {feature.icon}
                  </motion.div>
                  <h3 className="group-hover:text-primary mb-2 text-xl font-bold transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Demo Section */}
      <section className="relative w-full max-w-full overflow-hidden py-12 sm:py-20">
        <Spotlight className="absolute inset-0" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <Badge className="glass mb-4 px-4 py-2">
                <Video className="mr-2 h-4 w-4" />
                See It In Action
              </Badge>
              <h2 className="mb-6 text-2xl font-bold sm:text-3xl md:text-4xl lg:text-5xl">
                Watch Your AI Team Work
              </h2>
              <p className="text-muted-foreground mb-8 text-xl">
                See how easy it is to delegate tasks, monitor progress, and
                achieve results with your AI workforce.
              </p>
              <ul className="mb-8 space-y-4">
                {[
                  'Deploy in 60 seconds',
                  'Natural language commands',
                  'Real-time progress tracking',
                  'Collaborate with your team',
                ].map((item, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
              <Button size="lg" className="gradient-primary text-white" asChild>
                <Link to="/demo">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Full Demo
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="border-primary/20 from-primary/10 to-accent/10 shadow-primary/20 aspect-video overflow-hidden rounded-2xl border-2 bg-gradient-to-br shadow-2xl backdrop-blur-xl">
                <div className="flex h-full items-center justify-center">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-sm"
                  >
                    <Play className="h-8 w-8 text-white" />
                  </motion.div>
                </div>
              </div>
              {/* Floating elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="from-primary to-accent absolute -top-4 -right-4 h-24 w-24 rounded-2xl bg-gradient-to-br opacity-80 shadow-xl"
              />
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="from-accent to-secondary absolute -bottom-4 -left-4 h-32 w-32 rounded-2xl bg-gradient-to-br opacity-80 shadow-xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof / Trust Section */}
      <section className="relative w-full max-w-full overflow-hidden py-12 sm:py-20">
        <div className="from-primary/5 to-accent/5 absolute inset-0 bg-gradient-to-br via-transparent" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <Badge className="glass mb-4 px-4 py-2">
              <Star className="mr-2 h-4 w-4" />
              Why Businesses Choose Us
            </Badge>
            <h2 className="mb-6 text-3xl font-bold sm:text-4xl md:text-5xl lg:text-6xl">
              The Smartest Way to Scale
            </h2>
            <p className="text-muted-foreground text-xl">
              Real advantages that make AGI Workforce the platform of choice
            </p>
          </motion.div>

          <div className="grid w-full max-w-full gap-4 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <DollarSign className="h-8 w-8" />,
                gradient: 'from-green-500 to-emerald-500',
                headline: '99%+ Cost Reduction',
                detail:
                  'A senior developer costs $100K+/year. Our AI employees cost you only what you use — starting at $0/month. Free plan includes 1M tokens/month across all providers.',
              },
              {
                icon: <Zap className="h-8 w-8" />,
                gradient: 'from-blue-500 to-cyan-500',
                headline: 'Deploy in 60 Seconds',
                detail:
                  'No interviews, no onboarding, no contracts. Select an AI employee from our 165+ marketplace and start delegating in natural language immediately.',
              },
              {
                icon: <Shield className="h-8 w-8" />,
                gradient: 'from-purple-500 to-pink-500',
                headline: 'Enterprise-Grade Security',
                detail:
                  'Powered by Supabase with SOC 2 compliance, end-to-end encryption, and complete data isolation. Your data is never used to train models.',
              },
              {
                icon: <Clock className="h-8 w-8" />,
                gradient: 'from-orange-500 to-red-500',
                headline: '24/7 Operation',
                detail:
                  'AI employees never sleep, take breaks, or call in sick. They handle workloads around the clock across all time zones simultaneously.',
              },
              {
                icon: <Brain className="h-8 w-8" />,
                gradient: 'from-indigo-500 to-violet-500',
                headline: 'Multi-LLM Intelligence',
                detail:
                  'Access GPT-4, Claude, Gemini, and Perplexity — each optimized for different tasks. Our router picks the best model for every job automatically.',
              },
              {
                icon: <TrendingUp className="h-8 w-8" />,
                gradient: 'from-yellow-500 to-amber-500',
                headline: 'Instant Scalability',
                detail:
                  'Go from 1 to 100+ AI employees instantly without hiring pipelines, HR overhead, or infrastructure scaling concerns. Scale down just as easily.',
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glass group border-border/50 hover:border-primary/50 rounded-2xl border p-8 transition-all duration-300"
              >
                <div
                  className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r ${item.gradient} text-white`}
                >
                  {item.icon}
                </div>
                <h3 className="mb-3 text-xl font-bold">{item.headline}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.detail}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="relative w-full max-w-full overflow-hidden py-12 sm:py-20">
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <Badge className="glass mb-4 px-4 py-2">
              <Target className="mr-2 h-4 w-4" />
              Use Cases
            </Badge>
            <h2 className="mb-6 text-3xl font-bold sm:text-4xl md:text-5xl lg:text-6xl">
              How Teams Use AI Employees
            </h2>
            <p className="text-muted-foreground text-xl">
              Real workflows from successful implementations
            </p>
          </motion.div>

          <div className="grid w-full max-w-full gap-4 sm:gap-8 lg:grid-cols-2">
            {[
              {
                title: 'E-commerce Automation',
                description:
                  'Complete order processing, inventory management, and customer support',
                steps: [
                  'AI employee receives order notification',
                  'Validates inventory and processes payment',
                  'Updates inventory and triggers fulfillment',
                  'Sends confirmation and tracking info',
                  'Handles customer inquiries 24/7',
                ],
                icon: <ShoppingCart className="h-8 w-8" />,
                gradient: 'from-blue-500 to-purple-500',
                result: '95% automation rate, 24/7 operation',
              },
              {
                title: 'Content Marketing Pipeline',
                description:
                  'End-to-end content creation, SEO optimization, and distribution',
                steps: [
                  'AI employee researches trending topics',
                  'Creates SEO-optimized content',
                  'Generates social media posts',
                  'Schedules across platforms',
                  'Analyzes performance and optimizes',
                ],
                icon: <FileText className="h-8 w-8" />,
                gradient: 'from-green-500 to-teal-500',
                result: '300% content output increase',
              },
              {
                title: 'Customer Support Excellence',
                description:
                  'Intelligent ticket routing, resolution, and escalation',
                steps: [
                  'AI employee analyzes incoming tickets',
                  'Routes to appropriate specialist',
                  'Provides instant responses for common issues',
                  'Escalates complex cases to humans',
                  'Follows up and ensures resolution',
                ],
                icon: <MessageSquare className="h-8 w-8" />,
                gradient: 'from-orange-500 to-red-500',
                result: '98% satisfaction, 50% faster resolution',
              },
              {
                title: 'Data Analysis & Reporting',
                description:
                  'Automated data collection, analysis, and business intelligence',
                steps: [
                  'AI employee collects data from multiple sources',
                  'Cleans and validates data quality',
                  'Performs statistical analysis',
                  'Generates insights and recommendations',
                  'Creates executive dashboards',
                ],
                icon: <BarChart3 className="h-8 w-8" />,
                gradient: 'from-purple-500 to-pink-500',
                result: 'Real-time insights, 80% time savings',
              },
            ].map((useCase, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glass group border-border/50 hover:border-primary/50 rounded-2xl border p-8 transition-all duration-300"
              >
                <div
                  className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r ${useCase.gradient} text-white`}
                >
                  {useCase.icon}
                </div>

                <h3 className="mb-3 text-2xl font-bold">{useCase.title}</h3>
                <p className="text-muted-foreground mb-6">
                  {useCase.description}
                </p>

                <div className="mb-6 space-y-3">
                  {useCase.steps.map((step, stepIdx) => (
                    <div key={stepIdx} className="flex items-start gap-3">
                      <div className="bg-primary/10 text-primary mt-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold">
                        {stepIdx + 1}
                      </div>
                      <span className="text-muted-foreground text-sm">
                        {step}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="from-primary/10 to-accent/10 rounded-lg bg-gradient-to-r px-4 py-3 text-center">
                  <span className="text-primary text-sm font-semibold">
                    {useCase.result}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative w-full max-w-full overflow-hidden py-12 sm:py-20">
        <div className="relative z-10 mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <Badge className="glass mb-4 px-4 py-2">
              <MessageSquare className="mr-2 h-4 w-4" />
              FAQ
            </Badge>
            <h2 className="mb-6 text-3xl font-bold sm:text-4xl md:text-5xl lg:text-6xl">
              Common Questions
            </h2>
            <p className="text-muted-foreground text-xl">
              Everything you need to know about AI employees
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, idx) => (
                <AccordionItem
                  key={idx}
                  value={`item-${idx}`}
                  className="glass border-border/50 rounded-xl border px-6"
                >
                  <AccordionTrigger className="py-4 text-left hover:no-underline">
                    <span className="font-semibold">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative w-full max-w-full overflow-hidden py-12 sm:py-20">
        <div className="gradient-primary absolute inset-0 opacity-90"></div>
        <Particles className="absolute inset-0" quantity={100} />
        <div className="relative z-10 mx-auto w-full max-w-5xl px-4 text-center text-white sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="mb-6 text-3xl font-bold sm:text-4xl md:text-5xl lg:text-6xl">
              Ready to Build Your AI Workforce?
            </h2>
            <p className="mx-auto mb-12 max-w-3xl text-xl opacity-90 md:text-2xl">
              Join thousands of entrepreneurs and businesses using AI to scale
              without limits. Start free today - no credit card required.
            </p>

            <div className="mb-8 flex flex-col justify-center gap-4 sm:flex-row">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-primary bg-white px-10 py-7 text-lg font-semibold shadow-2xl hover:bg-white/90"
                  onClick={handleGetStarted}
                >
                  {user ? 'Go to Dashboard' : 'Get Started Free'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/30 bg-white/10 px-10 py-7 text-lg text-white backdrop-blur-sm hover:bg-white/20"
                  asChild
                >
                  <Link to="/demo">
                    <Play className="mr-2 h-5 w-5" />
                    See It In Action
                  </Link>
                </Button>
              </motion.div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm opacity-80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>Free forever plan</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>Start in 2 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>24/7 support</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

const LandingPageWithErrorBoundary: React.FC = () => (
  <ErrorBoundary componentName="LandingPage" showReportDialog>
    <LandingPage />
  </ErrorBoundary>
);

export default LandingPageWithErrorBoundary;
