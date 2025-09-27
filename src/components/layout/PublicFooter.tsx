import React from 'react';
import { Link } from 'react-router-dom';
import { Bot } from 'lucide-react';

const PublicFooter: React.FC = () => {
  return (
    <footer className="bg-card text-card-foreground py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-purple-600 rounded-lg flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">AGI Agent Automation</span>
            </div>
            <p className="text-muted-foreground">
              Scale your business with AI employees that work 24/7.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground">Features</a></li>
              <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
              <li><Link to="/chat" className="hover:text-foreground">Demo</Link></li>
              <li><Link to="/auth/register" className="hover:text-foreground">Sign Up</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground">About</Link></li>
              <li><Link to="/careers" className="hover:text-foreground">Careers</Link></li>
              <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
              <li><Link to="/blog" className="hover:text-foreground">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/legal" className="hover:text-foreground">Legal</Link></li>
              <li><Link to="/legal" className="hover:text-foreground">Privacy</Link></li>
              <li><Link to="/legal" className="hover:text-foreground">Terms</Link></li>
              <li><Link to="/contact" className="hover:text-foreground">Help</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
          <p>&copy; 2024 AGI Agent Automation. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export { PublicFooter };