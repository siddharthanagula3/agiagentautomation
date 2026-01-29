/**
 * Consulting Orchestrator - MGX/MetaGPT/CrewAI Inspired Multi-Agent System
 *
 * Core Philosophy: "Consult = SOP(Team)" - Structured Operating Procedures
 * applied to specialized AI consultants for comprehensive advice.
 *
 * Features:
 * - SOP-based workflows with structured outputs
 * - Role-based agents with goals, backstory, expertise
 * - Sequential, Parallel, and Hierarchical execution modes
 * - Race mode: Multiple agents solve same problem, best answer selected
 * - Domain-specific consulting: Health, Finance, Legal, Career, Tech, Life
 *
 * Inspired by:
 * - MGX (MetaGPT X): Multi-agent team with Race mode
 * - MetaGPT: SOPs for structured collaboration
 * - CrewAI: Role-based agents with goals and backstory
 */

import { unifiedLLMService } from '@core/ai/llm/unified-language-model';
import { employeeMemoryService } from '@core/ai/employees/employee-memory-service';
import { useMissionStore } from '@shared/stores/mission-control-store';
import { tokenLogger } from '@core/integrations/token-usage-tracker';

// ================================================
// TYPES - Agent Definition (CrewAI-inspired)
// ================================================

export interface ConsultantAgent {
  id: string;
  name: string;
  role: string;
  goal: string;
  backstory: string;
  expertise: string[];
  tools: string[];
  model: string;
  systemPrompt: string;
  outputSchema?: StructuredOutputSchema;
  // SOP: What this agent produces
  produces: string[];
  // SOP: What this agent requires from previous agents
  requires?: string[];
}

export interface StructuredOutputSchema {
  type: 'json' | 'markdown' | 'form';
  fields: OutputField[];
  template?: string;
}

export interface OutputField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
}

// ================================================
// TYPES - Consulting Workflows (SOP-based)
// ================================================

export interface ConsultingWorkflow {
  id: string;
  name: string;
  description: string;
  domain: ConsultingDomain;
  // SOP: Ordered steps with agents
  steps: WorkflowStep[];
  // Trigger patterns for auto-detection
  triggers: string[];
  // Expected final output
  outputSchema: StructuredOutputSchema;
  // Execution mode
  mode: 'sequential' | 'parallel' | 'hierarchical' | 'race';
  // Supervisor agent for hierarchical mode
  supervisor?: string;
}

export type ConsultingDomain =
  | 'health'
  | 'fitness'
  | 'nutrition'
  | 'finance'
  | 'legal'
  | 'career'
  | 'technology'
  | 'business'
  | 'education'
  | 'lifestyle'
  | 'mental_health'
  | 'relationships';

export interface WorkflowStep {
  id: string;
  agentId: string;
  name: string;
  description: string;
  // SOP: Required inputs from previous steps
  requires?: string[];
  // SOP: Outputs this step produces
  produces: string[];
  // Optional: Specific instructions for this step
  instructions?: string;
  // Can this step run in parallel with others?
  parallel?: boolean;
  // Is this step optional?
  optional?: boolean;
}

// ================================================
// TYPES - Execution
// ================================================

export interface ConsultationRequest {
  userId: string;
  sessionId: string;
  query: string;
  domain?: ConsultingDomain;
  workflowId?: string;
  preferredAgents?: string[];
  mode?: 'sequential' | 'parallel' | 'hierarchical' | 'race';
  context?: Record<string, unknown>;
}

export interface ConsultationResult {
  success: boolean;
  sessionId: string;
  workflowId: string;
  domain: ConsultingDomain;
  mode: string;
  // Final synthesized result
  result: StructuredConsultationOutput;
  // Individual agent contributions
  contributions: AgentContribution[];
  // If race mode, shows all competing results
  raceResults?: RaceResult[];
  // Metadata
  metadata: {
    totalTokens: number;
    totalCost: number;
    executionTime: number;
    agentsUsed: string[];
  };
  error?: string;
}

export interface AgentContribution {
  agentId: string;
  agentName: string;
  role: string;
  stepId: string;
  input: string;
  output: string;
  structuredOutput?: Record<string, unknown>;
  tokensUsed: number;
  executionTime: number;
  timestamp: Date;
}

export interface RaceResult {
  agentId: string;
  agentName: string;
  output: string;
  score: number;
  selected: boolean;
  reasoning?: string;
}

export interface StructuredConsultationOutput {
  summary: string;
  recommendations: Recommendation[];
  actionItems: ActionItem[];
  warnings?: string[];
  nextSteps?: string[];
  data?: Record<string, unknown>;
}

export interface Recommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  rationale: string;
  source: string; // Which agent provided this
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  deadline?: string;
  assignedTo?: string;
  status: 'pending' | 'in_progress' | 'completed';
}

// ================================================
// CONSULTANT AGENTS DATABASE
// ================================================

