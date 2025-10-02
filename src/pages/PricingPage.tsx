import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Check, X, ArrowRight, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import { Particles } from '@/components/ui/particles';
import { getPricingPlans, type PricingPlan as DBPricingPlan } from '@/services/marketing-api';

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
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      const dbPlans = await getPricingPlans();
      const formattedPlans: PricingPlan[] = dbPlans.map(plan => {
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
          color: plan.color_gradient
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
        '24/7 Support'
      ],
      cta: 'Get Started',
      color: 'from-blue-500 to-cyan-500'
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
        'Custom integrations'
      ],
      popular: true,
      cta: 'Get Started',
      color: 'from-purple-500 to-pink-500'
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
        '24/7 Priority support'
      ],
      cta: 'Contact Sales',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const comparisonFeatures = [
    {
      category: 'AI Employees',
      features: [
        { name: 'Number of AI employees', starter: 'Pay per employee', pro: 'Unlimited', enterprise: 'Unlimited' },
        { name: 'Pricing model', starter: '$1/employee/month', pro: '$19/month flat', enterprise: 'Custom' },
        { name: 'Bonus credits', starter: false, pro: '$10 (first-time)', enterprise: 'Custom packages' },
        { name: 'Billing frequency', starter: 'Weekly', pro: 'Weekly', enterprise: 'Custom' }
      ]
    },
    {
      category: 'Features',
      features: [
        { name: 'All AI features', starter: true, pro: true, enterprise: true },
        { name: 'Workflow automation', starter: true, pro: true, enterprise: true },
        { name: 'Pay-as-you-go', starter: true, pro: true, enterprise: false },
        { name: 'Custom integrations', starter: false, pro: true, enterprise: true }
      ]
    },
    {
      category: 'Support',
      features: [
        { name: '24/7 Support', starter: true, pro: true, enterprise: true },
        { name: 'Priority support', starter: false, pro: true, enterprise: true },
        { name: 'Dedicated account manager', starter: false, pro: false, enterprise: true },
        { name: 'Training & onboarding', starter: false, pro: false, enterprise: true }
      ]
    },
    {
      category: 'Advanced',
      features: [
        { name: 'Advanced analytics', starter: false, pro: true, enterprise: true },
        { name: 'Volume discounts', starter: false, pro: false, enterprise: true },
        { name: 'SLA guarantees', starter: false, pro: false, enterprise: true },
        { name: 'Advanced security', starter: false, pro: false, enterprise: true }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Particles className="absolute inset-0 -z-10" quantity={40} staticity={50} />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary">
              Pay-As-You-Go Pricing
            </h1>
            <p className="text-xl text-muted-foreground mb-12">
              Only pay for what you use. $1 per AI employee or $19 for unlimited access with $10 bonus credits for first-time users.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="animate-spin text-primary" size={48} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan, idx) => (
                <PricingCard key={idx} plan={plan} index={idx} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-accent/5">
        <div className="container mx-auto max-w-7xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-16"
          >
            Compare Plans
          </motion.h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="text-left py-4 px-6 font-semibold">Features</th>
                  <th className="text-center py-4 px-6 font-semibold">Pay Per Employee</th>
                  <th className="text-center py-4 px-6 font-semibold">All Access</th>
                  <th className="text-center py-4 px-6 font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((category, catIdx) => (
                  <React.Fragment key={catIdx}>
                    <tr className="bg-accent/5">
                      <td colSpan={4} className="py-3 px-6 font-bold text-sm">
                        {category.category}
                      </td>
                    </tr>
                    {category.features.map((feature, featIdx) => (
                      <tr key={featIdx} className="border-b border-border/20 hover:bg-accent/5">
                        <td className="py-3 px-6 text-sm">{feature.name}</td>
                        <td className="py-3 px-6 text-center">
                          {typeof feature.starter === 'boolean' ? (
                            feature.starter ? (
                              <Check size={18} className="inline text-green-500" />
                            ) : (
                              <X size={18} className="inline text-muted-foreground" />
                            )
                          ) : (
                            <span className="text-sm">{feature.starter}</span>
                          )}
                        </td>
                        <td className="py-3 px-6 text-center">
                          {typeof feature.pro === 'boolean' ? (
                            feature.pro ? (
                              <Check size={18} className="inline text-green-500" />
                            ) : (
                              <X size={18} className="inline text-muted-foreground" />
                            )
                          ) : (
                            <span className="text-sm">{feature.pro}</span>
                          )}
                        </td>
                        <td className="py-3 px-6 text-center">
                          {typeof feature.enterprise === 'boolean' ? (
                            feature.enterprise ? (
                              <Check size={18} className="inline text-green-500" />
                            ) : (
                              <X size={18} className="inline text-muted-foreground" />
                            )
                          ) : (
                            <span className="text-sm">{feature.enterprise}</span>
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
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-12"
          >
            Frequently Asked Questions
          </motion.h2>

          <div className="space-y-6">
            {[
              {
                q: 'Can I change plans anytime?',
                a: 'Yes, you can upgrade or downgrade at any time. Changes take effect immediately for upgrades and at the next billing cycle for downgrades.'
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards, PayPal, and wire transfer for Enterprise plans.'
              },
              {
                q: 'Is there a free trial?',
                a: 'Yes! All plans include a 14-day free trial with full access to features. No credit card required.'
              },
              {
                q: 'What happens if I exceed my limits?',
                a: 'We\'ll notify you before you reach your limits. You can upgrade or purchase add-ons to continue without interruption.'
              }
            ].map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-xl bg-background/60 backdrop-blur-xl border border-border/40 p-6"
              >
                <h3 className="text-lg font-bold mb-2">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl bg-gradient-to-r from-primary via-accent to-secondary p-12 text-center text-white"
          >
            <h2 className="text-4xl font-bold mb-4">Still Have Questions?</h2>
            <p className="text-xl mb-8 opacity-90">
              Our team is here to help you find the perfect plan
            </p>
            <Button size="lg" variant="secondary">
              Contact Sales
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

const PricingCard: React.FC<{ plan: PricingPlan; index: number }> = ({ plan, index }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className={`relative overflow-hidden rounded-3xl backdrop-blur-xl border p-8 ${
        plan.popular
          ? 'border-primary bg-gradient-to-b from-primary/10 to-accent/10 shadow-2xl scale-105'
          : 'border-border/40 bg-background/60'
      }`}
      whileHover={{ y: -8 }}
    >
      {plan.popular && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-accent text-white text-xs font-bold px-4 py-1 rounded-bl-xl">
          MOST POPULAR
        </div>
      )}

      <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
      <div className="mb-4">
        <span className="text-5xl font-bold">{plan.price}</span>
        {plan.period && <span className="text-muted-foreground ml-2">{plan.period}</span>}
      </div>
      <p className="text-muted-foreground mb-8">{plan.description}</p>

      <Button
        className={`w-full mb-8 ${
          plan.popular ? 'bg-gradient-to-r from-primary to-accent' : ''
        }`}
        variant={plan.popular ? 'default' : 'outline'}
      >
        {plan.cta}
        <ArrowRight className="ml-2" size={16} />
      </Button>

      <div className="space-y-3">
        {plan.features.map((feature, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <Check size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{feature}</span>
          </div>
        ))}
        {plan.notIncluded?.map((feature, idx) => (
          <div key={idx} className="flex items-start gap-3 opacity-50">
            <X size={18} className="text-muted-foreground mt-0.5 flex-shrink-0" />
            <span className="text-sm">{feature}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default PricingPage;
