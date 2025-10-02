import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
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
  Package
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Particles } from '../components/ui/particles';
import { Spotlight, MouseSpotlight } from '../components/ui/spotlight';
import { BentoGrid, BentoCard } from '../components/ui/bento-grid';
import { InteractiveHoverCard } from '../components/ui/interactive-hover-card';
import { AnimatedGradientText } from '../components/ui/animated-gradient-text';

// AI Employees data inspired by Motion.com
const aiEmployees = [
  {
    id: 1,
    name: "Alex - Code Architect",
    role: "Senior Developer",
    avatar: "👨‍💻",
    specialty: "Full-stack development",
    skills: ["React", "Node.js", "Python", "TypeScript"],
    color: "from-blue-500 to-cyan-500",
    available: true
  },
  {
    id: 2,
    name: "Maya - Design Genius",
    role: "UI/UX Designer",
    avatar: "🎨",
    specialty: "Product design & branding",
    skills: ["Figma", "Design Systems", "Prototyping", "Animation"],
    color: "from-purple-500 to-pink-500",
    available: true
  },
  {
    id: 3,
    name: "Sage - Data Scientist",
    role: "Analytics Expert",
    avatar: "📊",
    specialty: "Data analysis & ML",
    skills: ["Python", "TensorFlow", "Analytics", "Visualization"],
    color: "from-green-500 to-emerald-500",
    available: true
  },
  {
    id: 4,
    name: "Phoenix - Marketing Pro",
    role: "Growth Marketer",
    avatar: "📈",
    specialty: "Growth & content strategy",
    skills: ["SEO", "Content", "Analytics", "Campaigns"],
    color: "from-orange-500 to-red-500",
    available: true
  },
  {
    id: 5,
    name: "Nova - Customer Success",
    role: "Support Specialist",
    avatar: "💬",
    specialty: "Customer engagement",
    skills: ["Support", "Onboarding", "Documentation", "Training"],
    color: "from-indigo-500 to-violet-500",
    available: true
  },
  {
    id: 6,
    name: "Atlas - DevOps Engineer",
    role: "Infrastructure Expert",
    avatar: "🚀",
    specialty: "Cloud & deployment",
    skills: ["AWS", "Docker", "Kubernetes", "CI/CD"],
    color: "from-yellow-500 to-amber-500",
    available: true
  }
];

// Features data
const features = [
  {
    icon: <Brain className="w-6 h-6" />,
    title: "AI-Powered Automation",
    description: "Automate complex workflows with advanced AI that understands context and makes intelligent decisions",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Lightning Fast",
    description: "Deploy AI employees in seconds. See results in minutes, not days or weeks",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Enterprise Security",
    description: "Bank-level encryption, SOC 2 compliant, and GDPR ready. Your data is safe with us",
    gradient: "from-green-500 to-emerald-500"
  },
  {
    icon: <Workflow className="w-6 h-6" />,
    title: "Custom Workflows",
    description: "Build and deploy custom workflows tailored to your business needs",
    gradient: "from-orange-500 to-red-500"
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Real-time Analytics",
    description: "Track performance, costs, and efficiency with comprehensive analytics dashboard",
    gradient: "from-indigo-500 to-violet-500"
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Team Collaboration",
    description: "Share AI employees across your team and collaborate on workflows seamlessly",
    gradient: "from-yellow-500 to-amber-500"
  }
];

// Testimonials
const testimonials = [
  {
    quote: "We saved 40 hours per week and scaled our operations 3x without hiring. Game changer!",
    author: "Sarah Chen",
    role: "CEO at TechCorp",
    company: "TechCorp",
    avatar: "SC"
  },
  {
    quote: "The AI employees are like having a senior team member available 24/7. Incredible ROI.",
    author: "Michael Rodriguez",
    role: "CTO at StartupX",
    company: "StartupX",
    avatar: "MR"
  },
  {
    quote: "Cut our operational costs by 65% while improving quality. This is the future of work.",
    author: "Emily Watson",
    role: "Founder at GrowthLab",
    company: "GrowthLab",
    avatar: "EW"
  }
];

// Company logos for social proof
const companies = [
  { name: "TechCorp", logo: "🏢" },
  { name: "StartupX", logo: "🚀" },
  { name: "GrowthLab", logo: "📈" },
  { name: "DataFlow", logo: "💾" },
  { name: "CloudNine", logo: "☁️" },
  { name: "InnovateCo", logo: "💡" }
];