const CONSULTANT_AGENTS: Record<string, ConsultantAgent> = {
  // === HEALTH & FITNESS DOMAIN ===
  'fitness-trainer': {
    id: 'fitness-trainer',
    name: 'Alex Fit',
    role: 'Personal Fitness Trainer',
    goal: 'Create personalized workout plans that match your fitness level, goals, and lifestyle',
    backstory: `You are Alex, a certified personal trainer with 15 years of experience.
You've trained everyone from beginners to Olympic athletes. Your specialty is creating
sustainable fitness programs that people actually stick to. You believe fitness should
enhance life, not dominate it. You always consider injury prevention, progressive overload,
and recovery in your recommendations.`,
    expertise: [
      'workout_planning',
      'strength_training',
      'cardio',
      'flexibility',
      'injury_prevention',
      'sports_specific',
    ],
    tools: ['exercise_database', 'fitness_calculator', 'progress_tracker'],
    model: 'claude-3-5-sonnet-20241022',
    systemPrompt: `You are Alex Fit, a professional fitness trainer. When consulting:
1. Always assess current fitness level and any limitations first
2. Ask about goals, available equipment, and time commitment
3. Create detailed workout plans with sets, reps, and rest periods
4. Include warm-up and cool-down routines
5. Provide exercise substitutions for different equipment availability
6. Consider recovery and rest days in your planning
7. Output structured workout plans that can be tracked`,
    produces: [
      'workout_plan',
      'exercise_list',
      'training_schedule',
      'fitness_assessment',
    ],
  },

  dietitian: {
    id: 'dietitian',
    name: 'Dr. Sarah Nutrition',
    role: 'Registered Dietitian',
    goal: 'Provide evidence-based nutrition guidance tailored to individual health goals and dietary needs',
    backstory: `You are Dr. Sarah, a registered dietitian with a PhD in nutritional science.
You've helped thousands of clients achieve their health goals through personalized nutrition plans.
You believe in sustainable eating habits, not fad diets. You stay current with the latest
nutritional research and always consider individual health conditions, preferences, and cultural
food practices.`,
    expertise: [
      'meal_planning',
      'macronutrients',
      'micronutrients',
      'weight_management',
      'sports_nutrition',
      'medical_nutrition',
    ],
    tools: ['nutrition_database', 'calorie_calculator', 'meal_planner'],
    model: 'claude-3-5-sonnet-20241022',
    systemPrompt: `You are Dr. Sarah, a registered dietitian. When consulting:
1. Assess dietary history, allergies, and medical conditions first
2. Calculate caloric needs based on goals and activity level
3. Create balanced meal plans with specific portions and timing
4. Include macro and micronutrient breakdowns
5. Provide healthy alternatives for favorite foods
6. Consider budget, cooking skill, and time availability
7. Never recommend extreme or dangerous diets
8. Output structured meal plans with nutritional information`,
    produces: [
      'diet_plan',
      'meal_schedule',
      'calorie_target',
      'macro_breakdown',
      'grocery_list',
    ],
    requires: ['fitness_assessment', 'workout_plan'],
  },

  'chef-consultant': {
    id: 'chef-consultant',
    name: 'Chef Marco',
    role: 'Professional Chef & Meal Prep Expert',
    goal: 'Transform diet plans into delicious, practical meals that are easy to prepare',
    backstory: `You are Chef Marco, a culinary school graduate with 20 years of restaurant
experience. You've transitioned to helping people eat healthy without sacrificing flavor.
Your specialty is making nutritious food taste amazing and teaching efficient meal prep
techniques. You believe that healthy eating should be enjoyable, not a punishment.`,
    expertise: [
      'recipe_development',
      'meal_prep',
      'cooking_techniques',
      'flavor_balancing',
      'time_saving_cooking',
    ],
    tools: ['recipe_database', 'cooking_timer', 'substitution_guide'],
    model: 'claude-3-5-sonnet-20241022',
    systemPrompt: `You are Chef Marco, a professional chef. When consulting:
1. Take the diet plan and create delicious recipes that match the requirements
2. Consider cooking skill level and available equipment
3. Provide detailed step-by-step cooking instructions
4. Include meal prep tips to save time during the week
5. Suggest ingredient substitutions for preferences or availability
6. Calculate prep time and cooking time for each recipe
7. Create shopping lists organized by grocery store section
8. Output structured recipes with ingredients, instructions, and timing`,
    produces: [
      'recipes',
      'cooking_instructions',
      'prep_schedule',
      'shopping_list',
    ],
    requires: ['diet_plan', 'meal_schedule'],
  },

  // === MENTAL HEALTH DOMAIN ===
  'mental-health-counselor': {
    id: 'mental-health-counselor',
    name: 'Dr. Emily Wellness',
    role: 'Licensed Mental Health Counselor',
    goal: 'Provide compassionate mental health support and evidence-based coping strategies',
    backstory: `You are Dr. Emily, a licensed mental health counselor with specializations in
anxiety, depression, and stress management. You use a combination of CBT, mindfulness, and
positive psychology in your approach. You create a safe, non-judgmental space for clients
while providing practical tools for mental wellness.`,
    expertise: [
      'anxiety_management',
      'depression_support',
      'stress_reduction',
      'mindfulness',
      'coping_strategies',
      'emotional_regulation',
    ],
    tools: ['mood_tracker', 'mindfulness_exercises', 'journal_prompts'],
    model: 'claude-3-5-sonnet-20241022',
    systemPrompt: `You are Dr. Emily, a mental health counselor. When consulting:
1. Create a safe, empathetic space for discussion
2. Use active listening and validation techniques
3. Provide evidence-based coping strategies
4. Teach practical mindfulness and grounding techniques
5. Help identify thought patterns and reframe negative thinking
6. Always encourage professional in-person help for serious issues
7. Never diagnose conditions - that requires in-person evaluation
8. Output structured wellness plans with daily practices`,
    produces: [
      'wellness_plan',
      'coping_strategies',
      'mindfulness_exercises',
      'self_care_routine',
    ],
  },

  // === FINANCE DOMAIN ===
  'financial-advisor': {
    id: 'financial-advisor',
    name: 'James Wealth',
    role: 'Certified Financial Planner',
    goal: 'Help clients achieve financial security through smart planning and investment strategies',
    backstory: `You are James, a CFP with 20 years in wealth management. You've helped
clients navigate everything from starting their first budget to retirement planning.
You believe in financial education and empowering clients to make informed decisions.
Your approach balances growth with risk management based on individual circumstances.`,
    expertise: [
      'budgeting',
      'investing',
      'retirement_planning',
      'debt_management',
      'tax_optimization',
      'estate_planning',
    ],
    tools: ['budget_calculator', 'investment_analyzer', 'retirement_projector'],
    model: 'claude-3-5-sonnet-20241022',
    systemPrompt: `You are James, a financial advisor. When consulting:
1. Assess current financial situation, income, expenses, debts, and assets
2. Understand short-term and long-term financial goals
3. Create realistic budgets and savings plans
4. Recommend investment strategies based on risk tolerance and timeline
5. Explain concepts in plain language, not financial jargon
6. Always mention that this is educational, not personalized financial advice
7. Recommend consulting a licensed advisor for major decisions
8. Output structured financial plans with actionable steps`,
    produces: [
      'financial_plan',
      'budget',
      'investment_strategy',
      'savings_goals',
      'debt_payoff_plan',
    ],
  },

  'tax-specialist': {
    id: 'tax-specialist',
    name: 'Patricia Tax',
    role: 'Enrolled Agent & Tax Specialist',
    goal: 'Maximize tax efficiency while ensuring full compliance with tax laws',
    backstory: `You are Patricia, an Enrolled Agent with expertise in individual and small
business taxation. You've helped clients save thousands through legal tax strategies.
You stay current with ever-changing tax laws and love finding legitimate deductions
that clients often miss.`,
    expertise: [
      'tax_planning',
      'deductions',
      'credits',
      'business_taxes',
      'retirement_tax_strategies',
    ],
    tools: ['tax_calculator', 'deduction_finder', 'tax_calendar'],
    model: 'claude-3-5-sonnet-20241022',
    systemPrompt: `You are Patricia, a tax specialist. When consulting:
1. Understand income sources, filing status, and deduction eligibility
2. Identify commonly missed deductions and credits
3. Recommend tax-advantaged accounts and strategies
4. Provide estimated tax calculations
5. Always note that this is educational guidance, not tax advice
6. Recommend consulting a CPA or tax professional for filing
7. Output structured tax planning recommendations`,
    produces: [
      'tax_strategy',
      'deduction_list',
      'estimated_taxes',
      'tax_calendar',
    ],
    requires: ['financial_plan', 'income_details'],
  },

  // === LEGAL DOMAIN ===
  'legal-advisor': {
    id: 'legal-advisor',
    name: 'Attorney Michael Justice',
    role: 'General Legal Consultant',
    goal: 'Provide legal information and help understand rights and options in various legal matters',
    backstory: `You are Attorney Michael, with experience in business law, contracts,
and general legal matters. You help people understand their legal rights and options.
You explain complex legal concepts in plain English and help people know when they
need to hire a lawyer.`,
    expertise: [
      'contracts',
      'business_law',
      'employment_law',
      'intellectual_property',
      'landlord_tenant',
    ],
    tools: ['legal_document_templates', 'law_database', 'deadline_calculator'],
    model: 'claude-3-5-sonnet-20241022',
    systemPrompt: `You are Attorney Michael, a legal consultant. When consulting:
1. Listen to the situation and identify the legal issues involved
2. Explain relevant laws and rights in plain language
3. Outline options and potential consequences
4. Provide general legal information, NOT legal advice
5. Always recommend consulting a licensed attorney for specific situations
6. Never give advice on criminal matters - refer to criminal defense attorney
7. Help understand documents and contracts conceptually
8. Output structured legal information with next steps`,
    produces: [
      'legal_analysis',
      'rights_summary',
      'options_list',
      'document_review',
    ],
  },

  // === CAREER DOMAIN ===
  'career-coach': {
    id: 'career-coach',
    name: 'Diana Career',
    role: 'Executive Career Coach',
    goal: 'Help professionals advance their careers and find fulfilling work',
    backstory: `You are Diana, an executive career coach who has helped thousands of
professionals at all levels navigate career transitions, negotiations, and advancement.
You've worked with Fortune 500 executives and early-career professionals alike.
Your approach combines practical job search strategies with deeper career purpose work.`,
    expertise: [
      'career_planning',
      'resume_writing',
      'interview_prep',
      'salary_negotiation',
      'networking',
      'leadership_development',
    ],
    tools: ['resume_builder', 'interview_simulator', 'salary_database'],
    model: 'claude-3-5-sonnet-20241022',
    systemPrompt: `You are Diana, a career coach. When consulting:
1. Understand career history, goals, and values
2. Identify transferable skills and strengths
3. Provide specific, actionable career advice
4. Help with resume and LinkedIn optimization
5. Prepare for interviews with common questions and strategies
6. Research industry trends and opportunities
7. Help with salary negotiation strategies
8. Output structured career plans with timelines`,
    produces: [
      'career_plan',
      'resume_feedback',
      'interview_prep',
      'networking_strategy',
      'salary_research',
    ],
  },

  // === TECHNOLOGY DOMAIN ===
  'tech-advisor': {
    id: 'tech-advisor',
    name: 'Alex Tech',
    role: 'Senior Technology Consultant',
    goal: 'Provide expert guidance on technology decisions and implementations',
    backstory: `You are Alex, a tech consultant with 20 years of experience in software
development, system architecture, and digital transformation. You've led technology
initiatives at startups and enterprises. You excel at explaining complex technical
concepts to non-technical stakeholders.`,
    expertise: [
      'software_development',
      'system_architecture',
      'cloud_computing',
      'cybersecurity',
      'digital_transformation',
    ],
    tools: ['architecture_diagrams', 'tech_stack_analyzer', 'security_scanner'],
    model: 'claude-3-5-sonnet-20241022',
    systemPrompt: `You are Alex, a technology consultant. When consulting:
1. Understand business needs and technical requirements
2. Recommend appropriate technologies and architectures
3. Consider scalability, security, and maintainability
4. Provide cost estimates and timelines
5. Explain technical concepts in business terms
6. Output structured technical recommendations with diagrams where helpful`,
    produces: [
      'tech_recommendation',
      'architecture_plan',
      'implementation_roadmap',
      'cost_estimate',
    ],
  },

  // === BUSINESS DOMAIN ===
  'business-strategist': {
    id: 'business-strategist',
    name: 'Victoria Strategy',
    role: 'Business Strategy Consultant',
    goal: 'Help businesses grow through strategic planning and operational excellence',
    backstory: `You are Victoria, a former McKinsey consultant with expertise in business
strategy, market analysis, and operational improvement. You've helped startups scale
and enterprises transform. You bring a data-driven approach to business decisions.`,
    expertise: [
      'strategic_planning',
      'market_analysis',
      'operations',
      'growth_strategy',
      'competitive_analysis',
    ],
    tools: [
      'market_research',
      'financial_modeling',
      'competitive_intelligence',
    ],
    model: 'claude-3-5-sonnet-20241022',
    systemPrompt: `You are Victoria, a business strategist. When consulting:
1. Understand the business model, market, and competitive landscape
2. Analyze strengths, weaknesses, opportunities, and threats
3. Provide data-driven strategic recommendations
4. Create actionable business plans with metrics
5. Consider both short-term wins and long-term positioning
6. Output structured business plans with KPIs`,
    produces: [
      'business_plan',
      'market_analysis',
      'competitive_strategy',
      'growth_roadmap',
    ],
  },

  // === EDUCATION DOMAIN ===
  'education-consultant': {
    id: 'education-consultant',
    name: 'Professor Maria Learn',
    role: 'Education & Learning Consultant',
    goal: 'Help individuals maximize their learning potential and educational success',
    backstory: `You are Professor Maria, with 25 years in education as a teacher,
curriculum designer, and learning consultant. You specialize in personalized learning
strategies and study techniques. You believe everyone can learn effectively with the
right approach.`,
    expertise: [
      'learning_strategies',
      'study_techniques',
      'curriculum_design',
      'test_preparation',
      'academic_planning',
    ],
    tools: ['learning_assessment', 'study_planner', 'resource_library'],
    model: 'claude-3-5-sonnet-20241022',
    systemPrompt: `You are Professor Maria, an education consultant. When consulting:
1. Understand learning goals, style, and challenges
2. Assess current knowledge and skill gaps
3. Create personalized study plans
4. Recommend effective learning techniques
5. Provide resources and practice materials
6. Output structured learning plans with milestones`,
    produces: [
      'learning_plan',
      'study_schedule',
      'resource_list',
      'practice_exercises',
    ],
  },

  // === SUPERVISOR AGENT ===
  supervisor: {
    id: 'supervisor',
    name: 'Director Orchestrator',
    role: 'Consultation Supervisor',
    goal: 'Coordinate multiple consultants to provide comprehensive, cohesive advice',
    backstory: `You are the Director, overseeing a team of expert consultants. Your role
is to understand the client's needs, assign tasks to the right experts, synthesize
their advice into a coherent plan, and ensure the client gets comprehensive guidance.`,
    expertise: [
      'coordination',
      'synthesis',
      'quality_control',
      'client_needs_analysis',
    ],
    tools: ['agent_coordinator', 'quality_checker', 'synthesis_engine'],
    model: 'claude-3-5-sonnet-20241022',
    systemPrompt: `You are the Supervisor coordinating a team of expert consultants.
Your responsibilities:
1. Analyze the client's query to identify all relevant domains
2. Select the best consultants for each aspect of the query
3. Define the workflow and dependencies between consultants
4. Review and synthesize outputs from all consultants
5. Ensure advice is coherent, actionable, and comprehensive
6. Identify any gaps or conflicts in the advice
7. Present a unified consultation result to the client`,
    produces: ['consultation_synthesis', 'action_plan', 'recommendations'],
  },
};

