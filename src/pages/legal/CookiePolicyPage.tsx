import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Cookie, Settings, BarChart3, Shield } from 'lucide-react';

const CookiePolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">

      <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <Badge className="mb-6 glass px-6 py-2">
              <Cookie className="mr-2 h-4 w-4" />
              Cookie Policy
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Cookie Policy</h1>
            <p className="text-xl text-muted-foreground">Last updated: January 15, 2025</p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl space-y-12">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass p-8 rounded-2xl border border-border/50">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Cookie className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4">What Are Cookies?</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Cookies are small text files stored on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our platform.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass p-8 rounded-2xl border border-border/50">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4">Types of Cookies We Use</h2>
                <div className="text-muted-foreground space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Essential Cookies (Required)</h3>
                    <p>Necessary for the platform to function. These enable core features like authentication, security, and network management.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Performance Cookies</h3>
                    <p>Help us understand how you use our platform to improve performance and fix issues. Includes analytics and error tracking.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Functionality Cookies</h3>
                    <p>Remember your preferences like theme, language, and dashboard settings for a personalized experience.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Marketing Cookies (Optional)</h3>
                    <p>Track your visits across websites to show relevant ads. You can opt-out of these at any time.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass p-8 rounded-2xl border border-border/50">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4">Managing Your Cookies</h2>
                <p className="text-muted-foreground leading-relaxed">
                  You can control cookies through your browser settings. Note that disabling essential cookies may affect platform functionality. Most browsers allow you to refuse cookies or delete them. Visit your browser's help section for instructions.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default CookiePolicyPage;