// FAQ data
const faqs = [
  {
    question: "How quickly can I get started?",
    answer: "You can create your first AI employee in under 2 minutes. Simply sign up, choose from our marketplace, and start delegating tasks immediately. No technical knowledge required."
  },
  {
    question: "What tasks can AI employees handle?",
    answer: "AI employees can handle a wide range of tasks including coding, design, data analysis, content creation, customer support, marketing, and much more. Each AI employee specializes in specific domains with expert-level capabilities."
  },
  {
    question: "How much does it cost?",
    answer: "We offer a free forever plan to get started. Paid plans start at $29/month per AI employee with volume discounts. Enterprise plans available with custom pricing and SLAs."
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We use bank-level encryption, are SOC 2 compliant, and GDPR ready. Your data is isolated, encrypted at rest and in transit, and never used to train models without explicit permission."
  },
  {
    question: "Can I customize AI employees?",
    answer: "Yes! You can customize skills, workflows, integrations, and behavior. Advanced users can even create custom AI employees from scratch using our visual workflow builder."
  },
  {
    question: "What kind of support do you offer?",
    answer: "We offer 24/7 email support for all plans, priority support for paid plans, and dedicated success managers for enterprise customers. Comprehensive documentation and video tutorials available."
  }
];

const LandingPage: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [stats, setStats] = useState({ tasks: 0, time: 0, cost: 0 });
  const [activeEmployee, setActiveEmployee] = useState(0);

  const employeesRef = useRef(null);
  const featuresRef = useRef(null);
  const employeesInView = useInView(employeesRef, { once: true, amount: 0.3 });
  const featuresInView = useInView(featuresRef, { once: true, amount: 0.2 });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        tasks: Math.min(prev.tasks + 247, 50000),
        time: Math.min(prev.time + 1.3, 98),
        cost: Math.min(prev.cost + 2.1, 89)
      }));
    }, 10);
    setTimeout(() => clearInterval(interval), 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveEmployee((prev) => (prev + 1) % aiEmployees.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <Particles className="absolute inset-0 z-0" quantity={100} />
        <Spotlight className="absolute inset-0 z-0" />
        <div className="absolute inset-0 gradient-mesh"></div>

        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ y: [0, -15, 0], x: [0, -15, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 right-1/3 w-64 h-64 bg-secondary/10 rounded-full blur-3xl"
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <Badge className="mb-8 glass px-6 py-2 text-base font-medium">
              <Sparkles className="mr-2 h-4 w-4" />
              Your Complete AI Workforce - Available Now
            </Badge>

            <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-tight">
              <motion.span
                className="block mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Create Hundreds of
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

            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed">
              Build your dream team of AI employees who work 24/7.
              <span className="text-foreground font-semibold"> No hiring, no training, no overhead</span> -
              just instant expertise across every function.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" className="btn-glow gradient-primary text-white text-lg px-10 py-7 shadow-xl" asChild>
                  <Link to="/auth/register">
                    Start Building Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" variant="outline" className="glass text-lg px-10 py-7" asChild>
                  <Link to="/demo">
                    <Play className="mr-2 h-5 w-5" />
                    Watch Demo
                  </Link>
                </Button>
              </motion.div>
            </div>

            <BentoGrid className="max-w-4xl mx-auto">
              <BentoCard
                className="backdrop-blur-xl bg-background/40 border-primary/20"
                hover={true}
              >
                <InteractiveHoverCard>
                  <div className="text-center">
                    <motion.div
                      className="text-4xl font-bold text-primary mb-2"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      {stats.tasks.toLocaleString()}+
                    </motion.div>
                    <div className="text-sm text-muted-foreground">Tasks Completed Daily</div>
                  </div>
                </InteractiveHoverCard>
              </BentoCard>

              <BentoCard
                className="backdrop-blur-xl bg-background/40 border-accent/20"
                hover={true}
              >
                <InteractiveHoverCard>
                  <div className="text-center">
                    <motion.div
                      className="text-4xl font-bold text-accent mb-2"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                    >
                      {stats.time.toFixed(0)}%
                    </motion.div>
                    <div className="text-sm text-muted-foreground">Time Saved</div>
                  </div>
                </InteractiveHoverCard>
              </BentoCard>

              <BentoCard
                className="backdrop-blur-xl bg-background/40 border-secondary/20"
                hover={true}
              >
                <InteractiveHoverCard>
                  <div className="text-center">
                    <motion.div
                      className="text-4xl font-bold text-secondary mb-2"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                    >
                      {stats.cost.toFixed(0)}%
                    </motion.div>
                    <div className="text-sm text-muted-foreground">Cost Reduction</div>
                  </div>
                </InteractiveHoverCard>
              </BentoCard>
            </BentoGrid>
          </motion.div>
        </div>
      </section>

      {/* Social Proof - Company Logos */}
      <section className="py-16 bg-muted/30 backdrop-blur-sm border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-muted-foreground mb-12"
          >
            Trusted by innovative companies worldwide
          </motion.p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center">
            {companies.map((company, idx) => (
              <motion.div
                key={company.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.1 }}
                className="flex flex-col items-center gap-2 p-4"
              >
                <span className="text-4xl">{company.logo}</span>
                <span className="text-sm font-medium text-muted-foreground">{company.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Employees Marketplace Preview */}
      <section ref={employeesRef} className="py-32 relative overflow-hidden">
        <Particles className="absolute inset-0 opacity-20" quantity={50} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={employeesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 glass px-4 py-2">
              <Users className="mr-2 h-4 w-4" />
              AI Marketplace
            </Badge>
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <AnimatedGradientText>Hire Your AI Team</AnimatedGradientText>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Browse our marketplace of specialized AI employees. Each one brings expert-level skills
              and works 24/7 without breaks, vacations, or overhead costs.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiEmployees.map((employee, idx) => (
              <motion.div
                key={employee.id}
                initial={{ opacity: 0, y: 50 }}
                animate={employeesInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <InteractiveHoverCard>
                  <Card className={cn(
                    "group relative overflow-hidden border-2 transition-all duration-300",
                    "hover:shadow-2xl hover:shadow-primary/20",
                    activeEmployee === idx ? "border-primary/50" : "border-border/50"
                  )}>
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity",
                      employee.color
                    )} />
                    <div className="p-6 relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <motion.div
                          className="text-6xl"
                          animate={activeEmployee === idx ? {
                            scale: [1, 1.2, 1],
                            rotate: [0, 10, -10, 0]
                          } : {}}
                          transition={{ duration: 0.5 }}
                        >
                          {employee.avatar}
                        </motion.div>
                        {employee.available && (
                          <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                            Available
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-xl font-bold mb-1">{employee.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{employee.role}</p>
                      <p className="text-sm mb-4">{employee.specialty}</p>
                      <div className="flex flex-wrap gap-2">
                        {employee.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      <Button className="w-full mt-4 group-hover:bg-primary group-hover:text-white transition-colors" asChild>
                        <Link to="/marketplace">
                          Hire Now
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                    </div>
                  </Card>
                </InteractiveHoverCard>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Button size="lg" variant="outline" className="glass" asChild>
              <Link to="/marketplace">
                Browse All AI Employees
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-32 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-16"
          >
            <Badge className="mb-4 glass px-4 py-2">
              <Zap className="mr-2 h-4 w-4" />
              Powerful Features
            </Badge>
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              Everything You Need to Scale
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Enterprise-grade features that make AI workforce management simple, secure, and scalable.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 50 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Card className="group h-full p-6 border-2 border-border/50 hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/10">
                  <motion.div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br text-white",
                      feature.gradient
                    )}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    {feature.icon}
                  </motion.div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Demo Section */}
      <section className="py-32 relative overflow-hidden">
        <Spotlight className="absolute inset-0" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <Badge className="mb-4 glass px-4 py-2">
                <Video className="mr-2 h-4 w-4" />
                See It In Action
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Watch Your AI Team Work
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                See how easy it is to delegate tasks, monitor progress, and achieve results with your AI workforce.
              </p>
              <ul className="space-y-4 mb-8">
                {["Deploy in 60 seconds", "Natural language commands", "Real-time progress tracking", "Collaborate with your team"].map((item, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
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
              <div className="aspect-video rounded-2xl overflow-hidden border-2 border-primary/20 shadow-2xl shadow-primary/20 bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-xl">
                <div className="flex items-center justify-center h-full">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border-2 border-white/20 cursor-pointer"
                  >
                    <Play className="h-8 w-8 text-white" />
                  </motion.div>
                </div>
              </div>
              {/* Floating elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-2xl shadow-xl opacity-80"
              />
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-accent to-secondary rounded-2xl shadow-xl opacity-80"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 bg-muted/30 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 glass px-4 py-2">
              <Quote className="mr-2 h-4 w-4" />
              Testimonials
            </Badge>
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              Loved by Teams Worldwide
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See how businesses are transforming with AI employees
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-6 h-full hover:shadow-xl transition-shadow border-2 border-border/50 hover:border-primary/30">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-lg mb-6 leading-relaxed">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold">{testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 glass px-4 py-2">
              <MessageSquare className="mr-2 h-4 w-4" />
              FAQ
            </Badge>
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
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
                <AccordionItem key={idx} value={`item-${idx}`} className="glass border border-border/50 rounded-xl px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
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
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-90"></div>
        <Particles className="absolute inset-0" quantity={100} />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              Ready to Build Your AI Workforce?
            </h2>
            <p className="text-xl md:text-2xl mb-12 opacity-90 max-w-3xl mx-auto">
              Join thousands of entrepreneurs and businesses using AI to scale without limits.
              Start free today - no credit card required.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white hover:bg-white/90 text-primary text-lg px-10 py-7 font-semibold shadow-2xl"
                  asChild
                >
                  <Link to="/auth/register">
                    Start Building Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/30 bg-white/10 hover:bg-white/20 text-white text-lg px-10 py-7 backdrop-blur-sm"
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
