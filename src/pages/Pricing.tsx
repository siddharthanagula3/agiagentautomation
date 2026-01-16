import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, ArrowRight, Zap, Loader2 } from 'lucide-react';
import { Button } from '@shared/ui/button';
import { Particles } from '@shared/ui/particles';
import { CountdownTimer } from '@shared/ui/countdown-timer';
import { createDiscountEndDate } from '@shared/ui/countdown-utils';
// Marketing endpoints archived - using fallback data
import { useAuthStore } from '@shared/stores/authentication-store';
import { SEOHead } from '@shared/components/seo/SEOHead';
import {
  upgradeToProPlan,
  upgradeToMaxPlan,
  isStripeConfigured,
} from '@features/billing/services/stripe-payments';
import { toast } from 'sonner';

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  notIncluded?: string[];
  popular?: boolean;
  cta: string;
  color: string;
}

const FALLBACK_PLANS: PricingPlan[] = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'Forever',
    description: 'Hire Free AI Employees - Perfect for getting started',
    features: [
      'Hire Free AI Employees (unlimited)',
      '250K tokens/month for OpenAI',
      '250K tokens/month for Claude',
      '250K tokens/month for Perplexity',
      '250K tokens/month for Gemini',
      '1M total tokens/month (250K per provider)',
      'All core features',
      'Community support',
      'Natural language chat interface',
      '100+ pre-trained employee templates',
      'Real-time cost tracking',
    ],
    cta: 'Start Free Now',
    color: 'from-gray-500 to-gray-600',
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: '10M tokens/month - Perfect for scaling your AI workforce',
    features: [
      'Hire Free AI Employees (unlimited)',
      '2.5M tokens/month for OpenAI',
      '2.5M tokens/month for Claude',
      '2.5M tokens/month for Perplexity',
      '2.5M tokens/month for Gemini',
      '10M total tokens/month (2.5M per provider)',
      'Priority support (24/7)',
      'Advanced workflow automation',
      'API access',
      'Custom integrations',
      'Analytics dashboard',
      'Pay-as-you-go beyond included tokens',
    ],
    popular: true,
    cta: 'Start 14-Day Free Trial',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'Business',
    price: '$99',
    period: '/month',
    description: 'Replace your entire team - save $1M+/year!',
    features: [
      'Hire Free AI Employees (unlimited)',
      '10M+ tokens/month (custom allocation)',
      'Everything in Pro',
      'Dedicated success manager',
      'Custom AI employee training',
      'White-label options',
      'Advanced security features',
      'SLA guarantee (99.9% uptime)',
      'Volume token discounts (20% off)',
    ],
    cta: 'Start Free Trial',
    color: 'from-purple-500 to-pink-500',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'Fortune 500 solution - unlimited scale & savings',
    features: [
      'Everything in Business',
      'Custom token packages',
      'On-premise deployment available',
      'Custom contracts & SLAs',
      'Dedicated infrastructure',
      'Compliance certifications (SOC 2, HIPAA)',
      'Professional services team',
      'Training & onboarding programs',
      'Volume discounts up to 50% off',
    ],
    cta: 'Contact Sales',
    color: 'from-orange-500 to-red-500',
  },
];

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);

  // Updated: Jan 15th 2026 - Removed console statements for production
  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      // Use fallback plans since marketing endpoints were archived
      setPlans(FALLBACK_PLANS);
    } catch (error) {
      // Fallback to hardcoded plans if fetch fails
      setPlans(FALLBACK_PLANS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleSelectPlan = async (planName: string) => {
    if (planName === 'Enterprise') {
      navigate('/contact-sales');
      return;
    }

    // If user is not logged in, redirect to register page
    if (!user) {
      navigate('/register', { state: { selectedPlan: planName } });
      return;
    }

    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      toast.error('Payment system is not configured. Please contact support.');
      return;
    }

    try {
      setIsCreatingSubscription(true);
      toast.loading('Creating subscription...');

      // Get current user data
      const userData = {
        userId: user?.id || 'anonymous',
        userEmail: user?.email || 'user@example.com',
        billingPeriod: 'monthly' as const,
      };

      // Use the proper upgrade function instead
      if (planName === 'Pro') {
        await upgradeToProPlan(userData);
      } else if (planName === 'Max') {
        await upgradeToMaxPlan(userData);
      } else {
        throw new Error('Invalid plan selected');
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to create subscription. Please try again.'
      );
    } finally {
      setIsCreatingSubscription(false);
    }
  };

  const comparisonFeatures = [
    {
      category: 'AI Employees',
      features: [
        {
          name: 'AI Employees',
          starter: 'Hire Free (Unlimited)',
          pro: 'Hire Free (Unlimited)',
          enterprise: 'Hire Free (Unlimited)',
        },
        {
          name: 'Pricing model',
          starter: 'Free',
          pro: '$29/month ($24.99/month yearly)',
          enterprise: 'Custom',
        },
        {
          name: 'Bonus credits',
          starter: false,
          pro: '$10 (first-time)',
          enterprise: 'Custom packages',
        },
        {
          name: 'Billing frequency',
          starter: 'Weekly',
          pro: 'Weekly',
          enterprise: 'Custom',
        },
      ],
    },
    {
      category: 'Features',
      features: [
        { name: 'All AI features', starter: true, pro: true, enterprise: true },
        {
          name: 'Workflow automation',
          starter: true,
          pro: true,
          enterprise: true,
        },
        { name: 'Pay-as-you-go', starter: true, pro: true, enterprise: false },
        {
          name: 'Custom integrations',
          starter: false,
          pro: true,
          enterprise: true,
        },
      ],
    },
    {
      category: 'Support',
      features: [
        { name: '24/7 Support', starter: true, pro: true, enterprise: true },
        {
          name: 'Priority support',
          starter: false,
          pro: true,
          enterprise: true,
        },
        {
          name: 'Dedicated account manager',
          starter: false,
          pro: false,
          enterprise: true,
        },
        {
          name: 'Training & onboarding',
          starter: false,
          pro: false,
          enterprise: true,
        },
      ],
    },
    {
      category: 'Advanced',
      features: [
        {
          name: 'Advanced analytics',
          starter: false,
          pro: true,
          enterprise: true,
        },
        {
          name: 'Volume discounts',
          starter: false,
          pro: false,
          enterprise: true,
        },
        {
          name: 'SLA guarantees',
          starter: false,
          pro: false,
          enterprise: true,
        },
        {
          name: 'Advanced security',
          starter: false,
          pro: false,
          enterprise: true,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-background">
      <SEOHead
        title="AI Employee Pricing | Free Forever to $99/mo | Save 99% vs Human Employees"
        description="Hire Free AI Employees. Free plan: 1M tokens/month (250K per provider). Pro plan: 10M tokens/month (2.5M per provider). Token costs at market rates. Save 99%+ on payroll. Start in 60 seconds!"
        keywords={[
          'ai employee pricing',
          'cheapest ai employees',
          'ai agents cost',
          'replace human employees with ai',
          'ai workforce savings',
          'ai employees free trial',
          'ai employee subscription',
          'save money ai employees',
          'ai automation cost savings',
          'competitive ai pricing',
        ]}
        ogType="website"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: 'AI Employee Platform',
          description:
            'Replace human employees with AI employees. Save 99%+ on costs. Free Forever to $99/month.',
          brand: {
            '@type': 'Brand',
            name: 'AGI Agent Automation',
          },
          offers: {
            '@type': 'AggregateOffer',
            lowPrice: '0',
            highPrice: '99',
            priceCurrency: 'USD',
            offerCount: '4',
          },
        }}
      />
      <Particles
        className="absolute inset-0 -z-10"
        quantity={40}
        staticity={50}
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
              Hire Free AI Employees - Pay Only for Tokens
            </h1>
            <p className="mb-4 text-2xl font-semibold text-foreground">
              Free Plan: 1M Tokens/Month • Pro: 10M Tokens/Month
            </p>
            <p className="mb-8 text-xl text-muted-foreground">
              Free Forever: 250K tokens each (OpenAI, Claude, Perplexity,
              Gemini)
              <br />
              Pro $29/month: 2.5M tokens each (10M total) • Business $99/month •
              Enterprise Custom
              <br />
              AI Employees are FREE to hire • Token costs at market rates
            </p>

            {/* Countdown Timer for Limited Offer */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8"
            >
              <CountdownTimer targetDate={createDiscountEndDate()} />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-primary" size={48} />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan, idx) => (
                <PricingCard
                  key={idx}
                  plan={plan}
                  index={idx}
                  onSelect={() => handleSelectPlan(plan.name)}
                  isLoading={isCreatingSubscription}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="bg-gradient-to-b from-background to-accent/5 px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 text-center text-2xl font-bold sm:mb-12 sm:text-3xl md:text-4xl"
          >
            Compare Plans
          </motion.h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="px-2 py-3 text-left text-sm font-semibold sm:px-4 md:px-6 md:py-4">
                    Features
                  </th>
                  <th className="px-2 py-3 text-center text-sm font-semibold sm:px-4 md:px-6 md:py-4">
                    Pro
                  </th>
                  <th className="px-2 py-3 text-center text-sm font-semibold sm:px-4 md:px-6 md:py-4">
                    Max
                  </th>
                  <th className="px-2 py-3 text-center text-sm font-semibold sm:px-4 md:px-6 md:py-4">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((category, catIdx) => (
                  <React.Fragment key={catIdx}>
                    <tr className="bg-accent/5">
                      <td
                        colSpan={4}
                        className="px-2 py-2 text-xs font-bold sm:px-4 sm:py-3 sm:text-sm md:px-6"
                      >
                        {category.category}
                      </td>
                    </tr>
                    {category.features.map((feature, featIdx) => (
                      <tr
                        key={featIdx}
                        className="border-b border-border/20 hover:bg-accent/5"
                      >
                        <td className="px-2 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm md:px-6">
                          {feature.name}
                        </td>
                        <td className="px-2 py-2 text-center sm:px-4 sm:py-3 md:px-6">
                          {typeof feature.starter === 'boolean' ? (
                            feature.starter ? (
                              <Check
                                size={18}
                                className="inline text-green-500"
                              />
                            ) : (
                              <X
                                size={18}
                                className="inline text-muted-foreground"
                              />
                            )
                          ) : (
                            <span className="text-xs sm:text-sm">
                              {feature.starter}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-center sm:px-4 sm:py-3 md:px-6">
                          {typeof feature.pro === 'boolean' ? (
                            feature.pro ? (
                              <Check
                                size={18}
                                className="inline text-green-500"
                              />
                            ) : (
                              <X
                                size={18}
                                className="inline text-muted-foreground"
                              />
                            )
                          ) : (
                            <span className="text-xs sm:text-sm">
                              {feature.pro}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-center sm:px-4 sm:py-3 md:px-6">
                          {typeof feature.enterprise === 'boolean' ? (
                            feature.enterprise ? (
                              <Check
                                size={18}
                                className="inline text-green-500"
                              />
                            ) : (
                              <X
                                size={18}
                                className="inline text-muted-foreground"
                              />
                            )
                          ) : (
                            <span className="text-xs sm:text-sm">
                              {feature.enterprise}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 text-center text-2xl font-bold sm:mb-12 sm:text-3xl md:text-4xl"
          >
            Frequently Asked Questions
          </motion.h2>

          <div className="space-y-6">
            {[
              {
                q: 'Can I change plans anytime?',
                a: 'Yes, you can upgrade or downgrade at any time. Changes take effect immediately for upgrades and at the next billing cycle for downgrades.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards, PayPal, and wire transfer for Enterprise plans.',
              },
              {
                q: 'Is there a free trial?',
                a: 'Yes! All plans include a 14-day free trial with full access to features. No credit card required.',
              },
              {
                q: 'What happens if I exceed my limits?',
                a: "We'll notify you before you reach your limits. You can upgrade or purchase add-ons to continue without interruption.",
              },
            ].map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-xl border border-border/40 bg-background/60 p-4 backdrop-blur-xl sm:p-6"
              >
                <h3 className="mb-2 text-base font-bold sm:text-lg">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl bg-gradient-to-r from-primary via-accent to-secondary p-6 text-center text-white sm:p-8 md:p-12"
          >
            <h2 className="mb-4 text-2xl font-bold sm:text-3xl md:text-4xl">
              Still Have Questions?
            </h2>
            <p className="mb-8 text-xl opacity-90">
              Our team is here to help you find the perfect plan
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/contact-sales')}
            >
              Contact Sales
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

const PricingCard: React.FC<{
  plan: PricingPlan;
  index: number;
  onSelect: () => void;
  isLoading: boolean;
}> = ({ plan, index, onSelect, isLoading }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className={`relative overflow-hidden rounded-3xl border p-4 backdrop-blur-xl sm:p-6 md:p-8 ${
        plan.popular
          ? 'border-primary bg-gradient-to-b from-primary/10 to-accent/10 shadow-2xl sm:scale-105'
          : 'border-border/40 bg-background/60'
      }`}
      whileHover={{ y: -8 }}
    >
      {plan.popular && (
        <div className="absolute right-0 top-0 rounded-bl-xl bg-gradient-to-r from-primary to-accent px-4 py-1 text-xs font-bold text-white">
          MOST POPULAR
        </div>
      )}

      <h3 className="mb-2 text-2xl font-bold">{plan.name}</h3>
      <div className="mb-4">
        <span className="text-5xl font-bold">{plan.price}</span>
        {plan.period && (
          <span className="ml-2 text-muted-foreground">{plan.period}</span>
        )}
      </div>
      <p className="mb-8 text-muted-foreground">{plan.description}</p>

      <Button
        onClick={onSelect}
        disabled={isLoading}
        className={`mb-8 w-full ${
          plan.popular ? 'bg-gradient-to-r from-primary to-accent' : ''
        }`}
        variant={plan.popular ? 'default' : 'outline'}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 animate-spin" size={16} />
            Creating...
          </>
        ) : (
          <>
            {plan.cta}
            <ArrowRight className="ml-2" size={16} />
          </>
        )}
      </Button>

      <div className="space-y-3">
        {plan.features.map((feature, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <Check size={18} className="mt-0.5 flex-shrink-0 text-green-500" />
            <span className="text-sm">{feature}</span>
          </div>
        ))}
        {plan.notIncluded?.map((feature, idx) => (
          <div key={idx} className="flex items-start gap-3 opacity-50">
            <X
              size={18}
              className="mt-0.5 flex-shrink-0 text-muted-foreground"
            />
            <span className="text-sm">{feature}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default PricingPage;
