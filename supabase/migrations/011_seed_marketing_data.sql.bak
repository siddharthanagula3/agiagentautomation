-- Seed Data for Marketing Website Backend
-- Created: 2025-01-02
-- Description: Initial data for Blog, Resources, FAQs, Pricing Plans, Support Categories

-- ============================================================================
-- SUBSCRIPTION PLANS
-- ============================================================================

INSERT INTO public.subscription_plans (name, slug, description, price_monthly, price_yearly, features, not_included, popular, color_gradient, display_order) VALUES
('Starter', 'starter', 'Perfect for individuals and small teams getting started with AI automation', 49.00, 39.00,
'["Up to 3 AI employees", "10 active workflows", "1,000 workflow executions/month", "Basic integrations (10+ apps)", "AI chat support", "Standard analytics dashboard", "Email support"]'::jsonb,
'["Advanced AI models", "Custom integrations", "Priority support"]'::jsonb,
false, 'from-blue-500 to-cyan-500', 1),

('Professional', 'professional', 'For growing teams that need advanced AI capabilities and integrations', 149.00, 119.00,
'["Up to 10 AI employees", "Unlimited workflows", "10,000 workflow executions/month", "All integrations (50+ apps)", "Advanced AI models", "Custom AI training", "Real-time analytics & insights", "AI project manager", "Priority email & chat support", "Team collaboration (up to 10 users)", "Custom branding"]'::jsonb,
'[]'::jsonb,
true, 'from-purple-500 to-pink-500', 2),

('Enterprise', 'enterprise', 'For large organizations requiring maximum scale, security, and customization', 0.00, 0.00,
'["Unlimited AI employees", "Unlimited workflows", "Unlimited workflow executions", "All integrations + custom API", "Dedicated AI infrastructure", "Custom AI model development", "Advanced security & compliance", "SSO & SAML authentication", "Dedicated account manager", "24/7 priority support", "Unlimited team members", "Custom SLAs", "On-premise deployment option", "Custom contract terms"]'::jsonb,
'[]'::jsonb,
false, 'from-orange-500 to-red-500', 3);

-- ============================================================================
-- BLOG CATEGORIES
-- ============================================================================

INSERT INTO public.blog_categories (name, slug, description, icon) VALUES
('AI Automation', 'ai-automation', 'Latest trends and tips in AI automation', 'Zap'),
('Productivity', 'productivity', 'Boost your team productivity with AI', 'Rocket'),
('Case Studies', 'case-studies', 'Real-world success stories', 'Building2'),
('AI Insights', 'ai-insights', 'Deep dives into AI technology', 'Brain'),
('Team Management', 'team-management', 'Managing human-AI teams effectively', 'Users');

-- ============================================================================
-- BLOG AUTHORS
-- ============================================================================

INSERT INTO public.blog_authors (display_name, bio, avatar_emoji) VALUES
('Sarah Chen', 'AI strategist and founder of multiple AI-powered startups', '👩‍💼'),
('Marcus Rodriguez', 'Software engineer specializing in automation and workflows', '👨‍💻'),
('Emily Johnson', 'Business consultant focused on digital transformation', '👩‍🔬'),
('Dr. Alex Kumar', 'AI researcher with 10+ years in machine learning', '👨‍🔬');

-- ============================================================================
-- SUPPORT CATEGORIES
-- ============================================================================

INSERT INTO public.support_categories (title, slug, description, icon, color_gradient, display_order) VALUES
('Getting Started', 'getting-started', 'Learn the basics of setting up and using AI employees', 'Zap', 'from-blue-500 to-cyan-500', 1),
('Account & Billing', 'billing', 'Manage your subscription, payments, and account settings', 'CreditCard', 'from-green-500 to-emerald-500', 2),
('AI Workflows', 'workflows', 'Create and optimize automated workflows', 'Workflow', 'from-purple-500 to-pink-500', 3),
('Team Collaboration', 'team', 'Work effectively with AI and human team members', 'Users', 'from-orange-500 to-red-500', 4),
('Security & Privacy', 'security', 'Understand our security measures and data protection', 'Lock', 'from-indigo-500 to-purple-500', 5),
('Integrations', 'integrations', 'Connect with Slack, Salesforce, and 50+ other tools', 'Settings', 'from-teal-500 to-cyan-500', 6);

-- ============================================================================
-- FAQ ITEMS
-- ============================================================================

