import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { useAuthStore } from '../../stores/unified-auth-store';
import {
  Bot,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Particles } from '../../components/ui/particles';
import { Spotlight } from '../../components/ui/spotlight';

const LoginPage: React.FC = () => {
  const { login, isLoading, error, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're in demo mode
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const isDemoMode = !supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-url') || supabaseKey.includes('your-anon-key');
  
  const [formData, setFormData] = useState({
    email: isDemoMode ? 'demo@example.com' : '',
    password: isDemoMode ? 'demo123' : ''
  });
  const [showPassword, setShowPassword] = useState(false);

  // **KEY FIX: Add redirect logic after successful authentication**
  useEffect(() => {
    console.log('LoginPage: Auth state changed:', { isAuthenticated, user: user?.email });
    
    if (isAuthenticated && user) {
      console.log('✅ LoginPage: User authenticated, redirecting to dashboard');
      
      // Get the intended destination from location state, or default to dashboard
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      
      // Small delay to ensure auth state is fully settled
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
    }
  }, [isAuthenticated, user, navigate, location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('LoginPage: Attempting login...');
    
    try {
      await login({ email: formData.email, password: formData.password });
      console.log('LoginPage: Login function completed');
    } catch (err) {
      console.error('LoginPage: Login failed:', err);
    }
  };

  const handleDemoLogin = async () => {
    console.log('LoginPage: Demo login triggered');
    setFormData({
      email: 'demo@example.com',
      password: 'demo123'
    });
    
    // Trigger login immediately with demo credentials
    try {
      await login({ email: 'demo@example.com', password: 'demo123' });
    } catch (err) {
      console.error('LoginPage: Demo login failed:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Don't render login form if user is already authenticated
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-purple-500/5 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Enhanced background with particles and spotlight */}
      <Particles className="absolute inset-0" quantity={60} />
      <Spotlight className="absolute inset-0" />

      {/* Animated gradient blobs */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            y: [0, 30, 0],
            x: [0, -20, 0],
            scale: [1, 1.15, 1]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border border-border/50 backdrop-blur-xl bg-background/60 shadow-2xl">
          <CardHeader className="space-y-1 text-center pb-8">
            <motion.div
              className="flex justify-center mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            >
              <motion.div
                className="p-3 bg-primary/10 rounded-full"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Bot className="h-8 w-8 text-primary" />
              </motion.div>
            </motion.div>
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your AGI Agent Automation account
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Demo Mode Banner */}
            {isDemoMode && (
              <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Demo Mode - Using demo credentials</span>
              </div>
            )}
            
            <form id="login-form" onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-10"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Demo Login Button */}
            {isDemoMode && (
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Quick Demo
                    </span>
                  </div>
                </div>
                
                <Button 
                  onClick={handleDemoLogin}
                  variant="outline" 
                  className="w-full"
                  disabled={isLoading}
                >
                  <Bot className="mr-2 h-4 w-4" />
                  Quick Demo Login
                </Button>
              </div>
            )}

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link 
                to="/auth/register" 
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginPage;
