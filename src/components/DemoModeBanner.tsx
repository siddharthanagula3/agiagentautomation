import React from 'react';
import { AlertTriangle } from 'lucide-react';

const DemoModeBanner: React.FC = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const hasValidCredentials = supabaseUrl && 
                              supabaseKey && 
                              !supabaseUrl.includes('your_supabase_url_here') && 
                              !supabaseKey.includes('your_supabase_anon_key_here');

  if (hasValidCredentials) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <div className="text-sm">
            <span className="font-medium text-yellow-800">Demo Mode Active:</span>
            <span className="text-yellow-700 ml-2">
              No backend configured. Use <strong>demo@example.com / demo123</strong> to explore the app.
            </span>
          </div>
        </div>
        <div className="text-xs text-yellow-600">
          <a 
            href="https://github.com/yourusername/yourrepo#setup" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:text-yellow-800"
          >
            Setup Guide →
          </a>
        </div>
      </div>
    </div>
  );
};

export default DemoModeBanner;
