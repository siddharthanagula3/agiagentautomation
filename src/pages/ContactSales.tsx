import React, { useState } from 'react';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';
import { motion } from 'framer-motion';
import {
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Users,
  Building2,
  Zap,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Textarea } from '@shared/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select';
import { Particles } from '@shared/ui/particles';
import { submitContactForm } from '@core/integrations/marketing-endpoints';
import { toast } from 'sonner';
import { SEOHead } from '@shared/components/seo/SEOHead';

const ContactSalesPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    phone: '',
    employees: '',
    message: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.company.trim()) {
      newErrors.company = 'Company name is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    }

    if (
      formData.phone &&
      !/^[+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-()]/g, ''))
    ) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      toast.error('Please fix the errors in the form before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      await submitContactForm({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        company: formData.company,
        phone: formData.phone,
        companySize: formData.employees,
        message: formData.message,
        source: 'contact_sales_page',
      });

      setSubmitted(true);
      toast.success("Thank you for your interest! We'll be in touch soon.");

      // Reset form after successful submission
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        company: '',
        phone: '',
        employees: '',
        message: '',
      });
      setErrors({});
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to submit form. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    {
      icon: Users,
      title: 'Dedicated Account Manager',
      description: 'Get personalized support from a dedicated expert',
    },
    {
      icon: Zap,
      title: 'Custom Solutions',
      description: 'Tailored AI automation for your specific needs',
    },
    {
      icon: Building2,
      title: 'Enterprise Security',
      description: 'SOC 2, GDPR compliance, and custom SLAs',
    },
  ];

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Us',
      value: 'sales@agiagentautomation.com',
      description: 'Get a response within 24 hours',
    },
    {
      icon: Phone,
      title: 'Call Us',
      value: '+1 (555) 123-4567',
      description: 'Monday - Friday, 9am - 6pm EST',
    },
    {
      icon: MapPin,
      title: 'Visit Us',
      value: 'San Francisco, CA',
      description: 'Schedule an in-person meeting',
    },
  ];

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Particles
          className="absolute inset-0 -z-10"
          quantity={50}
          staticity={40}
        />
        <div className="flex min-h-screen items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-2xl text-center"
          >
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
              <CheckCircle2 size={40} className="text-green-500" />
            </div>
            <h1 className="mb-4 text-4xl font-bold">Thank You!</h1>
            <p className="mb-8 text-xl text-muted-foreground">
              We've received your message. Our sales team will contact you
              within 24 hours.
            </p>
            <Button onClick={() => (window.location.href = '/')} size="lg">
              Return to Home
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Contact Sales | Get Custom AI Employee Solutions | AGI Agent Automation"
        description="Contact our sales team for custom AI employee solutions. Get personalized pricing, enterprise features, and dedicated support. Schedule a demo today."
        keywords={[
          'contact sales ai employees',
          'ai automation sales',
          'enterprise ai solutions',
          'custom ai workforce',
          'ai employee consultation',
          'ai automation demo',
          'enterprise ai pricing',
          'ai workforce sales',
        ]}
        ogType="website"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          name: 'Contact Sales - AGI Agent Automation',
          description:
            'Contact our sales team for custom AI employee solutions',
          mainEntity: {
            '@type': 'Organization',
            name: 'AGI Agent Automation',
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'Sales',
              email: 'sales@agiagentautomation.com',
              availableLanguage: ['en'],
            },
          },
        }}
      />
      <Particles
        className="absolute inset-0 -z-10"
        quantity={50}
        staticity={40}
      />

      {/* Hero */}
      <section className="px-4 pb-16 pt-32 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <h1 className="mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-3xl font-bold text-transparent sm:text-4xl md:text-5xl lg:text-6xl">
              Let's Talk About Your AI Automation Needs
            </h1>
            <p className="text-xl text-muted-foreground">
              Speak with our sales team to learn how AGI Agent can transform
              your business
            </p>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="rounded-2xl border border-border/40 bg-background/60 p-6 text-center backdrop-blur-xl"
                >
                  <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-primary to-accent p-3 text-white">
                    <Icon size={24} />
                  </div>
                  <h3 className="mb-2 text-lg font-bold">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {benefit.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Form & Contact Info */}
      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-3xl border border-border/40 bg-background/60 p-4 backdrop-blur-xl sm:p-6 md:p-8"
            >
              <h2 className="mb-6 text-2xl font-bold sm:text-3xl">
                Get in Touch
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      First Name *
                    </label>
                    <Input
                      required
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange('firstName', e.target.value)
                      }
                      className={`border-border/40 bg-background/60 ${errors.firstName ? 'border-red-500' : ''}`}
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.firstName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Last Name *
                    </label>
                    <Input
                      required
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange('lastName', e.target.value)
                      }
                      className={`border-border/40 bg-background/60 ${errors.lastName ? 'border-red-500' : ''}`}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Work Email *
                  </label>
                  <Input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`border-border/40 bg-background/60 ${errors.email ? 'border-red-500' : ''}`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Company *
                  </label>
                  <Input
                    required
                    value={formData.company}
                    onChange={(e) =>
                      handleInputChange('company', e.target.value)
                    }
                    className={`border-border/40 bg-background/60 ${errors.company ? 'border-red-500' : ''}`}
                  />
                  {errors.company && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.company}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`border-border/40 bg-background/60 ${errors.phone ? 'border-red-500' : ''}`}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Company Size *
                  </label>
                  <select
                    required
                    value={formData.employees}
                    onChange={(e) =>
                      handleInputChange('employees', e.target.value)
                    }
                    className={`h-10 w-full rounded-md border border-border/40 bg-background/60 px-3 ${errors.employees ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select...</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-1000">201-1,000 employees</option>
                    <option value="1000+">1,000+ employees</option>
                  </select>
                  {errors.employees && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.employees}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    How can we help? *
                  </label>
                  <textarea
                    required
                    value={formData.message}
                    onChange={(e) =>
                      handleInputChange('message', e.target.value)
                    }
                    rows={4}
                    className={`w-full resize-none rounded-md border border-border/40 bg-background/60 px-3 py-2 ${errors.message ? 'border-red-500' : ''}`}
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-gradient-to-r from-primary to-accent"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" size={18} />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Request
                      <ArrowRight className="ml-2" size={18} />
                    </>
                  )}
                </Button>
              </form>
            </motion.div>

            {/* Contact Methods */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="rounded-3xl border border-border/40 bg-background/60 p-4 backdrop-blur-xl sm:p-6 md:p-8">
                <h2 className="mb-6 text-2xl font-bold sm:text-3xl">
                  Other Ways to Reach Us
                </h2>
                <div className="space-y-6">
                  {contactMethods.map((method, idx) => {
                    const Icon = method.icon;
                    return (
                      <div key={idx} className="flex items-start gap-4">
                        <div className="rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 p-3">
                          <Icon size={24} className="text-primary" />
                        </div>
                        <div>
                          <h3 className="mb-1 font-bold">{method.title}</h3>
                          <p className="mb-1 text-foreground">{method.value}</p>
                          <p className="text-sm text-muted-foreground">
                            {method.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-border/40 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 p-4 backdrop-blur-xl sm:p-6 md:p-8">
                <h3 className="mb-4 text-lg font-bold sm:text-xl">
                  What Happens Next?
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                      <span className="text-xs font-bold text-primary">1</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Response within 24 hours
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Our team will review your request
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                      <span className="text-xs font-bold text-primary">2</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Schedule a personalized demo
                      </p>
                      <p className="text-xs text-muted-foreground">
                        See AGI Agent in action
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                      <span className="text-xs font-bold text-primary">3</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Custom proposal & pricing
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Tailored to your needs
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

const ContactSalesPageWithErrorBoundary: React.FC = () => (
  <ErrorBoundary componentName="ContactSalesPage" showReportDialog>
    <ContactSalesPage />
  </ErrorBoundary>
);

export default ContactSalesPageWithErrorBoundary;
