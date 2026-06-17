import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@shared/ui/button';
import { ThemeToggle } from '@shared/ui/theme-toggle';
import { useAuthStore } from '@shared/stores/authentication-store';
import {
  Menu,
  X,
  ChevronDown,
  Bot,
  Users,
  MessageSquare,
  Workflow,
  Plug,
  LayoutDashboard,
  Briefcase,
  Building2,
  TrendingUp,
  Lightbulb,
  BookOpen,
  HelpCircle,
  Newspaper,
  Shield,
  FileCode,
} from 'lucide-react';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Product (matches footer Product)
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

  // Company (matches footer Company)
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
      icon: Shield,
      description: 'Security practices and posture',
    },
  ];

  const handleDropdownToggle = (menu: string) => {
    setActiveDropdown(activeDropdown === menu ? null : menu);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setActiveDropdown(null);
    setMobileMenuOpen(false);
  };

  return (
    <header className="border-border/40 bg-background/80 fixed top-0 right-0 left-0 z-50 border-b backdrop-blur-xl">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="group flex items-center gap-2">
            <motion.div
              className="text-2xl"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              🤖
            </motion.div>
            <span className="from-primary via-accent to-secondary bg-gradient-to-r bg-clip-text text-xl font-bold text-transparent">
              AGI Agent Automation
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 lg:flex">
            {/* Product */}
            <DropdownMenu
              label="Product"
              items={productMenu}
              isActive={activeDropdown === 'product'}
              onToggle={() => handleDropdownToggle('product')}
              onNavigate={handleNavigation}
            />

            {/* Company */}
            <DropdownMenu
              label="Company"
              items={companyMenu}
              isActive={activeDropdown === 'company'}
              onToggle={() => handleDropdownToggle('company')}
              onNavigate={handleNavigation}
            />

            {/* Resources */}
            <DropdownMenu
              label="Resources"
              items={resourcesMenu}
              isActive={activeDropdown === 'resources'}
              onToggle={() => handleDropdownToggle('resources')}
              onNavigate={handleNavigation}
            />

            {/* Pricing Quick Link */}
            <button
              onClick={() => handleNavigation('/pricing')}
              className="text-foreground/80 hover:text-foreground text-sm font-medium transition-colors"
            >
              Pricing
            </button>
          </div>

          {/* CTA Buttons */}
          <div className="hidden items-center gap-3 lg:flex">
            <ThemeToggle />
            {user ? (
              <Button
                onClick={() => navigate('/dashboard')}
                className="from-primary to-accent bg-gradient-to-r text-sm font-medium hover:opacity-90"
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/contact-sales')}
                  className="text-sm font-medium"
                >
                  Contact Sales
                </Button>
                <Button
                  onClick={() => navigate('/auth/register')}
                  className="from-primary to-accent bg-gradient-to-r text-sm font-medium hover:opacity-90"
                >
                  Get Started Free
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="text-foreground/80 hover:text-foreground flex h-11 w-11 items-center justify-center lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden lg:hidden"
            >
              <div className="space-y-4 px-4 py-4 sm:px-6">
                {/* Mobile Product */}
                <MobileDropdown
                  label="Product"
                  items={productMenu}
                  onNavigate={handleNavigation}
                />

                {/* Mobile Company */}
                <MobileDropdown
                  label="Company"
                  items={companyMenu}
                  onNavigate={handleNavigation}
                />

                {/* Mobile Resources */}
                <MobileDropdown
                  label="Resources"
                  items={resourcesMenu}
                  onNavigate={handleNavigation}
                />

                <button
                  onClick={() => handleNavigation('/pricing')}
                  className="text-foreground/80 hover:bg-accent/10 hover:text-foreground block w-full rounded-lg px-4 py-2 text-left text-sm font-medium transition-colors"
                >
                  Pricing
                </button>

                <div className="flex flex-col gap-2 px-4 pt-2">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-foreground/80 text-sm font-medium">
                      Theme
                    </span>
                    <ThemeToggle />
                  </div>
                  {user ? (
                    <Button
                      onClick={() => handleNavigation('/dashboard')}
                      className="from-primary to-accent w-full bg-gradient-to-r"
                    >
                      Go to Dashboard
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleNavigation('/contact-sales')}
                        className="w-full"
                      >
                        Contact Sales
                      </Button>
                      <Button
                        onClick={() => handleNavigation('/auth/register')}
                        className="from-primary to-accent w-full bg-gradient-to-r"
                      >
                        Get Started Free
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};

interface MenuItem {
  label: string;
  path: string;
  icon: React.ElementType;
  description: string;
}

interface DropdownMenuProps {
  label: string;
  items: MenuItem[];
  isActive: boolean;
  onToggle: () => void;
  onNavigate: (path: string) => void;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
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
        className="text-foreground/80 hover:text-foreground flex items-center gap-1 text-sm font-medium transition-colors"
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
            className="border-border/40 bg-background/95 absolute top-full left-0 mt-2 w-full max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border shadow-2xl backdrop-blur-xl sm:w-72 sm:max-w-none"
          >
            <div className="p-2">
              {items.map((item, idx) => (
                <motion.button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className="group hover:bg-accent/10 flex w-full items-start gap-3 rounded-lg p-3 transition-colors"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <div className="from-primary/20 to-accent/20 group-hover:from-primary/30 group-hover:to-accent/30 mt-0.5 rounded-lg bg-gradient-to-br p-2 transition-colors">
                    <item.icon size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-foreground group-hover:text-primary text-sm font-medium transition-colors">
                      {item.label}
                    </div>
                    <div className="text-muted-foreground mt-0.5 text-xs">
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
        className="text-foreground/80 hover:bg-accent/10 hover:text-foreground flex w-full items-center justify-between rounded-lg px-4 py-2 text-sm font-medium transition-colors"
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
              {items.map((item) => (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className="text-foreground/70 hover:bg-accent/10 hover:text-foreground flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors"
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

export default Header;
