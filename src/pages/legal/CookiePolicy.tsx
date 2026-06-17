import React from 'react';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';
import { motion } from 'framer-motion';
import { Badge } from '@shared/ui/badge';
import { Cookie, Settings, BarChart3, Shield } from 'lucide-react';

const CookiePolicyPage: React.FC = () => {
  return (
    <div className="bg-background min-h-screen">
      <section className="px-4 pt-32 pb-12 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Badge className="glass mb-6 px-6 py-2">
              <Cookie className="mr-2 h-4 w-4" />
              Cookie Policy
            </Badge>
            <h1 className="mb-6 text-5xl font-bold md:text-6xl">
              Cookie Policy
            </h1>
            <p className="text-muted-foreground text-xl">
              Last updated: January 15, 2026
            </p>
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass border-border/50 rounded-2xl border p-8"
          >
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 rounded-xl p-3">
                <Cookie className="text-primary h-6 w-6" />
              </div>
              <div className="flex-1">
                <h2 className="mb-4 text-2xl font-bold">What Are Cookies?</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Cookies are small text files stored on your device when you
                  visit our website. They help us provide you with a better
                  experience by remembering your preferences and understanding
                  how you use our platform.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass border-border/50 rounded-2xl border p-8"
          >
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 rounded-xl p-3">
                <Settings className="text-primary h-6 w-6" />
              </div>
              <div className="flex-1">
                <h2 className="mb-4 text-2xl font-bold">
                  Types of Cookies We Use
                </h2>
                <div className="text-muted-foreground space-y-4">
                  <div>
                    <h3 className="text-foreground mb-2 font-semibold">
                      Essential Cookies (Required)
                    </h3>
                    <p>
                      Necessary for the platform to function. These enable core
                      features like authentication, security, and network
                      management.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-foreground mb-2 font-semibold">
                      Performance Cookies
                    </h3>
                    <p>
                      Help us understand how you use our platform to improve
                      performance and fix issues. Includes analytics and error
                      tracking.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-foreground mb-2 font-semibold">
                      Functionality Cookies
                    </h3>
                    <p>
                      Remember your preferences like theme, language, and
                      dashboard settings for a personalized experience.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-foreground mb-2 font-semibold">
                      Marketing Cookies (Optional)
                    </h3>
                    <p>
                      Track your visits across websites to show relevant ads.
                      You can opt-out of these at any time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass border-border/50 rounded-2xl border p-8"
          >
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 rounded-xl p-3">
                <Shield className="text-primary h-6 w-6" />
              </div>
              <div className="flex-1">
                <h2 className="mb-4 text-2xl font-bold">
                  Managing Your Cookies
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  You can control cookies through your browser settings. Note
                  that disabling essential cookies may affect platform
                  functionality. Most browsers allow you to refuse cookies or
                  delete them. Visit your browser's help section for
                  instructions.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

const CookiePolicyPageWithErrorBoundary: React.FC = () => (
  <ErrorBoundary componentName="CookiePolicyPage" showReportDialog>
    <CookiePolicyPage />
  </ErrorBoundary>
);

export default CookiePolicyPageWithErrorBoundary;
