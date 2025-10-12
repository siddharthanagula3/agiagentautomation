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
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Particles } from '@/components/ui/particles';
import { SEOHead } from '@/components/seo/SEOHead';

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
      href: '/help/getting-started',
    },
    {
      id: 2,
      title: 'Account & Billing',
      description: 'Manage your subscription, payments, and account settings',
      icon: CreditCard,
      color: 'from-green-500 to-emerald-500',
      articleCount: 8,
      href: '/help/billing',
    },
    {
      id: 3,
      title: 'AI Workflows',
      description: 'Create and optimize automated workflows',
      icon: Workflow,
      color: 'from-purple-500 to-pink-500',
      articleCount: 15,
      href: '/help/workflows',
    },
    {
      id: 4,
      title: 'Team Collaboration',
      description: 'Work effectively with AI and human team members',
      icon: Users,
      color: 'from-orange-500 to-red-500',
      articleCount: 10,
      href: '/help/team',
    },
    {
      id: 5,
      title: 'Security & Privacy',
      description: 'Understand our security measures and data protection',
      icon: Lock,
      color: 'from-indigo-500 to-purple-500',
      articleCount: 7,
      href: '/help/security',
    },
    {
      id: 6,
      title: 'Integrations',
      description: 'Connect with Slack, Salesforce, and 50+ other tools',
      icon: Settings,
      color: 'from-teal-500 to-cyan-500',
      articleCount: 20,
      href: '/help/integrations',
    },
  ];

  const faqs: FAQItem[] = [
    {
      id: 1,
      question: 'How do I create my first AI employee?',
      answer:
        'Creating your first AI employee is simple! Go to the Dashboard, click "Hire AI Employee," select the role (e.g., Customer Support, Sales, Developer), configure its skills and permissions, and activate. Your AI employee will be ready to work in minutes.',
      category: 'Getting Started',
    },
    {
      id: 2,
      question: "What's included in the free trial?",
      answer:
        'Our 14-day free trial includes access to all features: up to 3 AI employees, unlimited workflows, integrations with 50+ tools, AI dashboards, and priority support. No credit card required to start.',
      category: 'Billing',
    },
    {
      id: 3,
      question: 'Can I integrate with my existing tools?',
      answer:
        'Yes! We support 50+ integrations including Slack, Microsoft Teams, Salesforce, HubSpot, Jira, GitHub, Google Workspace, and more. You can also build custom integrations using our REST API and webhooks.',
      category: 'Integrations',
    },
    {
      id: 4,
      question: 'Is my data secure?',
      answer:
        'Absolutely. We use enterprise-grade encryption (AES-256), SOC 2 Type II compliance, regular security audits, and GDPR compliance. Your data is never used to train AI models, and you maintain complete ownership.',
      category: 'Security',
    },
    {
      id: 5,
      question: 'How do AI workflows work?',
      answer:
        'AI workflows are automated processes that connect triggers (like receiving an email) to actions (like creating a task, sending a response, updating a database). You can use pre-built templates or create custom workflows with our visual builder.',
      category: 'Workflows',
    },
    {
      id: 6,
      question: 'Can I upgrade or downgrade my plan anytime?',
      answer:
        "Yes, you can change your plan at any time. Upgrades take effect immediately, and downgrades apply at the start of your next billing cycle. We'll prorate charges to ensure fairness.",
      category: 'Billing',
    },
    {
      id: 7,
      question: 'What happens if I exceed my AI employee limit?',
      answer:
        "If you reach your plan's AI employee limit, you'll receive a notification to upgrade. Existing AI employees continue working normally, but you won't be able to create new ones until you upgrade or remove inactive employees.",
      category: 'Account',
    },
    {
      id: 8,
      question: 'How does team collaboration work?',
      answer:
        'Invite team members via email, assign roles (Admin, Member, Viewer), and they can collaborate on managing AI employees, viewing dashboards, and editing workflows. You control permissions and access levels.',
      category: 'Team',
    },
    {
      id: 9,
      question: 'Do I need coding skills to use the platform?',
      answer:
        'No! Our platform is designed for non-technical users with drag-and-drop workflow builders, pre-built templates, and intuitive interfaces. However, developers can access our API for advanced customization.',
      category: 'Getting Started',
    },
    {
      id: 10,
      question: 'What kind of support do you offer?',
      answer:
        'We provide 24/7 email support for all plans, live chat for Pro and Enterprise, and dedicated account managers for Enterprise customers. We also have extensive documentation, video tutorials, and community forums.',
      category: 'Support',
    },
  ];

  const filteredFAQs = faqs.filter(
    faq =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Help & Support | AGI Agent Automation"
        description="Get help with AGI Agent Automation platform. Find answers to common questions, tutorials, and contact our support team for assistance."
        keywords={[
          'help center',
          'support',
          'ai automation help',
          'ai employee support',
          'tutorials',
          'documentation',
          'faq',
          'customer support',
        ]}
        ogType="website"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Help & Support',
          description: 'Get help with AGI Agent Automation platform',
          mainEntity: {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'How quickly can I get started?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'You can get started in minutes. Simply sign up, choose your AI employees, and begin automating your workflows immediately.',
                },
              },
            ],
          },
        }}
      />
      <Particles
        className="absolute inset-0 -z-10"
        quantity={30}
        staticity={50}
      />

      {/* Hero Section */}
      <section className="px-4 pb-16 pt-32 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-5xl font-bold text-transparent md:text-6xl">
              How Can We Help?
            </h1>
            <p className="mb-8 text-xl text-muted-foreground">
              Search our knowledge base or get in touch with support
            </p>

            {/* Search Bar */}
            <div className="relative mx-auto max-w-2xl">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={20}
              />
              <Input
                type="text"
                placeholder="Search for help articles..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-14 border-border/40 bg-background/60 pl-12 text-lg backdrop-blur-xl"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Support Categories */}
      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center text-3xl font-bold"
          >
            Browse by Category
          </motion.h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {supportCategories.map((category, idx) => (
              <CategoryCard key={category.id} category={category} index={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold">
              Frequently Asked Questions
            </h2>
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
                onToggle={() =>
                  setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)
                }
              />
            ))}
          </div>

          {filteredFAQs.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center"
            >
              <p className="text-xl text-muted-foreground">
                No results found. Try a different search term.
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Contact Support Section */}
      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold">Still Need Help?</h2>
            <p className="text-muted-foreground">
              Our support team is here to assist you
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
              description="support@agiworkforce.com"
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
      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 p-12 text-center backdrop-blur-xl"
          >
            <h2 className="mb-4 text-3xl font-bold">Join Our Community</h2>
            <p className="mx-auto mb-8 max-w-2xl text-muted-foreground">
              Connect with other users, share best practices, and get tips from
              AI automation experts
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button variant="outline" size="lg" className="border-border/40">
                <Users className="mr-2" size={18} />
                Community Forum
              </Button>
              <Button
                className="bg-gradient-to-r from-primary to-accent"
                size="lg"
              >
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

