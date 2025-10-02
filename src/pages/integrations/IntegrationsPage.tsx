/**
 * Integrations Page - External tools and API integration management
 */

import React from 'react';
import { motion } from 'framer-motion';
import IntegrationSettingsPanel from '@/components/automation/IntegrationSettingsPanel';
import { Network, Zap, Globe, Settings } from 'lucide-react';
import { Particles } from '@/components/ui/particles';

interface IntegrationsPageProps {
  className?: string;
}

const IntegrationsPage: React.FC<IntegrationsPageProps> = ({ className }) => {
  const handleIntegrationChange = (integrations: any[]) => {
    console.log('Integrations updated:', integrations);
    // Handle integration changes - could update global state, analytics, etc.
  };

  return (
    <div className="relative space-y-6">
      {/* Subtle Particles Background */}
      <Particles className="absolute inset-0 pointer-events-none opacity-20" quantity={30} />

      {/* Header with Gradient Overlay */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 rounded-xl blur-2xl -z-10" />
        <div className="flex items-center justify-between p-6 rounded-xl backdrop-blur-sm bg-background/30 border border-border/50">
          <div>
            <h1 className="text-3xl font-bold">Integrations</h1>
            <p className="text-muted-foreground mt-1">
              Connect external tools and services to enhance your AI workforce capabilities
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <motion.div
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-primary/10 backdrop-blur-sm border border-primary/20"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Network className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Connected Services</span>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Integration Settings Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="h-full"
      >
        <IntegrationSettingsPanel
          className="min-h-[calc(100vh-16rem)]"
          onIntegrationChange={handleIntegrationChange}
        />
      </motion.div>
    </div>
  );
};

export default IntegrationsPage;
