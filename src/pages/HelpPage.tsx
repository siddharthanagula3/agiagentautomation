import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  Search,
  HelpCircle,
  BookOpen,
  MessageSquare,
  Mail,
  Phone,
  ChevronDown,
  Zap,
  Users,
  Settings,
  CreditCard,
  Lock,
  Workflow,
  ExternalLink,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Header from '@/components/layout/Header';
import { Particles } from '@/components/ui/particles';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

interface SupportCategory {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  articleCount: number;
  href: string;
}

const HelpPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const supportCategories: SupportCategory[] = [
    {
      id: 1,
      title: 'Getting Started',
      description: 'Learn the basics of setting up and using AI employees',
      icon: Zap,
      color: 'from-blue-500 to-cyan-500',
      articleCount: 12,
      href: '/help/getting-started'
    },
    {
      id: 2,
      title: 'Account & Billing',
      description: 'Manage your subscription, payments, and account settings',
      icon: CreditCard,
      color: 'from-green-500 to-emerald-500',
      articleCount: 8,
      href: '/help/billing'
    },
    {
      id: 3,
      title: 'AI Workflows',
      description: 'Create and optimize automated workflows',
      icon: Workflow,
      color: 'from-purple-500 to-pink-500',
      articleCount: 15,
      href: '/help/workflows'
    },
    {
      id: 4,
      title: 'Team Collaboration',
      description: 'Work effectively with AI and human team members',
      icon: Users,
      color: 'from-orange-500 to-red-500',
      articleCount: 10,
      href: '/help/team'
    },
    {
      id: 5,
      title: 'Security & Privacy',
      description: 'Understand our security measures and data protection',
      icon: Lock,
      color: 'from-indigo-500 to-purple-500',
      articleCount: 7,
      href: '/help/security'
    },
    {
      id: 6,
      title: 'Integrations',
      description: 'Connect with Slack, Salesforce, and 50+ other tools',
      icon: Settings,
      color: 'from-teal-500 to-cyan-500',
      articleCount: 20,
      href: '/help/integrations'
    }
  ];

  const faqs: FAQItem[] = [
    {
      id: 1,
      question: 'How do I create my first AI employee?',
      answer: 'Creating your first AI employee is simple! Go to the Dashboard, click "Hire AI Employee," select the role (e.g., Customer Support, Sales, Developer), configure its skills and permissions, and activate. Your AI employee will be ready to work in minutes.',
      category: 'Getting Started'
    },
    {
      id: 2,
      question: 'What\'s included in the free trial?',
      answer: 'Our 14-day free trial includes access to all features: up to 3 AI employees, unlimited workflows, integrations with 50+ tools, AI dashboards, and priority support. No credit card required to start.',
      category: 'Billing'
    },
    {
      id: 3,
      question: 'Can I integrate with my existing tools?',
      answer: 'Yes! We support 50+ integrations including Slack, Microsoft Teams, Salesforce, HubSpot, Jira, GitHub, Google Workspace, and more. You can also build custom integrations using our REST API and webhooks.',
      category: 'Integrations'
    },
    {
      id: 4,
      question: 'Is my data secure?',
      answer: 'Absolutely. We use enterprise-grade encryption (AES-256), SOC 2 Type II compliance, regular security audits, and GDPR compliance. Your data is never used to train AI models, and you maintain complete ownership.',
      category: 'Security'
    },
    {
      id: 5,
      question: 'How do AI workflows work?',
      answer: 'AI workflows are automated processes that connect triggers (like receiving an email) to actions (like creating a task, sending a response, updating a database). You can use pre-built templates or create custom workflows with our visual builder.',
      category: 'Workflows'
    },
    {
      id: 6,
      question: 'Can I upgrade or downgrade my plan anytime?',
      answer: 'Yes, you can change your plan at any time. Upgrades take effect immediately, and downgrades apply at the start of your next billing cycle. We\'ll prorate charges to ensure fairness.',
      category: 'Billing'
    },
    {
      id: 7,
      question: 'What happens if I exceed my AI employee limit?',
      answer: 'If you reach your plan\'s AI employee limit, you\'ll receive a notification to upgrade. Existing AI employees continue working normally, but you won\'t be able to create new ones until you upgrade or remove inactive employees.',
      category: 'Account'
    },
    {
      id: 8,
      question: 'How does team collaboration work?',
      answer: 'Invite team members via email, assign roles (Admin, Member, Viewer), and they can collaborate on managing AI employees, viewing dashboards, and editing workflows. You control permissions and access levels.',
      category: 'Team'
    },
    {
      id: 9,
      question: 'Do I need coding skills to use the platform?',
      answer: 'No! Our platform is designed for non-technical users with drag-and-drop workflow builders, pre-built templates, and intuitive interfaces. However, developers can access our API for advanced customization.',
      category: 'Getting Started'
    },
    {
      id: 10,
      question: 'What kind of support do you offer?',
      answer: 'We provide 24/7 email support for all plans, live chat for Pro and Enterprise, and dedicated account managers for Enterprise customers. We also have extensive documentation, video tutorials, and community forums.',
      category: 'Support'
    }
  ];

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Particles className="absolute inset-0 -z-10" quantity={30} staticity={50} />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary">
              How Can We Help?
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Search our knowledge base or get in touch with support
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                type="text"
                placeholder="Search for help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 bg-background/60 backdrop-blur-xl border-border/40 text-lg"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Support Categories */}
      <section className="pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-12"
          >
            Browse by Category
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {supportCategories.map((category, idx) => (
              <CategoryCard key={category.id} category={category} index={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">
              Quick answers to common questions
            </p>
          </motion.div>

          <div className="space-y-4">
            {filteredFAQs.map((faq, idx) => (
              <FAQCard
                key={faq.id}
                faq={faq}
                index={idx}
                isExpanded={expandedFAQ === faq.id}
                onToggle={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
              />
            ))}
          </div>

          {filteredFAQs.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-xl text-muted-foreground">No results found. Try a different search term.</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Contact Support Section */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Still Need Help?</h2>
            <p className="text-muted-foreground">
              Our support team is here to assist you
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ContactCard
              icon={MessageSquare}
              title="Live Chat"
              description="Chat with our support team"
              cta="Start Chat"
              color="from-blue-500 to-cyan-500"
              index={0}
            />
            <ContactCard
              icon={Mail}
              title="Email Support"
              description="support@agiagent.com"
              cta="Send Email"
              color="from-purple-500 to-pink-500"
              index={1}
            />
            <ContactCard
              icon={BookOpen}
              title="Documentation"
              description="Comprehensive guides & tutorials"
              cta="View Docs"
              color="from-green-500 to-emerald-500"
              index={2}
            />
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 backdrop-blur-xl border border-border/40 p-12 text-center"
          >
            <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Connect with other users, share best practices, and get tips from AI automation experts
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" size="lg" className="border-border/40">
                <Users className="mr-2" size={18} />
                Community Forum
              </Button>
              <Button className="bg-gradient-to-r from-primary to-accent" size="lg">
                <ExternalLink className="mr-2" size={18} />
                Join Discord
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

const CategoryCard: React.FC<{ category: SupportCategory; index: number }> = ({ category, index }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const Icon = category.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="relative overflow-hidden rounded-2xl bg-background/60 backdrop-blur-xl border border-border/40 hover:border-primary/50 transition-all group cursor-pointer p-6"
      whileHover={{ y: -8 }}
    >
      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${category.color} text-white mb-4`}>
        <Icon size={24} />
      </div>
      <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
        {category.title}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {category.description}
      </p>
      <div className="flex items-center justify-between pt-4 border-t border-border/40">
        <span className="text-sm text-muted-foreground">
          {category.articleCount} articles
        </span>
        <ExternalLink size={16} className="text-primary group-hover:translate-x-1 transition-transform" />
      </div>
    </motion.div>
  );
};

const FAQCard: React.FC<{
  faq: FAQItem;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ faq, index, isExpanded, onToggle }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="rounded-xl bg-background/60 backdrop-blur-xl border border-border/40 overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-accent/5 transition-colors"
      >
        <div className="flex items-start gap-4 flex-1">
          <div className="mt-1">
            <HelpCircle size={20} className="text-primary" />
          </div>
          <span className="text-lg font-semibold pr-4">{faq.question}</span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown size={20} className="text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pl-16">
              <p className="text-muted-foreground leading-relaxed">
                {faq.answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ContactCard: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
  cta: string;
  color: string;
  index: number;
}> = ({ icon: Icon, title, description, cta, color, index }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="relative overflow-hidden rounded-2xl bg-background/60 backdrop-blur-xl border border-border/40 hover:border-primary/50 transition-all group p-6 text-center"
      whileHover={{ y: -8 }}
    >
      <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${color} text-white mb-4`}>
        <Icon size={28} />
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6">{description}</p>
      <Button variant="outline" className="w-full">
        {cta}
      </Button>
    </motion.div>
  );
};

export default HelpPage;
