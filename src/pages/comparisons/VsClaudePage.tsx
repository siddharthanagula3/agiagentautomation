import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, ArrowRight, TrendingDown, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';

const VsClaudePage: React.FC = () => {
  const comparisonFeatures = [
    {
      feature: 'Monthly Cost',
      agiWorkforce: '$10/employee/month',
      claude: '$20/month',
      winner: 'agi',
      savings: '95% cheaper'
    },
    {
      feature: 'Claude 3.5 Sonnet Access',
      agiWorkforce: 'Yes - Included',
      claude: 'Yes',
      winner: 'tie'
    },
    {
      feature: 'Multiple AI Models',
      agiWorkforce: 'Claude + GPT-4 + Gemini + Perplexity',
      claude: 'Claude only',
      winner: 'agi'
    },
    {
      feature: 'Specialized Employees',
      agiWorkforce: '20+ (Engineers, Marketers, Analysts)',
      claude: '1 general assistant',
      winner: 'agi'
    },
    {
      feature: 'Team Workspace',
      agiWorkforce: 'Unlimited members',
      claude: 'Individual only (no Pro Team plan)',
      winner: 'agi'
    },
    {
      feature: 'Workflow Automation',
      agiWorkforce: 'Visual builder included',
      claude: 'None',
      winner: 'agi'
    },
    {
      feature: 'Code Execution',
      agiWorkforce: 'Full MCP tools integration',
      claude: 'Analysis tool only',
      winner: 'agi'
    },
    {
      feature: 'Analytics Dashboard',
      agiWorkforce: 'Real-time metrics & reports',
      claude: 'None',
      winner: 'agi'
    },
    {
      feature: 'Custom Integrations',
      agiWorkforce: '50+ native apps',
      claude: 'Limited',
      winner: 'agi'
    },
    {
      feature: '10 Team Members Cost',
      agiWorkforce: '$10/employee/month',
      claude: '$200/month',
      winner: 'agi',
      savings: 'Save $190/month'
    }
  ];

  return (
    <div className="min-h-screen bg-background">

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple/10 via-transparent to-orange/10 pointer-events-none" />

        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <Badge className="mb-6 glass px-6 py-2 text-lg">
              <TrendingDown className="mr-2 h-5 w-5" />
              Same Claude 3.5, 95% Cheaper
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              AGI Workforce vs <span className="bg-gradient-to-r from-purple-400 to-orange-500 bg-clip-text text-transparent">Claude Pro</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto mb-8">
              We use the <span className="text-primary font-bold">same Claude 3.5 Sonnet</span> model. But at <span className="text-primary font-bold">$0 per month</span> instead of $20. Plus get GPT-4, Gemini, and 100+ specialized AI employees.
            </p>

            {/* Pricing Comparison */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-strong rounded-3xl p-8 max-w-4xl mx-auto mb-8"
            >
              <div className="grid md:grid-cols-2 gap-8">
                {/* Claude Pro */}
                <div className="text-center">
                  <div className="text-4xl mb-2">🧠</div>
                  <h3 className="text-2xl font-bold mb-4">Claude Pro</h3>
                  <div className="text-5xl font-bold mb-2 text-red-500">$20</div>
                  <div className="text-muted-foreground mb-4">/month per user</div>
                  <div className="space-y-2 text-left">
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Claude 3.5 Sonnet</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Only Claude models</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">No team features</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">No automation</span>
                    </div>
                  </div>
                </div>

                {/* AGI Workforce */}
                <div className="text-center relative">
                  <div className="absolute -top-4 -right-4">
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1">
                      <Crown className="h-4 w-4 mr-1" />
                      BETTER VALUE
                    </Badge>
                  </div>
                  <div className="text-4xl mb-2">🚀</div>
                  <h3 className="text-2xl font-bold mb-4">AGI Workforce</h3>
                  <div className="text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">$10</div>
                  <div className="text-muted-foreground mb-4">/month per AI employee</div>
                  <div className="space-y-2 text-left">
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">Claude 3.5 Sonnet ✅</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">+ GPT-4, Gemini, Perplexity</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">Unlimited team members</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">20+ specialized employees</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-border">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500 mb-2">
                    Save $20/month = $240/year per person
                  </p>
                  <p className="text-muted-foreground">
                    For a 10-person team: <span className="text-primary font-bold">Save $2,280/year</span>
                  </p>
                </div>
              </div>
            </motion.div>

            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent text-white text-lg px-8 py-6">
              <Link to="/register">
                Get Claude 3.5 for $0 per month <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
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
            className="glass rounded-2xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Feature</th>
                    <th className="px-6 py-4 text-center font-semibold">🚀 AGI Workforce</th>
                    <th className="px-6 py-4 text-center font-semibold">🧠 Claude Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((item, idx) => (
                    <tr key={idx} className="border-t border-border/50 hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4 font-medium">{item.feature}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {item.winner === 'agi' && <Check className="h-5 w-5 text-green-500" />}
                          <span className={item.winner === 'agi' ? 'font-medium text-green-600 dark:text-green-400' : ''}>
                            {item.agiWorkforce}
                          </span>
                        </div>
                        {item.savings && (
                          <Badge variant="outline" className="mt-1 border-green-500 text-green-600 dark:text-green-400">
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
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple/20 via-orange/10 to-transparent">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Get Claude 3.5 for Less
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Same AI model. 95% cheaper. Plus 3 more AI models and team features.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent text-white text-lg px-8 py-6">
                <Link to="/register">
                  Start Free - Save $228/Year <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6">
                <Link to="/pricing">
                  View Pricing
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default VsClaudePage;
