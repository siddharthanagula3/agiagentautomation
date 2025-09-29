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
}

export const AI_EMPLOYEES: AIEmployee[] = [
  // Engineering & Technology - Claude for coding
  {
    id: 'emp-001',
    name: 'Alex Chen',
    role: 'Software Architect',
    category: 'Engineering',
    description: 'Design scalable system architectures and lead technical decisions',
    provider: 'claude',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex-chen',
    skills: ['System Design', 'Architecture', 'Scalability', 'Cloud Infrastructure'],
    specialty: 'System architecture and technical leadership',
    fitLevel: 'excellent'
  },
  {
    id: 'emp-002',
    name: 'Sarah Kim',
    role: 'Solutions Architect',
    category: 'Engineering',
    description: 'Create end-to-end technical solutions for complex business problems',
    provider: 'claude',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah-kim',
    skills: ['Solution Design', 'Technical Strategy', 'Integration', 'Best Practices'],
    specialty: 'Enterprise solution architecture',
    fitLevel: 'excellent'
  },
  {
    id: 'emp-003',
    name: 'Marcus Johnson',
    role: 'Backend Engineer',
    category: 'Engineering',
    description: 'Build robust APIs, databases, and server-side logic',
    provider: 'claude',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcus-johnson',
    skills: ['Node.js', 'Python', 'Databases', 'API Design', 'Microservices'],
    specialty: 'Backend development and API design',
    fitLevel: 'excellent'
  },
  {
    id: 'emp-004',
    name: 'Emma Rodriguez',
    role: 'Frontend Engineer',
    category: 'Engineering',
    description: 'Create beautiful, responsive user interfaces with modern frameworks',
    provider: 'chatgpt',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma-rodriguez',
    skills: ['React', 'TypeScript', 'CSS', 'UI/UX', 'Performance'],
    specialty: 'Modern frontend development',
    fitLevel: 'excellent'
  },
  {
    id: 'emp-005',
    name: 'David Park',
    role: 'Full-Stack Engineer',
    category: 'Engineering',
    description: 'Build complete applications from frontend to backend',
    provider: 'claude',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david-park',
    skills: ['React', 'Node.js', 'Databases', 'DevOps', 'Full Stack'],
    specialty: 'End-to-end application development',
    fitLevel: 'excellent'
  },
  
  // Product Management - ChatGPT for communication
  {
    id: 'emp-006',
    name: 'Lisa Martinez',
    role: 'Product Manager',
    category: 'Product',
    description: 'Define product strategy, roadmaps, and drive feature development',
    provider: 'chatgpt',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisa-martinez',
    skills: ['Product Strategy', 'Roadmapping', 'User Research', 'Analytics'],
    specialty: 'Product strategy and execution',
    fitLevel: 'excellent'
  },
  {
    id: 'emp-007',
    name: 'Ryan Thompson',
    role: 'Technical Product Manager',
    category: 'Product',
    description: 'Bridge technical and business requirements for complex products',
    provider: 'chatgpt',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ryan-thompson',
    skills: ['Technical Requirements', 'API Strategy', 'Developer Experience'],
    specialty: 'Technical product management',
    fitLevel: 'excellent'
  },
  
  // AI, Data Science & Analytics - Claude for analysis
  {
    id: 'emp-008',
    name: 'Dr. Priya Sharma',
    role: 'Data Scientist',
    category: 'AI & Data',
    description: 'Analyze data, build ML models, and derive actionable insights',
    provider: 'claude',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya-sharma',
    skills: ['Machine Learning', 'Python', 'Statistics', 'Data Visualization'],
    specialty: 'Data science and ML engineering',
    fitLevel: 'excellent'
  },
  {
    id: 'emp-009',
    name: 'James Wilson',
    role: 'AI Engineer',
    category: 'AI & Data',
    description: 'Build and deploy AI/ML systems and neural networks',
    provider: 'claude',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james-wilson',
    skills: ['Deep Learning', 'PyTorch', 'TensorFlow', 'NLP', 'Computer Vision'],
    specialty: 'AI/ML system development',
    fitLevel: 'excellent'
  },
  {
    id: 'emp-010',
    name: 'Ana Garcia',
    role: 'BI Analyst',
    category: 'AI & Data',
    description: 'Transform data into actionable business intelligence',
    provider: 'claude',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ana-garcia',
    skills: ['SQL', 'Tableau', 'Power BI', 'Data Analysis', 'Reporting'],
    specialty: 'Business intelligence and analytics',
    fitLevel: 'excellent'
  },
  
  // IT, Security & Operations
  {
    id: 'emp-011',
    name: 'Kevin Chen',
    role: 'DevOps Engineer',
    category: 'IT & Operations',
    description: 'Automate deployments, manage infrastructure, and ensure reliability',
    provider: 'claude',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kevin-chen',
    skills: ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Terraform'],
    specialty: 'DevOps and infrastructure automation',
    fitLevel: 'excellent'
  },
  {
    id: 'emp-012',
    name: 'Sophia Lee',
    role: 'Security Analyst',
    category: 'IT & Operations',
    description: 'Identify vulnerabilities, monitor threats, and secure systems',
    provider: 'claude',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sophia-lee',
    skills: ['Security Audits', 'Penetration Testing', 'Compliance', 'Risk Assessment'],
    specialty: 'Cybersecurity and threat analysis',
    fitLevel: 'excellent'
  },
  
  // Marketing & Growth - ChatGPT for content
  {
    id: 'emp-013',
    name: 'Michael Brown',
    role: 'Content Marketing Manager',
    category: 'Marketing',
    description: 'Create compelling content that drives engagement and conversions',
    provider: 'chatgpt',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=michael-brown',
    skills: ['Content Strategy', 'Copywriting', 'SEO', 'Social Media'],
    specialty: 'Content marketing and strategy',
    fitLevel: 'excellent'
  },
  {
    id: 'emp-014',
    name: 'Jessica Taylor',
    role: 'SEO Manager',
    category: 'Marketing',
    description: 'Optimize websites for search engines and drive organic traffic',
    provider: 'chatgpt',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jessica-taylor',
    skills: ['SEO', 'Keyword Research', 'Technical SEO', 'Link Building'],
    specialty: 'Search engine optimization',
    fitLevel: 'excellent'
  },
  
  // Creative & Design - Gemini for visual
  {
    id: 'emp-015',
    name: 'Oliver Martinez',
    role: 'UI/UX Designer',
    category: 'Design',
    description: 'Design beautiful, intuitive user experiences',
    provider: 'chatgpt',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=oliver-martinez',
    skills: ['Figma', 'User Research', 'Wireframing', 'Prototyping', 'Design Systems'],
    specialty: 'User interface and experience design',
    fitLevel: 'good'
  },
  {
    id: 'emp-016',
    name: 'Isabella Chen',
    role: 'Video Content Creator',
    category: 'Creative',
    description: 'Plan, script, and conceptualize engaging video content',
    provider: 'gemini',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=isabella-chen',
    skills: ['Video Strategy', 'Scripting', 'Storyboarding', 'Content Planning'],
    specialty: 'Video content creation and strategy',
    fitLevel: 'good'
  },
  
  // Research - Perplexity
  {
    id: 'emp-017',
    name: 'Dr. Rachel Green',
    role: 'Research Analyst',
    category: 'Research',
    description: 'Conduct comprehensive research and competitive analysis',
    provider: 'perplexity',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rachel-green',
    skills: ['Market Research', 'Competitive Analysis', 'Data Gathering', 'Report Writing'],
    specialty: 'Research and competitive intelligence',
    fitLevel: 'excellent'
  },
  
  // Customer Support - ChatGPT
  {
    id: 'emp-018',
    name: 'Emily White',
    role: 'Customer Support Specialist',
    category: 'Support',
    description: 'Provide excellent customer service and resolve issues',
    provider: 'chatgpt',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily-white',
    skills: ['Customer Service', 'Problem Solving', 'Communication', 'CRM'],
    specialty: 'Customer support and success',
    fitLevel: 'excellent'
  },
  
  // QA & Testing - Claude
  {
    id: 'emp-019',
    name: 'Nathan Davis',
    role: 'QA Engineer',
    category: 'Engineering',
    description: 'Ensure software quality through comprehensive testing',
    provider: 'claude',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nathan-davis',
    skills: ['Test Automation', 'QA Processes', 'Bug Tracking', 'Quality Assurance'],
    specialty: 'Quality assurance and testing',
    fitLevel: 'excellent'
  },
  
  // Technical Writing - ChatGPT
  {
    id: 'emp-020',
    name: 'Victoria Moore',
    role: 'Technical Writer',
    category: 'Documentation',
    description: 'Create clear, comprehensive technical documentation',
    provider: 'chatgpt',
    price: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=victoria-moore',
    skills: ['Technical Writing', 'Documentation', 'API Docs', 'User Guides'],
    specialty: 'Technical documentation and content',
    fitLevel: 'excellent'
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
  { id: 'Engineering', label: 'Engineering & Tech', count: AI_EMPLOYEES.filter(e => e.category === 'Engineering').length },
  { id: 'Product', label: 'Product Management', count: AI_EMPLOYEES.filter(e => e.category === 'Product').length },
  { id: 'AI & Data', label: 'AI & Data Science', count: AI_EMPLOYEES.filter(e => e.category === 'AI & Data').length },
  { id: 'IT & Operations', label: 'IT & Operations', count: AI_EMPLOYEES.filter(e => e.category === 'IT & Operations').length },
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