const CategoryCard: React.FC<{ category: SupportCategory; index: number }> = ({
  category,
  index,
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const Icon = category.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur-xl transition-all hover:border-primary/50"
      whileHover={{ y: -8 }}
    >
      <div
        className={`inline-flex rounded-xl bg-gradient-to-br p-3 ${category.color} mb-4 text-white`}
      >
        <Icon size={24} />
      </div>
      <h3 className="mb-2 text-xl font-bold transition-colors group-hover:text-primary">
        {category.title}
      </h3>
      <p className="mb-4 text-sm text-muted-foreground">
        {category.description}
      </p>
      <div className="flex items-center justify-between border-t border-border/40 pt-4">
        <span className="text-sm text-muted-foreground">
          {category.articleCount} articles
        </span>
        <ExternalLink
          size={16}
          className="text-primary transition-transform group-hover:translate-x-1"
        />
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
      className="overflow-hidden rounded-xl border border-border/40 bg-background/60 backdrop-blur-xl"
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-accent/5"
      >
        <div className="flex flex-1 items-start gap-4">
          <div className="mt-1">
            <HelpCircle size={20} className="text-primary" />
          </div>
          <span className="pr-4 text-lg font-semibold">{faq.question}</span>
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
              <p className="leading-relaxed text-muted-foreground">
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
      className="group relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 p-6 text-center backdrop-blur-xl transition-all hover:border-primary/50"
      whileHover={{ y: -8 }}
    >
      <div
        className={`inline-flex rounded-xl bg-gradient-to-br p-4 ${color} mb-4 text-white`}
      >
        <Icon size={28} />
      </div>
      <h3 className="mb-2 text-xl font-bold">{title}</h3>
      <p className="mb-6 text-sm text-muted-foreground">{description}</p>
      <Button variant="outline" className="w-full">
        {cta}
      </Button>
    </motion.div>
  );
};

export default HelpPage;
