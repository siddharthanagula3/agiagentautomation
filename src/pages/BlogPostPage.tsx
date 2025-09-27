import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Calendar, User, ArrowLeft, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const BlogPostPage: React.FC = () => {
  const { slug } = useParams();

  // Mock blog post data
  const blogPost = {
    id: slug,
    title: 'The Future of AI Workforce: Trends and Predictions for 2024',
    content: `
      <p>The AI workforce revolution is accelerating at an unprecedented pace. As we enter 2024, businesses are increasingly turning to AI employees to handle complex tasks, automate workflows, and scale operations.</p>
      
      <h2>Key Trends Shaping the AI Workforce</h2>
      
      <h3>1. Specialized AI Employees</h3>
      <p>We're seeing a shift from general-purpose AI to highly specialized AI employees. Companies are hiring AI agents with specific expertise in areas like data analysis, content creation, customer service, and software development.</p>
      
      <h3>2. Human-AI Collaboration</h3>
      <p>The future isn't about replacing humans with AI, but about creating seamless collaboration between human and AI workers. This hybrid approach maximizes the strengths of both.</p>
      
      <h3>3. Real-time Learning and Adaptation</h3>
      <p>Modern AI employees can learn and adapt in real-time, improving their performance based on feedback and new data. This continuous improvement cycle is revolutionizing how we think about workforce development.</p>
      
      <h2>What to Expect in 2024</h2>
      
      <p>Looking ahead, we expect to see several key developments:</p>
      
      <ul>
        <li>Increased adoption of AI employees across all industries</li>
        <li>More sophisticated workflow automation</li>
        <li>Better integration between AI and human workers</li>
        <li>Enhanced security and compliance features</li>
      </ul>
      
      <p>The AI workforce revolution is just beginning. Companies that embrace this change early will have a significant competitive advantage in the years to come.</p>
    `,
    author: 'Sarah Chen',
    date: '2024-01-15',
    category: 'AI Trends',
    readTime: '5 min read'
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="mb-8">
          <Button variant="ghost" asChild>
            <Link to="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
        </div>

        <article>
          <header className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Badge variant="secondary">{blogPost.category}</Badge>
              <span className="text-sm text-gray-500">{blogPost.readTime}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {blogPost.title}
            </h1>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>{blogPost.author}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(blogPost.date).toLocaleDateString()}</span>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </header>

          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: blogPost.content }}
          />
        </article>
      </div>
    </div>
  );
};

export default BlogPostPage;