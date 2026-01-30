import React from 'react';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';
import { motion } from 'framer-motion';
import { Badge } from '@shared/ui/badge';
import { SEOHead } from '@shared/components/seo/SEOHead';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Scale,
  Ban,
  RefreshCw,
} from 'lucide-react';

const TermsOfServicePage: React.FC = () => {
  const lastUpdated = 'January 3, 2026';

  const sections = [
    {
      icon: CheckCircle2,
      title: 'Acceptance of Terms',
      content: `By accessing and using AGI Agent Automation Platform, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.

These terms apply to all users, including visitors, registered users, and paid subscribers. We reserve the right to modify these terms at any time, and will notify users of significant changes.`,
    },
    {
      icon: FileText,
      title: 'Services Description',
      content: `AGI Agent provides:

• AI employee creation and management platform
• Workflow automation tools
• Integration with third-party services
• Analytics and reporting dashboards
• API access for enterprise users
• Customer support and documentation

We strive to maintain 99.9% uptime but do not guarantee uninterrupted service. Scheduled maintenance will be communicated in advance.`,
    },
    {
      icon: Scale,
      title: 'User Responsibilities',
      content: `As a user, you agree to:

• Provide accurate account information
• Maintain the security of your account credentials
• Use the service in compliance with all applicable laws
• Not use the service for illegal or unauthorized purposes
• Not attempt to hack, reverse engineer, or compromise the platform
• Not create AI employees that violate ethical guidelines
• Respect intellectual property rights
• Not share your account with others

Violation of these terms may result in account suspension or termination.`,
    },
    {
      icon: Ban,
      title: 'Prohibited Uses',
      content: `You may NOT use our platform to:

• Create AI employees for illegal activities
• Generate harmful, discriminatory, or offensive content
• Spam or send unsolicited communications
• Infringe on intellectual property rights
• Violate privacy or data protection laws
• Overload or disrupt our infrastructure
• Resell our services without authorization
• Scrape or extract data without permission

We reserve the right to investigate and take action against violations.`,
    },
    {
      icon: RefreshCw,
      title: 'Billing and Refunds',
      content: `Subscription terms:

• Billing occurs monthly or annually based on your plan
• Automatic renewal unless cancelled 24 hours before renewal
• Price changes will be communicated 30 days in advance
• Refunds available within 14 days of initial purchase
• No refunds for partial months or unused features
• Enterprise customers have custom billing terms
• All fees are non-refundable except as required by law

Cancel anytime from your account settings.`,
    },
    {
      icon: AlertCircle,
      title: 'Limitation of Liability',
      content: `To the maximum extent permitted by law:

• Our total liability is limited to fees paid in the last 12 months
• We are not liable for indirect, incidental, or consequential damages
• We do not guarantee specific results or outcomes
• AI employees are tools; you are responsible for their outputs
• We are not liable for third-party integrations or services
• Service may be interrupted for maintenance or technical issues
• Data loss prevention is your responsibility (we provide backups)

Some jurisdictions do not allow liability limitations, so these may not apply to you.`,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Terms of Service | AGI Agent Automation"
        description="Terms of Service for AGI Agent Automation platform. Read our terms and conditions for using our AI employee and automation services."
        keywords={[
          'terms of service',
          'terms and conditions',
          'ai automation terms',
          'ai employee terms',
          'platform terms',
          'service agreement',
        ]}
        ogType="website"
        noindex={true}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-transparent px-4 pb-12 pt-32 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Badge className="glass mb-6 px-6 py-2">
              <FileText className="mr-2 h-4 w-4" />
              Terms of Service
            </Badge>
            <h1 className="mb-6 text-5xl font-bold md:text-6xl">
              Terms of Service
            </h1>
            <p className="mb-4 text-lg text-muted-foreground">
              Last updated: {lastUpdated}
            </p>
            <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
              Please read these terms carefully before using our platform.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Sections */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl space-y-12">
          {sections.map((section, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="glass rounded-2xl border border-border/50 p-8"
            >
              <div className="mb-4 flex items-start gap-4">
                <div className="rounded-xl bg-primary/10 p-3">
                  <section.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="mb-4 text-2xl font-bold">{section.title}</h2>
                  <div className="whitespace-pre-line leading-relaxed text-muted-foreground">
                    {section.content}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 text-3xl font-bold">
              Questions About These Terms?
            </h2>
            <p className="mb-6 text-lg text-muted-foreground">
              Contact our legal team for clarification or concerns.
            </p>
            <div className="flex flex-col justify-center gap-4 text-sm sm:flex-row">
              <div>
                <strong>Email:</strong> legal@agiagentautomation.com
              </div>
              <div className="hidden text-muted-foreground sm:block">|</div>
              <div>
                <strong>Support:</strong> support@agiagentautomation.com
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

const TermsOfServicePageWithErrorBoundary: React.FC = () => (
  <ErrorBoundary componentName="TermsOfServicePage" showReportDialog>
    <TermsOfServicePage />
  </ErrorBoundary>
);

export default TermsOfServicePageWithErrorBoundary;
