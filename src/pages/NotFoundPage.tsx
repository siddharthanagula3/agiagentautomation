import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Search, Home, Mail, FileText, ArrowLeft } from 'lucide-react';
import { SEOHead } from '@shared/components/seo/SEOHead';
import { useState } from 'react';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const quickLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/pricing', label: 'Pricing', icon: FileText },
    { to: '/contact-sales', label: 'Contact', icon: Mail },
    { to: '/help', label: 'Help Center', icon: Search },
  ];

  return (
    <>
      <SEOHead
        title="404 - Page Not Found | AGI Agent Automation"
        description="The page you're looking for doesn't exist. Find what you need with our site search or navigate to our popular pages."
        noindex
      />

      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/20 px-4">
        <div className="mx-auto max-w-2xl text-center">
          {/* 404 Animation */}
          <div className="mb-8">
            <h1 className="text-8xl font-extrabold text-primary/20 sm:text-9xl">
              404
            </h1>
            <div className="relative -mt-8">
              <h2 className="text-3xl font-bold sm:text-4xl">
                Page Not Found
              </h2>
            </div>
          </div>

          <p className="mb-8 text-lg text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
            Let's help you find what you need.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="mb-12">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search our site..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Search</Button>
            </div>
          </form>

          {/* Quick Links */}
          <div className="mb-8">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Quick Links
            </h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {quickLinks.map((link) => (
                <Link key={link.to} to={link.to}>
                  <Button
                    variant="outline"
                    className="w-full flex-col gap-2 h-auto py-4"
                  >
                    <link.icon className="h-5 w-5" />
                    <span className="text-sm">{link.label}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </div>

          {/* Go Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>

          {/* Additional Help */}
          <div className="mt-12 rounded-lg border bg-card p-6 text-left">
            <h3 className="mb-2 font-semibold">Need More Help?</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              If you believe this is an error or you need assistance, our support team is here to help.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link to="/help">
                <Button variant="outline" size="sm">
                  Visit Help Center
                </Button>
              </Link>
              <Link to="/contact-sales">
                <Button variant="outline" size="sm">
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;
