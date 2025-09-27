import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { ThemeToggle } from '../ui/theme-toggle';
import { Bot, Menu, X } from 'lucide-react';
import { useState } from 'react';
const Component: React.FC = () => {

  return (
    <header className="bg-background border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 h-10">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-purple-600 rounded-lg flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">AGI Agent Automation</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="inline-flex items-center h-10 text-muted-foreground hover:text-foreground">Features</a>
            <a href="#pricing" className="inline-flex items-center h-10 text-muted-foreground hover:text-foreground">Pricing</a>
            <a href="#testimonials" className="inline-flex items-center h-10 text-muted-foreground hover:text-foreground">Testimonials</a>
            <Link to="/about" className="inline-flex items-center h-10 text-muted-foreground hover:text-foreground">About</Link>
            <Link to="/contact" className="inline-flex items-center h-10 text-muted-foreground hover:text-foreground">Contact</Link>
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            <Link to="/auth/login" className="inline-flex items-center h-10 text-muted-foreground hover:text-foreground">
              Sign In
            </Link>
            <Button asChild>
              <Link to="/auth/register">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-4">
              <a href="#features" className="text-muted-foreground hover:text-foreground">Features</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground">Pricing</a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground">Testimonials</a>
              <Link to="/about" className="text-muted-foreground hover:text-foreground">About</Link>
              <Link to="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link>
              <div className="pt-4 border-t">
                <div className="mb-4">
                  <ThemeToggle />
                </div>
                <Link to="/auth/login" className="block text-muted-foreground hover:text-foreground mb-2">
                  Sign In
                </Link>
                <Button asChild className="w-full">
                  <Link to="/auth/register">Get Started</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export { PublicHeader };