import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const LegalPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Legal</h1>
        
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Terms of Service</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                By using AGI Agent Automation, you agree to our Terms of Service. 
                These terms govern your use of our platform and services.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                We are committed to protecting your privacy. Our Privacy Policy explains 
                how we collect, use, and protect your information.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cookie Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                We use cookies to improve your experience on our platform. 
                Learn more about how we use cookies and how to manage them.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;