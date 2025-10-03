import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/layout/Header';
import { Shield, Lock, Eye, Server, UserCheck, FileText } from 'lucide-react';

const PrivacyPolicyPage: React.FC = () => {
  const lastUpdated = 'January 15, 2025';

  const sections = [
    {
      icon: Eye,
      title: 'Information We Collect',
      content: `We collect information that you provide directly to us, including:

• Account information (name, email, password)
• Profile information (company name, role, preferences)
• Payment information (processed securely through Stripe)
• Usage data (how you interact with our platform)
• Communication data (support tickets, feedback)
• Device and log information (IP address, browser type, timestamps)

We use cookies and similar technologies to enhance your experience and analyze platform usage.`
    },
    {
      icon: Server,
      title: 'How We Use Your Information',
      content: `We use the collected information for:

• Providing and improving our AI automation services
• Personalizing your experience
• Processing transactions and sending receipts
• Communicating updates, security alerts, and support messages
• Analyzing platform usage and improving features
• Detecting and preventing fraud and abuse
• Complying with legal obligations

We never sell your personal information to third parties.`
    },
    {
      icon: Lock,
      title: 'Data Security',
      content: `We implement industry-standard security measures:

• End-to-end encryption for data in transit (TLS 1.3)
• AES-256 encryption for data at rest
• Regular security audits and penetration testing
• SOC 2 Type II compliance
• Multi-factor authentication (MFA)
• Role-based access controls (RBAC)
• Automated backup and disaster recovery

Your data is stored in secure, ISO 27001 certified data centers with 24/7 monitoring.`
    },
    {
      icon: UserCheck,
      title: 'Your Rights',
      content: `You have the right to:

• Access your personal data
• Correct inaccurate data
• Request deletion of your data
• Export your data (data portability)
• Opt-out of marketing communications
• Withdraw consent at any time
• File a complaint with a supervisory authority

Contact us at privacy@agiworkforce.com to exercise these rights.`
    },
    {
      icon: FileText,
      title: 'Data Retention',
      content: `We retain your data:

• Account data: For the duration of your account plus 30 days
• Transaction records: For 7 years (legal requirement)
• Usage analytics: In aggregated form for 2 years
• Support communications: For 3 years
• Deleted account data: Permanently removed within 30 days

You can request early deletion by contacting support.`
    },
    {
      icon: Shield,
      title: 'GDPR & CCPA Compliance',
      content: `We comply with:

• General Data Protection Regulation (GDPR) for EU users
• California Consumer Privacy Act (CCPA) for California residents
• Other applicable data protection laws worldwide

We have appointed a Data Protection Officer (DPO) available at dpo@agiworkforce.com.`
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Badge className="mb-6 glass px-6 py-2">
              <Shield className="mr-2 h-4 w-4" />
              Privacy Policy
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Your Privacy Matters
            </h1>
            <p className="text-lg text-muted-foreground mb-4">
              Last updated: {lastUpdated}
            </p>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We're committed to protecting your privacy and being transparent about how we collect, use, and safeguard your information.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="prose prose-lg max-w-none dark:prose-invert"
          >
            <p className="text-lg text-muted-foreground leading-relaxed">
              This Privacy Policy explains how AGI Workforce ("we", "us", "our") collects,
              uses, discloses, and protects your personal information when you use our AI automation platform
              and services. By using our services, you agree to the collection and use of information in
              accordance with this policy.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Privacy Sections */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl space-y-12">
          {sections.map((section, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="glass p-8 rounded-2xl border border-border/50"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <section.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
                  <div className="text-muted-foreground whitespace-pre-line leading-relaxed">
                    {section.content}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4">Questions About Privacy?</h2>
            <p className="text-lg text-muted-foreground mb-6">
              If you have any questions or concerns about our privacy practices, please contact us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
              <div>
                <strong>Email:</strong> privacy@agiworkforce.com
              </div>
              <div className="hidden sm:block text-muted-foreground">|</div>
              <div>
                <strong>DPO:</strong> dpo@agiworkforce.com
              </div>
              <div className="hidden sm:block text-muted-foreground">|</div>
              <div>
                <strong>Support:</strong> support@agiworkforce.com
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicyPage;
