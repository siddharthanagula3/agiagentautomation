import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const BlogPage: React.FC = () => {
  const blogPosts = [
    {
      id: '1',
      title: 'The Future of AI Workforce: Trends and Predictions for 2024',
      excerpt: 'Explore the latest trends in AI workforce automation and what to expect in the coming year.',
      author: 'Sarah Chen',
      date: '2024-01-15',
      category: 'AI Trends',
      readTime: '5 min read',
      image: '/api/placeholder/400/200'
    },
    {
      id: '2', 
      title: 'How to Scale Your Business with AI Employees',
      excerpt: 'Learn practical strategies for hiring and managing AI employees to grow your business.',
      author: 'Michael Rodriguez',
      date: '2024-01-10',
      category: 'Business',
      readTime: '7 min read',
      image: '/api/placeholder/400/200'
    },
    {
      id: '3',
      title: 'Best Practices for AI Employee Management',
      excerpt: 'Discover proven techniques for getting the most out of your AI workforce.',
      author: 'Emily Johnson',
      date: '2024-01-05',
      category: 'Management',
      readTime: '6 min read',
      image: '/api/placeholder/400/200'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            AI Workforce Blog
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stay updated with the latest insights, trends, and best practices in AI workforce automation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-t-lg"></div>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Badge variant="secondary">{post.category}</Badge>
                  <span className="text-sm text-gray-500">{post.readTime}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>{post.author}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(post.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link to={`/blog/${post.id}`}>
                    Read More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogPage;