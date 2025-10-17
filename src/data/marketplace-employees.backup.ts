/**
 * Marketplace Employee Data - Temporary stub for marketplace display
 * TODO: Replace with dynamic loading from systemPromptsService or backend
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
  originalPrice: number;
  avatar: string;
  skills: string[];
  specialty: string;
  fitLevel: 'excellent' | 'good';
  popular?: boolean;
}

// Stub data - in production, load from .agi/employees/ or backend
export const AI_EMPLOYEES: AIEmployee[] = [
  {
    id: 'emp-code-reviewer',
    name: 'Code Reviewer',
    role: 'Code Reviewer',
    category: 'Engineering',
    description:
      'Expert code review specialist ensuring quality, security, and maintainability',
    provider: 'claude',
    price: 0,
    originalPrice: 20,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=code-reviewer',
    skills: ['Code Review', 'Security', 'Best Practices', 'Documentation'],
    specialty: 'Code quality and security analysis',
    fitLevel: 'excellent',
    popular: true,
  },
  {
    id: 'emp-debugger',
    name: 'Debugger',
    role: 'Debugging Specialist',
    category: 'Engineering',
    description:
      'Debugging specialist for errors, test failures, and unexpected behavior',
    provider: 'claude',
    price: 0,
    originalPrice: 20,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=debugger',
    skills: ['Debugging', 'Root Cause Analysis', 'Testing', 'Problem Solving'],
    specialty: 'Error diagnosis and resolution',
    fitLevel: 'excellent',
    popular: true,
  },
  {
    id: 'emp-product-manager',
    name: 'Product Manager',
    role: 'Product Manager',
    category: 'Product',
    description:
      'Strategic product manager for roadmap planning, feature prioritization, and stakeholder management',
    provider: 'chatgpt',
    price: 29,
    originalPrice: 49,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=product-manager',
    skills: ['Product Strategy', 'Roadmapping', 'User Research', 'Analytics'],
    specialty: 'Product strategy and execution',
    fitLevel: 'excellent',
    popular: true,
  },
  {
    id: 'emp-data-analyst',
    name: 'Data Analyst',
    role: 'Data Analyst',
    category: 'Data',
    description:
      'Expert data analyst for insights, visualization, and data-driven decision making',
    provider: 'chatgpt',
    price: 39,
    originalPrice: 59,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=data-analyst',
    skills: ['SQL', 'Python', 'Data Visualization', 'Statistical Analysis'],
    specialty: 'Data analysis and insights',
    fitLevel: 'excellent',
    popular: false,
  },
  {
    id: 'emp-ui-designer',
    name: 'UI Designer',
    role: 'UI/UX Designer',
    category: 'Design',
    description:
      'Creative UI/UX designer for interfaces, user flows, and design systems',
    provider: 'gemini',
    price: 34,
    originalPrice: 54,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ui-designer',
    skills: ['UI Design', 'UX Research', 'Prototyping', 'Design Systems'],
    specialty: 'User interface and experience design',
    fitLevel: 'good',
    popular: true,
  },
  {
    id: 'emp-content-writer',
    name: 'Content Writer',
    role: 'Content Writer',
    category: 'Marketing',
    description:
      'Professional content writer for blogs, documentation, and marketing copy',
    provider: 'claude',
    price: 24,
    originalPrice: 44,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=content-writer',
    skills: ['Copywriting', 'SEO', 'Content Strategy', 'Editing'],
    specialty: 'Content creation and optimization',
    fitLevel: 'excellent',
    popular: false,
  },
  {
    id: 'emp-devops-engineer',
    name: 'DevOps Engineer',
    role: 'DevOps Engineer',
    category: 'Engineering',
    description:
      'DevOps specialist for CI/CD, infrastructure, deployment automation, and monitoring',
    provider: 'chatgpt',
    price: 44,
    originalPrice: 64,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=devops-engineer',
    skills: ['Docker', 'Kubernetes', 'CI/CD', 'Cloud Infrastructure'],
    specialty: 'Infrastructure and deployment automation',
    fitLevel: 'excellent',
    popular: true,
  },
  {
    id: 'emp-qa-tester',
    name: 'QA Tester',
    role: 'QA Engineer',
    category: 'Engineering',
    description:
      'Quality assurance specialist for test planning, automation, and bug detection',
    provider: 'gemini',
    price: 29,
    originalPrice: 49,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=qa-tester',
    skills: [
      'Test Automation',
      'Manual Testing',
      'Bug Tracking',
      'QA Strategy',
    ],
    specialty: 'Quality assurance and testing',
    fitLevel: 'good',
    popular: false,
  },
  {
    id: 'emp-marketing-specialist',
    name: 'Marketing Specialist',
    role: 'Marketing Specialist',
    category: 'Marketing',
    description:
      'Strategic marketing expert for campaigns, social media, and growth strategies',
    provider: 'claude',
    price: 34,
    originalPrice: 54,
    avatar:
      'https://api.dicebear.com/7.x/avataaars/svg?seed=marketing-specialist',
    skills: [
      'Digital Marketing',
      'Social Media',
      'Analytics',
      'Campaign Management',
    ],
    specialty: 'Marketing strategy and execution',
    fitLevel: 'excellent',
    popular: true,
  },
  {
    id: 'emp-business-analyst',
    name: 'Business Analyst',
    role: 'Business Analyst',
    category: 'Business',
    description:
      'Business analyst for requirements gathering, process optimization, and stakeholder communication',
    provider: 'chatgpt',
    price: 32,
    originalPrice: 52,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=business-analyst',
    skills: [
      'Requirements Analysis',
      'Process Mapping',
      'Stakeholder Management',
      'Documentation',
    ],
    specialty: 'Business analysis and requirements',
    fitLevel: 'good',
    popular: false,
  },
  {
    id: 'emp-tech-writer',
    name: 'Technical Writer',
    role: 'Technical Writer',
    category: 'Documentation',
    description:
      'Technical writer for API docs, user guides, and developer documentation',
    provider: 'claude',
    price: 27,
    originalPrice: 47,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tech-writer',
    skills: [
      'Technical Writing',
      'API Documentation',
      'Tutorials',
      'User Guides',
    ],
    specialty: 'Technical documentation and guides',
    fitLevel: 'excellent',
    popular: false,
  },
  {
    id: 'emp-security-specialist',
    name: 'Security Specialist',
    role: 'Security Engineer',
    category: 'Engineering',
    description:
      'Cybersecurity expert for vulnerability assessment, penetration testing, and security audits',
    provider: 'claude',
    price: 49,
    originalPrice: 69,
    avatar:
      'https://api.dicebear.com/7.x/avataaars/svg?seed=security-specialist',
    skills: [
      'Security Auditing',
      'Penetration Testing',
      'Compliance',
      'Threat Analysis',
    ],
    specialty: 'Cybersecurity and compliance',
    fitLevel: 'excellent',
    popular: true,
  },
];

export const categories = [
  { id: 'all', label: 'All Categories', count: AI_EMPLOYEES.length },
  {
    id: 'Engineering',
    label: 'Engineering',
    count: AI_EMPLOYEES.filter((e) => e.category === 'Engineering').length,
  },
];

export const providerInfo = {
  chatgpt: { name: 'ChatGPT' },
  claude: { name: 'Claude' },
  gemini: { name: 'Gemini' },
  perplexity: { name: 'Perplexity' },
};

export const getEmployeesByCategory = (category: string) => {
  if (category === 'all') return AI_EMPLOYEES;
  return AI_EMPLOYEES.filter((e) => e.category === category);
};
