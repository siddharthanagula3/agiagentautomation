import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Particles } from '@/components/ui/particles';
import { Code, Terminal, Key, Zap, FileJson, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const APIReferencePage: React.FC = () => {
  const endpoints = [
    {
      method: 'POST',
      path: '/api/v1/employees',
      description: 'Create a new AI employee',
      badge: 'AI Employees',
    },
    {
      method: 'GET',
      path: '/api/v1/employees',
      description: 'List all AI employees',
      badge: 'AI Employees',
    },
    {
      method: 'POST',
      path: '/api/v1/workflows',
      description: 'Create a new workflow',
      badge: 'Workflows',
    },
    {
      method: 'GET',
      path: '/api/v1/workflows/{id}/execute',
      description: 'Execute a workflow',
      badge: 'Workflows',
    },
    {
      method: 'GET',
      path: '/api/v1/analytics',
      description: 'Get analytics data',
      badge: 'Analytics',
    },
    {
      method: 'POST',
      path: '/api/v1/integrations',
      description: 'Connect an integration',
      badge: 'Integrations',
    },
  ];

  const features = [
    {
      icon: Key,
      title: 'API Keys',
      description: 'Secure authentication with API keys and OAuth 2.0',
    },
    {
      icon: Zap,
      title: 'Rate Limits',
      description: '10,000 requests/hour on Pro, unlimited on Enterprise',
    },
    {
      icon: FileJson,
      title: 'JSON',
      description: 'RESTful API with JSON request/response format',
    },
    {
      icon: Shield,
      title: 'Secure',
      description: 'TLS 1.3 encryption and IP whitelisting available',
    },
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
              <Code className="mr-2 h-4 w-4" />
              API Reference
            </Badge>
            <h1 className="mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-5xl font-bold text-transparent md:text-7xl">
              Build with Our API
            </h1>
            <p className="mb-8 text-xl text-muted-foreground">
              Powerful REST API to integrate AGI Agent into your applications
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                asChild
                className="bg-gradient-to-r from-primary to-accent"
              >
                <Link to="/auth/register">Get API Key</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/documentation">View Docs</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="border-2 border-border/50 p-6 text-center">
                  <div className="mx-auto mb-4 w-fit rounded-xl bg-primary/10 p-3">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 font-bold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-2xl border border-border/50 p-8"
          >
            <div className="mb-6 flex items-center gap-3">
              <Terminal className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Getting Started</h2>
            </div>
            <div className="overflow-x-auto rounded-xl bg-black/50 p-6 font-mono text-sm">
              <div className="text-green-400"># Install SDK</div>
              <div className="mb-4 text-white">npm install @agiagent/sdk</div>
              <div className="text-green-400"># Initialize client</div>
              <div className="mb-2 text-white">
                import {'{ AGIAgent }'} from '@agiagent/sdk';
              </div>
              <div className="mb-4 text-white">
                const client = new AGIAgent({'{ apiKey: "your_api_key" }'});
              </div>
              <div className="text-green-400"># Create an AI employee</div>
              <div className="text-white">
                const employee = await client.employees.create({'{'}
              </div>
              <div className="ml-4 text-white">name: "Sales Agent",</div>
              <div className="ml-4 text-white">role: "sales",</div>
              <div className="ml-4 text-white">
                capabilities: ["lead_qualification", "email"]
              </div>
              <div className="text-white">{'});'}</div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-4xl font-bold">API Endpoints</h2>
            <p className="text-xl text-muted-foreground">
              Core endpoints to build your integration
            </p>
          </motion.div>

          <div className="mx-auto max-w-4xl space-y-4">
            {endpoints.map((endpoint, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="group cursor-pointer border-2 border-border/50 p-4 transition-all hover:border-primary/50">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <Badge
                      variant={
                        endpoint.method === 'GET' ? 'secondary' : 'default'
                      }
                      className="w-fit"
                    >
                      {endpoint.method}
                    </Badge>
                    <code className="flex-1 font-mono text-sm">
                      {endpoint.path}
                    </code>
                    <Badge variant="outline">{endpoint.badge}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {endpoint.description}
                  </p>
                </Card>
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
            <h2 className="mb-4 text-4xl font-bold">SDKs & Libraries</h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Official SDKs for your favorite languages
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge className="px-4 py-2 text-base">
                JavaScript/TypeScript
              </Badge>
              <Badge className="px-4 py-2 text-base">Python</Badge>
              <Badge className="px-4 py-2 text-base">Go</Badge>
              <Badge className="px-4 py-2 text-base">Ruby</Badge>
              <Badge className="px-4 py-2 text-base">PHP</Badge>
              <Badge className="px-4 py-2 text-base">Java</Badge>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default APIReferencePage;
