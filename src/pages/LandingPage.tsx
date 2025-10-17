import React, { useState, useEffect, useRef } from 'react';
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
import { ExpandableChatDemo } from '@shared/ui/expandable-chat-demo';
import { Particles } from '@shared/ui/particles';
import { Spotlight, MouseSpotlight } from '@shared/ui/spotlight';
import { BentoGrid, BentoCard } from '@shared/ui/bento-grid';
import { InteractiveHoverCard } from '@shared/ui/interactive-hover-card';
import { AnimatedGradientText } from '@shared/ui/animated-gradient-text';
import { CountdownTimer } from '@shared/ui/countdown-timer';
import { createDiscountEndDate } from '@shared/ui/countdown-utils';
import { SEOHead } from '@shared/components/seo/SEOHead';
import { useAuthStore } from '@shared/stores/unified-auth-store';
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
    question: 'How quickly can I get started?',
    answer:
      'You can create your first AI employee in under 2 minutes. Simply sign up, choose from our marketplace, and start delegating tasks immediately. No technical knowledge required.',
  },
  {
    question: 'What tasks can AI employees handle?',
    answer:
      'AI employees can handle a wide range of tasks including coding, design, data analysis, content creation, customer support, marketing, and much more. Each AI employee specializes in specific domains with expert-level capabilities.',
  },
  {
    question: 'How much does it cost?',
    answer:
      'We offer a free forever plan to get started. Paid plans start at $29/month per AI employee with volume discounts. Enterprise plans available with custom pricing and SLAs.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Absolutely. We use bank-level encryption, are SOC 2 compliant, and GDPR ready. Your data is isolated, encrypted at rest and in transit, and never used to train models without explicit permission.',
  },
  {
    question: 'Can I customize AI employees?',
    answer:
      'Yes! You can customize skills, workflows, integrations, and behavior. Advanced users can even create custom AI employees from scratch using our visual workflow builder.',
  },
  {
    question: 'What kind of support do you offer?',
    answer:
      'We offer 24/7 email support for all plans, priority support for paid plans, and dedicated success managers for enterprise customers. Comprehensive documentation and video tutorials available.',
  },
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/register');
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
    <div className="min-h-screen">
      <SEOHead
        title="AGI Agent Automation | #1 AI Employees Platform USA | Hire 165+ AI Agents"
        description="Hire AI Employees starting at $1/month. 165+ specialized AI agents for automation, customer support, sales, marketing & more. Best AI workforce platform in USA. 24/7 operation, 95% cost savings. Start free trial today!"
        keywords={[
          'ai employees',
          'hire ai employees',
          'ai agents',
          'ai automation',
          'agi agent automation',
          'cheapest ai employees',
          'best ai employees usa',
          'no 1 in usa',
          'ai workforce',
          'agi',
          'asi',
          'hiring ai employees',
        ]}
        ogImage="https://agiagentautomation.com/og-landing.jpg"
      />

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
        <Particles className="absolute inset-0 z-0" quantity={100} />
        <Spotlight className="absolute inset-0 z-0" />
        <div className="gradient-mesh absolute inset-0"></div>

        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute left-20 top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
          />
          <motion.div
            animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-20 right-20 h-96 w-96 rounded-full bg-accent/10 blur-3xl"
          />
          <motion.div
            animate={{ y: [0, -15, 0], x: [0, -15, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute right-1/3 top-1/2 h-64 w-64 rounded-full bg-secondary/10 blur-3xl"
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

            <h1 className="mb-8 text-6xl font-bold leading-tight md:text-8xl">
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

            <p className="mx-auto mb-8 max-w-4xl text-xl leading-relaxed text-muted-foreground md:text-2xl">
              Build your dream team of AI employees who work 24/7.
              <span className="font-semibold text-foreground">
                {' '}
                No hiring, no training, no overhead
              </span>{' '}
              - just instant expertise across every function.
            </p>

            {/* Limited Time Offer Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-8"
            >
              <div className="flex items-center justify-center gap-4 text-lg font-semibold text-muted-foreground">
                <span>Limited time offer ends in</span>
                <CountdownTimer targetDate={createDiscountEndDate()} />
              </div>
            </motion.div>

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
                      className="mb-2 text-4xl font-bold text-primary"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      {stats.tasks.toLocaleString()}+
                    </motion.div>
                    <div className="text-sm text-muted-foreground">
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
                      className="mb-2 text-4xl font-bold text-accent"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                    >
                      {stats.time.toFixed(0)}%
                    </motion.div>
                    <div className="text-sm text-muted-foreground">
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
                      className="mb-2 text-4xl font-bold text-secondary"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                    >
                      {stats.cost.toFixed(0)}%
                    </motion.div>
                    <div className="text-sm text-muted-foreground">
                      Cost Reduction
                    </div>
                  </div>
                </InteractiveHoverCard>
              </BentoCard>
            </BentoGrid>
          </motion.div>
        </div>
      </section>
      <ExpandableChatDemo />

      {/* AI Employees Marketplace Preview */}
      <section ref={employeesRef} className="relative overflow-hidden py-20">
        <Particles className="absolute inset-0 opacity-20" quantity={50} />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
            <h2 className="mb-6 text-5xl font-bold md:text-6xl">
              <AnimatedGradientText>Hire Your AI Team</AnimatedGradientText>
            </h2>
            <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
              Browse our marketplace of specialized AI employees. Each one
              brings expert-level skills and works 24/7 without breaks,
              vacations, or overhead costs.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {displayedEmployees.map((employee, idx) => (
              <motion.div
                key={employee.id}
                initial={{ opacity: 0, y: 50 }}
                animate={employeesInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Card
                  className={cn(
                    'glass-strong card-hover group relative h-full overflow-hidden border-2 transition-all duration-300',
                    'hover:shadow-2xl hover:shadow-primary/20',
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
                          className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl ring-2 ring-border"
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
                            alt={employee.role}
                            className="h-full w-full object-cover"
                          />
                        </motion.div>
                        <div className="min-w-0 flex-1">
                          <h3 className="mb-1 truncate text-lg font-semibold">
                            {employee.role}
                          </h3>
                          <p className="truncate text-xs text-muted-foreground">
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
                    <p className="mb-4 line-clamp-2 flex-grow text-sm text-muted-foreground">
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
                    <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
                      {employee.fitLevel === 'excellent' ? (
                        <>
                          <Zap className="h-4 w-4 text-primary" />
                          <span className="text-xs font-medium text-primary">
                            Excellent Fit
                          </span>
                        </>
                      ) : (
                        <>
                          <TrendingUp className="h-4 w-4 text-accent" />
                          <span className="text-xs font-medium text-accent">
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
                          <div className="text-sm text-muted-foreground">
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
                          <div className="text-xs italic text-muted-foreground">
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
        className="relative overflow-hidden bg-muted/30 py-20"
      >
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            className="mb-16 text-center"
          >
            <Badge className="glass mb-4 px-4 py-2">
              <Zap className="mr-2 h-4 w-4" />
              Powerful Features
            </Badge>
            <h2 className="mb-6 text-5xl font-bold md:text-6xl">
              Everything You Need to Scale
            </h2>
            <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
              Enterprise-grade features that make AI workforce management
              simple, secure, and scalable.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 50 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Card className="group h-full border-2 border-border/50 p-6 transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10">
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
                  <h3 className="mb-2 text-xl font-bold transition-colors group-hover:text-primary">
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
      <section className="relative overflow-hidden py-20">
        <Spotlight className="absolute inset-0" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
              <h2 className="mb-6 text-4xl font-bold md:text-5xl">
                Watch Your AI Team Work
              </h2>
              <p className="mb-8 text-xl text-muted-foreground">
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
              <div className="aspect-video overflow-hidden rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-accent/10 shadow-2xl shadow-primary/20 backdrop-blur-xl">
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
                className="absolute -right-4 -top-4 h-24 w-24 rounded-2xl bg-gradient-to-br from-primary to-accent opacity-80 shadow-xl"
              />
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -bottom-4 -left-4 h-32 w-32 rounded-2xl bg-gradient-to-br from-accent to-secondary opacity-80 shadow-xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <Badge className="glass mb-4 px-4 py-2">
              <Star className="mr-2 h-4 w-4" />
              Testimonials
            </Badge>
            <h2 className="mb-6 text-5xl font-bold md:text-6xl">
              Loved by 10,000+ Companies
            </h2>
            <p className="text-xl text-muted-foreground">
              See how businesses are transforming with AI employees
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: 'Sarah Chen',
                role: 'CTO, TechFlow',
                company: 'TechFlow',
                avatar: '👩‍💼',
                content:
                  'AGI Agent Automation reduced our development time by 70%. Our AI employees handle complex coding tasks while our team focuses on strategy. Game-changing platform.',
                rating: 5,
                metric: '70% faster development',
              },
              {
                name: 'Marcus Rodriguez',
                role: 'CEO, GrowthCo',
                company: 'GrowthCo',
                avatar: '👨‍💼',
                content:
                  'We hired 15 AI employees for marketing and sales. Our conversion rates increased by 150% in just 3 months. The ROI is incredible.',
                rating: 5,
                metric: '150% conversion increase',
              },
              {
                name: 'Emily Watson',
                role: 'Operations Director, ScaleUp',
                company: 'ScaleUp',
                avatar: '👩‍🔬',
                content:
                  "Our AI employees handle customer support 24/7 with 98% satisfaction rates. We've saved $200K annually while improving service quality.",
                rating: 5,
                metric: '$200K annual savings',
              },
            ].map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glass group rounded-2xl border border-border/50 p-8 transition-all duration-300 hover:border-primary/50"
              >
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </div>

                <div className="mb-4 flex">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                <blockquote className="mb-6 text-muted-foreground">
                  "{testimonial.content}"
                </blockquote>

                <div className="rounded-lg bg-primary/10 px-4 py-2 text-center">
                  <span className="text-sm font-semibold text-primary">
                    {testimonial.metric}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="relative overflow-hidden py-20">
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
            <h2 className="mb-6 text-5xl font-bold md:text-6xl">
              How Teams Use AI Employees
            </h2>
            <p className="text-xl text-muted-foreground">
              Real workflows from successful implementations
            </p>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-2">
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
                className="glass group rounded-2xl border border-border/50 p-8 transition-all duration-300 hover:border-primary/50"
              >
                <div
                  className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r ${useCase.gradient} text-white`}
                >
                  {useCase.icon}
                </div>

                <h3 className="mb-3 text-2xl font-bold">{useCase.title}</h3>
                <p className="mb-6 text-muted-foreground">
                  {useCase.description}
                </p>

                <div className="mb-6 space-y-3">
                  {useCase.steps.map((step, stepIdx) => (
                    <div key={stepIdx} className="flex items-start gap-3">
                      <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {stepIdx + 1}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {step}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 px-4 py-3 text-center">
                  <span className="text-sm font-semibold text-primary">
                    {useCase.result}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative overflow-hidden py-20">
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
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
            <h2 className="mb-6 text-5xl font-bold md:text-6xl">
              Common Questions
            </h2>
            <p className="text-xl text-muted-foreground">
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
                  className="glass rounded-xl border border-border/50 px-6"
                >
                  <AccordionTrigger className="py-4 text-left hover:no-underline">
                    <span className="font-semibold">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden py-20">
        <div className="gradient-primary absolute inset-0 opacity-90"></div>
        <Particles className="absolute inset-0" quantity={100} />
        <div className="relative z-10 mx-auto max-w-5xl px-4 text-center text-white sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="mb-6 text-5xl font-bold md:text-6xl">
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
                  className="bg-white px-10 py-7 text-lg font-semibold text-primary shadow-2xl hover:bg-white/90"
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

export default LandingPage;
