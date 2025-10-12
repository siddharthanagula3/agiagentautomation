#!/usr/bin/env node

/**
 * Generate Blog Posts Script
 * Creates blog posts for every day from August 11th to October 25th, 2025
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Blog post topics and categories
const topics = [
  {
    category: 'AI & Automation',
    topics: [
      'The Future of AI Workforce Management',
      'Building Scalable AI Teams',
      'AI Employee Performance Optimization',
      'Automation Best Practices',
      'AI Ethics in the Workplace',
      'Machine Learning for Business',
      'Natural Language Processing Advances',
      'Computer Vision Applications',
      'AI-Powered Decision Making',
      'Robotic Process Automation',
    ],
  },
  {
    category: 'Productivity',
    topics: [
      'Streamlining Workflows with AI',
      'Time Management with AI Assistants',
      'Collaborative AI Tools',
      'Productivity Metrics and KPIs',
      'Remote Work Optimization',
      'Task Automation Strategies',
      'Digital Transformation',
      'Workflow Integration',
      'Performance Analytics',
      'Efficiency Best Practices',
    ],
  },
  {
    category: 'Technology',
    topics: [
      'Cloud Computing Trends',
      'API Integration Strategies',
      'Database Optimization',
      'Security in AI Systems',
      'DevOps with AI',
      'Microservices Architecture',
      'Container Technologies',
      'Serverless Computing',
      'Edge Computing',
      'Blockchain Applications',
    ],
  },
  {
    category: 'Business',
    topics: [
      'AI ROI Measurement',
      'Digital Marketing with AI',
      'Customer Experience Enhancement',
      'Sales Automation',
      'Business Intelligence',
      'Market Analysis with AI',
      'Competitive Intelligence',
      'Strategic Planning',
      'Innovation Management',
      'Change Management',
    ],
  },
  {
    category: 'Development',
    topics: [
      'AI-Assisted Coding',
      'Code Review Automation',
      'Testing with AI',
      'Deployment Strategies',
      'Version Control Best Practices',
      'Code Quality Metrics',
      'Refactoring Techniques',
      'Performance Optimization',
      'Security Auditing',
      'Documentation Generation',
    ],
  },
];

const authors = [
  {
    id: randomUUID(),
    display_name: 'Alex Chen',
    avatar_emoji: '👨‍💻',
    bio: 'Senior AI Engineer with 10+ years in machine learning and automation.',
  },
  {
    id: randomUUID(),
    display_name: 'Sarah Johnson',
    avatar_emoji: '👩‍💼',
    bio: 'Product Manager specializing in AI-driven business solutions.',
  },
  {
    id: randomUUID(),
    display_name: 'Mike Rodriguez',
    avatar_emoji: '👨‍🔬',
    bio: 'Research Scientist focused on AI ethics and responsible automation.',
  },
  {
    id: randomUUID(),
    display_name: 'Emily Davis',
    avatar_emoji: '👩‍🎨',
    bio: 'UX Designer creating intuitive AI interfaces and experiences.',
  },
  {
    id: randomUUID(),
    display_name: 'David Kim',
    avatar_emoji: '👨‍💻',
    bio: 'Full-stack developer and AI integration specialist.',
  },
];

// Generate date range from August 11 to October 25, 2025
function generateDateRange() {
  const dates = [];
  const startDate = new Date('2025-08-11');
  const endDate = new Date('2025-10-25');

  for (
    let date = new Date(startDate);
    date <= endDate;
    date.setDate(date.getDate() + 1)
  ) {
    dates.push(new Date(date));
  }

  return dates;
}

// Generate blog post content
function generateBlogPost(topic, category, date, author) {
  const slug = topic
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  const excerpt = `Discover how ${topic.toLowerCase()} is transforming modern businesses and learn practical strategies for implementation.`;

  const content = `
# ${topic}

In today's rapidly evolving digital landscape, ${topic.toLowerCase()} has become a cornerstone of modern business strategy. This comprehensive guide explores the latest trends, best practices, and real-world applications that are reshaping industries.

## Key Insights

- **Market Impact**: Recent studies show a 40% increase in efficiency when implementing ${topic.toLowerCase()} strategies
- **Technology Trends**: Emerging technologies are making these solutions more accessible than ever
- **Future Outlook**: Industry experts predict continued growth and innovation in this space

## Implementation Strategies

### 1. Getting Started
The first step in implementing ${topic.toLowerCase()} is understanding your current infrastructure and identifying opportunities for improvement.

### 2. Best Practices
- Start with pilot projects to validate concepts
- Ensure proper training and change management
- Monitor performance metrics closely
- Iterate based on feedback and results

### 3. Common Challenges
While the benefits are clear, organizations often face challenges such as:
- Integration complexity
- Change management
- Skill gaps in teams
- Budget constraints

## Real-World Applications

Companies across various industries are successfully implementing ${topic.toLowerCase()} to drive results. From startups to enterprise organizations, the impact is measurable and significant.

## Looking Ahead

The future of ${topic.toLowerCase()} is bright, with continuous innovation and improvement expected. Organizations that invest in these capabilities today will be well-positioned for tomorrow's challenges.

## Conclusion

${topic} represents a significant opportunity for organizations looking to improve efficiency, reduce costs, and enhance customer experiences. By following best practices and learning from industry leaders, businesses can successfully implement these solutions and achieve their goals.

---

*Published on ${date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} by ${author.display_name}*
  `.trim();

  return {
    title: topic,
    slug,
    excerpt,
    content,
    image_url: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000000)}?w=800&h=400&fit=crop&auto=format`,
    published: true,
    featured: Math.random() < 0.1, // 10% chance of being featured
    published_at: date.toISOString(),
    author_id: author.id,
    category_id: category.id,
  };
}

async function createAuthors() {
  console.log('📝 Creating blog authors...');

  for (const author of authors) {
    const { error } = await supabase
      .from('blog_authors')
      .upsert(author, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Error creating author ${author.display_name}:`, error);
    } else {
      console.log(`✅ Created author: ${author.display_name}`);
    }
  }
}

async function createCategories() {
  console.log('📂 Creating blog categories...');

  for (const categoryData of topics) {
    const category = {
      id: randomUUID(),
      name: categoryData.category,
      slug: categoryData.category.toLowerCase().replace(/\s+/g, '-'),
      description: `Articles about ${categoryData.category.toLowerCase()}`,
    };

    const { error } = await supabase
      .from('blog_categories')
      .upsert(category, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Error creating category ${category.name}:`, error);
    } else {
      console.log(`✅ Created category: ${category.name}`);
    }
  }
}

async function createBlogPosts() {
  console.log('📰 Creating blog posts...');

  const dates = generateDateRange();
  const categories = await supabase.from('blog_categories').select('*');
  const authorsList = await supabase.from('blog_authors').select('*');

  if (categories.error || authorsList.error) {
    console.error('❌ Error fetching categories or authors');
    return;
  }

  let postCount = 0;

  for (const date of dates) {
    // Select random category and topic
    const categoryData = topics[Math.floor(Math.random() * topics.length)];
    const topic =
      categoryData.topics[
        Math.floor(Math.random() * categoryData.topics.length)
      ];
    const author =
      authorsList.data[Math.floor(Math.random() * authorsList.data.length)];
    const category = categories.data.find(
      c => c.name === categoryData.category
    );

    if (!category) {
      console.error(`❌ Category not found: ${categoryData.category}`);
      continue;
    }

    const post = generateBlogPost(topic, category, date, author);

    const { error } = await supabase.from('blog_posts').insert(post);

    if (error) {
      console.error(`❌ Error creating post "${post.title}":`, error);
    } else {
      postCount++;
      if (postCount % 10 === 0) {
        console.log(`✅ Created ${postCount} blog posts...`);
      }
    }
  }

  console.log(`🎉 Successfully created ${postCount} blog posts!`);
}

async function main() {
  try {
    console.log('🚀 Starting blog post generation...');

    await createAuthors();
    await createCategories();
    await createBlogPosts();

    console.log('✨ Blog post generation complete!');
  } catch (error) {
    console.error('❌ Error in main process:', error);
    process.exit(1);
  }
}

// Run the script if called directly
main();
