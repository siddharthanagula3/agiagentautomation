import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { MapPin, Clock, Users, ArrowRight } from 'lucide-react';

const CareersPage: React.FC = () => {
  const openPositions = [
    {
      title: 'Senior AI Engineer',
      location: 'San Francisco, CA',
      type: 'Full-time',
      department: 'Engineering',
      description: 'Lead the development of our AI workforce platform and work with cutting-edge machine learning technologies.'
    },
    {
      title: 'Product Manager',
      location: 'Remote',
      type: 'Full-time', 
      department: 'Product',
      description: 'Drive product strategy and work closely with engineering and design teams to build amazing user experiences.'
    },
    {
      title: 'Customer Success Manager',
      location: 'New York, NY',
      type: 'Full-time',
      department: 'Customer Success',
      description: 'Help our customers succeed with AI workforce automation and build long-term relationships.'
    }
  ];

  const benefits = [
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Great Team',
      description: 'Work with talented, passionate people who are building the future of work.'
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: 'Flexible Hours',
      description: 'Work when you\'re most productive with flexible schedules and remote options.'
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      title: 'Remote Friendly',
      description: 'Work from anywhere with our fully remote-friendly culture and policies.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Join Our Team
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Help us build the future of AI workforce automation. We're looking for talented, 
            passionate people to join our mission.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {benefits.map((benefit, index) => (
            <Card key={index} className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4 text-blue-600">
                {benefit.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
              <p className="text-gray-600">{benefit.description}</p>
            </Card>
          ))}
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Open Positions</h2>
          <div className="space-y-6">
            {openPositions.map((position, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{position.title}</h3>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{position.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{position.type}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{position.department}</Badge>
                    <Button>
                      Apply Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-gray-600">{position.description}</p>
              </Card>
            ))}
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Don't see a role that fits?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            We're always looking for great people. Send us your resume and we'll keep you in mind for future opportunities.
          </p>
          <Button size="lg">
            Send Resume
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CareersPage;