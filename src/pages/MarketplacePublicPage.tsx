/**
 * AI Employee Marketplace
 * Browse and purchase AI employees for $1 each
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
  DollarSign,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AI_EMPLOYEES, categories, providerInfo, getEmployeesByCategory, type AIEmployee } from '@/data/ai-employees';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/unified-auth-store';
import { isEmployeePurchased, listPurchasedEmployees, purchaseEmployee } from '@/services/supabase-employees';

export const MarketplacePublicPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [purchasedEmployees, setPurchasedEmployees] = useState<Set<string>>(new Set());

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

  // Filter employees
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
      await purchaseEmployee(user.id, employee);
      // refresh list
      const rows = await listPurchasedEmployees(user.id);
      setPurchasedEmployees(new Set(rows.map(r => r.employee_id)));
      toast.success(`${employee.role} hired!`, {
        description: `You can now chat with your ${employee.role} in the AI Chat section.`,
      });
    } catch (err) {
      console.error('Purchase failed', err);
      toast.error('Failed to hire employee');
    }
  };

  const isPurchased = (employeeId: string) => purchasedEmployees.has(employeeId);

  const getProviderColor = (provider: string) => {
    const colors = {
      chatgpt: 'bg-green-500/20 text-green-400 border-green-500/30',
      claude: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      gemini: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      perplexity: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    };
    return colors[provider as keyof typeof colors] || colors.chatgpt;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bot className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">AI Employee Marketplace</h1>
                <p className="text-sm text-muted-foreground">Hire specialized AI employees for $1 each</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="border-border">
                <Sparkles className="h-3 w-3 mr-1" />
                {AI_EMPLOYEES.length} Employees Available
              </Badge>
              <Button 
                onClick={() => navigate('/dashboard/chat')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                My AI Team ({purchasedEmployees.size})
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <Card className="mb-8 border-border bg-card">
        <CardContent className="p-6">
        <div className="space-y-4">
        {/* Search */}
        <div className="w-full">
        <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
        placeholder="Search by role or skills..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10 bg-background border-border"
        />
        </div>
        </div>
        
        {/* Category Filter - New row */}
        <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
        <Button
        key={category.id}
        variant={selectedCategory === category.id ? 'default' : 'outline'}
        size="sm"
        onClick={() => setSelectedCategory(category.id)}
        className="whitespace-nowrap flex-shrink-0"
        >
        {category.label}
        <Badge variant="secondary" className="ml-2 text-xs">
        {category.count}
        </Badge>
        </Button>
        ))}
        </div>
        </div>
        </CardContent>
        </Card>

        {/* Employees Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => (
            <Card 
              key={employee.id} 
              className={cn(
                "hover:shadow-lg transition-all duration-300 border-border bg-card",
                isPurchased(employee.id) && "border-green-500/50 bg-green-500/5"
              )}
            >
              <CardContent className="p-6">
                {/* Employee Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3 flex-1">
                    <img
                      src={employee.avatar}
                      alt={employee.role}
                      className="w-12 h-12 rounded-full ring-2 ring-border"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-card-foreground text-lg">{employee.role}</h3>
                      <p className="text-xs text-muted-foreground">{employee.specialty}</p>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs flex-shrink-0", getProviderColor(employee.provider))}
                  >
                    {providerInfo[employee.provider].name}
                  </Badge>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {employee.description}
                </p>

                {/* Skills */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {employee.skills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {employee.skills.length > 3 && (
                      <Badge variant="outline" className="text-xs border-border">
                        +{employee.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Fit Level */}
                <div className="flex items-center space-x-2 mb-4">
                  <Star className={cn(
                    "h-4 w-4",
                    employee.fitLevel === 'excellent' ? "text-yellow-500 fill-yellow-500" : "text-blue-500 fill-blue-500"
                  )} />
                  <span className="text-xs text-muted-foreground capitalize">
                    {employee.fitLevel} fit for AI tasks
                  </span>
                </div>

                {/* Price and Purchase */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    <span className="text-2xl font-bold text-foreground">{employee.price}</span>
                    <span className="text-sm text-muted-foreground">one-time</span>
                  </div>

                  <Button
                    onClick={() => handlePurchase(employee)}
                    disabled={isPurchased(employee.id)}
                    size="sm"
                    className={cn(
                      isPurchased(employee.id) 
                        ? "bg-green-600 hover:bg-green-600 cursor-not-allowed" 
                        : "bg-primary hover:bg-primary/90"
                    )}
                  >
                    {isPurchased(employee.id) ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Hired
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Hire Now
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredEmployees.length === 0 && (
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Bot className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No employees found
              </h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Try adjusting your search or filter criteria
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="border-border"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MarketplacePublicPage;
