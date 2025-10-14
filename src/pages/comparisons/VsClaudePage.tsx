import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { Card, CardContent } from '@shared/ui/card';
import { Check, X, ArrowRight, TrendingDown, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';

const VsClaudePage: React.FC = () => {
  const comparisonFeatures = [
    {
      feature: 'Monthly Cost',
      agiWorkforce: '$10/employee/month',
      claude: '$20/month',
      winner: 'agi',
      savings: '95% cheaper',
    },
    {
      feature: 'Claude 3.5 Sonnet Access',
      agiWorkforce: 'Yes - Included',
      claude: 'Yes',
      winner: 'tie',
    },
    {
      feature: 'Multiple AI Models',
      agiWorkforce: 'Claude + GPT-4 + Gemini + Perplexity',
      claude: 'Claude only',
      winner: 'agi',
    },
    {
      feature: 'Specialized Employees',
      agiWorkforce: '20+ (Engineers, Marketers, Analysts)',
      claude: '1 general assistant',
      winner: 'agi',
    },
    {
      feature: 'Team Workspace',
      agiWorkforce: 'Unlimited members',
      claude: 'Individual only (no Pro Team plan)',
      winner: 'agi',
    },
    {
      feature: 'Workflow Automation',
      agiWorkforce: 'Visual builder included',
      claude: 'None',
      winner: 'agi',
    },
    {
      feature: 'Code Execution',
      agiWorkforce: 'Full MCP tools integration',
      claude: 'Analysis tool only',
      winner: 'agi',
    },
    {
      feature: 'Analytics Dashboard',
      agiWorkforce: 'Real-time metrics & reports',
      claude: 'None',
      winner: 'agi',
    },
    {
      feature: 'Custom Integrations',
      agiWorkforce: '50+ native apps',
      claude: 'Limited',
      winner: 'agi',
    },
    {
      feature: '10 Team Members Cost',
      agiWorkforce: '$10/employee/month',
      claude: '$200/month',
      winner: 'agi',
      savings: 'Save $190/month',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="from-purple/10 to-orange/10 pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent" />

        <div className="container relative z-10 mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 text-center"
          >
            <Badge className="glass mb-6 px-6 py-2 text-lg">
              <TrendingDown className="mr-2 h-5 w-5" />
              Same Claude 3.5, 95% Cheaper
            </Badge>

            <h1 className="mb-6 text-5xl font-bold md:text-7xl">
              AGI Workforce vs{' '}
              <span className="bg-gradient-to-r from-purple-400 to-orange-500 bg-clip-text text-transparent">
                Claude Pro
              </span>
            </h1>

            <p className="mx-auto mb-8 max-w-4xl text-xl text-muted-foreground md:text-2xl">
              We use the{' '}
              <span className="font-bold text-primary">
                same Claude 3.5 Sonnet
              </span>{' '}
              model. But at{' '}
              <span className="font-bold text-primary">$0 per month</span>{' '}
              instead of $20. Plus get GPT-4, Gemini, and 100+ specialized AI
              employees.
            </p>

            {/* Pricing Comparison */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-strong mx-auto mb-8 max-w-4xl rounded-3xl p-8"
            >
              <div className="grid gap-8 md:grid-cols-2">
                {/* Claude Pro */}
                <div className="text-center">
                  <div className="mb-2 text-4xl">🧠</div>
                  <h3 className="mb-4 text-2xl font-bold">Claude Pro</h3>
                  <div className="mb-2 text-5xl font-bold text-red-500">
                    $20
                  </div>
                  <div className="mb-4 text-muted-foreground">
                    /month per user
                  </div>
                  <div className="space-y-2 text-left">
                    <div className="flex items-start gap-2">
                      <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                      <span className="text-sm">Claude 3.5 Sonnet</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <X className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                      <span className="text-sm">Only Claude models</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <X className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                      <span className="text-sm">No team features</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <X className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                      <span className="text-sm">No automation</span>
                    </div>
                  </div>
                </div>

                {/* AGI Workforce */}
                <div className="relative text-center">
                  <div className="absolute -right-4 -top-4">
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-1 text-white">
                      <Crown className="mr-1 h-4 w-4" />
                      BETTER VALUE
                    </Badge>
                  </div>
                  <div className="mb-2 text-4xl">🚀</div>
                  <h3 className="mb-4 text-2xl font-bold">AGI Workforce</h3>
                  <div className="mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-5xl font-bold text-transparent">
                    $10
                  </div>
                  <div className="mb-4 text-muted-foreground">
                    /month per AI employee
                  </div>
                  <div className="space-y-2 text-left">
                    <div className="flex items-start gap-2">
                      <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                      <span className="text-sm font-medium">
                        Claude 3.5 Sonnet ✅
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                      <span className="text-sm font-medium">
                        + GPT-4, Gemini, Perplexity
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                      <span className="text-sm font-medium">
                        Unlimited team members
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                      <span className="text-sm font-medium">
                        20+ specialized employees
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-border pt-8">
                <div className="text-center">
                  <p className="mb-2 text-2xl font-bold text-green-500">
                    Save $20/month = $240/year per person
                  </p>
                  <p className="text-muted-foreground">
                    For a 10-person team:{' '}
                    <span className="font-bold text-primary">
                      Save $2,280/year
                    </span>
                  </p>
                </div>
              </div>
            </motion.div>

            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-primary to-accent px-8 py-6 text-lg text-white"
            >
              <Link to="/register">
                Get Claude 3.5 for $0 per month{' '}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-4xl font-bold md:text-5xl">
              Why Pay More for the Same AI?
            </h2>
            <p className="text-xl text-muted-foreground">
              Get Claude 3.5 + GPT-4 + Gemini + More for Less
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass overflow-hidden rounded-2xl"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">
                      Feature
                    </th>
                    <th className="px-6 py-4 text-center font-semibold">
                      🚀 AGI Workforce
                    </th>
                    <th className="px-6 py-4 text-center font-semibold">
                      🧠 Claude Pro
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((item, idx) => (
                    <tr
                      key={idx}
                      className="border-t border-border/50 transition-colors hover:bg-accent/5"
                    >
                      <td className="px-6 py-4 font-medium">{item.feature}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {item.winner === 'agi' && (
                            <Check className="h-5 w-5 text-green-500" />
                          )}
                          <span
                            className={
                              item.winner === 'agi'
                                ? 'font-medium text-green-600 dark:text-green-400'
                                : ''
                            }
                          >
                            {item.agiWorkforce}
                          </span>
                        </div>
                        {item.savings && (
                          <Badge
                            variant="outline"
                            className="mt-1 border-green-500 text-green-600 dark:text-green-400"
                          >
                            {item.savings}
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-muted-foreground">
                        {item.claude}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="from-purple/20 via-orange/10 bg-gradient-to-br to-transparent px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-6 text-4xl font-bold md:text-5xl">
              Get Claude 3.5 for Less
            </h2>
            <p className="mb-8 text-xl text-muted-foreground">
              Same AI model. 95% cheaper. Plus 3 more AI models and team
              features.
            </p>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-primary to-accent px-8 py-6 text-lg text-white"
              >
                <Link to="/register">
                  Start Free - Save $228/Year{' '}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="px-8 py-6 text-lg"
              >
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default VsClaudePage;