// ================================================
// CONSULTING WORKFLOWS (SOPs)
// ================================================

const CONSULTING_WORKFLOWS: Record<string, ConsultingWorkflow> = {
  // === FITNESS CONSULTATION WORKFLOW ===
  'fitness-complete': {
    id: 'fitness-complete',
    name: 'Complete Fitness Consultation',
    description:
      'Comprehensive fitness consultation: workout plan, nutrition, and meal prep',
    domain: 'fitness',
    mode: 'sequential',
    triggers: [
      'fitness',
      'workout',
      'diet',
      'meal plan',
      'lose weight',
      'build muscle',
      'get fit',
      'nutrition',
    ],
    steps: [
      {
        id: 'fitness-assessment',
        agentId: 'fitness-trainer',
        name: 'Fitness Assessment & Workout Plan',
        description:
          'Assess fitness level and create personalized workout plan',
        produces: ['workout_plan', 'training_schedule', 'fitness_goals'],
      },
      {
        id: 'nutrition-plan',
        agentId: 'dietitian',
        name: 'Nutrition Planning',
        description: 'Create diet plan aligned with fitness goals',
        requires: ['fitness_goals', 'workout_plan'],
        produces: ['diet_plan', 'calorie_target', 'macro_breakdown'],
      },
      {
        id: 'meal-prep',
        agentId: 'chef-consultant',
        name: 'Meal Preparation',
        description: 'Create recipes and meal prep schedule',
        requires: ['diet_plan', 'calorie_target'],
        produces: ['recipes', 'shopping_list', 'prep_schedule'],
      },
    ],
    outputSchema: {
      type: 'json',
      fields: [
        {
          name: 'workoutPlan',
          type: 'object',
          description: 'Weekly workout schedule',
          required: true,
        },
        {
          name: 'dietPlan',
          type: 'object',
          description: 'Daily meal plan with macros',
          required: true,
        },
        {
          name: 'recipes',
          type: 'array',
          description: 'Recipe list with instructions',
          required: true,
        },
        {
          name: 'shoppingList',
          type: 'array',
          description: 'Weekly grocery list',
          required: true,
        },
      ],
    },
  },

  // === FINANCIAL PLANNING WORKFLOW ===
  'financial-complete': {
    id: 'financial-complete',
    name: 'Complete Financial Consultation',
    description:
      'Comprehensive financial planning: budget, investments, and tax strategy',
    domain: 'finance',
    mode: 'sequential',
    triggers: [
      'financial',
      'budget',
      'invest',
      'retirement',
      'savings',
      'money',
      'taxes',
      'wealth',
    ],
    steps: [
      {
        id: 'financial-assessment',
        agentId: 'financial-advisor',
        name: 'Financial Assessment',
        description: 'Assess financial situation and create plan',
        produces: ['financial_plan', 'budget', 'investment_strategy'],
      },
      {
        id: 'tax-planning',
        agentId: 'tax-specialist',
        name: 'Tax Optimization',
        description: 'Optimize tax strategy based on financial plan',
        requires: ['financial_plan', 'budget'],
        produces: ['tax_strategy', 'deduction_list'],
      },
    ],
    outputSchema: {
      type: 'json',
      fields: [
        {
          name: 'budget',
          type: 'object',
          description: 'Monthly budget breakdown',
          required: true,
        },
        {
          name: 'investmentPlan',
          type: 'object',
          description: 'Investment allocation',
          required: true,
        },
        {
          name: 'taxStrategy',
          type: 'object',
          description: 'Tax optimization tips',
          required: true,
        },
      ],
    },
  },

  // === CAREER DEVELOPMENT WORKFLOW ===
  'career-development': {
    id: 'career-development',
    name: 'Career Development Consultation',
    description: 'Comprehensive career planning and job search strategy',
    domain: 'career',
    mode: 'sequential',
    triggers: [
      'career',
      'job',
      'resume',
      'interview',
      'promotion',
      'salary',
      'job search',
    ],
    steps: [
      {
        id: 'career-planning',
        agentId: 'career-coach',
        name: 'Career Planning',
        description: 'Develop career strategy and action plan',
        produces: ['career_plan', 'resume_feedback', 'interview_prep'],
      },
    ],
    outputSchema: {
      type: 'json',
      fields: [
        {
          name: 'careerPlan',
          type: 'object',
          description: 'Career development roadmap',
          required: true,
        },
        {
          name: 'actionItems',
          type: 'array',
          description: 'Immediate action items',
          required: true,
        },
      ],
    },
  },

  // === WELLNESS WORKFLOW ===
  'wellness-complete': {
    id: 'wellness-complete',
    name: 'Complete Wellness Consultation',
    description: 'Physical fitness, nutrition, and mental wellness combined',
    domain: 'health',
    mode: 'sequential',
    triggers: [
      'wellness',
      'health',
      'self-care',
      'wellbeing',
      'balanced',
      'healthy lifestyle',
    ],
    steps: [
      {
        id: 'mental-wellness',
        agentId: 'mental-health-counselor',
        name: 'Mental Wellness Assessment',
        description: 'Assess mental health and create wellness strategies',
        produces: ['wellness_plan', 'coping_strategies', 'self_care_routine'],
      },
      {
        id: 'fitness-plan',
        agentId: 'fitness-trainer',
        name: 'Fitness for Wellness',
        description: 'Create exercise plan that supports mental health',
        requires: ['wellness_plan'],
        produces: ['workout_plan', 'stress_relief_exercises'],
      },
      {
        id: 'nutrition-wellness',
        agentId: 'dietitian',
        name: 'Nutrition for Wellness',
        description: 'Create diet plan supporting mental and physical health',
        requires: ['wellness_plan', 'workout_plan'],
        produces: ['diet_plan', 'mood_boosting_foods'],
      },
    ],
    outputSchema: {
      type: 'json',
      fields: [
        {
          name: 'wellnessPlan',
          type: 'object',
          description: 'Integrated wellness approach',
          required: true,
        },
        {
          name: 'dailyRoutine',
          type: 'object',
          description: 'Daily wellness routine',
          required: true,
        },
        {
          name: 'selfCareChecklist',
          type: 'array',
          description: 'Self-care activities',
          required: true,
        },
      ],
    },
  },

  // === BUSINESS STARTUP WORKFLOW ===
  'business-startup': {
    id: 'business-startup',
    name: 'Business Startup Consultation',
    description: 'Start and grow a business: strategy, legal, and tech',
    domain: 'business',
    mode: 'hierarchical',
    supervisor: 'supervisor',
    triggers: ['startup', 'business', 'entrepreneur', 'company', 'launch'],
    steps: [
      {
        id: 'business-strategy',
        agentId: 'business-strategist',
        name: 'Business Strategy',
        description: 'Develop business model and strategy',
        produces: ['business_plan', 'market_analysis'],
        parallel: true,
      },
      {
        id: 'legal-setup',
        agentId: 'legal-advisor',
        name: 'Legal Setup',
        description: 'Legal considerations for starting a business',
        produces: ['legal_checklist', 'entity_recommendation'],
        parallel: true,
      },
      {
        id: 'tech-planning',
        agentId: 'tech-advisor',
        name: 'Technology Planning',
        description: 'Technical requirements and implementation',
        requires: ['business_plan'],
        produces: ['tech_stack', 'implementation_plan'],
      },
      {
        id: 'financial-planning',
        agentId: 'financial-advisor',
        name: 'Financial Planning',
        description: 'Startup finances and funding strategy',
        requires: ['business_plan'],
        produces: ['financial_projections', 'funding_strategy'],
      },
    ],
    outputSchema: {
      type: 'json',
      fields: [
        {
          name: 'businessPlan',
          type: 'object',
          description: 'Complete business plan',
          required: true,
        },
        {
          name: 'legalRequirements',
          type: 'array',
          description: 'Legal checklist',
          required: true,
        },
        {
          name: 'techPlan',
          type: 'object',
          description: 'Technology roadmap',
          required: true,
        },
        {
          name: 'financials',
          type: 'object',
          description: 'Financial projections',
          required: true,
        },
      ],
    },
  },

  // === RACE MODE EXAMPLE ===
  'quick-advice-race': {
    id: 'quick-advice-race',
    name: 'Quick Expert Advice (Race Mode)',
    description: 'Get quick advice from multiple experts, best answer selected',
    domain: 'lifestyle',
    mode: 'race',
    triggers: ['quick advice', 'best advice', 'multiple opinions'],
    steps: [
      {
        id: 'race-participants',
        agentId: 'supervisor', // Supervisor selects participants based on query
        name: 'Parallel Expert Consultation',
        description: 'Multiple experts answer simultaneously',
        produces: ['multiple_opinions'],
      },
    ],
    outputSchema: {
      type: 'json',
      fields: [
        {
          name: 'bestAnswer',
          type: 'object',
          description: 'Top-selected answer',
          required: true,
        },
        {
          name: 'alternativeViews',
          type: 'array',
          description: 'Other expert opinions',
          required: false,
        },
      ],
    },
  },
};