INSERT INTO public.faq_items (question, answer, category, display_order) VALUES
('How do I create my first AI employee?', 'Creating your first AI employee is simple! Go to the Dashboard, click "Hire AI Employee," select the role (e.g., Customer Support, Sales, Developer), configure its skills and permissions, and activate. Your AI employee will be ready to work in minutes.', 'Getting Started', 1),
('What''s included in the free trial?', 'Our 14-day free trial includes access to all features: up to 3 AI employees, unlimited workflows, integrations with 50+ tools, AI dashboards, and priority support. No credit card required to start.', 'Billing', 2),
('Can I integrate with my existing tools?', 'Yes! We support 50+ integrations including Slack, Microsoft Teams, Salesforce, HubSpot, Jira, GitHub, Google Workspace, and more. You can also build custom integrations using our REST API and webhooks.', 'Integrations', 3),
('Is my data secure?', 'Absolutely. We use enterprise-grade encryption (AES-256), SOC 2 Type II compliance, regular security audits, and GDPR compliance. Your data is never used to train AI models, and you maintain complete ownership.', 'Security', 4),
('How do AI workflows work?', 'AI workflows are automated processes that connect triggers (like receiving an email) to actions (like creating a task, sending a response, updating a database). You can use pre-built templates or create custom workflows with our visual builder.', 'Workflows', 5),
('Can I upgrade or downgrade my plan anytime?', 'Yes, you can change your plan at any time. Upgrades take effect immediately, and downgrades apply at the start of your next billing cycle. We''ll prorate charges to ensure fairness.', 'Billing', 6),
('What happens if I exceed my AI employee limit?', 'If you reach your plan''s AI employee limit, you''ll receive a notification to upgrade. Existing AI employees continue working normally, but you won''t be able to create new ones until you upgrade or remove inactive employees.', 'Account', 7),
('How does team collaboration work?', 'Invite team members via email, assign roles (Admin, Member, Viewer), and they can collaborate on managing AI employees, viewing dashboards, and editing workflows. You control permissions and access levels.', 'Team', 8),
('Do I need coding skills to use the platform?', 'No! Our platform is designed for non-technical users with drag-and-drop workflow builders, pre-built templates, and intuitive interfaces. However, developers can access our API for advanced customization.', 'Getting Started', 9),
('What kind of support do you offer?', 'We provide 24/7 email support for all plans, live chat for Pro and Enterprise, and dedicated account managers for Enterprise customers. We also have extensive documentation, video tutorials, and community forums.', 'Support', 10);

-- Update category post counts
UPDATE public.blog_categories SET post_count = 0;

-- Update support category article counts
UPDATE public.support_categories SET article_count = 0;

-- ============================================================================
-- RESOURCES
-- ============================================================================

INSERT INTO public.resources (title, description, type, category, duration, thumbnail_url, featured) VALUES
('The Complete Guide to AI Employee Implementation', 'Step-by-step framework for integrating AI employees into your organization, from planning to scaling.', 'Ebook', 'Getting Started', '45 pages', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop', true),
('AI Workflow Automation Templates', 'Pre-built templates for common workflows: customer support, sales outreach, data processing, and more.', 'Template', 'Automation', '12 templates', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop', true),
('Getting Started with AI Chat', 'Learn how to configure and deploy AI chat agents for customer support and internal communication.', 'Guide', 'AI Chat', '15 min read', 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=600&h=400&fit=crop', false),
('Building Custom Integrations', 'Developer guide to integrating AGI Agent with your existing tech stack using our API and webhooks.', 'Guide', 'Development', '25 min read', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop', false),
('Dashboard Configuration Masterclass', 'Video walkthrough of creating custom AI dashboards with advanced analytics and real-time insights.', 'Video', 'Analytics', '42 min', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop', false),
('Sales Team Onboarding Template', 'Complete onboarding package for sales teams adopting AI employees, including training materials.', 'Template', 'Sales', '8 resources', 'https://images.unsplash.com/photo-1553484771-371a605b060b?w=600&h=400&fit=crop', false);

-- ============================================================================
-- HELP ARTICLES
-- ============================================================================

INSERT INTO public.help_articles (title, slug, content, excerpt, category_id, published) VALUES
('How to Create Your First AI Employee', 'create-first-ai-employee',
'# Creating Your First AI Employee

Welcome to AGI Agent! This guide will walk you through creating your first AI employee.

## Step 1: Access the Marketplace
Navigate to the AI Marketplace from your dashboard...

## Step 2: Choose a Role
Select the role that matches your needs: Customer Support, Sales, Developer...

## Step 3: Configure Skills
Customize the AI employee''s capabilities and permissions...',
'Step-by-step guide to hiring your first AI employee',
(SELECT id FROM public.support_categories WHERE slug = 'getting-started' LIMIT 1),
true),

('Managing Your Subscription', 'managing-subscription',
'# Subscription Management

Learn how to manage your AGI Agent subscription.

## Changing Plans
You can upgrade or downgrade at any time from Settings > Billing...

## Billing Cycle
Choose between monthly and yearly billing to save up to 20%...',
'Complete guide to subscription and billing management',
(SELECT id FROM public.support_categories WHERE slug = 'billing' LIMIT 1),
true),

('Connecting Slack Integration', 'slack-integration',
'# Slack Integration Setup

Connect AGI Agent with your Slack workspace.

## Prerequisites
- Admin access to your Slack workspace
- AGI Agent Pro or Enterprise plan...

## Installation Steps
1. Go to Integrations page
2. Click "Connect" on Slack card
3. Authorize the app...',
'How to integrate AGI Agent with Slack',
(SELECT id FROM public.support_categories WHERE slug = 'integrations' LIMIT 1),
true);

-- Update support category article counts
UPDATE public.support_categories sc
SET article_count = (
  SELECT COUNT(*) FROM public.help_articles ha
  WHERE ha.category_id = sc.id AND ha.published = true
);
