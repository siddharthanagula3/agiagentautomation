/**
 * Security Page - Comprehensive Security Information
 * Details about security measures, compliance, and best practices
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card';
import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import {
  Shield,
  Lock,
  Eye,
  Server,
  Key,
  CheckCircle2,
  FileText,
  Globe,
  Database,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { SEOHead } from '@shared/components/seo/SEOHead';
import { Link } from 'react-router-dom';

const SecurityPage: React.FC = () => {
  const securityFeatures = [
    {
      icon: Lock,
      title: 'End-to-End Encryption',
      description:
        'All data in transit is encrypted using TLS 1.3. Data at rest is encrypted using AES-256.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Database,
      title: 'Secure Data Storage',
      description:
        'Data is stored in Supabase with Row Level Security (RLS) policies ensuring users can only access their own data.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Key,
      title: 'API Key Security',
      description:
        'API keys are never exposed to the client. All LLM API calls are proxied through secure Netlify Functions.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Shield,
      title: 'Authentication',
      description:
        'Supabase Auth provides secure authentication with email verification, password reset, and session management.',
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: Eye,
      title: 'Privacy First',
      description:
        'We follow GDPR and CCPA compliance. Users can request data deletion and export their data at any time.',
      color: 'from-indigo-500 to-violet-500',
    },
    {
      icon: Server,
      title: 'Infrastructure Security',
      description:
        'Hosted on Netlify and Supabase with SOC 2 Type II compliance, regular security audits, and DDoS protection.',
      color: 'from-teal-500 to-cyan-500',
    },
  ];

  const complianceStandards = [
    { name: 'GDPR', status: 'Compliant', icon: Globe },
    { name: 'CCPA', status: 'Compliant', icon: FileText },
    { name: 'SOC 2', status: 'Type II', icon: CheckCircle2 },
  ];

  const securityPractices = [
    'Regular security audits and penetration testing',
    'Automated vulnerability scanning',
    'Secure coding practices and code reviews',
    'Least privilege access controls',
    'Regular security training for team members',
    'Incident response plan in place',
    'Data backup and disaster recovery procedures',
    'Multi-factor authentication available',
  ];

  return (
    <>
      <SEOHead
        title="Security | AGI Agent Automation"
        description="Learn about our security measures, compliance standards, and data protection practices."
        keywords={['security', 'privacy', 'data protection', 'encryption', 'GDPR', 'compliance']}
      />

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-background to-muted/20 px-4 py-20 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="mb-6 px-4 py-2">
                <Shield className="mr-2 h-4 w-4" />
                Security & Compliance
              </Badge>
              <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-6xl">
                Your Data is Protected
              </h1>
              <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
                We take security seriously. Learn about our comprehensive security measures,
                compliance standards, and commitment to protecting your data.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Security Features */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <h2 className="mb-12 text-center text-3xl font-bold">Security Features</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {securityFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="h-full border-border transition-all hover:border-primary/50">
                      <CardHeader>
                        <div
                          className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${feature.color}`}
                        >
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <CardTitle>{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Compliance Standards */}
        <section className="border-t border-border bg-muted/30 px-4 py-16 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl">
            <h2 className="mb-12 text-center text-3xl font-bold">Compliance Standards</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {complianceStandards.map((standard) => {
                const Icon = standard.icon;
                return (
                  <Card key={standard.name} className="border-border text-center">
                    <CardHeader>
                      <Icon className="mx-auto mb-4 h-12 w-12 text-primary" />
                      <CardTitle>{standard.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="outline" className="border-green-600 text-green-600">
                        {standard.status}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Security Practices */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl">
            <h2 className="mb-12 text-center text-3xl font-bold">Security Practices</h2>
            <Card className="border-border">
              <CardContent className="p-8">
                <ul className="space-y-4">
                  {securityPractices.map((practice, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-green-600" />
                      <span className="text-muted-foreground">{practice}</span>
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Data Protection */}
        <section className="border-t border-border bg-muted/30 px-4 py-16 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Data Protection & Privacy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  We are committed to protecting your data and privacy. Here's what you need to
                  know:
                </p>
                <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                  <li>
                    <strong>Data Ownership:</strong> You own all your data. We never sell or share
                    your data with third parties.
                  </li>
                  <li>
                    <strong>Data Retention:</strong> Data is retained according to your plan. You
                    can delete your data at any time.
                  </li>
                  <li>
                    <strong>Right to Access:</strong> You can request a copy of all your data at
                    any time.
                  </li>
                  <li>
                    <strong>Right to Deletion:</strong> You can request deletion of your account
                    and all associated data.
                  </li>
                  <li>
                    <strong>Data Processing:</strong> All data processing happens within secure,
                    compliant infrastructure.
                  </li>
                </ul>
                <div className="flex gap-4 pt-4">
                  <Link to="/legal/privacy-policy">
                    <Button variant="outline">
                      <FileText className="mr-2 h-4 w-4" />
                      Privacy Policy
                    </Button>
                  </Link>
                  <Link to="/legal/terms-of-service">
                    <Button variant="outline">
                      <FileText className="mr-2 h-4 w-4" />
                      Terms of Service
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Contact Security Team */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-2xl text-center">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Security Questions?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-6 text-muted-foreground">
                  If you have security concerns or questions, please contact our security team.
                </p>
                <Link to="/contact-sales">
                  <Button>
                    Contact Security Team
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </>
  );
};

export default SecurityPage;