// ================================================
// CONSULTING ORCHESTRATOR CLASS
// ================================================

export class ConsultingOrchestrator {
  private static instance: ConsultingOrchestrator;
  private agents: Record<string, ConsultantAgent> = CONSULTANT_AGENTS;
  private workflows: Record<string, ConsultingWorkflow> = CONSULTING_WORKFLOWS;

  static getInstance(): ConsultingOrchestrator {
    if (!ConsultingOrchestrator.instance) {
      ConsultingOrchestrator.instance = new ConsultingOrchestrator();
    }
    return ConsultingOrchestrator.instance;
  }

  // ================================================
  // MAIN CONSULTATION METHOD
  // ================================================

  async startConsultation(
    request: ConsultationRequest
  ): Promise<ConsultationResult> {
    const startTime = Date.now();
    const store = useMissionStore.getState();

    try {
      // Step 1: Detect or select workflow
      const workflow = this.selectWorkflow(request);

      store.addMessage({
        from: 'system',
        type: 'system',
        content: `🎯 Starting consultation: **${workflow.name}**\n📋 Domain: ${workflow.domain}\n⚙️ Mode: ${workflow.mode}`,
      });

      // Step 2: Execute based on mode
      let result: ConsultationResult;

      switch (workflow.mode) {
        case 'sequential':
          result = await this.executeSequential(request, workflow);
          break;
        case 'parallel':
          result = await this.executeParallel(request, workflow);
          break;
        case 'hierarchical':
          result = await this.executeHierarchical(request, workflow);
          break;
        case 'race':
          result = await this.executeRace(request, workflow);
          break;
        default:
          result = await this.executeSequential(request, workflow);
      }

      result.metadata.executionTime = Date.now() - startTime;

      store.addMessage({
        from: 'system',
        type: 'system',
        content: `✅ Consultation complete! ${result.contributions.length} experts consulted in ${(result.metadata.executionTime / 1000).toFixed(1)}s`,
      });

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      store.addMessage({
        from: 'system',
        type: 'error',
        content: `❌ Consultation failed: ${errorMessage}`,
      });

      return {
        success: false,
        sessionId: request.sessionId,
        workflowId: request.workflowId || 'unknown',
        domain: request.domain || 'lifestyle',
        mode: request.mode || 'sequential',
        result: {
          summary: 'Consultation failed',
          recommendations: [],
          actionItems: [],
        },
        contributions: [],
        metadata: {
          totalTokens: 0,
          totalCost: 0,
          executionTime: Date.now() - startTime,
          agentsUsed: [],
        },
        error: errorMessage,
      };
    }
  }

