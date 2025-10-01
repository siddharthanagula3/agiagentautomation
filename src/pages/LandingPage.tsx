import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  ArrowRight, 
  Sparkles,
  Zap,
  Brain,
  MessageSquare,
  BarChart3,
  Shield,
  CheckCircle2,
  Play,
  Workflow,
  FileText,
  Users,
  Clock,
  Star,
  Quote,
  TrendingUp,
  Rocket,
  Target,
  Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const LandingPage: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [stats, setStats] = useState({ tasks: 0, time: 0, cost: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        tasks: Math.min(prev.tasks + 247, 50000),
        time: Math.min(prev.time + 1.3, 98),
        cost: Math.min(prev.cost + 2.1, 89)
      }));
    }, 10);
    setTimeout(() => clearInterval(interval), 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 gradient-mesh"></div>
        
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ y: [0, -15, 0], x: [0, -15, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 right-1/3 w-64 h-64 bg-secondary/10 rounded-full blur-3xl"
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <Badge className="mb-8 glass px-6 py-2 text-base font-medium">
              <Sparkles className="mr-2 h-4 w-4" />
              Your Complete AI Workforce - Available Now
            </Badge>

            <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-tight">
              <span className="block mb-2">One Person.</span>
              <span className="block text-gradient-primary">Billion Dollar Company.</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed">
              Your AI workforce works like the Claude desktop extension - 
              <span className="text-foreground font-semibold"> just ask in natural language</span> and watch as it 
              <span className="text-foreground font-semibold"> thinks, plans, and executes</span> everything from A to Z.
            </p>

            <div className="glass-strong rounded-2xl p-8 mb-12 max-w-3xl mx-auto">
              <div className="flex items-start gap-4 text-left">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">No "AI Employees" - Just Results</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Forget managing agents or building workflows. Simply describe what you need, 
                    and our AI automatically handles every step - from understanding your goal to 
                    delivering the final result. It's that simple.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button size="lg" className="btn-glow gradient-primary text-white text-lg px-10 py-7 shadow-xl" asChild>
                <Link to="/auth/register">
                  Start Building Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="glass text-lg px-10 py-7" asChild>
                <Link to="/demo">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Link>
              </Button>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
            >
              <div className="glass rounded-2xl p-8">
                <div className="text-4xl font-bold text-primary mb-2">{stats.tasks.toLocaleString()}+</div>
                <div className="text-sm text-muted-foreground">Tasks Completed Daily</div>
              </div>
              <div className="glass rounded-2xl p-8">
                <div className="text-4xl font-bold text-accent mb-2">{stats.time.toFixed(0)}%</div>
                <div className="text-sm text-muted-foreground">Time Saved</div>
              </div>
              <div className="glass rounded-2xl p-8">
                <div className="text-4xl font-bold text-secondary mb-2">{stats.cost.toFixed(0)}%</div>
                <div className="text-sm text-muted-foreground">Cost Reduction</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-90"></div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              Ready to Build Your AI Workforce?
            </h2>
            <p className="text-xl md:text-2xl mb-12 opacity-90 max-w-3xl mx-auto">
              Join thousands of entrepreneurs and businesses using AI to scale without limits. 
              Start free today - no credit card required.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                size="lg" 
                variant="secondary" 
                className="bg-white hover:bg-white/90 text-primary text-lg px-10 py-7 font-semibold shadow-2xl"
                asChild
              >
                <Link to="/auth/register">
                  Start Building Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white/30 bg-white/10 hover:bg-white/20 text-white text-lg px-10 py-7 backdrop-blur-sm"
                asChild
              >
                <Link to="/demo">
                  <Play className="mr-2 h-5 w-5" />
                  See It In Action
                </Link>
              </Button>
            </div>

            <div className="flex items-center justify-center gap-8 text-sm opacity-80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>Free forever plan</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>Start in 2 minutes</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
