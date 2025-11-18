import React from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Zap,
  Globe,
  Shield,
  Clock,
  CheckCircle2,
  ArrowRight,
  Bot,
  Users,
} from 'lucide-react';
import { Button } from '@shared/ui/button';
import { Particles } from '@shared/ui/particles';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@shared/stores/authentication-store';

const AIChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleStartTrial = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  const handleSeeDemo = () => {
    navigate('/demo');
  };
  const features = [
    {
      icon: Zap,
      title: 'Instant Responses 24/7',
      description:
        'AI chat agents respond in under 2 seconds, anytime, from anywhere in the world.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Globe,
      title: 'Support 100+ Languages',
      description:
        'Communicate with customers globally. AI automatically detects and responds in their native language.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Shield,
      title: 'Context-Aware Conversations',
      description:
        'AI remembers past interactions, understands intent, and provides personalized responses.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Users,
      title: 'Seamless Human Handoff',
      description:
        'Complex queries are automatically escalated to human agents with full conversation context.',
      color: 'from-orange-500 to-red-500',
    },
  ];

  const useCases = [
    {
      title: 'Customer Support',
      description:
        'Handle FAQs, troubleshooting, account issues, and product questions instantly.',
    },
    {
      title: 'Sales Assistance',
      description:
        'Qualify leads, answer product questions, schedule demos, and guide purchase decisions.',
    },
    {
      title: 'Internal Help Desk',
      description:
        'Support employees with HR questions, IT requests, and policy information.',
    },
    {
      title: 'Lead Qualification',
      description:
        'Engage website visitors, capture information, and route qualified leads to sales.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Particles
        className="absolute inset-0 -z-10"
        quantity={50}
        staticity={40}
      />

      <section className="px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <MessageSquare size={16} />
                AI Chat
              </div>
              <h1 className="mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-3xl font-bold text-transparent sm:text-4xl md:text-5xl lg:text-6xl">
                Intelligent Conversations at Scale
              </h1>
              <p className="mb-8 text-xl text-muted-foreground">
                Deploy AI chat agents that understand context, speak 100+
                languages, and provide instant support 24/7.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent"
                  onClick={handleStartTrial}
                >
                  {user ? 'Go to Dashboard' : 'Start Free Trial'}{' '}
                  <ArrowRight className="ml-2" />
                </Button>
                <Button size="lg" variant="outline" onClick={handleSeeDemo}>
                  See Demo
                </Button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <img
                src="https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=800&h=600&fit=crop"
                alt="AI Chat"
                className="rounded-3xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 text-center text-2xl font-bold sm:mb-12 sm:text-3xl md:text-4xl"
          >
            Powerful AI Chat Features
          </motion.h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="rounded-2xl border border-border/40 bg-background/60 p-8 backdrop-blur-xl"
                  whileHover={{ y: -8 }}
                >
                  <div
                    className={`inline-flex rounded-xl bg-gradient-to-br p-3 ${feature.color} mb-4 text-white`}
                  >
                    <Icon size={28} />
                  </div>
                  <h3 className="mb-3 text-2xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-background to-accent/5 px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 text-center text-2xl font-bold sm:mb-12 sm:text-3xl md:text-4xl"
          >
            Use Cases
          </motion.h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {useCases.map((useCase, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur-xl"
              >
                <h3 className="mb-2 text-xl font-bold">{useCase.title}</h3>
                <p className="text-muted-foreground">{useCase.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl bg-gradient-to-r from-primary via-accent to-secondary p-6 text-center text-white sm:p-8 md:p-12"
          >
            <h2 className="mb-4 text-2xl font-bold sm:text-3xl md:text-4xl">
              Ready to Transform Customer Conversations?
            </h2>
            <p className="mb-8 text-xl opacity-90">
              Deploy AI chat in minutes and start delivering instant support
            </p>
            <Button size="lg" variant="secondary" onClick={handleStartTrial}>
              {user ? 'Go to Dashboard' : 'Start Free Trial'}
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AIChatPage;
