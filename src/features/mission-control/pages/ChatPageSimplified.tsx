/**
 * Chat Page - Simplified
 * Standard one-on-one AI chat interface
 */

import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { StandardChat } from '../components/StandardChat';

const ChatPageSimplified: React.FC = () => {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">AI Chat</h1>
            <p className="text-slate-400">
              Direct conversation with AI assistant
            </p>
          </div>
        </div>
      </motion.div>

      {/* Chat Interface */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1"
      >
        <StandardChat />
      </motion.div>
    </div>
  );
};

export default ChatPageSimplified;
