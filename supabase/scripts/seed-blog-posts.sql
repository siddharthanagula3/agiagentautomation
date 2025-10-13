-- ================================================================
-- Blog Posts Seed Script
-- ================================================================
-- Creates blog posts for every day from August 11th, 2025 to October 25th, 2025
-- ================================================================

-- First, ensure we have blog authors and categories
INSERT INTO public.blog_authors (id, display_name, bio, avatar_emoji, avatar_url, user_id)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'AI Research Team', 'Leading experts in artificial intelligence and automation', '🤖', null, null),
  ('550e8400-e29b-41d4-a716-446655440002', 'Product Team', 'Building the future of AI workforce management', '⚡', null, null),
  ('550e8400-e29b-41d4-a716-446655440003', 'Engineering Team', 'Creating scalable AI solutions for businesses', '💻', null, null)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.blog_categories (id, name, slug, description)
VALUES 
  ('650e8400-e29b-41d4-a716-446655440001', 'AI Technology', 'ai-technology', 'Latest developments in AI and machine learning'),
  ('650e8400-e29b-41d4-a716-446655440002', 'Product Updates', 'product-updates', 'New features and improvements to our platform'),
  ('650e8400-e29b-41d4-a716-446655440003', 'Industry Insights', 'industry-insights', 'Analysis of AI trends and market developments'),
  ('650e8400-e29b-41d4-a716-446655440004', 'Tutorials', 'tutorials', 'Step-by-step guides for using AI employees'),
  ('650e8400-e29b-41d4-a716-446655440005', 'Case Studies', 'case-studies', 'Real-world success stories from our users')
ON CONFLICT (id) DO NOTHING;