  // ================================================
  // WORKFLOW SELECTION
  // ================================================

  private selectWorkflow(request: ConsultationRequest): ConsultingWorkflow {
    // If workflow specified, use it
    if (request.workflowId && this.workflows[request.workflowId]) {
      return this.workflows[request.workflowId];
    }

    // Auto-detect based on query
    const queryLower = request.query.toLowerCase();

    for (const workflow of Object.values(this.workflows)) {
      for (const trigger of workflow.triggers) {
        if (queryLower.includes(trigger.toLowerCase())) {
          return workflow;
        }
      }
    }

    // Default to a general consultation
    return this.createAdHocWorkflow(request);
  }

  private createAdHocWorkflow(
    request: ConsultationRequest
  ): ConsultingWorkflow {
    // Analyze query to select best agents
    const relevantAgents = this.selectRelevantAgents(
      request.query,
      request.preferredAgents
    );

    return {
      id: `adhoc-${Date.now()}`,
      name: 'Custom Consultation',
      description: 'Personalized consultation based on your query',
      domain: request.domain || 'lifestyle',
      mode: request.mode || 'sequential',
      triggers: [],
      steps: relevantAgents.map((agentId, index) => ({
        id: `step-${index}`,
        agentId,
        name: this.agents[agentId]?.name || agentId,
        description: `Consultation with ${this.agents[agentId]?.role || 'expert'}`,
        produces: this.agents[agentId]?.produces || ['advice'],
        requires: index > 0 ? [`step-${index - 1}`] : undefined,
      })),
      outputSchema: {
        type: 'json',
        fields: [
          {
            name: 'summary',
            type: 'string',
            description: 'Consultation summary',
            required: true,
          },
          {
            name: 'recommendations',
            type: 'array',
            description: 'Expert recommendations',
            required: true,
          },
        ],
      },
    };
  }

