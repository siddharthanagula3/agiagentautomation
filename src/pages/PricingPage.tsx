import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, ArrowRight, Zap, Loader2 } from 'lucide-react';
import { Button } from '@shared/ui/button';
import { Particles } from '@shared/ui/particles';
import {
  CountdownTimer,
  createDiscountEndDate,
} from '@shared/ui/countdown-timer';
import {
  getPricingPlans,
  type PricingPlan as DBPricingPlan,
} from '@core/api/marketing-api';
import { useAuthStore } from '@shared/stores/unified-auth-store';
import { SEOHead } from '@shared/components/seo/SEOHead';
import {
  upgradeToProPlan,
  upgradeToMaxPlan,
  isStripeConfigured,
} from '@features/billing/services/stripe-service';
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

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

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

      // Map plan names to Stripe price IDs
      let priceId: string;
      if (planName === 'Pay Per Employee') {
        priceId = 'price_1SHESN21oG095Q15MXZ3eBfD'; // $1/month Pay Per Employee
      } else if (planName === 'All Access') {
        priceId = 'price_1SHESd21oG095Q15kQzHLzVW'; // $19/month All Access
      } else {
        throw new Error('Invalid plan selected');
      }

      // Get current user data
      const userData = {
        userId: user?.id || 'anonymous',
        userEmail: user?.email || 'user@example.com',
        billingPeriod: 'monthly' as const,
      };

      // Use the proper upgrade function instead
      if (planName === 'Pay Per Employee') {
        await upgradeToProPlan(userData);
      } else if (planName === 'All Access') {
        await upgradeToMaxPlan(userData);
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to create subscription. Please try again.'
      );
    } finally {
      setIsCreatingSubscription(false);
    }
  };

  async function loadPlans() {
    try {
      const dbPlans = await getPricingPlans();
      const formattedPlans: PricingPlan[] = dbPlans.map((plan) => {
        let price = 'Custom';
        let period = '';

        if (plan.slug === 'pay-per-employee') {
          price = '$1';
          period = '/employee/month';
        } else if (plan.slug === 'all-access') {
          price = '$19';
          period = '/month';
        } else if (plan.slug === 'enterprise') {
          price = 'Custom';
          period = '';
        }

        return {
          name: plan.name,
          price,
          period,
          description: plan.description,
          features: plan.features,
          notIncluded: plan.not_included || [],
          popular: plan.popular,
          cta: plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started',
          color: plan.color_gradient,
        };
      });
      setPlans(formattedPlans);
    } catch (error) {
      console.error('Error loading pricing plans:', error);
      // Fallback to hardcoded plans if fetch fails
      setPlans(fallbackPlans);
    } finally {
      setLoading(false);
    }
  }

  const fallbackPlans: PricingPlan[] = [
    {
      name: 'Pay Per Employee',
      price: '$1',
      period: '/employee/month',
      description: 'Perfect for teams that want flexibility',
      features: [
        '$1 per AI employee per month',
        'Pay-as-you-go after purchase',
        'No upfront commitment',
        'Cancel anytime',
        'Weekly billing',
        'All AI features included',
        '24/7 Support',
      ],
      cta: 'Get Started',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      name: 'All Access',
      price: '$19',
      period: '/month',
      description: 'Best value - Hire unlimited AI employees',
      features: [
        'Hire ALL AI employees',
        '$10 bonus credits for first-time users',
        'Pay-as-you-go after credits',
        'Weekly billing',
        'All AI features included',
        'Priority support',
        'Advanced analytics',
        'Custom integrations',
      ],
      popular: true,
      cta: 'Get Started',
      color: 'from-purple-500 to-pink-500',
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'Custom pricing for large organizations',
      features: [
        'Unlimited AI employees',
        'Custom credit packages',
        'Volume discounts',
        'Dedicated account manager',
        'SLA guarantees',
        'Custom integrations',
        'Advanced security',
        'Training & onboarding',
        '24/7 Priority support',
      ],
      cta: 'Contact Sales',
      color: 'from-orange-500 to-red-500',
    },
  ];

  const comparisonFeatures = [
    {
      category: 'AI Employees',
      features: [
        {
          name: 'Number of AI employees',
          starter: 'Pay per employee',
          pro: 'Unlimited',
          enterprise: 'Unlimited',
        },
        {
          name: 'Pricing model',
          starter: '$1/employee/month',
          pro: '$19/month flat',
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
    <div className="min-h-screen bg-background">
      <SEOHead
        title="AI Employee Pricing | Starting at $1/month | AGI Agent Automation"
        description="Affordable AI employee pricing starting at $1/month. Choose from Pay Per Employee, All Access, or Enterprise plans. 14-day free trial. No setup fees. Cancel anytime."
        keywords={[
          'ai employee pricing',
          'ai agents cost',
          'ai automation pricing',
          'hire ai employees price',
          'ai workforce pricing',
          'cheap ai employees',
          'ai employee subscription',
          'ai automation plans',
          'ai agents monthly cost',
        ]}
        ogType="website"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: 'AI Employee Platform',
          description: 'Affordable AI employee platform starting at $1/month',
          brand: {
            '@type': 'Brand',
            name: 'AGI Agent Automation',
          },
          offers: {
            '@type': 'AggregateOffer',
            lowPrice: '1',
            highPrice: '19',
            priceCurrency: 'USD',
            offerCount: '3',
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
            <h1 className="mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-5xl font-bold text-transparent md:text-6xl">
              Pay-As-You-Go Pricing
            </h1>
            <p className="mb-8 text-xl text-muted-foreground">
              Only pay for what you use. $1 per AI employee or $19 for unlimited
              access with $10 bonus credits for first-time users.
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
            className="mb-16 text-center text-4xl font-bold"
          >
            Compare Plans
          </motion.h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="px-6 py-4 text-left font-semibold">
                    Features
                  </th>
                  <th className="px-6 py-4 text-center font-semibold">
                    Pay Per Employee
                  </th>
                  <th className="px-6 py-4 text-center font-semibold">
                    All Access
                  </th>
                  <th className="px-6 py-4 text-center font-semibold">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((category, catIdx) => (
                  <React.Fragment key={catIdx}>
                    <tr className="bg-accent/5">
                      <td colSpan={4} className="px-6 py-3 text-sm font-bold">
                        {category.category}
                      </td>
                    </tr>
                    {category.features.map((feature, featIdx) => (
                      <tr
                        key={featIdx}
                        className="border-b border-border/20 hover:bg-accent/5"
                      >
                        <td className="px-6 py-3 text-sm">{feature.name}</td>
                        <td className="px-6 py-3 text-center">
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
                            <span className="text-sm">{feature.starter}</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-center">
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
                            <span className="text-sm">{feature.pro}</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-center">
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
                            <span className="text-sm">
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
            className="mb-12 text-center text-4xl font-bold"
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
                className="rounded-xl border border-border/40 bg-background/60 p-6 backdrop-blur-xl"
              >
                <h3 className="mb-2 text-lg font-bold">{faq.q}</h3>
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
            className="rounded-3xl bg-gradient-to-r from-primary via-accent to-secondary p-12 text-center text-white"
          >
            <h2 className="mb-4 text-4xl font-bold">Still Have Questions?</h2>
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
      className={`relative overflow-hidden rounded-3xl border p-8 backdrop-blur-xl ${
        plan.popular
          ? 'scale-105 border-primary bg-gradient-to-b from-primary/10 to-accent/10 shadow-2xl'
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
