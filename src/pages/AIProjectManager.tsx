import React from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Target,
  Users,
  Calendar,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@shared/ui/button';
import { Particles } from '@shared/ui/particles';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@shared/stores/authentication-store';

const AIProjectManagerPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleStartTrial = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  const handleSeeHowItWorks = () => {
    navigate('/demo');
  };
  const features = [
    {
      icon: Target,
      title: 'Smart Task Assignment',
      description:
        'AI automatically assigns tasks based on team capacity, skills, and priorities.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Calendar,
      title: 'Predictive Scheduling',
      description:
        'AI forecasts project timelines, identifies bottlenecks, and suggests optimizations.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Users,
      title: 'Team Coordination',
      description:
        'Automated stand-ups, status updates, and cross-team communication.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Zap,
      title: 'Risk Detection',
      description:
        'AI monitors project health and alerts you to risks before they become issues.',
      color: 'from-orange-500 to-red-500',
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
                <Briefcase size={16} />
                AI Project Manager
              </div>
              <h1 className="mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-5xl font-bold text-transparent md:text-6xl">
                Deliver Projects On Time, Every Time
              </h1>
              <p className="mb-8 text-xl text-muted-foreground">
                AI project managers coordinate teams, predict delays, optimize
                resources, and keep everyone aligned.
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
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleSeeHowItWorks}
                >
                  See How It Works
                </Button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <img
                src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=600&fit=crop"
                alt="Project Management"
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
            className="mb-16 text-center text-4xl font-bold"
          >
            AI-Powered Project Intelligence
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

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl bg-gradient-to-r from-primary via-accent to-secondary p-12 text-center text-white"
          >
            <h2 className="mb-4 text-4xl font-bold">
              Ready to Ship Projects Faster?
            </h2>
            <p className="mb-8 text-xl opacity-90">
              Let AI handle project coordination
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

export default AIProjectManagerPage;
