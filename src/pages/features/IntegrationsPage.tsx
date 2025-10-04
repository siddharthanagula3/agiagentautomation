import React from 'react';
import { motion } from 'framer-motion';
import { Plug, Zap, Shield, Code, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Particles } from '@/components/ui/particles';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/unified-auth-store';

const IntegrationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleStartTrial = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  const handleBrowseIntegrations = () => {
    navigate('/integrations');
  };
  const integrations = [
    { name: 'Slack', category: 'Communication', logo: '💬' },
    { name: 'Salesforce', category: 'CRM', logo: '☁️' },
    { name: 'HubSpot', category: 'Marketing', logo: '🎯' },
    { name: 'Jira', category: 'Project Mgmt', logo: '📋' },
    { name: 'GitHub', category: 'Development', logo: '🐙' },
    { name: 'Google Workspace', category: 'Productivity', logo: '📧' },
    { name: 'Microsoft Teams', category: 'Communication', logo: '💼' },
    { name: 'Zendesk', category: 'Support', logo: '🎫' }
  ];

  const features = [
    {
      icon: Plug,
      title: '50+ Native Integrations',
      description: 'Connect with all your favorite tools in one click, no coding required.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Code,
      title: 'REST API & Webhooks',
      description: 'Build custom integrations with our developer-friendly API.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'OAuth 2.0, encryption, and compliance with SOC 2 and GDPR.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Zap,
      title: 'Real-Time Sync',
      description: 'Bi-directional data sync keeps everything up-to-date instantly.',
      color: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Particles className="absolute inset-0 -z-10" quantity={50} staticity={40} />

      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Plug size={16} />
                Integrations
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary">
                Connect Your Entire Tech Stack
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Seamlessly integrate with 50+ tools or build custom connections with our API. Your AI employees work where you work.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-gradient-to-r from-primary to-accent" onClick={handleStartTrial}>
                  {user ? 'Go to Dashboard' : 'Start Free Trial'} <ArrowRight className="ml-2" />
                </Button>
                <Button size="lg" variant="outline" onClick={handleBrowseIntegrations}>Browse Integrations</Button>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-20">
            {integrations.map((integration, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-xl bg-background/60 backdrop-blur-xl border border-border/40 p-4 text-center hover:border-primary/50 transition-all"
                whileHover={{ y: -4 }}
              >
                <div className="text-3xl mb-2">{integration.logo}</div>
                <div className="font-semibold text-sm">{integration.name}</div>
                <div className="text-xs text-muted-foreground">{integration.category}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-accent/5">
        <div className="container mx-auto max-w-7xl">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-4xl font-bold text-center mb-16">
            Enterprise-Grade Integration Platform
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
            <h2 className="text-4xl font-bold mb-4">Ready to Connect Everything?</h2>
            <p className="text-xl mb-8 opacity-90">Integrate in minutes with our no-code setup</p>
            <Button size="lg" variant="secondary" onClick={handleStartTrial}>
              {user ? 'Go to Dashboard' : 'Start Free Trial'}
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default IntegrationsPage;
