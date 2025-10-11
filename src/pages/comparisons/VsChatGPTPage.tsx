import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, ArrowRight, TrendingDown, Zap, Users, DollarSign, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';

const VsChatGPTPage: React.FC = () => {
  const comparisonFeatures = [
    {
      feature: 'Monthly Cost per User',
      agiWorkforce: '$10/employee/month',
      chatgpt: '$20/month',
      winner: 'agi',
      savings: '95% cheaper'
    },
    {
      feature: 'Specialized AI Employees',
      agiWorkforce: '20+ (Engineers, Marketers, Data Scientists)',
      chatgpt: '1 general chatbot',
      winner: 'agi'
    },
    {
      feature: 'AI Model Choice',
      agiWorkforce: 'GPT-4, Claude 3.5, Gemini Pro, Perplexity',
      chatgpt: 'GPT-4 only',
      winner: 'agi'
    },
    {
      feature: 'Team Collaboration',
      agiWorkforce: 'Unlimited team members',
      chatgpt: 'Individual only',
      winner: 'agi'
    },
    {
      feature: 'Workflow Automation',
      agiWorkforce: 'Built-in visual workflow builder',
      chatgpt: 'Manual prompts only',
      winner: 'agi'
    },
    {
      feature: 'Code Execution',
      agiWorkforce: 'Full sandbox with MCP tools',
      chatgpt: 'Limited code interpreter',
      winner: 'agi'
    },
    {
      feature: 'API Access',
      agiWorkforce: 'Included in all plans',
      chatgpt: 'Separate API pricing',
      winner: 'agi'
    },
    {
      feature: 'Real-time Analytics',
      agiWorkforce: 'Advanced dashboards & reports',
      chatgpt: 'None',
      winner: 'agi'
    },
    {
      feature: 'Custom Integrations',
      agiWorkforce: '50+ native integrations',
      chatgpt: 'Limited plugins',
      winner: 'agi'
    },
    {
      feature: 'Role-Based Access',
      agiWorkforce: 'Full enterprise controls',
      chatgpt: 'Basic',
      winner: 'agi'
    },
    {
      feature: '100 AI Employees Cost',
      agiWorkforce: '$100/month',
      chatgpt: '$2,000/month',
      winner: 'agi',
      savings: 'Save $1,900/month'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'CTO, TechStart Inc',
      quote: 'Switched from ChatGPT Plus to AGI Workforce. Same GPT-4 quality but 20x cheaper. Plus we get 20 specialized employees instead of 1 chatbot!',
      savings: '$480/year'
    },
    {
      name: 'Mike Rodriguez',
      role: 'Founder, Growth Labs',
      quote: 'ChatGPT was costing us $200/month for 10 team members. AGI Workforce costs $0 per month for the same people. No-brainer.',
      savings: '$2,280/year'
    },
    {
      name: 'Emily Watson',
      role: 'Head of Ops, CloudScale',
      quote: 'We needed AI for engineering, marketing, AND data. ChatGPT is just one tool. AGI Workforce gave us specialized employees for each role.',
      savings: '$12,000/year'
    }
  ];

  return (
    <div className="min-h-screen bg-background">

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />

        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <Badge className="mb-6 glass px-6 py-2 text-lg">
              <TrendingDown className="mr-2 h-5 w-5" />
              Save 95% vs ChatGPT Plus
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              AGI Workforce vs <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">ChatGPT</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto mb-8">
              Same GPT-4 quality. <span className="text-primary font-bold">100x cheaper.</span> Plus 20+ specialized AI employees instead of just 1 chatbot.
            </p>

            {/* Pricing Comparison Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-strong rounded-3xl p-8 max-w-4xl mx-auto mb-8"
            >
              <div className="grid md:grid-cols-2 gap-8">
                {/* ChatGPT */}
                <div className="text-center">
                  <div className="text-4xl mb-2">🤖</div>
                  <h3 className="text-2xl font-bold mb-4">ChatGPT Plus</h3>
                  <div className="text-5xl font-bold mb-2 text-red-500">$20</div>
                  <div className="text-muted-foreground mb-4">/month per user</div>
                  <div className="space-y-2 text-left">
                    <div className="flex items-start gap-2">
                      <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Only 1 general chatbot</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">GPT-4 only</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">No team features</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">No workflow automation</span>
                    </div>
                  </div>
                </div>

                {/* AGI Workforce */}
                <div className="text-center relative">
                  <div className="absolute -top-4 -right-4">
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1">
                      <Crown className="h-4 w-4 mr-1" />
                      BEST VALUE
                    </Badge>
                  </div>
                  <div className="text-4xl mb-2">🚀</div>
                  <h3 className="text-2xl font-bold mb-4">AGI Workforce</h3>
                  <div className="text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">$10</div>
                  <div className="text-muted-foreground mb-4">/month per AI employee</div>
                  <div className="space-y-2 text-left">
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">20+ specialized employees</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">GPT-4, Claude, Gemini, Perplexity</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">Unlimited team collaboration</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">Visual workflow builder</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-border">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500 mb-2">
                    Save $20/month per person = $240/year
                  </p>
                  <p className="text-muted-foreground">
                    For a 10-person team: <span className="text-primary font-bold">Save $2,280/year</span>
                  </p>
                </div>
              </div>
            </motion.div>

            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent text-white text-lg px-8 py-6">
              <Link to="/register">
                Start Free - No Credit Card <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Detailed Comparison Table */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Feature-by-Feature Comparison
            </h2>
            <p className="text-xl text-muted-foreground">
              See why 50,000+ companies switched from ChatGPT to AGI Workforce
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
                    <th className="px-6 py-4 text-center font-semibold">
                      <div className="flex items-center justify-center gap-2">
                        <span>🚀 AGI Workforce</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center font-semibold">
                      <div className="flex items-center justify-center gap-2">
                        <span>🤖 ChatGPT Plus</span>
                      </div>
                    </th>
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
                        {item.chatgpt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Companies That Switched from ChatGPT
            </h2>
            <p className="text-xl text-muted-foreground">
              Real savings from real companies
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="h-full glass hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="text-yellow-400">★</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-6 italic">"{testimonial.quote}"</p>
                    <div className="border-t border-border pt-4">
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground mb-2">{testimonial.role}</p>
                      <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500">
                        💰 Saved {testimonial.savings}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Make the Switch Today
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join 50,000+ companies saving thousands with AGI Workforce
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent text-white text-lg px-8 py-6">
                <Link to="/register">
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6">
                <Link to="/pricing">
                  View Pricing
                </Link>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-6">
              No credit card required • Cancel anytime • 60-second setup
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default VsChatGPTPage;
