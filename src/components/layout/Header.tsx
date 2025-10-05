import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuthStore } from '@/stores/unified-auth-store';
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
  FileCode
} from 'lucide-react';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const productMenu = [
    { label: 'AI Marketplace', path: '/marketplace', icon: Bot, description: 'Browse specialized AI employees' },
    { label: 'AI Chat', path: '/features/ai-chat', icon: MessageSquare, description: 'Intelligent conversations' },
    { label: 'AI Workflows', path: '/features/ai-workflows', icon: Workflow, description: 'Automated processes' },
    { label: 'Pricing', path: '/pricing', icon: LayoutDashboard, description: 'Simple, transparent pricing' },
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
    { label: 'Security', path: '/security', icon: Shield, description: 'Security practices and posture' },
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
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/40">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div
              className="text-2xl"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              🤖
            </motion.div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary">
              AGI Workforce
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {/* Product Dropdown */}
            <DropdownMenu
              label="Product"
              items={productMenu}
              isActive={activeDropdown === 'product'}
              onToggle={() => handleDropdownToggle('product')}
              onNavigate={handleNavigation}
            />

            {/* Company Dropdown */}
            <DropdownMenu
              label="Company"
              items={companyMenu}
              isActive={activeDropdown === 'company'}
              onToggle={() => handleDropdownToggle('company')}
              onNavigate={handleNavigation}
            />

            {/* Resources Dropdown */}
            <DropdownMenu
              label="Resources"
              items={resourcesMenu}
              isActive={activeDropdown === 'resources'}
              onToggle={() => handleDropdownToggle('resources')}
              onNavigate={handleNavigation}
            />

            {/* Pricing surfaced inside Product menu; keep optional quick link if desired */}
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <Button
                onClick={() => navigate('/dashboard')}
                className="text-sm font-medium bg-gradient-to-r from-primary to-accent hover:opacity-90"
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
                  onClick={() => navigate('/register')}
                  className="text-sm font-medium bg-gradient-to-r from-primary to-accent hover:opacity-90"
                >
                  Get Started Free
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-foreground/80 hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden overflow-hidden"
            >
              <div className="py-4 space-y-4">
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
                  className="block w-full text-left px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors"
                >
                  Pricing
                </button>

                <div className="flex flex-col gap-2 px-4 pt-2">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-foreground/80">Theme</span>
                    <ThemeToggle />
                  </div>
                  {user ? (
                    <Button
                      onClick={() => handleNavigation('/dashboard')}
                      className="w-full bg-gradient-to-r from-primary to-accent"
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
                        onClick={() => handleNavigation('/register')}
                        className="w-full bg-gradient-to-r from-primary to-accent"
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

const DropdownMenu: React.FC<DropdownMenuProps> = ({ label, items, isActive, onToggle, onNavigate }) => {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
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
                    <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {item.label}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
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

const MobileDropdown: React.FC<MobileDropdownProps> = ({ label, items, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors"
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
            <div className="pl-4 mt-1 space-y-1">
              {items.map((item) => (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground/70 hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors"
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
