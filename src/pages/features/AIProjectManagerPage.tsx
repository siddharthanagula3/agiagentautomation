import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Target, Users, Calendar, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import { Particles } from '@/components/ui/particles';

const AIProjectManagerPage: React.FC = () => {
  const features = [
    {
      icon: Target,
      title: 'Smart Task Assignment',
      description: 'AI automatically assigns tasks based on team capacity, skills, and priorities.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Calendar,
      title: 'Predictive Scheduling',
      description: 'AI forecasts project timelines, identifies bottlenecks, and suggests optimizations.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Users,
      title: 'Team Coordination',
      description: 'Automated stand-ups, status updates, and cross-team communication.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Zap,
      title: 'Risk Detection',
      description: 'AI monitors project health and alerts you to risks before they become issues.',
      color: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Particles className="absolute inset-0 -z-10" quantity={50} staticity={40} />

      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Briefcase size={16} />
                AI Project Manager
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary">
                Deliver Projects On Time, Every Time
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                AI project managers coordinate teams, predict delays, optimize resources, and keep everyone aligned.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-gradient-to-r from-primary to-accent">
                  Start Free Trial <ArrowRight className="ml-2" />
                </Button>
                <Button size="lg" variant="outline">See How It Works</Button>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
              <img src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=600&fit=crop" alt="Project Management" className="rounded-3xl" />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-4xl font-bold text-center mb-16">
            AI-Powered Project Intelligence
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div key={idx} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} className="rounded-2xl bg-background/60 backdrop-blur-xl border border-border/40 p-8" whileHover={{ y: -8 }}>
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} text-white mb-4`}>
                    <Icon size={28} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-3xl bg-gradient-to-r from-primary via-accent to-secondary p-12 text-center text-white">
            <h2 className="text-4xl font-bold mb-4">Ready to Ship Projects Faster?</h2>
            <p className="text-xl mb-8 opacity-90">Let AI handle project coordination</p>
            <Button size="lg" variant="secondary">Start Free Trial</Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AIProjectManagerPage;
