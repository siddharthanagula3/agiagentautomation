/**
 * Help & Support Page - Documentation, FAQs, and support resources
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Textarea } from '@shared/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@shared/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui/tabs';
import {
  HelpCircle,
  Book,
  MessageCircle,
  Mail,
  FileText,
  Video,
  Code,
  Zap,
  Send,
  ExternalLink,
  Search,
  Bot,
  Users,
  Settings,
  CreditCard,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  supportService,
  FAQ as FAQType,
} from '@features/support/services/support-service';
import { useAuthStore } from '@shared/stores/authentication-store';

interface FAQItem {
  category: string;
  question: string;
  answer: string;
}

const HelpSupportPage: React.FC = () => {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: user?.email || '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingFAQs, setIsLoadingFAQs] = useState(true);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);

  const faqs: FAQItem[] = [
    {
      category: 'Getting Started',
      question: 'How do I hire my first AI employee?',
      answer:
        'Visit the Marketplace page, browse available AI employees, and click "Hire Now" on the employee you want. AI Employees are FREE to hire - there is no cost to hire them. You only pay for tokens used. Free plan includes 1M tokens/month (250K each for OpenAI, Claude, Perplexity, Gemini). Pro plan ($29/month) includes 10M tokens/month (2.5M each).',
    },
    {
      category: 'Getting Started',
      question: 'What AI providers are supported?',
      answer:
        'We support ChatGPT (OpenAI), Claude (Anthropic), Gemini (Google), and Perplexity. You need to add at least one API key in your .env file to use the chat functionality.',
    },
    {
      category: 'Chat',
      question: 'How do I start a chat with an AI employee?',
      answer:
        'Go to the Chat page, click the "New Chat" button, select an employee from your purchased list, and start chatting. Each employee uses their configured AI provider.',
    },
    {
      category: 'Billing',
      question: 'How much does it cost?',
      answer:
        "AI Employees are FREE to hire - there is no cost to hire them. You only pay for tokens used. Free plan includes 1M tokens/month (250K each for OpenAI, Claude, Perplexity, Gemini). Pro plan ($29/month) includes 10M tokens/month (2.5M each). The actual AI API costs depend on your usage and the provider you're using, but you get generous token allowances included with each plan.",
    },
    {
      category: 'Technical',
      question: 'Is my data secure?',
      answer:
        'Yes! We use Supabase for secure data storage with row-level security. Your conversations and data are encrypted and only accessible to you.',
    },
    {
      category: 'Automation',
      question: 'How do I create a workflow?',
      answer:
        'Go to Automation > Designer, use the visual workflow builder to create your automation by connecting nodes, and click "Save" when done.',
    },
  ];

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const faqsByCategory = filteredFaqs.reduce(
    (acc, faq) => {
      if (!acc[faq.category]) {
        acc[faq.category] = [];
      }
      acc[faq.category].push(faq);
      return acc;
    },
    {} as Record<string, FAQItem[]>
  );

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !contactForm.name ||
      !contactForm.email ||
      !contactForm.subject ||
      !contactForm.message
    ) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supportService.submitTicket({
        name: contactForm.name,
        email: contactForm.email,
        subject: contactForm.subject,
        message: contactForm.message,
      });

      if (error) {
        console.error('Error submitting ticket:', error);
        toast.error('Failed to send message. Please try again.');
        return;
      }

      toast.success("Message sent successfully! We'll get back to you soon.");
      setContactForm({
        name: '',
        email: user?.email || '',
        subject: '',
        message: '',
      });
    } catch (error) {
      console.error('Error submitting ticket:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold">Help & Support</h1>
        <p className="mt-1 text-muted-foreground">
          Find answers and get the help you need
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for help..."
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs defaultValue="faq" className="space-y-6">
          <TabsList>
            <TabsTrigger value="faq">
              <HelpCircle className="mr-2 h-4 w-4" />
              FAQs
            </TabsTrigger>
            <TabsTrigger value="docs">
              <Book className="mr-2 h-4 w-4" />
              Documentation
            </TabsTrigger>
            <TabsTrigger value="contact">
              <MessageCircle className="mr-2 h-4 w-4" />
              Contact Us
            </TabsTrigger>
          </TabsList>

          <TabsContent value="faq" className="space-y-6">
            {isLoadingFAQs ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Loader2 className="mx-auto mb-4 h-16 w-16 animate-spin text-primary" />
                  <p className="text-muted-foreground">Loading FAQs...</p>
                </CardContent>
              </Card>
            ) : Object.entries(faqsByCategory).length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <HelpCircle className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                  <h3 className="mb-2 text-xl font-semibold">
                    No results found
                  </h3>
                  <p className="text-muted-foreground">
                    Try different search terms
                  </p>
                  <Button
                    onClick={() => setSearchQuery('')}
                    variant="outline"
                    className="mt-4"
                  >
                    Clear Search
                  </Button>
                </CardContent>
              </Card>
            ) : (
              Object.entries(faqsByCategory).map(([category, items]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      {category === 'Getting Started' && (
                        <Zap className="mr-2 h-5 w-5 text-primary" />
                      )}
                      {category === 'Chat' && (
                        <MessageCircle className="mr-2 h-5 w-5 text-success" />
                      )}
                      {category === 'Billing' && (
                        <CreditCard className="mr-2 h-5 w-5 text-primary" />
                      )}
                      {category === 'Technical' && (
                        <Code className="mr-2 h-5 w-5 text-primary" />
                      )}
                      {category === 'Automation' && (
                        <Bot className="mr-2 h-5 w-5 text-primary" />
                      )}
                      {category === 'Account' && (
                        <Settings className="mr-2 h-5 w-5 text-primary" />
                      )}
                      {category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {items.map((faq, index) => (
                        <AccordionItem
                          key={index}
                          value={`${category}-${index}`}
                        >
                          <AccordionTrigger className="text-left hover:text-primary">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="docs" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {[
                {
                  title: 'Quick Start Guide',
                  desc: 'Get up and running in minutes',
                  icon: Zap,
                },
                {
                  title: 'API Documentation',
                  desc: 'Complete API reference',
                  icon: Code,
                },
                {
                  title: 'Video Tutorials',
                  desc: 'Step-by-step video guides',
                  icon: Video,
                },
                {
                  title: 'Best Practices',
                  desc: 'Tips for optimal usage',
                  icon: Book,
                },
              ].map((doc, i) => (
                <Card
                  key={i}
                  className="transition-colors hover:border-primary/50"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="rounded-lg bg-primary/20 p-3">
                        <doc.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-1 text-lg font-semibold">
                          {doc.title}
                        </h3>
                        <p className="mb-3 text-sm text-muted-foreground">
                          {doc.desc}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toast.info('Coming soon!')}
                        >
                          Read More
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                {
                  title: 'Email Support',
                  desc: 'support@agiworkforce.com',
                  icon: Mail,
                  action: 'Send Email',
                  href: 'mailto:support@agiworkforce.com',
                },
                {
                  title: 'Live Chat',
                  desc: 'Chat with our support team',
                  icon: MessageCircle,
                  action: 'Start Chat',
                  href: '#',
                },
                {
                  title: 'Community Forum',
                  desc: 'Connect with other users',
                  icon: Users,
                  action: 'Visit Forum',
                  href: '#',
                },
              ].map((ch, i) => (
                <Card key={i}>
                  <CardContent className="p-6 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                      <ch.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">{ch.title}</h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                      {ch.desc}
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        ch.href === '#'
                          ? toast.info('Coming soon!')
                          : (window.location.href = ch.href)
                      }
                    >
                      {ch.action}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Send us a message</CardTitle>
                <CardDescription>
                  We'll get back to you as soon as possible
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Name
                      </label>
                      <Input
                        value={contactForm.name}
                        onChange={(e) =>
                          setContactForm((p) => ({
                            ...p,
                            name: e.target.value,
                          }))
                        }
                        required
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Email
                      </label>
                      <Input
                        type="email"
                        value={contactForm.email}
                        onChange={(e) =>
                          setContactForm((p) => ({
                            ...p,
                            email: e.target.value,
                          }))
                        }
                        required
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Subject
                    </label>
                    <Input
                      value={contactForm.subject}
                      onChange={(e) =>
                        setContactForm((p) => ({
                          ...p,
                          subject: e.target.value,
                        }))
                      }
                      required
                      placeholder="How can we help?"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Message
                    </label>
                    <Textarea
                      value={contactForm.message}
                      onChange={(e) =>
                        setContactForm((p) => ({
                          ...p,
                          message: e.target.value,
                        }))
                      }
                      required
                      className="min-h-[150px]"
                      placeholder="Please describe your issue..."
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="gradient-primary"
                  >
                    {isSubmitting ? (
                      'Sending...'
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default HelpSupportPage;
