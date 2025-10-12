import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Particles } from '@/components/ui/particles';
import {
  Shield,
  Lock,
  Eye,
  Server,
  Key,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';

const SecurityPage: React.FC = () => {
  const features = [
    {
      icon: Lock,
      title: 'End-to-End Encryption',
      description: 'TLS 1.3 for data in transit, AES-256 for data at rest',
    },
    {
      icon: Key,
      title: 'Multi-Factor Authentication',
      description: 'Secure your account with 2FA, biometric, and hardware keys',
    },
    {
      icon: Server,
      title: 'SOC 2 Type II Certified',
      description: 'Independently audited for security controls',
    },
    {
      icon: Eye,
      title: 'Continuous Monitoring',
      description: '24/7 threat detection and incident response',
    },
    {
      icon: Shield,
      title: 'GDPR & CCPA Compliant',
      description: 'Full compliance with global data protection regulations',
    },
    {
      icon: FileCheck,
      title: 'Regular Audits',
      description: 'Quarterly penetration testing and security reviews',
    },
  ];

  const certifications = [
    { name: 'SOC 2 Type II', status: 'Certified' },
    { name: 'ISO 27001', status: 'Certified' },
    { name: 'GDPR', status: 'Compliant' },
    { name: 'CCPA', status: 'Compliant' },
    { name: 'HIPAA', status: 'Available' },
    { name: 'PCI DSS', status: 'Level 1' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Particles className="absolute inset-0 -z-10" quantity={40} />

      <section className="px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-4xl text-center"
          >
            <Badge className="glass mb-6 px-6 py-2">
              <Shield className="mr-2 h-4 w-4" />
              Security
            </Badge>
            <h1 className="mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-5xl font-bold text-transparent md:text-7xl">
              Enterprise-Grade Security
            </h1>
            <p className="text-xl leading-relaxed text-muted-foreground">
              Your data security is our top priority. We implement
              industry-leading security measures to protect your information and
              ensure compliance with global standards.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-4xl font-bold md:text-5xl">
              Security Features
            </h2>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="h-full border-2 border-border/50 p-6 transition-all hover:border-primary/50">
                  <div className="mb-4 w-fit rounded-xl bg-primary/10 p-3">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-4xl font-bold">
              Certifications & Compliance
            </h2>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-2">
            {certifications.map((cert, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="glass flex items-center justify-between rounded-xl border border-border/50 p-4"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-semibold">{cert.name}</span>
                </div>
                <Badge variant="secondary">{cert.status}</Badge>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-6 text-4xl font-bold">Report a Security Issue</h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Found a security vulnerability? We appreciate responsible
              disclosure.
            </p>
            <div className="flex flex-col gap-2">
              <p className="text-sm">
                <strong>Email:</strong> security@agiworkforce.com
              </p>
              <p className="text-sm">
                <strong>PGP Key:</strong> Available upon request
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default SecurityPage;
