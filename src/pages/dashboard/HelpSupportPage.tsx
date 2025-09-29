/**
 * Help & Support Page - Documentation, FAQs, and support resources
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
  CheckCircle,
  ExternalLink,
  Search,
  Bot,
  Users,
  Settings,
  CreditCard,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

interface FAQItem {
  category: string;
  question: string;
  answer: string;
}

const HelpSupportPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const faqs: FAQItem[] = [
    {
      category: 'Getting Started',
      question: 'How do I hire my first AI employee?',
      answer: 'Visit the Marketplace page, browse available AI employees, and click "Hire Now" on the employee you want. The cost is $1 per employee, and they will be immediately available in your Chat page.'
    },
    {
      category: 'Getting Started',
      question: 'What AI providers are supported?',
      answer: 'We support ChatGPT (OpenAI), Claude (Anthropic), Gemini (Google), and Perplexity. You need to add at least one API key in your .env file to use the chat functionality.'
    },
    {
      category: 'Getting Started',
      question: 'How do I configure API keys?',
      answer: 'Add your API keys to the .env file in your project root. For example: VITE_OPENAI_API_KEY=your-key-here. See the API_SETUP_GUIDE.md for detailed instructions.'
    },
    {
      category: 'Chat',
      question: 'How do I start a chat with an AI employee?',
      answer: 'Go to the Chat page, click the "New Chat" button, select an employee from your purchased list, and start chatting. Each employee uses their configured AI provider.'
    },
    {
      category: 'Chat',
      question: 'Can I chat with multiple employees at once?',
      answer: 'Yes! The chat interface supports multiple tabs. You can open separate conversations with different AI employees and switch between them easily.'
    },
    {
      category: 'Chat',
      question: 'Why am I getting "API key not configured" errors?',
      answer: 'This means the AI provider for that employee doesn\'t have an API key set up. Add the required API key to your .env file and restart the development server.'
    },
    {
      category: 'Billing',
      question: 'How much does it cost?',
      answer: 'Currently, hiring AI employees costs $1 each. The actual AI API costs depend on your usage and the provider you\'re using. Check your provider\'s pricing for details.'
    },
    {
      category: 'Billing',
      question: 'What payment methods are accepted?',
      answer: 'We use Stripe for secure payment processing. You can pay with credit cards, debit cards, and other methods supported by Stripe.'
    },
    {
      category: 'Billing',
      question: 'Can I get a refund?',
      answer: 'Refunds are available within 7 days of purchase if you haven\'t used the AI employee. Contact support with your purchase details.'
    },
    {
      category: 'Technical',
      question: 'What are the system requirements?',
      answer: 'You need a modern web browser (Chrome, Firefox, Safari, or Edge), a stable internet connection, and Node.js 18+ if running locally.'
    },
    {
      category: 'Technical',
      question: 'Is my data secure?',
      answer: 'Yes! We use Supabase for secure data storage with row-level security. Your conversations and data are encrypted and only accessible to you.'
    },
    {
      category: 'Technical',
      question: 'Can I export my chat history?',
      answer: 'Yes, chat history export will be available soon. Currently, all your conversations are saved in your account and accessible anytime.'
    },
    {
      category: 'Automation',
      question: 'How do I create a workflow?',
      answer: 'Go to Automation > Designer, use the visual workflow builder to create your automation by connecting nodes, and click "Save" when done.'
    },
    {
      category: 'Automation',
      question: 'Can workflows run automatically?',
      answer: 'Yes! Workflows can be triggered by schedule, webhook, or manually. Configure triggers in the workflow settings.'
    },
    {
      category: 'Account',
      question: 'How do I change my password?',
      answer: 'Go to Settings > Security and click "Change Password". Follow the prompts to set a new password.'
    }
  ];

  const documentationLinks = [
    {
      title: 'Quick Start Guide',
      description: 'Get up and running in minutes',
      icon: Zap,
      href: '/docs/quickstart'
    },
    {
      title: 'API Documentation',
      description: 'Complete API reference',
      icon: Code,
      href: '/docs/api'
    },
    {
      title: 'Video Tutorials',
      description: 'Step-by-step video guides',
      icon: Video,
      href: '/docs/videos'
    },
    {
      title: 'Best Practices',
      description: 'Tips for optimal usage',
      icon: Book,
      href: '/docs/best-practices'
    }
  ];

  const supportChannels = [
    {
      title: 'Email Support',
      description: 'support@agiplatform.com',
      icon: Mail,
      action: 'Send Email',
      href: 'mailto:support@agiplatform.com'
    },
    {
      title: 'Live Chat',
      description: 'Chat with our support team',
      icon: MessageCircle,
      action: 'Start Chat',
      href: '#'
    },
    {
      title: 'Community Forum',
      description: 'Connect with other users',
      icon: Users,
      action: 'Visit Forum',
      href: '#'
    }
  ];

  const filteredFaqs = faqs.filter(
    faq =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const faqsByCategory = filteredFaqs.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, FAQItem[]>);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Message sent successfully! We\'ll get back to you soon.');
      setContactForm({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Help & Support</h1>
          <p className="text-slate-400 mt-1">
            Find answers and get the help you need
          </p>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for help..."
                className="pl-10 bg-slate-700/30 border-slate-600/30 text-white placeholder:text-slate-500"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs defaultValue="faq" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger value="faq" className="data-[state=active]:bg-slate-700">
              <HelpCircle className="h-4 w-4 mr-2" />
              FAQs
            </TabsTrigger>
            <TabsTrigger value="docs" className="data-[state=active]:bg-slate-700">
              <Book className="h-4 w-4 mr-2" />
              Documentation
            </TabsTrigger>
            <TabsTrigger value="contact" className="data-[state=active]:bg-slate-700">
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact Us
            </TabsTrigger>
          </TabsList>

          {/* FAQs Tab */}
          <TabsContent value="faq" className="space-y-6">
            {Object.entries(faqsByCategory).length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="p-12 text-center">
                  <HelpCircle className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
                  <p className="text-slate-400">
                    Try different search terms or browse all FAQs
                  </p>
                  <Button 
                    onClick={() => setSearchQuery('')}
                    variant="outline"
                    className="mt-4 border-slate-600 text-slate-300"
                  >
                    Clear Search
                  </Button>
                </CardContent>
              </Card>
            ) : (
              Object.entries(faqsByCategory).map(([category, items]) => (
                <Card key={category} className="bg-slate-800/50 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      {category === 'Getting Started' && <Zap className="h-5 w-5 mr-2 text-blue-400" />}
                      {category === 'Chat' && <MessageCircle className="h-5 w-5 mr-2 text-green-400" />}
                      {category === 'Billing' && <CreditCard className="h-5 w-5 mr-2 text-purple-400" />}
                      {category === 'Technical' && <Code className="h-5 w-5 mr-2 text-orange-400" />}
                      {category === 'Automation' && <Bot className="h-5 w-5 mr-2 text-pink-400" />}
                      {category === 'Account' && <Settings className="h-5 w-5 mr-2 text-yellow-400" />}
                      {category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {items.map((faq, index) => (
                        <AccordionItem key={index} value={`${category}-${index}`}>
                          <AccordionTrigger className="text-left text-slate-200 hover:text-white">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-slate-400">
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

          {/* Documentation Tab */}
          <TabsContent value="docs" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {documentationLinks.map((doc, index) => (
                <Card key={index} className="bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-blue-600/20 p-3 rounded-lg">
                        <doc.icon className="h-6 w-6 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {doc.title}
                        </h3>
                        <p className="text-slate-400 text-sm mb-3">
                          {doc.description}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-600 text-slate-300 hover:text-white"
                          onClick={() => toast.info('Documentation coming soon!')}
                        >
                          Read More
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Quick Links</CardTitle>
                <CardDescription>Common topics and guides</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <a href="#" className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-slate-400" />
                      <span className="text-slate-200">API Setup Guide</span>
                    </div>
                    <ExternalLink className="h-4 w-4 text-slate-500" />
                  </a>
                  <a href="#" className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-slate-400" />
                      <span className="text-slate-200">Workflow Creation Tutorial</span>
                    </div>
                    <ExternalLink className="h-4 w-4 text-slate-500" />
                  </a>
                  <a href="#" className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-slate-400" />
                      <span className="text-slate-200">Security Best Practices</span>
                    </div>
                    <ExternalLink className="h-4 w-4 text-slate-500" />
                  </a>
                  <a href="#" className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-slate-400" />
                      <span className="text-slate-200">Billing & Subscription Guide</span>
                    </div>
                    <ExternalLink className="h-4 w-4 text-slate-500" />
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {supportChannels.map((channel, index) => (
                <Card key={index} className="bg-slate-800/50 border-slate-700/50">
                  <CardContent className="p-6 text-center">
                    <div className="bg-blue-600/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <channel.icon className="h-8 w-8 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {channel.title}
                    </h3>
                    <p className="text-sm text-slate-400 mb-4">
                      {channel.description}
                    </p>
                    <Button
                      variant="outline"
                      className="w-full border-slate-600 text-slate-300 hover:text-white"
                      onClick={() => channel.href === '#' ? toast.info('Coming soon!') : window.location.href = channel.href}
                    >
                      {channel.action}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Send us a message</CardTitle>
                <CardDescription>
                  We'll get back to you as soon as possible
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-300 mb-1 block">
                        Name
                      </label>
                      <Input
                        value={contactForm.name}
                        onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                        className="bg-slate-700/30 border-slate-600/30 text-white"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-300 mb-1 block">
                        Email
                      </label>
                      <Input
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                        className="bg-slate-700/30 border-slate-600/30 text-white"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-1 block">
                      Subject
                    </label>
                    <Input
                      value={contactForm.subject}
                      onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                      required
                      className="bg-slate-700/30 border-slate-600/30 text-white"
                      placeholder="How can we help?"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-1 block">
                      Message
                    </label>
                    <Textarea
                      value={contactForm.message}
                      onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                      required
                      className="bg-slate-700/30 border-slate-600/30 text-white min-h-[150px]"
                      placeholder="Please describe your issue or question..."
                    />
                  </div>

                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? (
                      <>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
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
