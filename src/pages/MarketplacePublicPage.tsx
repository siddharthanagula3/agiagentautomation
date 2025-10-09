/**
 * AI Employee Marketplace - Modern Professional Design
 * Browse and hire AI workforce with glassmorphism UI
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  ShoppingCart,
  CheckCircle,
  Bot,
  Sparkles,
  Star,
  Zap,
  TrendingUp,
  Filter,
  X,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AI_EMPLOYEES, categories, providerInfo, getEmployeesByCategory, type AIEmployee } from '@/data/ai-employees';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/unified-auth-store';
import { isEmployeePurchased, listPurchasedEmployees, purchaseEmployee } from '@/services/supabase-employees';
import { motion, AnimatePresence } from 'framer-motion';
import { createCheckoutSession, isStripeConfigured } from '@/services/stripe-service';

export const MarketplacePublicPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [purchasedEmployees, setPurchasedEmployees] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadPurchased() {
      try {
        if (!user?.id) {
          setPurchasedEmployees(new Set());
          return;
        }
        const rows = await listPurchasedEmployees(user.id);
        if (!isMounted) return;
        setPurchasedEmployees(new Set(rows.map(r => r.employee_id)));
      } catch (err) {
        console.error('Failed to load purchases', err);
      }
    }
    loadPurchased();
    return () => { isMounted = false; };
  }, [user?.id]);

  const filteredEmployees = getEmployeesByCategory(selectedCategory).filter(emp =>
    emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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

      // Check if Stripe is configured
      if (isStripeConfigured()) {
        // Use Stripe for payment
        toast.loading('Redirecting to checkout...', { id: 'checkout' });
        
      await createCheckoutSession({
        employeeId: employee.id,
        employeeRole: employee.role,
        price: employee.price,
        userId: user.id,
        userEmail: user.email || '',
        provider: employee.provider, // Pass the actual LLM provider
      });
        
        // The user will be redirected to Stripe Checkout
        // After successful payment, webhook will create the purchased_employee record
      } else {
        // Fallback: Direct purchase without payment (for development/testing)
        console.warn('[Marketplace] Stripe not configured, using direct purchase');
        await purchaseEmployee(user.id, employee);
        const rows = await listPurchasedEmployees(user.id);
        setPurchasedEmployees(new Set(rows.map(r => r.employee_id)));
        toast.success(`${employee.role} hired!`, {
          description: `Start working with your ${employee.role} in the chat.`,
          action: {
            label: 'Go to Chat',
            onClick: () => navigate('/chat')
          }
        });
      }
    } catch (err) {
      console.error('Purchase failed', err);
      toast.error('Failed to hire employee');
      toast.dismiss('checkout');
    }
  };

  const isPurchased = (employeeId: string) => purchasedEmployees.has(employeeId);

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
    <div className="min-h-screen pt-24 p-6">

      {/* Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-3xl p-8 mb-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <div>
                <Badge className="mb-2 glass">
                  <Bot className="mr-2 h-3 w-3" />
                  AI Marketplace
                </Badge>
                <h1 className="text-4xl font-bold mb-2">Hire Your AI Workforce</h1>
                <p className="text-xl text-muted-foreground">
                  Specialized AI employees for $10/month • {AI_EMPLOYEES.length} available
                </p>
              </div>
            </div>

            <Button 
              onClick={() => navigate('/workforce')}
              size="lg"
              className="btn-glow gradient-primary text-white"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              My Team ({purchasedEmployees.size})
            </Button>
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
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by role, skills, or specialty..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 glass text-base"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
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
                <Filter className="h-5 w-5 mr-2" />
                Filters
                {selectedCategory !== 'all' && (
                  <Badge variant="secondary" className="ml-2">1</Badge>
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
                  <div className="pt-6 mt-6 border-t border-border">
                    <h3 className="text-sm font-semibold mb-3">Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <Button
                          key={category.id}
                          variant={selectedCategory === category.id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedCategory(category.id)}
                          className={cn(
                            "whitespace-nowrap",
                            selectedCategory === category.id && "gradient-primary text-white"
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">
            {filteredEmployees.length} {filteredEmployees.length === 1 ? 'Employee' : 'Employees'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {selectedCategory !== 'all' && `In ${categories.find(c => c.id === selectedCategory)?.label}`}
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
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
                  "glass-strong card-hover group h-full",
                  isPurchased(employee.id) && "card-premium"
                )}
              >
                <CardContent className="p-6 flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-14 h-14 rounded-xl overflow-hidden ring-2 ring-border flex-shrink-0 group-hover:scale-110 transition-transform">
                        <img
                          src={employee.avatar}
                          alt={employee.role}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg truncate">
                            {employee.role}
                          </h3>
                          {employee.popular && (
                            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                              Popular
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {employee.specialty}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      className={cn(
                        "flex-shrink-0 bg-gradient-to-r text-white border-0",
                        getProviderGradient(employee.provider)
                      )}
                    >
                      {providerInfo[employee.provider].name}
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-grow">
                    {employee.description}
                  </p>

                  {/* Skills */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {employee.skills.slice(0, 4).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
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
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
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
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 ml-auto" />
                  </div>

                  {/* Price and Purchase */}
                  <div className="space-y-3">
                    {/* Pricing Display */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold">${employee.price}</span>
                          <span className="text-sm text-muted-foreground">/month</span>
                          {employee.originalPrice && employee.originalPrice > employee.price && (
                            <span className="text-sm text-muted-foreground line-through">
                              ${employee.originalPrice}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            or ${employee.price}/mo billed yearly
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            50% OFF
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Yearly: ${employee.price * 12} (save ${(employee.originalPrice - employee.price) * 12})
                        </div>
                      </div>
                    </div>

                    {/* Purchase Button */}
                    <Button
                      onClick={() => handlePurchase(employee)}
                      disabled={isPurchased(employee.id)}
                      size="sm"
                      className={cn(
                        "btn-glow w-full",
                        isPurchased(employee.id) 
                          ? "bg-success hover:bg-success cursor-default" 
                          : "gradient-primary text-white"
                      )}
                    >
                      {isPurchased(employee.id) ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Hired
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Hire Now
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
              <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mb-6">
                <Search className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">No Employees Found</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                We couldn't find any AI employees matching your criteria. Try adjusting your search or filters.
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
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
            <CardContent className="p-12 text-center relative z-10">
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-3xl font-bold mb-4">
                You've Hired {purchasedEmployees.size} AI {purchasedEmployees.size === 1 ? 'Employee' : 'Employees'}!
              </h3>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Your AI workforce is ready. Start delegating tasks and watch them execute autonomously.
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={() => navigate('/chat')}
                  className="btn-glow gradient-primary text-white text-lg px-8"
                >
                  Start Working with Your Team
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/workforce')}
                  className="text-lg px-8"
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