  private selectRelevantAgents(query: string, preferred?: string[]): string[] {
    if (preferred && preferred.length > 0) {
      return preferred.filter((id) => this.agents[id]);
    }

    const queryLower = query.toLowerCase();
    const scores: Record<string, number> = {};

    for (const [agentId, agent] of Object.entries(this.agents)) {
      if (agentId === 'supervisor') continue;

      let score = 0;

      // Check expertise keywords
      for (const expertise of agent.expertise) {
        if (queryLower.includes(expertise.replace(/_/g, ' '))) {
          score += 10;
        }
      }

      // Check role keywords
      const roleWords = agent.role.toLowerCase().split(/\s+/);
      for (const word of roleWords) {
        if (queryLower.includes(word) && word.length > 3) {
          score += 5;
        }
      }

      if (score > 0) {
        scores[agentId] = score;
      }
    }

    // Sort by score and take top 3
    const sorted = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id);

    // Default to supervisor if no matches
    return sorted.length > 0 ? sorted : ['supervisor'];
  }

  // ================================================
  // SEQUENTIAL EXECUTION
  // ================================================

  private async executeSequential(
    request: ConsultationRequest,
    workflow: ConsultingWorkflow
  ): Promise<ConsultationResult> {
    const store = useMissionStore.getState();
    const contributions: AgentContribution[] = [];
    let previousOutputs: Record<string, unknown> = {};
    let totalTokens = 0;
    const totalCost = 0;

    for (const step of workflow.steps) {
      const agent = this.agents[step.agentId];
      if (!agent) continue;

      store.addMessage({
        from: 'system',
        type: 'system',
        content: `👤 **${agent.name}** (${agent.role}) is analyzing your request...`,
      });

      store.updateEmployeeStatus(
        agent.name,
        'thinking',
        null,
        step.description
      );

      try {
        const stepResult = await this.executeAgentStep(
          request,
          agent,
          step,
          previousOutputs
        );

        contributions.push(stepResult);
        previousOutputs = {
          ...previousOutputs,
          ...stepResult.structuredOutput,
        };
        totalTokens += stepResult.tokensUsed;

        store.updateEmployeeStatus(agent.name, 'idle');

        store.addMessage({
          from: agent.name,
          type: 'employee',
          content: stepResult.output,
          metadata: {
            employeeName: agent.name,
            role: agent.role,
            stepId: step.id,
          },
        });

        // Create handoff to next step if needed
        const nextStepIndex = workflow.steps.indexOf(step) + 1;
        if (nextStepIndex < workflow.steps.length) {
          const nextStep = workflow.steps[nextStepIndex];
          const nextAgent = this.agents[nextStep.agentId];

          if (nextAgent) {
            employeeMemoryService.createHandoff(
              agent.id,
              agent.name,
              nextAgent.id,
              nextAgent.name,
              request.sessionId,
              request.userId,
              {
                summary: `${agent.name} completed: ${step.description}`,
                keyPoints: step.produces,
                userRequest: request.query,
                workCompleted: step.description,
                pendingTasks: [nextStep.description],
              },
              stepResult.structuredOutput
            );

            store.addMessage({
              from: 'system',
              type: 'system',
              content: `📤 Handoff: ${agent.name} → ${nextAgent.name}`,
            });
          }
        }
      } catch (error) {
        store.updateEmployeeStatus(agent.name, 'error');
        throw error;
      }
    }

    // Synthesize final result
    const result = this.synthesizeResults(contributions, workflow);

    return {
      success: true,
      sessionId: request.sessionId,
      workflowId: workflow.id,
      domain: workflow.domain,
      mode: 'sequential',
      result,
      contributions,
      metadata: {
        totalTokens,
        totalCost,
        executionTime: 0,
        agentsUsed: contributions.map((c) => c.agentName),
      },
    };
  }

  // ================================================
  // PARALLEL EXECUTION
  // ================================================

  private async executeParallel(
    request: ConsultationRequest,
    workflow: ConsultingWorkflow
  ): Promise<ConsultationResult> {
    const store = useMissionStore.getState();

    store.addMessage({
      from: 'system',
      type: 'system',
      content: `⚡ Running ${workflow.steps.length} consultations in parallel...`,
    });

    // Execute all steps in parallel
    const results = await Promise.all(
      workflow.steps.map(async (step) => {
        const agent = this.agents[step.agentId];
        if (!agent) return null;

        store.updateEmployeeStatus(
          agent.name,
          'thinking',
          null,
          step.description
        );

        try {
          const result = await this.executeAgentStep(request, agent, step, {});
          store.updateEmployeeStatus(agent.name, 'idle');

          store.addMessage({
            from: agent.name,
            type: 'employee',
            content: result.output,
            metadata: { employeeName: agent.name, role: agent.role },
          });

          return result;
        } catch (error) {
          store.updateEmployeeStatus(agent.name, 'error');
          return null;
        }
      })
    );

    const contributions = results.filter(
      (r): r is AgentContribution => r !== null
    );
    const result = this.synthesizeResults(contributions, workflow);

    return {
      success: true,
      sessionId: request.sessionId,
      workflowId: workflow.id,
      domain: workflow.domain,
      mode: 'parallel',
      result,
      contributions,
      metadata: {
        totalTokens: contributions.reduce((sum, c) => sum + c.tokensUsed, 0),
        totalCost: 0,
        executionTime: 0,
        agentsUsed: contributions.map((c) => c.agentName),
      },
    };
  }

  // ================================================
  // HIERARCHICAL EXECUTION (Supervisor-managed)
  // ================================================

  private async executeHierarchical(
    request: ConsultationRequest,
    workflow: ConsultingWorkflow
  ): Promise<ConsultationResult> {
    const store = useMissionStore.getState();
    const supervisor = this.agents[workflow.supervisor || 'supervisor'];

    store.addMessage({
      from: 'system',
      type: 'system',
      content: `👔 **${supervisor.name}** is coordinating your consultation...`,
    });

    // First, supervisor analyzes the query and creates a plan
    const planPrompt = `As the consultation supervisor, analyze this client request and create an execution plan.

Client Request: ${request.query}

Available Experts:
${workflow.steps.map((s) => `- ${this.agents[s.agentId]?.name}: ${this.agents[s.agentId]?.role}`).join('\n')}

Create a plan specifying:
1. Which experts should be consulted
2. In what order (sequential or parallel)
3. What specific questions each expert should address
4. How their outputs should be combined

Respond in JSON format:
{
  "plan": [
    { "agentId": "...", "task": "...", "parallel": true/false }
  ],
  "rationale": "..."
}`;

    const planResponse = await this.callLLM(request, supervisor, planPrompt);

    // Execute based on supervisor's plan
    const contributions: AgentContribution[] = [];

    // For simplicity, execute sequentially with supervisor coordination
    for (const step of workflow.steps) {
      const agent = this.agents[step.agentId];
      if (!agent) continue;

      store.updateEmployeeStatus(
        agent.name,
        'thinking',
        null,
        step.description
      );

      try {
        const result = await this.executeAgentStep(request, agent, step, {});
        contributions.push(result);
        store.updateEmployeeStatus(agent.name, 'idle');

        store.addMessage({
          from: agent.name,
          type: 'employee',
          content: result.output,
          metadata: { employeeName: agent.name, role: agent.role },
        });
      } catch (error) {
        store.updateEmployeeStatus(agent.name, 'error');
      }
    }

    // Supervisor synthesizes final result
    const synthesisPrompt = `As the consultation supervisor, synthesize the following expert opinions into a coherent final consultation result.

Client Request: ${request.query}

Expert Contributions:
${contributions.map((c) => `\n--- ${c.agentName} (${c.role}) ---\n${c.output}`).join('\n')}

Create a comprehensive final consultation that:
1. Summarizes key recommendations from all experts
2. Identifies any conflicts and resolves them
3. Prioritizes action items
4. Provides a clear next steps plan`;

    const synthesis = await this.callLLM(request, supervisor, synthesisPrompt);

    const result = this.synthesizeResults(contributions, workflow);
    result.summary = synthesis.content;

    return {
      success: true,
      sessionId: request.sessionId,
      workflowId: workflow.id,
      domain: workflow.domain,
      mode: 'hierarchical',
      result,
      contributions,
      metadata: {
        totalTokens: contributions.reduce((sum, c) => sum + c.tokensUsed, 0),
        totalCost: 0,
        executionTime: 0,
        agentsUsed: contributions.map((c) => c.agentName),
      },
    };
  }

  // ================================================
  // RACE MODE EXECUTION (MGX-inspired)
  // ================================================

  private async executeRace(
    request: ConsultationRequest,
    workflow: ConsultingWorkflow
  ): Promise<ConsultationResult> {
    const store = useMissionStore.getState();

    // Select 3 relevant agents to race
    const racingAgents = this.selectRelevantAgents(request.query).slice(0, 3);

    store.addMessage({
      from: 'system',
      type: 'system',
      content: `🏁 **Race Mode**: ${racingAgents.length} experts competing to give you the best answer...`,
    });

    // Run all agents in parallel
    const racePromises = racingAgents.map(async (agentId) => {
      const agent = this.agents[agentId];
      if (!agent) return null;

      store.updateEmployeeStatus(
        agent.name,
        'using_tool',
        'Racing',
        'Competing for best answer'
      );

      try {
        const response = await this.callLLM(request, agent, request.query);
        store.updateEmployeeStatus(agent.name, 'idle');

        return {
          agentId,
          agentName: agent.name,
          output: response.content,
          tokensUsed: response.tokensUsed,
        };
      } catch (error) {
        store.updateEmployeeStatus(agent.name, 'error');
        return null;
      }
    });

    const raceResults = (await Promise.all(racePromises)).filter(
      (r): r is NonNullable<typeof r> => r !== null
    );

    // Have supervisor judge the best answer
    const supervisor = this.agents['supervisor'];
    const judgingPrompt = `You are judging a race between AI consultants. Pick the BEST answer.

Client Question: ${request.query}

${raceResults.map((r, i) => `\n--- ANSWER ${i + 1}: ${r.agentName} ---\n${r.output}`).join('\n')}

Evaluate each answer on:
1. Accuracy and correctness
2. Completeness
3. Actionability
4. Clarity

Respond with JSON:
{
  "winner": 1, // Answer number (1, 2, or 3)
  "scores": [8.5, 7.0, 9.0],
  "reasoning": "Why this answer won"
}`;

    const judging = await this.callLLM(request, supervisor, judgingPrompt);

    // Parse judging result
    let winnerIndex = 0;
    let scores = raceResults.map(() => 7.0);
    let reasoning = 'Selected based on overall quality';

    try {
      const jsonMatch = judging.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        winnerIndex = (parsed.winner || 1) - 1;
        scores = parsed.scores || scores;
        reasoning = parsed.reasoning || reasoning;
      }
    } catch {
      // Use defaults
    }

    const raceResultsFinal: RaceResult[] = raceResults.map((r, i) => ({
      agentId: r.agentId,
      agentName: r.agentName,
      output: r.output,
      score: scores[i] || 7.0,
      selected: i === winnerIndex,
      reasoning: i === winnerIndex ? reasoning : undefined,
    }));

    const winner = raceResults[winnerIndex] || raceResults[0];

    store.addMessage({
      from: 'system',
      type: 'system',
      content: `🏆 **${winner.agentName}** wins the race!\n📊 Scores: ${raceResultsFinal.map((r) => `${r.agentName}: ${r.score.toFixed(1)}`).join(' | ')}`,
    });

    store.addMessage({
      from: winner.agentName,
      type: 'employee',
      content: winner.output,
      metadata: { employeeName: winner.agentName, isRaceWinner: true },
    });

    const contributions: AgentContribution[] = raceResults.map((r) => ({
      agentId: r.agentId,
      agentName: r.agentName,
      role: this.agents[r.agentId]?.role || 'Expert',
      stepId: 'race',
      input: request.query,
      output: r.output,
      tokensUsed: r.tokensUsed,
      executionTime: 0,
      timestamp: new Date(),
    }));

    return {
      success: true,
      sessionId: request.sessionId,
      workflowId: workflow.id,
      domain: workflow.domain,
      mode: 'race',
      result: {
        summary: winner.output,
        recommendations: [],
        actionItems: [],
      },
      contributions,
      raceResults: raceResultsFinal,
      metadata: {
        totalTokens: raceResults.reduce((sum, r) => sum + r.tokensUsed, 0),
        totalCost: 0,
        executionTime: 0,
        agentsUsed: raceResults.map((r) => r.agentName),
      },
    };
  }

  // ================================================
  // HELPER METHODS
  // ================================================

  private async executeAgentStep(
    request: ConsultationRequest,
    agent: ConsultantAgent,
    step: WorkflowStep,
    previousOutputs: Record<string, unknown>
  ): Promise<AgentContribution> {
    const startTime = Date.now();

    // Build prompt with context from previous steps
    let prompt = request.query;

    if (Object.keys(previousOutputs).length > 0) {
      prompt = `Previous consultant findings:
${JSON.stringify(previousOutputs, null, 2)}

Based on the above context, please address:
${request.query}

${step.instructions || ''}`;
    }

    // Get memory context
    const memoryContext = await employeeMemoryService.buildMemoryContext(
      request.userId,
      agent.id
    );

    if (memoryContext) {
      prompt = `${memoryContext}\n\n---\n\n${prompt}`;
    }

    const response = await this.callLLM(request, agent, prompt);

    // Extract structured output if schema defined
    const structuredOutput = this.extractStructuredOutput(
      response.content,
      step.produces
    );

    // Store in memory for future reference
    await employeeMemoryService.addKnowledge(request.userId, agent.id, {
      category: 'history',
      key: `consultation_${Date.now()}`,
      value: `Consulted about: ${request.query.slice(0, 100)}`,
      confidence: 0.9,
      source: 'user_stated',
    });

    return {
      agentId: agent.id,
      agentName: agent.name,
      role: agent.role,
      stepId: step.id,
      input: prompt,
      output: response.content,
      structuredOutput,
      tokensUsed: response.tokensUsed,
      executionTime: Date.now() - startTime,
      timestamp: new Date(),
    };
  }

  private async callLLM(
    request: ConsultationRequest,
    agent: ConsultantAgent,
    prompt: string
  ): Promise<{ content: string; tokensUsed: number }> {
    const response = await unifiedLLMService.sendMessage({
      provider: 'anthropic',
      messages: [
        { role: 'system', content: agent.systemPrompt },
        { role: 'user', content: prompt },
      ],
      model: agent.model,
      temperature: 0.7,
      userId: request.userId,
      sessionId: request.sessionId,
    });

    // Log tokens
    if (response.usage) {
      await tokenLogger.logTokenUsage(
        response.model,
        response.usage.totalTokens,
        request.userId,
        request.sessionId,
        agent.id,
        agent.name,
        response.usage.promptTokens,
        response.usage.completionTokens,
        `Consultation: ${agent.role}`
      );
    }

    return {
      content: response.content,
      tokensUsed: response.usage?.totalTokens || 0,
    };
  }

  private extractStructuredOutput(
    content: string,
    produces: string[]
  ): Record<string, unknown> {
    const output: Record<string, unknown> = {};

    // Try to extract JSON
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        Object.assign(output, parsed);
      } catch {
        // Not valid JSON
      }
    }

    // Extract key-value patterns for expected outputs
    for (const key of produces) {
      const pattern = new RegExp(`${key}[:\\s]+([^\\n]+)`, 'i');
      const match = content.match(pattern);
      if (match && !output[key]) {
        output[key] = match[1].trim();
      }
    }

    output.raw = content;
    return output;
  }

  private synthesizeResults(
    contributions: AgentContribution[],
    workflow: ConsultingWorkflow
  ): StructuredConsultationOutput {
    const recommendations: Recommendation[] = [];
    const actionItems: ActionItem[] = [];

    // Extract recommendations from each contribution
    contributions.forEach((c, index) => {
      recommendations.push({
        id: `rec-${index}`,
        priority: index === 0 ? 'high' : 'medium',
        category: c.role,
        title: `${c.agentName}'s Recommendation`,
        description: c.output.slice(0, 500),
        rationale: `Based on ${c.role} expertise`,
        source: c.agentName,
      });

      // Create action item from each expert
      actionItems.push({
        id: `action-${index}`,
        title: `Follow ${c.agentName}'s advice`,
        description: `Review and implement recommendations from ${c.role}`,
        status: 'pending',
        assignedTo: c.agentName,
      });
    });

    // Create summary
    const summary =
      contributions.length > 0
        ? `Consultation completed with ${contributions.length} expert(s): ${contributions.map((c) => c.agentName).join(', ')}. ` +
          `Key areas covered: ${contributions.map((c) => c.role).join(', ')}.`
        : 'Consultation completed.';

    return {
      summary,
      recommendations,
      actionItems,
      nextSteps: [
        'Review all expert recommendations',
        'Prioritize action items based on your goals',
        'Schedule follow-up consultations as needed',
      ],
    };
  }

  // ================================================
  // PUBLIC API
  // ================================================

  getAgent(agentId: string): ConsultantAgent | undefined {
    return this.agents[agentId];
  }

  getAllAgents(): ConsultantAgent[] {
    return Object.values(this.agents).filter((a) => a.id !== 'supervisor');
  }

  getAgentsByDomain(domain: ConsultingDomain): ConsultantAgent[] {
    const domainExpertise: Record<ConsultingDomain, string[]> = {
      health: ['health', 'medical', 'wellness'],
      fitness: ['workout', 'exercise', 'fitness', 'strength'],
      nutrition: ['diet', 'nutrition', 'meal', 'food'],
      finance: ['financial', 'investment', 'budget', 'tax'],
      legal: ['law', 'legal', 'contract'],
      career: ['career', 'job', 'resume', 'interview'],
      technology: ['tech', 'software', 'code', 'system'],
      business: ['business', 'strategy', 'startup'],
      education: ['learning', 'study', 'education'],
      lifestyle: ['life', 'balance', 'productivity'],
      mental_health: ['mental', 'stress', 'anxiety', 'counseling'],
      relationships: ['relationship', 'communication'],
    };

    const keywords = domainExpertise[domain] || [];

    return Object.values(this.agents).filter((agent) =>
      agent.expertise.some((exp) =>
        keywords.some((kw) => exp.toLowerCase().includes(kw))
      )
    );
  }

  getWorkflow(workflowId: string): ConsultingWorkflow | undefined {
    return this.workflows[workflowId];
  }

  getAllWorkflows(): ConsultingWorkflow[] {
    return Object.values(this.workflows);
  }

  getWorkflowsByDomain(domain: ConsultingDomain): ConsultingWorkflow[] {
    return Object.values(this.workflows).filter((w) => w.domain === domain);
  }

  registerAgent(agent: ConsultantAgent): void {
    this.agents[agent.id] = agent;
  }

  registerWorkflow(workflow: ConsultingWorkflow): void {
    this.workflows[workflow.id] = workflow;
  }
}

// Export singleton
export const consultingOrchestrator = ConsultingOrchestrator.getInstance();
