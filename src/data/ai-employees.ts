/**
 * AI Employee Types and Data
 * Defines all available AI employees, their specializations, and API integrations
 */

export type AIProvider = 'chatgpt' | 'claude' | 'gemini' | 'perplexity';

export interface AIEmployee {
  id: string;
  name: string;
  role: string;
  category: string;
  description: string;
  provider: AIProvider;
  price: number;
  avatar: string;
  skills: string[];
  specialty: string;
  fitLevel: 'excellent' | 'good';
  defaultTools?: string[]; // MCP tools this employee should use by default
}

export const AI_EMPLOYEES: AIEmployee[] = [
  // Engineering & Technology - Claude for coding
  {
    id: 'emp-001',
    name: 'Software Architect',
    role: 'Software Architect',
    category: 'Engineering',
    description: 'Design scalable system architectures and lead technical decisions',
    provider: 'claude',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=software-architect',
    skills: ['System Design', 'Architecture', 'Scalability', 'Cloud Infrastructure'],
    specialty: 'System architecture and technical leadership',
    fitLevel: 'excellent',
    defaultTools: ['code_interpreter', 'web_search', 'create_visualization', 'analyze_file']
  },
  {
    id: 'emp-002',
    name: 'Solutions Architect',
    role: 'Solutions Architect',
    category: 'Engineering',
    description: 'Create end-to-end technical solutions for complex business problems',
    provider: 'claude',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=solutions-architect',
    skills: ['Solution Design', 'Technical Strategy', 'Integration', 'Best Practices'],
    specialty: 'Enterprise solution architecture',
    fitLevel: 'excellent',
    defaultTools: ['web_search', 'create_visualization', 'api_call', 'analyze_file']
  },
  {
    id: 'emp-003',
    name: 'Backend Engineer',
    role: 'Backend Engineer',
    category: 'Engineering',
    description: 'Build robust APIs, databases, and server-side logic',
    provider: 'claude',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=backend-engineer',
    skills: ['Node.js', 'Python', 'Databases', 'API Design', 'Microservices'],
    specialty: 'Backend development and API design',
    fitLevel: 'excellent',
    defaultTools: ['code_interpreter', 'api_call', 'web_search', 'analyze_file']
  },
  {
    id: 'emp-004',
    name: 'Frontend Engineer',
    role: 'Frontend Engineer',
    category: 'Engineering',
    description: 'Create beautiful, responsive user interfaces with modern frameworks',
    provider: 'chatgpt',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=frontend-engineer',
    skills: ['React', 'TypeScript', 'CSS', 'UI/UX', 'Performance'],
    specialty: 'Modern frontend development',
    fitLevel: 'excellent',
    defaultTools: ['code_interpreter', 'web_search', 'analyze_file']
  },
  {
    id: 'emp-005',
    name: 'Full-Stack Engineer',
    role: 'Full-Stack Engineer',
    category: 'Engineering',
    description: 'Build complete applications from frontend to backend',
    provider: 'claude',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fullstack-engineer',
    skills: ['React', 'Node.js', 'Databases', 'DevOps', 'Full Stack'],
    specialty: 'End-to-end application development',
    fitLevel: 'excellent',
    defaultTools: ['code_interpreter', 'api_call', 'web_search', 'analyze_file']
  },

  // Product Management - ChatGPT for communication
  {
    id: 'emp-006',
    name: 'Product Manager',
    role: 'Product Manager',
    category: 'Product',
    description: 'Define product strategy, roadmaps, and drive feature development',
    provider: 'chatgpt',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=product-manager',
    skills: ['Product Strategy', 'Roadmapping', 'User Research', 'Analytics'],
    specialty: 'Product strategy and execution',
    fitLevel: 'excellent',
    defaultTools: ['web_search', 'create_visualization', 'analyze_file']
  },
  {
    id: 'emp-007',
    name: 'Technical Product Manager',
    role: 'Technical Product Manager',
    category: 'Product',
    description: 'Bridge technical and business requirements for complex products',
    provider: 'chatgpt',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=technical-product-manager',
    skills: ['Technical Requirements', 'API Strategy', 'Developer Experience'],
    specialty: 'Technical product management',
    fitLevel: 'excellent',
    defaultTools: ['web_search', 'api_call', 'analyze_file', 'create_visualization']
  },

  // AI, Data Science & Analytics - Claude for analysis
  {
    id: 'emp-008',
    name: 'Data Scientist',
    role: 'Data Scientist',
    category: 'AI & Data',
    description: 'Analyze data, build ML models, and derive actionable insights',
    provider: 'claude',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=data-scientist',
    skills: ['Machine Learning', 'Python', 'Statistics', 'Data Visualization'],
    specialty: 'Data science and ML engineering',
    fitLevel: 'excellent',
    defaultTools: ['code_interpreter', 'analyze_file', 'create_visualization', 'web_search']
  },
  {
    id: 'emp-009',
    name: 'AI Engineer',
    role: 'AI Engineer',
    category: 'AI & Data',
    description: 'Build and deploy AI/ML systems and neural networks',
    provider: 'claude',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ai-engineer',
    skills: ['Deep Learning', 'PyTorch', 'TensorFlow', 'NLP', 'Computer Vision'],
    specialty: 'AI/ML system development',
    fitLevel: 'excellent',
    defaultTools: ['code_interpreter', 'analyze_file', 'web_search', 'api_call']
  },
  {
    id: 'emp-010',
    name: 'BI Analyst',
    role: 'BI Analyst',
    category: 'AI & Data',
    description: 'Transform data into actionable business intelligence',
    provider: 'claude',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bi-analyst',
    skills: ['SQL', 'Tableau', 'Power BI', 'Data Analysis', 'Reporting'],
    specialty: 'Business intelligence and analytics',
    fitLevel: 'excellent',
    defaultTools: ['analyze_file', 'create_visualization', 'web_search', 'code_interpreter']
  },

  // IT, Security & Operations
  {
    id: 'emp-011',
    name: 'DevOps Engineer',
    role: 'DevOps Engineer',
    category: 'IT & Operations',
    description: 'Automate deployments, manage infrastructure, and ensure reliability',
    provider: 'claude',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=devops-engineer',
    skills: ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Terraform'],
    specialty: 'DevOps and infrastructure automation',
    fitLevel: 'excellent',
    defaultTools: ['code_interpreter', 'api_call', 'web_search', 'analyze_file']
  },
  {
    id: 'emp-012',
    name: 'Security Analyst',
    role: 'Security Analyst',
    category: 'IT & Operations',
    description: 'Identify vulnerabilities, monitor threats, and secure systems',
    provider: 'claude',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=security-analyst',
    skills: ['Security Audits', 'Penetration Testing', 'Compliance', 'Risk Assessment'],
    specialty: 'Cybersecurity and threat analysis',
    fitLevel: 'excellent',
    defaultTools: ['web_search', 'analyze_file', 'code_interpreter', 'api_call']
  },

  // Marketing & Growth - ChatGPT for content
  {
    id: 'emp-013',
    name: 'Content Marketing Manager',
    role: 'Content Marketing Manager',
    category: 'Marketing',
    description: 'Create compelling content that drives engagement and conversions',
    provider: 'chatgpt',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=content-marketing-manager',
    skills: ['Content Strategy', 'Copywriting', 'SEO', 'Social Media'],
    specialty: 'Content marketing and strategy',
    fitLevel: 'excellent',
    defaultTools: ['web_search', 'analyze_file']
  },
  {
    id: 'emp-014',
    name: 'SEO Manager',
    role: 'SEO Manager',
    category: 'Marketing',
    description: 'Optimize websites for search engines and drive organic traffic',
    provider: 'chatgpt',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=seo-manager',
    skills: ['SEO', 'Keyword Research', 'Technical SEO', 'Link Building'],
    specialty: 'Search engine optimization',
    fitLevel: 'excellent',
    defaultTools: ['web_search', 'analyze_file', 'api_call']
  },

  // Creative & Design - Gemini for visual
  {
    id: 'emp-015',
    name: 'UI/UX Designer',
    role: 'UI/UX Designer',
    category: 'Design',
    description: 'Design beautiful, intuitive user experiences',
    provider: 'chatgpt',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ui-ux-designer',
    skills: ['Figma', 'User Research', 'Wireframing', 'Prototyping', 'Design Systems'],
    specialty: 'User interface and experience design',
    fitLevel: 'good',
    defaultTools: ['web_search', 'analyze_file']
  },
  {
    id: 'emp-016',
    name: 'Video Content Creator',
    role: 'Video Content Creator',
    category: 'Creative',
    description: 'Plan, script, and conceptualize engaging video content',
    provider: 'gemini',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=video-content-creator',
    skills: ['Video Strategy', 'Scripting', 'Storyboarding', 'Content Planning'],
    specialty: 'Video content creation and strategy',
    fitLevel: 'good',
    defaultTools: ['web_search', 'analyze_file']
  },

  // Research - Perplexity
  {
    id: 'emp-017',
    name: 'Research Analyst',
    role: 'Research Analyst',
    category: 'Research',
    description: 'Conduct comprehensive research and competitive analysis',
    provider: 'perplexity',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=research-analyst',
    skills: ['Market Research', 'Competitive Analysis', 'Data Gathering', 'Report Writing'],
    specialty: 'Research and competitive intelligence',
    fitLevel: 'excellent',
    defaultTools: ['web_search', 'analyze_file', 'create_visualization']
  },

  // Customer Support - ChatGPT
  {
    id: 'emp-018',
    name: 'Customer Support Specialist',
    role: 'Customer Support Specialist',
    category: 'Support',
    description: 'Provide excellent customer service and resolve issues',
    provider: 'chatgpt',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=customer-support-specialist',
    skills: ['Customer Service', 'Problem Solving', 'Communication', 'CRM'],
    specialty: 'Customer support and success',
    fitLevel: 'excellent',
    defaultTools: ['web_search', 'analyze_file']
  },

  // QA & Testing - Claude
  {
    id: 'emp-019',
    name: 'QA Engineer',
    role: 'QA Engineer',
    category: 'Engineering',
    description: 'Ensure software quality through comprehensive testing',
    provider: 'claude',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=qa-engineer',
    skills: ['Test Automation', 'QA Processes', 'Bug Tracking', 'Quality Assurance'],
    specialty: 'Quality assurance and testing',
    fitLevel: 'excellent',
    defaultTools: ['code_interpreter', 'web_search', 'analyze_file', 'api_call']
  },

  // Technical Writing - ChatGPT
  {
    id: 'emp-020',
    name: 'Technical Writer',
    role: 'Technical Writer',
    category: 'Documentation',
    description: 'Create clear, comprehensive technical documentation',
    provider: 'chatgpt',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=technical-writer',
    skills: ['Technical Writing', 'Documentation', 'API Docs', 'User Guides'],
    specialty: 'Technical documentation and content',
    fitLevel: 'excellent',
    defaultTools: ['web_search', 'code_interpreter', 'analyze_file']
  },

  // Executive Leadership - Claude for strategic thinking
  {
    id: 'emp-021',
    name: 'Chief Executive Officer',
    role: 'Chief Executive Officer',
    category: 'Executive',
    description: 'Provide strategic leadership and drive organizational vision',
    provider: 'claude',
    price: 2,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chief-executive-officer',
    skills: ['Strategic Planning', 'Leadership', 'Business Development', 'Decision Making'],
    specialty: 'Executive leadership and strategic direction',
    fitLevel: 'excellent',
    defaultTools: ['web_search', 'create_visualization', 'analyze_file']
  },
  {
    id: 'emp-022',
    name: 'Chief Technology Officer',
    role: 'Chief Technology Officer',
    category: 'Executive',
    description: 'Lead technology strategy and drive innovation initiatives',
    provider: 'claude',
    price: 2,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chief-technology-officer',
    skills: ['Technology Strategy', 'Innovation', 'Architecture', 'Team Leadership'],
    specialty: 'Technology leadership and innovation',
    fitLevel: 'excellent',
    defaultTools: ['web_search', 'code_interpreter', 'create_visualization', 'analyze_file']
  },
  {
    id: 'emp-023',
    name: 'Chief Operating Officer',
    role: 'Chief Operating Officer',
    category: 'Executive',
    description: 'Optimize operations and drive operational excellence',
    provider: 'claude',
    price: 2,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chief-operating-officer',
    skills: ['Operations Management', 'Process Optimization', 'Team Building', 'Performance'],
    specialty: 'Operational excellence and optimization',
    fitLevel: 'excellent',
    defaultTools: ['web_search', 'create_visualization', 'analyze_file']
  },
  {
    id: 'emp-024',
    name: 'Chief Financial Officer',
    role: 'Chief Financial Officer',
    category: 'Executive',
    description: 'Manage financial strategy and ensure fiscal responsibility',
    provider: 'claude',
    price: 2,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chief-financial-officer',
    skills: ['Financial Planning', 'Budgeting', 'Risk Management', 'Investment Strategy'],
    specialty: 'Financial leadership and strategy',
    fitLevel: 'excellent',
    defaultTools: ['web_search', 'create_visualization', 'analyze_file']
  },

  // Specialized Engineering Roles
  {
    id: 'emp-025',
    name: 'Mobile App Developer',
    role: 'Mobile App Developer',
    category: 'Engineering',
    description: 'Build native and cross-platform mobile applications',
    provider: 'claude',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mobile-app-developer',
    skills: ['React Native', 'Flutter', 'iOS', 'Android', 'Mobile UX'],
    specialty: 'Mobile application development',
    fitLevel: 'excellent',
    defaultTools: ['code_interpreter', 'web_search', 'analyze_file']
  },
  {
    id: 'emp-026',
    name: 'Blockchain Engineer',
    role: 'Blockchain Engineer',
    category: 'Engineering',
    description: 'Develop smart contracts and blockchain solutions',
    provider: 'claude',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=blockchain-engineer',
    skills: ['Solidity', 'Web3', 'DeFi', 'Smart Contracts', 'Ethereum'],
    specialty: 'Blockchain and Web3 development',
    fitLevel: 'excellent',
    defaultTools: ['code_interpreter', 'web_search', 'analyze_file']
  },
  {
    id: 'emp-027',
    name: 'Cloud Solutions Architect',
    role: 'Cloud Solutions Architect',
    category: 'Engineering',
    description: 'Design and implement cloud-native solutions',
    provider: 'claude',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cloud-solutions-architect',
    skills: ['AWS', 'Azure', 'GCP', 'Kubernetes', 'Serverless'],
    specialty: 'Cloud architecture and migration',
    fitLevel: 'excellent',
    defaultTools: ['code_interpreter', 'web_search', 'api_call', 'analyze_file']
  },
  {
    id: 'emp-028',
    name: 'ML Engineer',
    role: 'ML Engineer',
    category: 'AI & Data',
    description: 'Build and deploy machine learning systems at scale',
    provider: 'claude',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ml-engineer',
    skills: ['MLOps', 'Model Deployment', 'ML Infrastructure', 'A/B Testing'],
    specialty: 'Machine learning engineering and deployment',
    fitLevel: 'excellent',
    defaultTools: ['code_interpreter', 'web_search', 'api_call', 'analyze_file']
  },

  // Business Development & Sales
  {
    id: 'emp-029',
    name: 'Business Development Manager',
    role: 'Business Development Manager',
    category: 'Business',
    description: 'Identify opportunities and drive business growth',
    provider: 'chatgpt',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=business-development-manager',
    skills: ['Partnership Development', 'Market Analysis', 'Negotiation', 'Strategy'],
    specialty: 'Business development and partnerships',
    fitLevel: 'excellent',
    defaultTools: ['web_search', 'analyze_file', 'create_visualization']
  },
  {
    id: 'emp-030',
    name: 'Sales Manager',
    role: 'Sales Manager',
    category: 'Business',
    description: 'Lead sales teams and drive revenue growth',
    provider: 'chatgpt',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sales-manager',
    skills: ['Sales Strategy', 'CRM Management', 'Team Leadership', 'Revenue Growth'],
    specialty: 'Sales leadership and revenue generation',
    fitLevel: 'excellent',
    defaultTools: ['web_search', 'analyze_file']
  },
  {
    id: 'emp-031',
    name: 'Account Manager',
    role: 'Account Manager',
    category: 'Business',
    description: 'Manage client relationships and ensure satisfaction',
    provider: 'chatgpt',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=account-manager',
    skills: ['Client Relations', 'Account Management', 'Customer Success', 'Retention'],
    specialty: 'Client relationship management',
    fitLevel: 'excellent',
    defaultTools: ['web_search', 'analyze_file']
  },

  // Finance & Accounting
  {
    id: 'emp-032',
    name: 'Financial Analyst',
    role: 'Financial Analyst',
    category: 'Finance',
    description: 'Analyze financial data and provide strategic insights',
    provider: 'claude',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=financial-analyst',
    skills: ['Financial Analysis', 'Forecasting', 'Budgeting', 'Excel', 'SQL'],
    specialty: 'Financial analysis and forecasting',
    fitLevel: 'excellent',
    defaultTools: ['analyze_file', 'create_visualization', 'web_search']
  },
  {
    id: 'emp-033',
    name: 'Accounting Manager',
    role: 'Accounting Manager',
    category: 'Finance',
    description: 'Manage accounting operations and ensure compliance',
    provider: 'claude',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=accounting-manager',
    skills: ['GAAP', 'Financial Reporting', 'Tax Compliance', 'Audit', 'QuickBooks'],
    specialty: 'Accounting and financial compliance',
    fitLevel: 'excellent',
    defaultTools: ['analyze_file', 'web_search']
  },

  // Human Resources
  {
    id: 'emp-034',
    name: 'HR Manager',
    role: 'HR Manager',
    category: 'Human Resources',
    description: 'Manage human resources and employee relations',
    provider: 'chatgpt',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hr-manager',
    skills: ['Recruitment', 'Employee Relations', 'HR Policies', 'Performance Management'],
    specialty: 'Human resources management',
    fitLevel: 'excellent',
    defaultTools: ['web_search', 'analyze_file']
  },
  {
    id: 'emp-035',
    name: 'Talent Acquisition Specialist',
    role: 'Talent Acquisition Specialist',
    category: 'Human Resources',
    description: 'Source and recruit top talent for the organization',
    provider: 'chatgpt',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=talent-acquisition-specialist',
    skills: ['Recruiting', 'Sourcing', 'Interviewing', 'Candidate Assessment'],
    specialty: 'Talent acquisition and recruitment',
    fitLevel: 'excellent',
    defaultTools: ['web_search', 'analyze_file']
  },

  // Legal & Compliance
  {
    id: 'emp-036',
    name: 'Legal Counsel',
    role: 'Legal Counsel',
    category: 'Legal',
    description: 'Provide legal guidance and ensure compliance',
    provider: 'claude',
    price: 2,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=legal-counsel',
    skills: ['Contract Law', 'Corporate Law', 'Compliance', 'Risk Management'],
    specialty: 'Legal counsel and compliance',
    fitLevel: 'excellent',
    defaultTools: ['web_search', 'analyze_file']
  },
  {
    id: 'emp-037',
    name: 'Compliance Officer',
    role: 'Compliance Officer',
    category: 'Legal',
    description: 'Ensure regulatory compliance and risk management',
    provider: 'claude',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=compliance-officer',
    skills: ['Regulatory Compliance', 'Risk Assessment', 'Policy Development', 'Auditing'],
    specialty: 'Compliance and risk management',
    fitLevel: 'excellent',
    defaultTools: ['web_search', 'analyze_file']
  },

  // Operations & Project Management
  {
    id: 'emp-038',
    name: 'Operations Manager',
    role: 'Operations Manager',
    category: 'Operations',
    description: 'Optimize business operations and improve efficiency',
    provider: 'claude',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=operations-manager',
    skills: ['Process Optimization', 'Operations Management', 'Efficiency', 'Team Coordination'],
    specialty: 'Operations optimization and management',
    fitLevel: 'excellent',
    defaultTools: ['web_search', 'create_visualization', 'analyze_file']
  },
  {
    id: 'emp-039',
    name: 'Project Manager',
    role: 'Project Manager',
    category: 'Operations',
    description: 'Lead projects and ensure successful delivery',
    provider: 'chatgpt',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=project-manager',
    skills: ['Project Management', 'Agile', 'Scrum', 'Team Leadership', 'Timeline Management'],
    specialty: 'Project management and delivery',
    fitLevel: 'excellent',
    defaultTools: ['web_search', 'create_visualization', 'analyze_file']
  },
  {
    id: 'emp-040',
    name: 'Program Manager',
    role: 'Program Manager',
    category: 'Operations',
    description: 'Manage complex programs and strategic initiatives',
    provider: 'claude',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=program-manager',
    skills: ['Program Management', 'Strategic Planning', 'Stakeholder Management', 'Risk Management'],
    specialty: 'Program management and strategic execution',
    fitLevel: 'excellent',
    defaultTools: ['web_search', 'create_visualization', 'analyze_file']
  },

  // Specialized Marketing Roles
  {
    id: 'emp-041',
    name: 'Growth Marketing Manager',
    role: 'Growth Marketing Manager',
    category: 'Marketing',
    description: 'Drive user acquisition and growth through data-driven marketing',
    provider: 'chatgpt',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=growth-marketing-manager',
    skills: ['Growth Hacking', 'A/B Testing', 'Funnel Optimization', 'User Acquisition'],
    specialty: 'Growth marketing and user acquisition',
    fitLevel: 'excellent',
    defaultTools: ['web_search', 'analyze_file', 'create_visualization']
  },
  {
    id: 'emp-042',
    name: 'Performance Marketing Manager',
    role: 'Performance Marketing Manager',
    category: 'Marketing',
    description: 'Optimize paid advertising campaigns for maximum ROI',
    provider: 'chatgpt',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=performance-marketing-manager',
    skills: ['Google Ads', 'Facebook Ads', 'Analytics', 'ROI Optimization', 'Campaign Management'],
    specialty: 'Performance marketing and paid advertising',
    fitLevel: 'excellent',
    defaultTools: ['web_search', 'analyze_file', 'create_visualization']
  },
  {
    id: 'emp-043',
    name: 'Brand Manager',
    role: 'Brand Manager',
    category: 'Marketing',
    description: 'Develop and maintain brand identity and positioning',
    provider: 'chatgpt',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=brand-manager',
    skills: ['Brand Strategy', 'Brand Identity', 'Market Positioning', 'Brand Guidelines'],
    specialty: 'Brand management and strategy',
    fitLevel: 'excellent',
    defaultTools: ['web_search', 'analyze_file']
  },

  // Additional Creative Roles
  {
    id: 'emp-044',
    name: 'Graphic Designer',
    role: 'Graphic Designer',
    category: 'Creative',
    description: 'Create compelling visual designs and brand assets',
    provider: 'gemini',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=graphic-designer',
    skills: ['Adobe Creative Suite', 'Brand Design', 'Print Design', 'Digital Design'],
    specialty: 'Graphic design and visual branding',
    fitLevel: 'good',
    defaultTools: ['web_search', 'analyze_file']
  },
  {
    id: 'emp-045',
    name: 'Copywriter',
    role: 'Copywriter',
    category: 'Creative',
    description: 'Craft compelling copy that converts and engages audiences',
    provider: 'chatgpt',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=copywriter',
    skills: ['Copywriting', 'Content Strategy', 'Email Marketing', 'Sales Copy'],
    specialty: 'Copywriting and content creation',
    fitLevel: 'excellent',
    defaultTools: ['web_search', 'analyze_file']
  },
  {
    id: 'emp-046',
    name: 'Brand Strategist',
    role: 'Brand Strategist',
    category: 'Creative',
    description: 'Develop comprehensive brand strategies and positioning',
    provider: 'chatgpt',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=brand-strategist',
    skills: ['Brand Strategy', 'Market Research', 'Consumer Insights', 'Brand Positioning'],
    specialty: 'Brand strategy and positioning',
    fitLevel: 'excellent',
    defaultTools: ['web_search', 'analyze_file', 'create_visualization']
  },

  // Specialized Data Roles
  {
    id: 'emp-047',
    name: 'Data Engineer',
    role: 'Data Engineer',
    category: 'AI & Data',
    description: 'Build and maintain data infrastructure and pipelines',
    provider: 'claude',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=data-engineer',
    skills: ['Data Pipelines', 'ETL', 'Big Data', 'Apache Spark', 'Data Warehousing'],
    specialty: 'Data engineering and infrastructure',
    fitLevel: 'excellent',
    defaultTools: ['code_interpreter', 'web_search', 'analyze_file']
  },
  {
    id: 'emp-048',
    name: 'Analytics Engineer',
    role: 'Analytics Engineer',
    category: 'AI & Data',
    description: 'Transform raw data into actionable business insights',
    provider: 'claude',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=analytics-engineer',
    skills: ['SQL', 'dbt', 'Data Modeling', 'Analytics', 'Business Intelligence'],
    specialty: 'Analytics engineering and data modeling',
    fitLevel: 'excellent',
    defaultTools: ['code_interpreter', 'analyze_file', 'create_visualization', 'web_search']
  },
  {
    id: 'emp-049',
    name: 'MLOps Engineer',
    role: 'MLOps Engineer',
    category: 'AI & Data',
    description: 'Deploy and maintain machine learning systems in production',
    provider: 'claude',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mlops-engineer',
    skills: ['MLOps', 'Model Deployment', 'Docker', 'Kubernetes', 'ML Infrastructure'],
    specialty: 'Machine learning operations and deployment',
    fitLevel: 'excellent',
    defaultTools: ['code_interpreter', 'web_search', 'api_call', 'analyze_file']
  },

  // Additional Support & Customer Success
  {
    id: 'emp-050',
    name: 'Customer Success Manager',
    role: 'Customer Success Manager',
    category: 'Support',
    description: 'Ensure customer satisfaction and drive retention',
    provider: 'chatgpt',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=customer-success-manager',
    skills: ['Customer Success', 'Account Management', 'Retention', 'Upselling'],
    specialty: 'Customer success and retention',
    fitLevel: 'excellent',
    defaultTools: ['web_search', 'analyze_file']
  },
  {
    id: 'emp-051',
    name: 'Technical Support Engineer',
    role: 'Technical Support Engineer',
    category: 'Support',
    description: 'Provide technical support and troubleshooting assistance',
    provider: 'claude',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=technical-support-engineer',
    skills: ['Technical Support', 'Troubleshooting', 'API Support', 'Documentation'],
    specialty: 'Technical support and troubleshooting',
    fitLevel: 'excellent',
    defaultTools: ['web_search', 'code_interpreter', 'analyze_file']
  }
];

