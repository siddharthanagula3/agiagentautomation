import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@shared/ui/button';
import { ThemeToggle } from '@shared/ui/theme-toggle';
import {
  Bot,
  Menu,
  X,
  Sparkles,
  ChevronDown,
  MessageSquare,
  Workflow,
  LayoutDashboard,
  Briefcase,
  Building2,
  Lightbulb,
  BookOpen,
  HelpCircle,
  Newspaper,
  FileCode,
  User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { useAuthStore } from '@shared/stores/unified-auth-store';

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
    {
      label: 'AI Marketplace',
      path: '/marketplace',
      icon: Bot,
      description: 'Browse specialized AI employees',
    },
    {
      label: 'AI Chat',
      path: '/features/ai-chat',
      icon: MessageSquare,
      description: 'Intelligent conversations',
    },
  ];
  const companyMenu = [
    {
      label: 'About Us',
      path: '/about',
      icon: Building2,
      description: 'Learn about our mission',
    },
    {
      label: 'Careers',
      path: '/careers',
      icon: Briefcase,
      description: 'Join our team',
    },
    {
      label: 'Blog',
      path: '/blog',
      icon: Newspaper,
      description: 'Latest insights & updates',
    },
    {
      label: 'Contact',
      path: '/contact-sales',
      icon: Lightbulb,
      description: 'Get in touch with us',
    },
  ];
  const resourcesMenu = [
    {
      label: 'Documentation',
      path: '/documentation',
      icon: BookOpen,
      description: 'Product guides and docs',
    },
    {
      label: 'API Reference',
      path: '/api-reference',
      icon: FileCode,
      description: 'Endpoints and examples',
    },
    {
      label: 'Help Center',
      path: '/help',
      icon: HelpCircle,
      description: 'Get support',
    },
    {
      label: 'Security',
      path: '/security',
      icon: LayoutDashboard,
      description: 'Security practices and posture',
    },
  ];

  const handleDropdownToggle = (menu: string) =>
    setActiveDropdown(activeDropdown === menu ? null : menu);
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
        'fixed left-0 right-0 top-0 z-50 transition-all duration-300',
        scrolled
          ? 'glass-strong border-b border-border shadow-lg'
          : 'bg-transparent'
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="group flex items-center space-x-3">
            <div className="gradient-primary flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold">AI Workforce</span>
              <span className="text-xs text-muted-foreground">
                Powered by AGI
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            <HeaderDropdown
              label="Product"
              items={productMenu}
              isActive={activeDropdown === 'product'}
              onToggle={() => handleDropdownToggle('product')}
              onNavigate={handleNavigate}
            />
            <HeaderDropdown
              label="Company"
              items={companyMenu}
              isActive={activeDropdown === 'company'}
              onToggle={() => handleDropdownToggle('company')}
              onNavigate={handleNavigate}
            />
            <HeaderDropdown
              label="Resources"
              items={resourcesMenu}
              isActive={activeDropdown === 'resources'}
              onToggle={() => handleDropdownToggle('resources')}
              onNavigate={handleNavigate}
            />
            <button
              onClick={() => handleNavigate('/pricing')}
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              Pricing
            </button>
          </nav>

          {/* Desktop Auth */}
          <div className="hidden items-center space-x-3 md:flex">
            <ThemeToggle />
            {user ? (
              <Button
                onClick={() => handleNavigate('/dashboard')}
                className="btn-glow gradient-primary text-sm text-white"
              >
                <User className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild className="text-sm">
                  <Link to="/auth/login">Sign In</Link>
                </Button>
                <Button
                  asChild
                  className="btn-glow gradient-primary text-sm text-white"
                >
                  <Link to="/auth/register">Get Started Free</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="rounded-lg p-2 transition-colors hover:bg-muted/50 md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden md:hidden"
            >
              <nav className="space-y-2 border-t border-border py-6">
                <MobileDropdown
                  label="Product"
                  items={productMenu}
                  onNavigate={handleNavigate}
                />
                <MobileDropdown
                  label="Company"
                  items={companyMenu}
                  onNavigate={handleNavigate}
                />
                <MobileDropdown
                  label="Resources"
                  items={resourcesMenu}
                  onNavigate={handleNavigate}
                />
                <div className="space-y-2 pt-4">
                  {user ? (
                    <Button
                      onClick={() => {
                        handleNavigate('/dashboard');
                        setIsMenuOpen(false);
                      }}
                      className="gradient-primary w-full text-white"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Button>
                  ) : (
                    <>
                      <Link
                        to="/auth/login"
                        onClick={() => setIsMenuOpen(false)}
                        className="block"
                      >
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                        >
                          Sign In
                        </Button>
                      </Link>
                      <Link
                        to="/auth/register"
                        onClick={() => setIsMenuOpen(false)}
                        className="block"
                      >
                        <Button className="gradient-primary w-full text-white">
                          Get Started Free
                        </Button>
                      </Link>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handleNavigate('/pricing')}
                  >
                    Pricing
                  </Button>
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
interface MenuItem {
  label: string;
  path: string;
  icon: React.ElementType;
  description: string;
}
interface HeaderDropdownProps {
  label: string;
  items: MenuItem[];
  isActive: boolean;
  onToggle: () => void;
  onNavigate: (path: string) => void;
}
const HeaderDropdown: React.FC<HeaderDropdownProps> = ({
  label,
  items,
  isActive,
  onToggle,
  onNavigate,
}) => {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-1 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
      >
        {label}
        <motion.div
          animate={{ rotate: isActive ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
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
            className="absolute left-0 top-full mt-2 w-72 overflow-hidden rounded-xl border border-border/40 bg-background/95 shadow-2xl backdrop-blur-xl"
          >
            <div className="p-2">
              {items.map((item, idx) => (
                <motion.button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className="group flex w-full items-start gap-3 rounded-lg p-3 transition-colors hover:bg-accent/10"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <div className="mt-0.5 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 p-2 transition-colors group-hover:from-primary/30 group-hover:to-accent/30">
                    <item.icon size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                      {item.label}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {item.description}
                    </div>
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

interface MobileDropdownProps {
  label: string;
  items: MenuItem[];
  onNavigate: (path: string) => void;
}
const MobileDropdown: React.FC<MobileDropdownProps> = ({
  label,
  items,
  onNavigate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent/10 hover:text-foreground"
      >
        {label}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={16} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-1 space-y-1 pl-4">
              {items.map(item => (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm text-foreground/70 transition-colors hover:bg-accent/10 hover:text-foreground"
                >
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
