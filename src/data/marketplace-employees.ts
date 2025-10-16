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
