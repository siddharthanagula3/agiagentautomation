import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/ui/card';
import { authService } from '@core/security/auth-service';
import { Bot, Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Particles } from '@shared/ui/particles';
import { Spotlight } from '@shared/ui/spotlight';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      const { error } = await authService.resetPassword(email);

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Enhanced background with particles and spotlight */}
      <Particles className="absolute inset-0" quantity={60} />
      <Spotlight className="absolute inset-0" />

      {/* Animated gradient blobs */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-20 top-20 h-96 w-96 rounded-full bg-primary/20 blur-3xl"
        />
        <motion.div
          animate={{
            y: [0, 30, 0],
            x: [0, -20, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-20 right-20 h-96 w-96 rounded-full bg-accent/20 blur-3xl"
        />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border border-border/50 bg-background/60 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-1 pb-8 text-center">
            <motion.div
              className="mb-4 flex justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            >
              <motion.div
                className="rounded-full bg-primary/10 p-3"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Bot className="h-8 w-8 text-primary" />
              </motion.div>
            </motion.div>
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your
              password
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {success ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
                  <CheckCircle className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Check your email</p>
                    <p className="text-sm">
                      We've sent a password reset link to {email}
                    </p>
                  </div>
                </div>

                <Link to="/auth/login">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="flex items-center space-x-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-destructive">
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
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </Button>

                <Link to="/auth/login">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to login
                  </Button>
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
