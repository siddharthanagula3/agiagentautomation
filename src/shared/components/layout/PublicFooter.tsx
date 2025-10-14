import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bot,
  Sparkles,
  Mail,
  MessageSquare,
  Github,
  Twitter,
  Linkedin,
} from 'lucide-react';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { motion } from 'framer-motion';

const PublicFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: 'AI Marketplace', href: '/marketplace' },
      { label: 'AI Chat', href: '/features/ai-chat' },
      { label: 'AI Workflows', href: '/features/ai-workflows' },
      { label: 'Pricing', href: '/pricing' },
    ],
    company: [
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Blog', href: '/blog' },
      { label: 'Contact', href: '/contact-sales' },
    ],
    resources: [
      { label: 'Documentation', href: '/documentation' },
      { label: 'API Reference', href: '/api-reference' },
      { label: 'Help Center', href: '/help' },
      { label: 'Security', href: '/security' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms of Service', href: '/terms-of-service' },
      { label: 'Cookie Policy', href: '/cookie-policy' },
      { label: 'Security', href: '/security' },
    ],
  };

  const socialLinks = [
    { icon: <Twitter className="h-5 w-5" />, href: '#', label: 'Twitter' },
    { icon: <Linkedin className="h-5 w-5" />, href: '#', label: 'LinkedIn' },
    { icon: <Github className="h-5 w-5" />, href: '#', label: 'GitHub' },
  ];

  return (
    <footer className="relative border-t border-border bg-card">
      {/* Gradient Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-primary/5"></div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Top Section */}
        <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="group mb-6 flex items-center space-x-3">
              <div className="gradient-primary flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold">AI Workforce</span>
                <span className="text-xs text-muted-foreground">
                  Powered by AGI
                </span>
              </div>
            </Link>
            <p className="mb-6 leading-relaxed text-muted-foreground">
              Build your billion-dollar company with AI that thinks, plans, and
              executes. From natural language to complete results.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map(social => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="glass group flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-primary/10"
                >
                  <span className="text-muted-foreground transition-colors group-hover:text-primary">
                    {social.icon}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">
                {category}
              </h3>
              <ul className="space-y-3">
                {links.map(link => (
                  <li key={link.label}>
                    {link.href.startsWith('#') ? (
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-strong mb-12 rounded-2xl p-8"
        >
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex-1">
              <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold">
                <Mail className="h-5 w-5 text-primary" />
                Stay Updated
              </h3>
              <p className="text-sm text-muted-foreground">
                Get the latest updates on AI workforce automation and platform
                features.
              </p>
            </div>
            <div className="flex w-full gap-2 md:w-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="glass md:w-64"
              />
              <Button className="gradient-primary whitespace-nowrap text-white">
                Subscribe
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-center text-sm text-muted-foreground md:text-left">
            © {currentYear} AGI Workforce. All rights reserved. Built with AI
            for the AI age.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link
              to="/privacy-policy"
              className="transition-colors hover:text-foreground"
            >
              Privacy
            </Link>
            <Link
              to="/terms-of-service"
              className="transition-colors hover:text-foreground"
            >
              Terms
            </Link>
            <Link
              to="/help"
              className="transition-colors hover:text-foreground"
            >
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export { PublicFooter };
