import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

const LoginPage: React.FC = () => {
  const { login, isLoading, error, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  
  // Check if we're in demo mode
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const isDemoMode = !supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-url') || supabaseKey.includes('your-anon-key');
  
  const [formData, setFormData] = useState({
    email: isDemoMode ? 'demo@example.com' : '',
    password: isDemoMode ? 'demo123' : ''
  });
  const [showPassword, setShowPassword] = useState(false);

  // Authentication redirect logic is now handled by ProtectedRoute

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ email: formData.email, password: formData.password });
  };

  const handleDemoLogin = async () => {
    setFormData({
      email: 'demo@example.com',
      password: 'demo123'
    });
    // Trigger login after setting demo credentials
    setTimeout(() => {
      const form = document.getElementById('login-form') as HTMLFormElement;
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }, 100);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-purple-500/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1 text-center pb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Bot className="h-8 w-8 text-primary" />
              </div>
            </div>
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
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
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
      </div>
    </div>
  );
};

export default LoginPage;