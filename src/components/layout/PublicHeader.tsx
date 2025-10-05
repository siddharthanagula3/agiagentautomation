import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { ThemeToggle } from '../ui/theme-toggle';
import { Bot, Menu, X, Sparkles, ChevronDown, MessageSquare, Workflow, LayoutDashboard, Briefcase, Building2, Lightbulb, BookOpen, HelpCircle, Newspaper, FileCode, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/unified-auth-store';

const PublicHeader: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Menus aligned with footer
  const productMenu = [
    { label: 'AI Marketplace', path: '/marketplace', icon: Bot, description: 'Browse specialized AI employees' },
    { label: 'AI Chat', path: '/features/ai-chat', icon: MessageSquare, description: 'Intelligent conversations' },
    { label: 'AI Workflows', path: '/features/ai-workflows', icon: Workflow, description: 'Automated processes' },
  ];
  const companyMenu = [
    { label: 'About Us', path: '/about', icon: Building2, description: 'Learn about our mission' },
    { label: 'Careers', path: '/careers', icon: Briefcase, description: 'Join our team' },
    { label: 'Blog', path: '/blog', icon: Newspaper, description: 'Latest insights & updates' },
    { label: 'Contact', path: '/contact-sales', icon: Lightbulb, description: 'Get in touch with us' },
  ];
  const resourcesMenu = [
    { label: 'Documentation', path: '/documentation', icon: BookOpen, description: 'Product guides and docs' },
    { label: 'API Reference', path: '/api-reference', icon: FileCode, description: 'Endpoints and examples' },
    { label: 'Help Center', path: '/help', icon: HelpCircle, description: 'Get support' },
    { label: 'Security', path: '/security', icon: LayoutDashboard, description: 'Security practices and posture' },
  ];

  const handleDropdownToggle = (menu: string) => setActiveDropdown(activeDropdown === menu ? null : menu);
  const handleNavigate = (path: string) => {
    navigate(path);
    setActiveDropdown(null);
    setIsMenuOpen(false);
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "glass-strong border-b border-border shadow-lg" : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold">AI Workforce</span>
              <span className="text-xs text-muted-foreground">Powered by AGI</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <HeaderDropdown label="Product" items={productMenu} isActive={activeDropdown === 'product'} onToggle={() => handleDropdownToggle('product')} onNavigate={handleNavigate} />
            <HeaderDropdown label="Company" items={companyMenu} isActive={activeDropdown === 'company'} onToggle={() => handleDropdownToggle('company')} onNavigate={handleNavigate} />
            <HeaderDropdown label="Resources" items={resourcesMenu} isActive={activeDropdown === 'resources'} onToggle={() => handleDropdownToggle('resources')} onNavigate={handleNavigate} />
            <button onClick={() => handleNavigate('/pricing')} className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">Pricing</button>
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center space-x-3">
            <ThemeToggle />
            {user ? (
              <Button 
                onClick={() => handleNavigate('/dashboard')}
                className="btn-glow gradient-primary text-white text-sm"
              >
                <User className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  asChild
                  className="text-sm"
                >
                  <Link to="/auth/login">Sign In</Link>
                </Button>
                <Button 
                  asChild
                  className="btn-glow gradient-primary text-white text-sm"
                >
                  <Link to="/auth/register">
                    Get Started Free
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden"
            >
              <nav className="py-6 space-y-2 border-t border-border">
                <MobileDropdown label="Product" items={productMenu} onNavigate={handleNavigate} />
                <MobileDropdown label="Company" items={companyMenu} onNavigate={handleNavigate} />
                <MobileDropdown label="Resources" items={resourcesMenu} onNavigate={handleNavigate} />
                <div className="pt-4 space-y-2">
                  {user ? (
                    <Button 
                      onClick={() => {
                        handleNavigate('/dashboard');
                        setIsMenuOpen(false);
                      }}
                      className="w-full gradient-primary text-white"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  ) : (
                    <>
                      <Link to="/auth/login" onClick={() => setIsMenuOpen(false)} className="block">
                        <Button variant="ghost" className="w-full justify-start">
                          Sign In
                        </Button>
                      </Link>
                      <Link to="/auth/register" onClick={() => setIsMenuOpen(false)} className="block">
                        <Button className="w-full gradient-primary text-white">
                          Get Started Free
                        </Button>
                      </Link>
                    </>
                  )}
                  <Button variant="ghost" className="w-full justify-start" onClick={() => handleNavigate('/pricing')}>Pricing</Button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};

export { PublicHeader };
 
// Reusable dropdown components
interface MenuItem { label: string; path: string; icon: React.ElementType; description: string; }
interface HeaderDropdownProps { label: string; items: MenuItem[]; isActive: boolean; onToggle: () => void; onNavigate: (path: string) => void; }
const HeaderDropdown: React.FC<HeaderDropdownProps> = ({ label, items, isActive, onToggle, onNavigate }) => {
  return (
    <div className="relative">
      <button onClick={onToggle} className="flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
        {label}
        <motion.div animate={{ rotate: isActive ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 w-72 backdrop-blur-xl bg-background/95 border border-border/40 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="p-2">
              {items.map((item, idx) => (
                <motion.button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-accent/10 transition-colors group"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <div className="mt-0.5 p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 group-hover:from-primary/30 group-hover:to-accent/30 transition-colors">
                    <item.icon size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{item.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface MobileDropdownProps { label: string; items: MenuItem[]; onNavigate: (path: string) => void; }
const MobileDropdown: React.FC<MobileDropdownProps> = ({ label, items, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors">
        {label}
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="pl-4 mt-1 space-y-1">
              {items.map((item) => (
                <button key={item.path} onClick={() => onNavigate(item.path)} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground/70 hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors">
                  <item.icon size={16} className="text-primary" />
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