// Helper functions
export const getEmployeesByCategory = (category: string): AIEmployee[] => {
  if (category === 'all') return AI_EMPLOYEES;
  return AI_EMPLOYEES.filter(emp => emp.category === category);
};

export const getEmployeesByProvider = (provider: AIProvider): AIEmployee[] => {
  return AI_EMPLOYEES.filter(emp => emp.provider === provider);
};

export const getEmployeeById = (id: string): AIEmployee | undefined => {
  return AI_EMPLOYEES.find(emp => emp.id === id);
};

export const categories = [
  { id: 'all', label: 'All Employees', count: AI_EMPLOYEES.length },
  { id: 'Executive', label: 'Executive Leadership', count: AI_EMPLOYEES.filter(e => e.category === 'Executive').length },
  { id: 'Engineering', label: 'Engineering & Tech', count: AI_EMPLOYEES.filter(e => e.category === 'Engineering').length },
  { id: 'Product', label: 'Product Management', count: AI_EMPLOYEES.filter(e => e.category === 'Product').length },
  { id: 'AI & Data', label: 'AI & Data Science', count: AI_EMPLOYEES.filter(e => e.category === 'AI & Data').length },
  { id: 'IT & Operations', label: 'IT & Operations', count: AI_EMPLOYEES.filter(e => e.category === 'IT & Operations').length },
  { id: 'Business', label: 'Business & Sales', count: AI_EMPLOYEES.filter(e => e.category === 'Business').length },
  { id: 'Finance', label: 'Finance & Accounting', count: AI_EMPLOYEES.filter(e => e.category === 'Finance').length },
  { id: 'Human Resources', label: 'Human Resources', count: AI_EMPLOYEES.filter(e => e.category === 'Human Resources').length },
  { id: 'Legal', label: 'Legal & Compliance', count: AI_EMPLOYEES.filter(e => e.category === 'Legal').length },
  { id: 'Operations', label: 'Operations & PM', count: AI_EMPLOYEES.filter(e => e.category === 'Operations').length },
  { id: 'Marketing', label: 'Marketing & Growth', count: AI_EMPLOYEES.filter(e => e.category === 'Marketing').length },
  { id: 'Design', label: 'Design & Creative', count: AI_EMPLOYEES.filter(e => e.category === 'Design' || e.category === 'Creative').length },
  { id: 'Research', label: 'Research & Analysis', count: AI_EMPLOYEES.filter(e => e.category === 'Research').length },
  { id: 'Support', label: 'Customer Success', count: AI_EMPLOYEES.filter(e => e.category === 'Support').length },
  { id: 'Documentation', label: 'Documentation', count: AI_EMPLOYEES.filter(e => e.category === 'Documentation').length },
];

export const providerInfo = {
  chatgpt: {
    name: 'ChatGPT',
    description: 'Best for general assistance, content creation, and customer communication',
    color: 'green'
  },
  claude: {
    name: 'Claude',
    description: 'Excellent for coding, complex analysis, and technical tasks',
    color: 'purple'
  },
  gemini: {
    name: 'Gemini',
    description: 'Ideal for image generation, video content, and creative work',
    color: 'blue'
  },
  perplexity: {
    name: 'Perplexity',
    description: 'Perfect for research, fact-checking, and information gathering',
    color: 'orange'
  }
};
