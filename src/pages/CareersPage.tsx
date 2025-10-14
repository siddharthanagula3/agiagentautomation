import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { Card } from '@shared/ui/card';
import { Particles } from '@shared/ui/particles';
import { SEOHead } from '@shared/components/seo/SEOHead';
import {
  Briefcase,
  MapPin,
  Clock,
  ArrowRight,
  Heart,
  Users,
  Rocket,
  Zap,
  Globe,
  Award,
} from 'lucide-react';

const CareersPage: React.FC = () => {
  const openings = [
    {
      title: 'Senior AI Engineer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      description:
        'Build cutting-edge AI systems that power our AI employee platform',
    },
    {
      title: 'Product Manager - AI',
      department: 'Product',
      location: 'San Francisco, CA',
      type: 'Full-time',
      description: 'Drive product strategy for AI automation features',
    },
    {
      title: 'Full Stack Engineer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      description: 'Build scalable web applications with React and Node.js',
    },
    {
      title: 'AI Research Scientist',
      department: 'Research',
      location: 'New York, NY',
      type: 'Full-time',
      description: 'Research and develop next-generation AI models',
    },
    {
      title: 'DevOps Engineer',
      department: 'Infrastructure',
      location: 'Remote',
      type: 'Full-time',
      description:
        'Scale our cloud infrastructure to support millions of AI employees',
    },
    {
      title: 'UX Designer',
      department: 'Design',
      location: 'Remote',
      type: 'Full-time',
      description: 'Design beautiful and intuitive user experiences',
    },
  ];

  const benefits = [
    {
      icon: Heart,
      title: 'Health & Wellness',
      description: 'Comprehensive health, dental, and vision insurance',
    },
    {
      icon: Globe,
      title: 'Remote-First',
      description: 'Work from anywhere with flexible hours',
    },
    {
      icon: Rocket,
      title: 'Growth',
      description: 'Unlimited learning budget and career development',
    },
    {
      icon: Users,
      title: 'Team Culture',
      description: 'Collaborative environment with world-class talent',
    },
    {
      icon: Award,
      title: 'Equity',
      description: 'Competitive salary with generous stock options',
    },
    {
      icon: Zap,
      title: 'Innovation',
      description: 'Work on cutting-edge AI technology',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Careers | Join Our AI Team | AGI Agent Automation"
        description="Join our mission to democratize AI. We're hiring AI engineers, product managers, and more. Remote-first culture, competitive benefits, and cutting-edge technology."
        keywords={[
          'ai careers',
          'ai engineer jobs',
          'ai automation jobs',
          'remote ai jobs',
          'ai startup careers',
          'machine learning jobs',
          'ai product manager',
          'ai research scientist',
        ]}
        ogType="website"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'JobPosting',
          title: 'AI Engineer Positions',
          description: 'Join our AI team building the future of work',
          hiringOrganization: {
            '@type': 'Organization',
            name: 'AGI Agent Automation',
            sameAs: 'https://agiagentautomation.com',
          },
          jobLocation: {
            '@type': 'Place',
            address: {
              '@type': 'PostalAddress',
              addressCountry: 'US',
            },
          },
          employmentType: 'FULL_TIME',
          workHours: 'Remote',
        }}
      />
      <Particles
        className="absolute inset-0 -z-10"
        quantity={40}
        staticity={50}
      />

      {/* Hero Section */}
      <section className="px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl text-center"
          >
            <Badge className="glass mb-6 px-6 py-2">
              <Briefcase className="mr-2 h-4 w-4" />
              Careers
            </Badge>
            <h1 className="mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-5xl font-bold text-transparent md:text-7xl">
              Build the Future with Us
            </h1>
            <p className="mb-8 text-xl leading-relaxed text-muted-foreground">
              Join our mission to democratize AI and transform how businesses
              operate. We're looking for talented individuals who want to make a
              real impact.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-4xl font-bold md:text-5xl">
              Why Join AGI Agent?
            </h2>
            <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
              We offer more than just a job. Build your career with cutting-edge
              technology and a team that values innovation, growth, and
              work-life balance.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="group h-full border-2 border-border/50 p-6 transition-all hover:border-primary/50">
                  <div className="mb-4 w-fit rounded-xl bg-primary/10 p-3 transition-transform group-hover:scale-110">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-4xl font-bold md:text-5xl">
              Open Positions
            </h2>
            <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
              Find your next role and help us build the future of AI automation
            </p>
          </motion.div>

          <div className="mx-auto max-w-4xl space-y-4">
            {openings.map((job, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="group cursor-pointer border-2 border-border/50 p-6 transition-all hover:border-primary/50">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <h3 className="mb-2 text-xl font-bold transition-colors group-hover:text-primary">
                        {job.title}
                      </h3>
                      <p className="mb-4 text-muted-foreground">
                        {job.description}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <Badge variant="secondary" className="gap-1">
                          <Briefcase className="h-3 w-3" />
                          {job.department}
                        </Badge>
                        <Badge variant="secondary" className="gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.location}
                        </Badge>
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="h-3 w-3" />
                          {job.type}
                        </Badge>
                      </div>
                    </div>
                    <Button className="transition-colors group-hover:bg-primary group-hover:text-white">
                      Apply Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-6 text-4xl font-bold md:text-5xl">
              Don't See the Right Role?
            </h2>
            <p className="mb-8 text-xl text-muted-foreground">
              We're always looking for exceptional talent. Send us your resume
              and we'll keep you in mind for future opportunities.
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-accent"
            >
              Send Your Resume
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default CareersPage;