-- Generate blog posts for each day from August 11, 2025 to October 25, 2025
-- This creates approximately 75 blog posts
WITH date_series AS (
  SELECT generate_series(
    '2025-08-11'::date,
    '2025-10-25'::date,
    '1 day'::interval
  )::date as post_date
),
blog_templates AS (
  SELECT 
    post_date,
    CASE 
      WHEN EXTRACT(DOW FROM post_date) = 0 THEN 'Sunday' -- Sunday
      WHEN EXTRACT(DOW FROM post_date) = 1 THEN 'Monday' -- Monday
      WHEN EXTRACT(DOW FROM post_date) = 2 THEN 'Tuesday' -- Tuesday
      WHEN EXTRACT(DOW FROM post_date) = 3 THEN 'Wednesday' -- Wednesday
      WHEN EXTRACT(DOW FROM post_date) = 4 THEN 'Thursday' -- Thursday
      WHEN EXTRACT(DOW FROM post_date) = 5 THEN 'Friday' -- Friday
      WHEN EXTRACT(DOW FROM post_date) = 6 THEN 'Saturday' -- Saturday
    END as day_name,
    EXTRACT(DAY FROM post_date) as day_num,
    EXTRACT(MONTH FROM post_date) as month_num,
    EXTRACT(YEAR FROM post_date) as year_num
  FROM date_series
),
blog_content AS (
  SELECT 
    post_date,
    day_name,
    day_num,
    month_num,
    year_num,
    CASE 
      WHEN EXTRACT(DOW FROM post_date) IN (0, 6) THEN 'AI Technology' -- Weekends
      WHEN EXTRACT(DOW FROM post_date) = 1 THEN 'Product Updates' -- Monday
      WHEN EXTRACT(DOW FROM post_date) = 2 THEN 'Industry Insights' -- Tuesday
      WHEN EXTRACT(DOW FROM post_date) = 3 THEN 'Tutorials' -- Wednesday
      WHEN EXTRACT(DOW FROM post_date) = 4 THEN 'Case Studies' -- Thursday
      WHEN EXTRACT(DOW FROM post_date) = 5 THEN 'AI Technology' -- Friday
    END as category_name,
    CASE 
      WHEN EXTRACT(DOW FROM post_date) IN (0, 6) THEN '550e8400-e29b-41d4-a716-446655440001' -- AI Research Team
      WHEN EXTRACT(DOW FROM post_date) = 1 THEN '550e8400-e29b-41d4-a716-446655440002' -- Product Team
      WHEN EXTRACT(DOW FROM post_date) = 2 THEN '550e8400-e29b-41d4-a716-446655440001' -- AI Research Team
      WHEN EXTRACT(DOW FROM post_date) = 3 THEN '550e8400-e29b-41d4-a716-446655440003' -- Engineering Team
      WHEN EXTRACT(DOW FROM post_date) = 4 THEN '550e8400-e29b-41d4-a716-446655440002' -- Product Team
      WHEN EXTRACT(DOW FROM post_date) = 5 THEN '550e8400-e29b-41d4-a716-446655440001' -- AI Research Team
    END as author_id,
    CASE 
      WHEN EXTRACT(DOW FROM post_date) IN (0, 6) THEN '650e8400-e29b-41d4-a716-446655440001' -- AI Technology
      WHEN EXTRACT(DOW FROM post_date) = 1 THEN '650e8400-e29b-41d4-a716-446655440002' -- Product Updates
      WHEN EXTRACT(DOW FROM post_date) = 2 THEN '650e8400-e29b-41d4-a716-446655440003' -- Industry Insights
      WHEN EXTRACT(DOW FROM post_date) = 3 THEN '650e8400-e29b-41d4-a716-446655440004' -- Tutorials
      WHEN EXTRACT(DOW FROM post_date) = 4 THEN '650e8400-e29b-41d4-a716-446655440005' -- Case Studies
      WHEN EXTRACT(DOW FROM post_date) = 5 THEN '650e8400-e29b-41d4-a716-446655440001' -- AI Technology
    END as category_id
  FROM blog_templates
)
INSERT INTO public.blog_posts (
  id,
  title,
  slug,
  excerpt,
  content,
  image_url,
  author_id,
  category_id,
  published,
  featured,
  read_time,
  views,
  published_at,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid() as id,
  CASE 
    WHEN EXTRACT(DOW FROM post_date) IN (0, 6) THEN 
      CASE (day_num % 7)
        WHEN 0 THEN 'The Future of AI: How Machine Learning is Transforming Business Operations'
        WHEN 1 THEN 'Advanced AI Algorithms: Breaking Down Complex Decision-Making Processes'
        WHEN 2 THEN 'Neural Networks in Practice: Real-World Applications and Success Stories'
        WHEN 3 THEN 'AI Ethics and Responsibility: Building Trust in Automated Systems'
        WHEN 4 THEN 'Deep Learning Breakthroughs: What''s New in AI Research'
        WHEN 5 THEN 'Natural Language Processing: Making AI More Human-Like'
        WHEN 6 THEN 'Computer Vision: Teaching AI to See and Understand the World'
      END
    WHEN EXTRACT(DOW FROM post_date) = 1 THEN 
      CASE (day_num % 5)
        WHEN 0 THEN 'New Feature Release: Enhanced AI Employee Performance Analytics'
        WHEN 1 THEN 'Platform Update: Improved User Interface and Experience'
        WHEN 2 THEN 'Security Enhancement: Advanced Encryption for Data Protection'
        WHEN 3 THEN 'Integration Update: New API Endpoints and Webhook Support'
        WHEN 4 THEN 'Performance Optimization: Faster Response Times and Better Reliability'
      END
    WHEN EXTRACT(DOW FROM post_date) = 2 THEN 
      CASE (day_num % 6)
        WHEN 0 THEN 'AI Market Trends: What''s Driving Growth in 2025'
        WHEN 1 THEN 'Industry Analysis: How AI is Reshaping Traditional Business Models'
        WHEN 2 THEN 'Competitive Landscape: Key Players in the AI Automation Space'
        WHEN 3 THEN 'Investment Insights: Where VCs are Putting Their Money in AI'
        WHEN 4 THEN 'Regulatory Update: New Policies Affecting AI Implementation'
        WHEN 5 THEN 'Global AI Adoption: Regional Differences and Opportunities'
      END
    WHEN EXTRACT(DOW FROM post_date) = 3 THEN 
      CASE (day_num % 4)
        WHEN 0 THEN 'Getting Started with AI Employees: A Complete Beginner''s Guide'
        WHEN 1 THEN 'Advanced Configuration: Customizing AI Employee Behavior'
        WHEN 2 THEN 'Workflow Optimization: Maximizing Efficiency with AI Automation'
        WHEN 3 THEN 'Troubleshooting Common Issues: Solutions and Best Practices'
      END
    WHEN EXTRACT(DOW FROM post_date) = 4 THEN 
      CASE (day_num % 5)
        WHEN 0 THEN 'Case Study: How TechCorp Increased Productivity by 300% with AI Employees'
        WHEN 1 THEN 'Success Story: StartupXYZ''s Journey to Full AI Automation'
        WHEN 2 THEN 'ROI Analysis: Measuring the Financial Impact of AI Implementation'
        WHEN 3 THEN 'Customer Spotlight: InnovateLabs'' AI Transformation'
        WHEN 4 THEN 'Before and After: A Visual Guide to AI Employee Implementation'
      END
    WHEN EXTRACT(DOW FROM post_date) = 5 THEN 
      CASE (day_num % 6)
        WHEN 0 THEN 'AI Research Breakthrough: New Model Achieves Human-Level Performance'
        WHEN 1 THEN 'Technical Deep Dive: Understanding Transformer Architecture'
        WHEN 2 THEN 'Open Source AI: Contributing to the Global AI Community'
        WHEN 3 THEN 'AI Hardware: The Latest in Processing Power and Efficiency'
        WHEN 4 THEN 'Quantum Computing and AI: The Next Frontier'
        WHEN 5 THEN 'Edge AI: Bringing Intelligence to IoT Devices'
      END
  END as title,
  CASE 
    WHEN EXTRACT(DOW FROM post_date) IN (0, 6) THEN 
      'ai-future-' || to_char(post_date, 'YYYY-MM-DD') || '-' || (day_num % 7)
    WHEN EXTRACT(DOW FROM post_date) = 1 THEN 
      'product-update-' || to_char(post_date, 'YYYY-MM-DD') || '-' || (day_num % 5)
    WHEN EXTRACT(DOW FROM post_date) = 2 THEN 
      'industry-insights-' || to_char(post_date, 'YYYY-MM-DD') || '-' || (day_num % 6)
    WHEN EXTRACT(DOW FROM post_date) = 3 THEN 
      'tutorial-guide-' || to_char(post_date, 'YYYY-MM-DD') || '-' || (day_num % 4)
    WHEN EXTRACT(DOW FROM post_date) = 4 THEN 
      'case-study-' || to_char(post_date, 'YYYY-MM-DD') || '-' || (day_num % 5)
    WHEN EXTRACT(DOW FROM post_date) = 5 THEN 
      'ai-research-' || to_char(post_date, 'YYYY-MM-DD') || '-' || (day_num % 6)
  END as slug,
  CASE 
    WHEN EXTRACT(DOW FROM post_date) IN (0, 6) THEN 
      'Exploring the latest developments in artificial intelligence and how they''re revolutionizing business operations across industries.'
    WHEN EXTRACT(DOW FROM post_date) = 1 THEN 
      'Stay updated with the latest features and improvements to our AI workforce platform.'
    WHEN EXTRACT(DOW FROM post_date) = 2 THEN 
      'In-depth analysis of AI market trends, industry developments, and strategic insights for business leaders.'
    WHEN EXTRACT(DOW FROM post_date) = 3 THEN 
      'Step-by-step tutorials and guides to help you maximize the potential of AI employees in your organization.'
    WHEN EXTRACT(DOW FROM post_date) = 4 THEN 
      'Real-world success stories and detailed case studies showcasing the impact of AI automation.'
    WHEN EXTRACT(DOW FROM post_date) = 5 THEN 
      'Cutting-edge research and technical insights from the forefront of artificial intelligence development.'
  END as excerpt,
  CASE 
    WHEN EXTRACT(DOW FROM post_date) IN (0, 6) THEN 
      'Artificial intelligence continues to evolve at an unprecedented pace, transforming how businesses operate and compete in the global marketplace. In this comprehensive analysis, we explore the latest breakthroughs in machine learning, neural networks, and automated decision-making systems that are reshaping entire industries.

The integration of AI into business operations has moved beyond simple automation to sophisticated systems that can learn, adapt, and make complex decisions in real-time. Companies that embrace these technologies are seeing remarkable improvements in efficiency, accuracy, and innovation.

Key areas of focus include:

**Advanced Machine Learning Algorithms**
Modern AI systems leverage sophisticated algorithms that can process vast amounts of data to identify patterns and make predictions with unprecedented accuracy. These systems are particularly effective in areas such as customer service, supply chain optimization, and financial analysis.

**Natural Language Processing Breakthroughs**
Recent advances in NLP have enabled AI systems to understand and generate human-like text with remarkable fluency. This has opened up new possibilities for automated content creation, customer support, and communication.

**Computer Vision Applications**
AI-powered visual recognition systems are now capable of analyzing complex images and videos with human-level accuracy, enabling applications in quality control, security, and medical diagnosis.

**Ethical AI Implementation**
As AI becomes more powerful, ensuring ethical implementation becomes increasingly important. This includes addressing bias, ensuring transparency, and maintaining human oversight in critical decision-making processes.

The future of AI in business looks incredibly promising, with new applications emerging regularly. Companies that invest in AI technology today will be well-positioned to lead their industries tomorrow.

*This article is part of our ongoing series on AI technology and its impact on modern business operations.*'
    WHEN EXTRACT(DOW FROM post_date) = 1 THEN 
      'We''re excited to announce the latest updates to our AI workforce platform, designed to enhance your experience and provide even more powerful automation capabilities.

**New Features in This Release:**

**Enhanced Performance Analytics**
Our new analytics dashboard provides detailed insights into AI employee performance, including task completion rates, efficiency metrics, and cost analysis. This helps you optimize your AI workforce and maximize ROI.

**Improved User Interface**
We''ve redesigned the user interface based on extensive user feedback, making it more intuitive and efficient. The new design focuses on ease of use while providing access to advanced features for power users.

**Advanced Security Features**
Security is our top priority, and this release includes enhanced encryption, improved authentication, and additional privacy controls to protect your sensitive data.

**API Enhancements**
New API endpoints and improved webhook support make it easier to integrate our platform with your existing systems and workflows.

**Performance Improvements**
We''ve optimized the platform for faster response times and improved reliability, ensuring your AI employees can work at peak efficiency.

These updates represent our commitment to continuous improvement and innovation. We''re constantly working to make our platform more powerful, user-friendly, and secure.

*For detailed technical documentation and migration guides, please visit our developer portal.*'
    WHEN EXTRACT(DOW FROM post_date) = 2 THEN 
      'The AI industry continues to experience unprecedented growth, with new developments emerging almost daily. In this comprehensive market analysis, we examine the key trends, opportunities, and challenges shaping the future of artificial intelligence in business.

**Market Growth and Investment Trends**

The global AI market is projected to reach $1.8 trillion by 2030, driven by increasing adoption across industries and significant investment from both private and public sectors. Key growth areas include:

- **Enterprise AI Solutions**: Large corporations are investing heavily in AI to improve operational efficiency and gain competitive advantages.
- **SME AI Adoption**: Small and medium enterprises are increasingly adopting AI solutions as they become more accessible and cost-effective.
- **Industry-Specific Applications**: AI is being tailored for specific industries, from healthcare to manufacturing to financial services.

**Key Market Drivers**

Several factors are driving the rapid growth of the AI market:

1. **Technological Advancements**: Breakthroughs in machine learning, natural language processing, and computer vision are making AI more powerful and versatile.
2. **Data Availability**: The explosion of digital data provides the fuel needed to train and improve AI systems.
3. **Computing Power**: Advances in hardware, including specialized AI chips, are making complex AI computations more accessible.
4. **Regulatory Support**: Governments worldwide are implementing policies that encourage AI development and adoption.

**Regional Analysis**

Different regions are approaching AI adoption in unique ways:

- **North America**: Leading in AI research and development, with strong private sector investment.
- **Europe**: Focus on ethical AI and regulatory frameworks, with significant public sector involvement.
- **Asia-Pacific**: Rapid adoption in manufacturing and consumer applications, driven by government initiatives.

**Future Outlook**

The AI market is expected to continue its rapid growth, with new applications emerging regularly. Key areas to watch include:

- **Edge AI**: Bringing AI capabilities to devices and systems at the network edge.
- **AI Ethics**: Increasing focus on responsible AI development and deployment.
- **Quantum AI**: The potential intersection of quantum computing and artificial intelligence.

*This analysis is based on extensive market research and industry reports from leading research organizations.*'
    WHEN EXTRACT(DOW FROM post_date) = 3 THEN 
      'Welcome to our comprehensive tutorial series on getting started with AI employees. This guide will walk you through everything you need to know to successfully implement and manage AI workers in your organization.

**Step 1: Understanding AI Employees**

AI employees are sophisticated software agents that can perform a wide range of tasks autonomously. They''re designed to work alongside human employees, handling routine tasks while humans focus on strategic and creative work.

**Step 2: Setting Up Your First AI Employee**

1. **Choose the Right AI Employee**: Select an AI employee that matches your specific needs and requirements.
2. **Configure Basic Settings**: Set up basic parameters such as working hours, task priorities, and communication preferences.
3. **Define Task Scope**: Clearly define what tasks your AI employee will handle and establish boundaries.

**Step 3: Training and Optimization**

- **Initial Training**: Provide your AI employee with examples of the work you want them to perform.
- **Feedback Loop**: Regularly review and provide feedback to improve performance.
- **Continuous Learning**: AI employees learn and improve over time with more data and experience.

**Step 4: Integration with Existing Systems**

- **API Integration**: Connect your AI employee to existing business systems and databases.
- **Workflow Integration**: Incorporate AI employees into your existing business processes.
- **Monitoring and Analytics**: Set up systems to track performance and identify improvement opportunities.

**Step 5: Scaling and Expansion**

Once you''ve successfully implemented your first AI employee, you can:

- **Add More AI Employees**: Scale up by adding additional AI workers for different tasks.
- **Cross-Training**: Train AI employees to handle multiple types of tasks.
- **Advanced Configuration**: Implement more sophisticated features and capabilities.

**Best Practices**

- Start small and scale gradually
- Provide clear instructions and examples
- Monitor performance regularly
- Maintain human oversight
- Keep security and privacy in mind

**Common Pitfalls to Avoid**

- Overcomplicating initial setup
- Insufficient training data
- Lack of clear task definitions
- Ignoring security considerations
- Expecting immediate perfection

*This tutorial is part of our comprehensive learning series. Check out our other guides for more advanced topics.*'
    WHEN EXTRACT(DOW FROM post_date) = 4 THEN 
      'In this detailed case study, we examine how TechCorp, a mid-sized technology company, successfully implemented AI employees and achieved remarkable results in productivity and efficiency.

**Company Background**

TechCorp is a 500-person technology company specializing in software development and IT services. Like many companies, they faced challenges with repetitive tasks, inconsistent quality, and resource allocation.

**The Challenge**

TechCorp was struggling with:
- Manual data entry and processing tasks consuming significant employee time
- Inconsistent quality in customer support responses
- Difficulty scaling operations to meet growing demand
- High costs associated with hiring and training additional staff

**The Solution**

TechCorp decided to implement AI employees to handle routine tasks and improve operational efficiency. They started with a pilot program focusing on three key areas:

1. **Customer Support**: AI employees to handle common inquiries and support tickets
2. **Data Processing**: Automated data entry and analysis tasks
3. **Content Creation**: AI employees for generating marketing materials and documentation

**Implementation Process**

**Phase 1: Planning and Preparation (Weeks 1-2)**
- Identified specific tasks suitable for AI automation
- Selected appropriate AI employee types
- Developed training protocols and success metrics

**Phase 2: Pilot Implementation (Weeks 3-6)**
- Deployed AI employees in controlled environments
- Provided extensive training and feedback
- Monitored performance and made adjustments

**Phase 3: Full Rollout (Weeks 7-12)**
- Expanded AI employee deployment across departments
- Integrated with existing systems and workflows
- Trained human employees to work alongside AI workers

**Results and Impact**

The results exceeded expectations:

**Quantitative Results:**
- 300% increase in task completion speed
- 95% reduction in data entry errors
- 60% decrease in customer response time
- 40% reduction in operational costs

**Qualitative Benefits:**
- Improved employee satisfaction as staff focused on more engaging work
- Enhanced customer experience with faster, more consistent support
- Increased innovation as human employees had more time for strategic thinking
- Better scalability to handle business growth

**Key Success Factors**

1. **Clear Task Definition**: Well-defined roles and responsibilities for AI employees
2. **Comprehensive Training**: Extensive training with real-world examples
3. **Human-AI Collaboration**: Effective integration between human and AI workers
4. **Continuous Monitoring**: Regular performance review and optimization
5. **Change Management**: Proper training and support for human employees

**Lessons Learned**

- Start with clearly defined, repetitive tasks
- Invest in comprehensive training and setup
- Maintain human oversight and quality control
- Be patient with the learning curve
- Focus on continuous improvement

**Future Plans**

TechCorp plans to:
- Expand AI employee deployment to additional departments
- Implement more sophisticated AI capabilities
- Develop custom AI solutions for specific business needs
- Share best practices with other companies

*This case study demonstrates the significant potential of AI employees when properly implemented and managed.*'
    WHEN EXTRACT(DOW FROM post_date) = 5 THEN 
      'Recent breakthroughs in artificial intelligence research are pushing the boundaries of what''s possible with machine learning and automated systems. In this technical deep dive, we explore the latest developments and their implications for the future of AI.

**Breakthrough in Neural Architecture**

Researchers have developed a new neural network architecture that achieves human-level performance on complex reasoning tasks. This breakthrough represents a significant step forward in creating AI systems that can think and reason like humans.

**Key Technical Innovations:**

**1. Advanced Transformer Models**
The latest transformer architectures incorporate novel attention mechanisms that allow for more efficient processing of sequential data. These models can handle longer sequences and maintain context over extended periods.

**2. Multimodal Learning Systems**
New approaches to multimodal learning enable AI systems to process and understand information from multiple sources simultaneously, including text, images, and audio.

**3. Few-Shot Learning Capabilities**
Recent advances in few-shot learning allow AI systems to quickly adapt to new tasks with minimal training data, making them more practical for real-world applications.

**4. Explainable AI Techniques**
New methods for making AI decisions more interpretable are helping to build trust and understanding in automated systems.

**Implications for Business Applications**

These technical advances have significant implications for business applications:

**Enhanced Decision Making**: AI systems can now make more complex decisions with greater accuracy and reliability.

**Improved Efficiency**: New architectures enable faster processing and more efficient resource utilization.

**Better Integration**: Multimodal capabilities allow for more seamless integration with existing business systems.

**Increased Trust**: Explainable AI techniques help build confidence in automated decision-making processes.

**Research Methodology**

The research involved extensive experimentation with various neural network architectures, training methodologies, and evaluation metrics. Key findings include:

- **Performance Metrics**: New models achieve 95%+ accuracy on complex reasoning tasks
- **Efficiency Gains**: 3x improvement in processing speed compared to previous architectures
- **Scalability**: Systems can handle 10x more data than previous generations
- **Robustness**: Improved performance across diverse domains and applications

**Future Research Directions**

Ongoing research is focusing on:

- **Quantum AI**: Exploring the intersection of quantum computing and artificial intelligence
- **Edge AI**: Developing more efficient models for deployment on edge devices
- **Federated Learning**: Enabling AI training across distributed systems while maintaining privacy
- **Neuromorphic Computing**: Developing hardware that mimics biological neural networks

**Practical Applications**

These advances are already being applied in various domains:

- **Healthcare**: Improved diagnostic accuracy and treatment recommendations
- **Finance**: Enhanced fraud detection and risk assessment
- **Manufacturing**: Better quality control and predictive maintenance
- **Customer Service**: More natural and effective automated interactions

**Conclusion**

The pace of AI research continues to accelerate, with new breakthroughs emerging regularly. These advances are making AI more powerful, efficient, and practical for real-world applications. As these technologies mature, we can expect to see even more transformative applications across industries.

*This research represents a collaborative effort between leading AI research institutions and industry partners.*'
  END as content,
  CASE 
    WHEN EXTRACT(DOW FROM post_date) IN (0, 6) THEN 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop'
    WHEN EXTRACT(DOW FROM post_date) = 1 THEN 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop'
    WHEN EXTRACT(DOW FROM post_date) = 2 THEN 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop'
    WHEN EXTRACT(DOW FROM post_date) = 3 THEN 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop'
    WHEN EXTRACT(DOW FROM post_date) = 4 THEN 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop'
    WHEN EXTRACT(DOW FROM post_date) = 5 THEN 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop'
  END as image_url,
  author_id,
  category_id,
  true as published,
  CASE 
    WHEN day_num % 7 = 0 THEN true -- Feature every 7th post
    ELSE false
  END as featured,
  CASE 
    WHEN EXTRACT(DOW FROM post_date) IN (0, 6) THEN '8 min read'
    WHEN EXTRACT(DOW FROM post_date) = 1 THEN '5 min read'
    WHEN EXTRACT(DOW FROM post_date) = 2 THEN '12 min read'
    WHEN EXTRACT(DOW FROM post_date) = 3 THEN '6 min read'
    WHEN EXTRACT(DOW FROM post_date) = 4 THEN '10 min read'
    WHEN EXTRACT(DOW FROM post_date) = 5 THEN '9 min read'
  END as read_time,
  (random() * 1000)::integer as views,
  post_date::timestamp with time zone as published_at,
  post_date::timestamp with time zone as created_at,
  post_date::timestamp with time zone as updated_at
FROM blog_content
ORDER BY post_date;

-- Update the sequence for blog_posts if it exists
SELECT setval('blog_posts_id_seq', (SELECT MAX(EXTRACT(EPOCH FROM created_at))::bigint FROM blog_posts), true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published) WHERE published = true;

-- Update statistics
ANALYZE blog_posts;
ANALYZE blog_authors;
ANALYZE blog_categories;

-- Success message
SELECT 'Blog posts seed completed successfully! Created ' || COUNT(*) || ' blog posts from August 11, 2025 to October 25, 2025.' as result
FROM blog_posts
WHERE published_at >= '2025-08-11'::date AND published_at <= '2025-10-25'::date;