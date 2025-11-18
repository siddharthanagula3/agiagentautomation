/**
 * AI Employee Marketplace - Modern Professional Design
 * Browse and hire AI workforce with glassmorphism UI
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Badge } from '@shared/ui/badge';
import {
  Search,
  CheckCircle,
  Bot,
  Sparkles,
  Star,
  Zap,
  TrendingUp,
  Filter,
  X,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import {
  categories,
  providerInfo,
  type AIEmployee,
} from '@/data/marketplace-employees';
import { toast } from 'sonner';
import { useAuthStore } from '@shared/stores/authentication-store';
import { supabase } from '@shared/lib/supabase-client';
import { useQuery } from '@tanstack/react-query';
import {
  isEmployeePurchased,
  listPurchasedEmployees,
  purchaseEmployee,
} from '@features/workforce/services/employee-database';
import { motion, AnimatePresence } from 'framer-motion';
// Stripe removed - free hiring only
import { CountdownTimer } from '@shared/ui/countdown-timer';

export const MarketplacePublicPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [discountEnd, setDiscountEnd] = useState<Date | null>(null);
  // Initialize persistent 15-minute countdown per user (localStorage)
  useEffect(() => {
    const STORAGE_KEY = 'marketplace_offer_deadline';
    const saved = localStorage.getItem(STORAGE_KEY);
    const now = Date.now();
    let endTs: number | null = null;
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!Number.isNaN(parsed) && parsed > now) {
        endTs = parsed;
      }
    }
    if (!endTs) {
      endTs = now + 15 * 60 * 1000;
      localStorage.setItem(STORAGE_KEY, String(endTs));
    }
    setDiscountEnd(new Date(endTs));
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [purchasedEmployees, setPurchasedEmployees] = useState<Set<string>>(
    new Set()
  );
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadPurchased() {
      try {
        if (!user?.id) {
          setPurchasedEmployees(new Set());
          return;
        }
        // Updated: Nov 16th 2025 - Removed console statements for production
        const rows = await listPurchasedEmployees(user.id);
        if (!isMounted) return;
        setPurchasedEmployees(new Set(rows.map((r) => r.employee_id)));
      } catch (err) {
        // Failed to load purchases
      }
    }
    loadPurchased();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Fetch employees from database
  const { data: dbEmployees = [], isLoading: isLoadingEmployees } = useQuery<
    AIEmployee[]
  >({
    queryKey: ['public-marketplace-employees', selectedCategory, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('ai_employees')
        .select('*')
        .eq('status', 'active');

      // Apply category filter
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      // Apply search filter
      if (searchQuery) {
        const searchTerm = searchQuery.toLowerCase();
        query = query.or(
          `name.ilike.%${searchTerm}%,role.ilike.%${searchTerm}%,department.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        toast.error('Failed to load employees');
        return [];
      }

      // Transform database employees to marketplace format
      return (data || []).map((dbEmp): AIEmployee => {
        const cost = dbEmp.cost || { monthly: 0, yearly: 0 };
        const monthlyPrice =
          typeof cost === 'object' && cost.monthly ? cost.monthly : 0;
        const yearlyPrice =
          typeof cost === 'object' && cost.yearly ? cost.yearly : 0;

        return {
          id: dbEmp.employee_id || dbEmp.id,
          name: dbEmp.name,
          role: dbEmp.role,
          category: dbEmp.category || 'general',
          description:
            dbEmp.system_prompt?.slice(0, 150) || `Expert ${dbEmp.role}`,
          provider: 'claude' as const,
          price: monthlyPrice,
          originalPrice: monthlyPrice * 2,
          yearlyPrice: yearlyPrice,
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${dbEmp.employee_id}&backgroundColor=EEF2FF%2CE0F2FE%2CF0F9FF&radius=50&size=128`,
          skills: Array.isArray(dbEmp.capabilities) ? dbEmp.capabilities : [],
          specialty: dbEmp.department || dbEmp.category || 'General',
          fitLevel: 'excellent' as const,
          popular: dbEmp.level === 'senior',
        };
      });
    },
    staleTime: 5 * 60 * 1000,
  });

  const filteredEmployees = dbEmployees;

  const handlePurchase = async (employee: AIEmployee) => {
    try {
      if (!user?.id) {
        toast.error('Please sign in to hire an AI employee');
        navigate('/auth/login');
        return;
      }

      const already = await isEmployeePurchased(user.id, employee.id);
      if (already) {
        toast.info('Already hired');
        return;
      }

      // Free instant hiring - no payment required
      toast.loading('Hiring employee...', { id: 'hire' });

      await purchaseEmployee(user.id, employee);
      const rows = await listPurchasedEmployees(user.id);
      setPurchasedEmployees(new Set(rows.map((r) => r.employee_id)));

      toast.success(`${employee.name} hired successfully! 🎉`, {
        id: 'hire',
        description: `Start building with your new ${employee.role}.`,
        action: {
          label: 'Go to Workforce',
          onClick: () => navigate('/workforce'),
        },
      });
    } catch (err) {
      // Check if it's a database setup error
      if (
        err instanceof Error &&
        err.message.includes('DATABASE_SETUP_REQUIRED')
      ) {
        toast.error('Database Setup Required', {
          description:
            'Please run the database setup script in Supabase to enable free hiring.',
          action: {
            label: 'View Setup Guide',
            onClick: () => {
              // Open the setup guide in a new tab
              window.open('/setup-guide', '_blank');
            },
          },
        });
      } else {
        toast.error('Failed to hire employee', {
          description:
            'Please try again or contact support if the issue persists.',
        });
      }

      toast.dismiss('hire');
    }
  };

  const isPurchased = (employeeId: string) =>
    purchasedEmployees.has(employeeId);

  const getProviderGradient = (provider: string) => {
    const gradients = {
      chatgpt: 'from-green-500 to-emerald-500',
      claude: 'from-purple-500 to-pink-500',
      gemini: 'from-blue-500 to-cyan-500',
      perplexity: 'from-orange-500 to-red-500',
    };
    return gradients[provider as keyof typeof gradients] || gradients.chatgpt;
  };

  return (
    <div className="min-h-screen p-6 pt-24">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong relative mb-8 overflow-hidden rounded-3xl p-8"
      >
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="gradient-primary flex h-16 w-16 items-center justify-center rounded-2xl">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <div>
                <Badge className="glass mb-2">
                  <Bot className="mr-2 h-3 w-3" />
                  AI Marketplace
                </Badge>
                <h1 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">
                  Hire Your AI Workforce
                </h1>
                <p className="text-xl text-muted-foreground">
                  Specialized AI employees for{' '}
                  <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text font-extrabold text-transparent">
                    FREE
                  </span>{' '}
                  per month • {isLoadingEmployees ? '...' : dbEmployees.length}{' '}
                  available
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Countdown Banner */}
              {discountEnd && (
                <div className="glass rounded-xl border border-primary/30 p-3">
                  <CountdownTimer
                    targetDate={discountEnd}
                    showHours={false}
                    showLabel={false}
                  />
                </div>
              )}
              <Button
                onClick={() => navigate('/workforce')}
                size="lg"
                className="btn-glow gradient-primary text-white"
              >
                <Bot className="mr-2 h-5 w-5" />
                My Team ({purchasedEmployees.size})
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="glass-strong mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 md:flex-row">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-muted-foreground" />
                  <Input
                    placeholder="Search by role, skills, or specialty..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="glass h-12 pl-10 text-base"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transform"
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Toggle */}
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowFilters(!showFilters)}
                className="glass"
              >
                <Filter className="mr-2 h-5 w-5" />
                Filters
                {selectedCategory !== 'all' && (
                  <Badge variant="secondary" className="ml-2">
                    1
                  </Badge>
                )}
              </Button>
            </div>

            {/* Category Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-6 border-t border-border pt-6">
                    <h3 className="mb-3 text-sm font-semibold">Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <Button
                          key={category.id}
                          variant={
                            selectedCategory === category.id
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          onClick={() => setSelectedCategory(category.id)}
                          className={cn(
                            'whitespace-nowrap',
                            selectedCategory === category.id &&
                              'gradient-primary text-white'
                          )}
                        >
                          {category.label}
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {category.count}
                          </Badge>
                        </Button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Results Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">
            {filteredEmployees.length}{' '}
            {filteredEmployees.length === 1 ? 'Employee' : 'Employees'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {selectedCategory !== 'all' &&
              `In ${categories.find((c) => c.id === selectedCategory)?.label}`}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>

        {(searchQuery || selectedCategory !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
          >
            <X className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      {/* Employees Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filteredEmployees.map((employee, index) => (
            <motion.div
              key={employee.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card
                className={cn(
                  'glass-strong card-hover group h-full',
                  isPurchased(employee.id) && 'card-premium'
                )}
              >
                <CardContent className="flex h-full flex-col p-6">
                  {/* Header */}
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex min-w-0 flex-1 items-center space-x-3">
                      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl ring-2 ring-border transition-transform group-hover:scale-110">
                        <img
                          src={employee.avatar}
                          alt={employee.role}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <h3 className="truncate text-lg font-semibold">
                            {employee.role}
                          </h3>
                          {employee.popular && (
                            <Badge
                              variant="secondary"
                              className="border-orange-200 bg-orange-100 text-xs text-orange-800"
                            >
                              Popular
                            </Badge>
                          )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {employee.specialty}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={cn(
                        'flex-shrink-0 border-0 bg-gradient-to-r text-white',
                        getProviderGradient(employee.provider)
                      )}
                    >
                      {providerInfo[employee.provider].name}
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="mb-4 line-clamp-2 flex-grow text-sm text-muted-foreground">
                    {employee.description}
                  </p>

                  {/* Skills */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {employee.skills.slice(0, 4).map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="text-xs"
                        >
                          {skill}
                        </Badge>
                      ))}
                      {employee.skills.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{employee.skills.length - 4}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Fit Level */}
                  <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
                    {employee.fitLevel === 'excellent' ? (
                      <>
                        <Zap className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium text-primary">
                          Excellent Fit
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="h-4 w-4 text-accent" />
                        <span className="text-xs font-medium text-accent">
                          Great Fit
                        </span>
                      </>
                    )}
                    <Star className="ml-auto h-4 w-4 fill-yellow-500 text-yellow-500" />
                  </div>

                  {/* Pricing and Hire Button */}
                  <div className="space-y-3">
                    {/* Two-column layout for desktop, stacked for mobile */}
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
                      {/* Left column: Price */}
                      <div className="flex flex-col items-start sm:items-start">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-2xl font-bold text-transparent">
                          $0
                        </div>
                        <div className="text-sm text-muted-foreground">
                          per month
                        </div>
                      </div>

                      {/* Right column: Offers (right-aligned on desktop) */}
                      <div className="flex flex-col items-end text-right sm:items-end">
                        <div className="mb-1">
                          <Badge className="border-0 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-xs text-white shadow">
                            <Sparkles className="mr-1 h-3 w-3" />
                            Limited time offer
                          </Badge>
                        </div>
                        <div className="text-xs font-semibold text-foreground">
                          Hire now for{' '}
                          <span className="text-green-600">FREE</span>
                        </div>
                      </div>
                    </div>

                    {/* Hire Button */}
                    <Button
                      onClick={() => handlePurchase(employee)}
                      disabled={isPurchased(employee.id)}
                      size="sm"
                      className={cn(
                        'btn-glow w-full',
                        isPurchased(employee.id)
                          ? 'cursor-default bg-success hover:bg-success'
                          : 'gradient-primary text-white'
                      )}
                    >
                      {isPurchased(employee.id) ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Hired
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-4 w-4" />
                          Hire Now - Free!
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredEmployees.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="glass-strong">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted/20">
                <Search className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-2xl font-semibold">
                No Employees Found
              </h3>
              <p className="mb-6 max-w-md text-center text-muted-foreground">
                We couldn't find any AI employees matching your criteria. Try
                adjusting your search or filters.
              </p>
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="gradient-primary text-white"
              >
                <X className="mr-2 h-4 w-4" />
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* CTA Section */}
      {purchasedEmployees.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12"
        >
          <Card className="card-premium relative overflow-hidden">
            <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl"></div>
            <CardContent className="relative z-10 p-6 text-center sm:p-8 md:p-12">
              <Sparkles className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-4 text-xl font-bold sm:text-2xl md:text-3xl">
                You've Hired {purchasedEmployees.size} AI{' '}
                {purchasedEmployees.size === 1 ? 'Employee' : 'Employees'}!
              </h3>
              <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
                Your AI workforce is ready. Start delegating tasks and watch
                them execute autonomously.
              </p>
              <div className="flex justify-center gap-4">
                <Button
                  size="lg"
                  onClick={() => navigate('/chat')}
                  className="btn-glow gradient-primary px-8 text-lg text-white"
                >
                  Start Working with Your Team
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/workforce')}
                  className="px-8 text-lg"
                >
                  Manage Workforce
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default MarketplacePublicPage;
