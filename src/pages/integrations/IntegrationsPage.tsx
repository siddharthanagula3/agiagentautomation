/**
 * Integrations Page - External tools and API integration management
 */

import React from 'react';
import { motion } from 'framer-motion';
import IntegrationSettingsPanel from '@/components/automation/IntegrationSettingsPanel';
import { Network, Zap, Globe, Settings } from 'lucide-react';

interface IntegrationsPageProps {
  className?: string;
}

const IntegrationsPage: React.FC<IntegrationsPageProps> = ({ className }) => {
  const handleIntegrationChange = (integrations: any[]) => {
    console.log('Integrations updated:', integrations);
    // Handle integration changes - could update global state, analytics, etc.
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
          <h1 className="text-3xl font-bold text-white">Integrations</h1>
          <p className="text-slate-400 mt-1">
            Connect external tools and services to enhance your AI workforce capabilities
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-slate-400">
            <Network className="h-5 w-5" />
            <span className="text-sm">Connected Services</span>
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