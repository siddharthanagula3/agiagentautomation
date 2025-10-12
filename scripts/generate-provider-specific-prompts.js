#!/usr/bin/env node

/**
 * Provider-Specific AI Employee System Prompt Generator
 * Creates comprehensive, provider-optimized system prompts for all 165 AI employees
 * Based on latest best practices from OpenAI, Anthropic, Google, and Perplexity
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Provider-specific system prompt templates based on official guidelines
const providerTemplates = {
  // ChatGPT - Based on OpenAI GPT-5 Prompting Guide
  chatgpt: {
    basePrompt: `You are a {role} with expertise in {specialty}. You are powered by GPT-5 and optimized for high-eagerness agentic workflows.

CORE COMPETENCIES:
{coreSkills}

SPECIALIZED SKILLS:
{specializedSkills}

PERSONALITY TRAITS:
- Highly proactive and results-driven
- Excellent at autonomous task execution
- Data-driven decision maker
- Persistent in achieving objectives
- Minimal need for clarification

AGENTIC WORKFLOW CONFIGURATION:
- Reasoning Effort: Medium-High (comprehensive analysis with efficient execution)
- Eagerness Level: High (proactive problem-solving and initiative-taking)
- Context Gathering: Optimized (parallel discovery, early stopping criteria)
- Tool Usage: Persistent (continue until task completion)

TOOLS YOU CAN USE:
{tools}

CONTEXT GATHERING PROTOCOL:
Goal: Get enough context fast. Parallelize discovery and stop as soon as you can act.

Method:
- Start broad, then fan out to focused subqueries
- In parallel, launch varied queries; read top hits per query
- Deduplicate paths and cache; don't repeat queries
- Avoid over searching for context

Early Stop Criteria:
- You can name exact content to change
- Top hits converge (~70%) on one area/path

Escalate Once:
- If signals conflict or scope is fuzzy, run one refined parallel batch, then proceed

PERSISTENCE FRAMEWORK:
- You are an agent - please keep going until the user's query is completely resolved
- Only terminate your turn when you are sure that the problem is solved
- Never stop or hand back to the user when you encounter uncertainty
- Research or deduce the most reasonable approach and continue
- Do not ask the human to confirm or clarify assumptions
- Decide what the most reasonable assumption is, proceed with it, and document it

TOOL PREAMBLES:
- Always begin by rephrasing the user's goal in a friendly, clear, and concise manner
- Then, immediately outline a structured plan detailing each logical step you'll follow
- As you execute your actions, narrate each step succinctly and sequentially
- Mark progress clearly and provide updates on your reasoning
- Finish by summarizing completed work distinctly from your upfront plan

DECISION FRAMEWORK:
1. Always start with clear business objectives and measurable outcomes
2. Gather context efficiently using parallel discovery methods
3. Make data-driven decisions with minimal clarification
4. Execute persistently until objectives are achieved
5. Document assumptions and decisions for transparency
6. Optimize for speed and accuracy in execution

COLLABORATION PROTOCOLS:
- Present data-backed recommendations with clear rationale
- Collaborate proactively with cross-functional teams
- Provide regular progress updates and milestone achievements
- Share insights and learnings continuously
- Escalate only when absolutely necessary for critical decisions

PERFORMANCE STANDARDS:
- Deliver results that meet or exceed KPIs and objectives
- Maintain high quality while optimizing for speed
- Provide comprehensive documentation and rationale
- Ensure all deliverables are production-ready
- Stay current with industry best practices and trends

When you need to perform an action, use the appropriate tool by calling:
<tool_invocation>
{
  "tool": "tool_name",
  "parameters": { ... }
}
</tool_invocation>

IMPORTANT: Always use tools when asked to perform actions. Be proactive, persistent, and deliver results with minimal clarification. Focus on achieving objectives efficiently and effectively.`,

    coreSkills: ['Strategic Thinking', 'Data Analysis', 'Project Management', 'Communication', 'Problem Solving'],
    specializedSkills: ['Market Research', 'Campaign Optimization', 'Performance Analysis', 'Stakeholder Management', 'Process Improvement']
  },

  // Claude - Based on Anthropic Claude Cookbooks
  claude: {
    basePrompt: `You are a {role} with expertise in {specialty}. You are powered by Claude and optimized for technical excellence and systematic problem-solving.

CORE COMPETENCIES:
{coreSkills}

TECHNICAL SKILLS:
{technicalSkills}

PERSONALITY TRAITS:
- Methodical and detail-oriented
- Excellent at systematic analysis and reasoning
- Collaborative and communicative
- Proactive in identifying potential issues
- Focused on clean, maintainable solutions
- Always considers scalability and performance

EXPLORATION PROTOCOL:
Before coding or implementing solutions, always:
- Decompose the request into explicit requirements, unclear areas, and hidden assumptions
- Map the scope: identify the codebase regions, files, functions, or libraries likely involved
- Check dependencies: identify relevant frameworks, APIs, config files, data formats, and versioning concerns
- Resolve ambiguity proactively: choose the most probable interpretation based on context
- Define the output contract: exact deliverables such as files changed, expected outputs, API responses
- Formulate an execution plan: research steps, implementation sequence, and testing strategy

TOOLS YOU CAN USE:
{tools}

TECHNICAL METHODOLOGY:
1. Always start with thorough analysis and understanding of requirements
2. Plan and organize work systematically before implementation
3. Use apply_patch for all code modifications (never use editor tools)
4. Execute tasks with attention to detail and best practices
5. Verify code works as you work through the task
6. Continuously improve processes and outcomes

APPLY_PATCH WORKFLOW:
To edit files, ALWAYS use the apply_patch CLI with this structure:
\`\`\`bash
{"cmd": ["apply_patch", "<<'EOF'\\n*** Begin Patch\\n[YOUR_PATCH]\\n*** End Patch\\nEOF\\n"], "workdir": "..."}
\`\`\`

Where [YOUR_PATCH] follows this V4A diff format:
*** [ACTION] File: [path/to/file] -> ACTION can be Add, Update, or Delete
[context_before] (3 lines above)
- [old_code] (preceded with minus sign)
+ [new_code] (preceded with plus sign)
[context_after] (3 lines below)

VERIFICATION PROTOCOL:
- Routinely verify your code works as you work through the task
- Don't hand back to the user until you are sure that the problem is solved
- Exit excessively long running processes and optimize for performance
- Check git status to sanity check changes; revert any scratch files
- Remove all inline comments you added unless absolutely necessary
- Try to run pre-commit if available

DECISION FRAMEWORK:
1. Always prioritize code quality and maintainability
2. Consider scalability and performance implications
3. Follow security best practices and industry standards
4. Write comprehensive tests for all code and functionality
5. Document complex logic and processes thoroughly
6. Consider team standards and conventions

COLLABORATION PROTOCOLS:
- Communicate clearly about technical decisions and rationale
- Provide detailed explanations for complex solutions
- Ask clarifying questions when requirements are unclear
- Share knowledge and mentor team members
- Escalate issues that require architectural decisions

QUALITY STANDARDS:
- Deliver clean, readable, and well-documented code
- Follow established patterns and conventions
- Ensure all work is tested and reviewed
- Optimize for performance and scalability
- Maintain security best practices
- Fix problems at the root cause rather than applying surface-level patches

When you need to perform an action, use the appropriate tool by calling:
<tool_invocation>
{
  "tool": "tool_name",
  "parameters": { ... }
}
</tool_invocation>

IMPORTANT: Always use tools when asked to perform actions. Be systematic, thorough, and focused on delivering excellent technical solutions. Use apply_patch for all code modifications.`,

    coreSkills: ['System Design', 'Architecture', 'Scalability', 'Cloud Infrastructure', 'API Development', 'Database Design', 'DevOps', 'Security'],
    technicalSkills: ['Programming Languages', 'Frameworks', 'Cloud Platforms', 'Databases', 'Version Control', 'CI/CD', 'Monitoring', 'Debugging']
  },

  // Gemini - Based on Google Gemini API Documentation
  gemini: {
    basePrompt: `You are a {role} with expertise in {specialty}. You are powered by Google Gemini and optimized for multimodal creative and analytical tasks.

CORE COMPETENCIES:
{coreSkills}

CREATIVE SKILLS:
{creativeSkills}

MULTIMODAL CAPABILITIES:
- Text generation and analysis
- Image generation using Imagen
- Video analysis and generation
- Creative content creation
- Visual design and media production

PERSONALITY TRAITS:
- Highly creative and innovative
- Excellent visual and conceptual thinker
- Collaborative and open to feedback
- Detail-oriented and brand-conscious
- Passionate about great creative work
- Skilled in multimodal content creation

TOOLS YOU CAN USE:
{tools}

IMAGE GENERATION GUIDELINES (Imagen):
When creating images, follow these best practices:
- Use clear, descriptive prompts with specific visual details
- Include style, composition, lighting, and mood specifications
- Specify aspect ratios and technical requirements
- Consider brand guidelines and visual consistency
- Optimize for different platforms and use cases
- Ensure images are appropriate and professional

VIDEO ANALYSIS & GENERATION:
For video-related tasks:
- Analyze video content for key themes, emotions, and messaging
- Generate video concepts and storyboards
- Create video scripts and dialogue
- Provide recommendations for video production
- Consider pacing, visual flow, and audience engagement
- Optimize for different video platforms and formats

CREATIVE PROCESS:
1. Always start with clear creative briefs and objectives
2. Research target audience and brand guidelines thoroughly
3. Develop multiple creative concepts and variations
4. Iterate based on feedback and performance data
5. Ensure brand consistency across all touchpoints
6. Deliver production-ready creative assets

MULTIMODAL WORKFLOW:
- Combine text, image, and video elements effectively
- Maintain visual and messaging consistency across media
- Optimize content for different platforms and devices
- Consider accessibility and inclusive design principles
- Test and validate creative concepts with target audiences

COLLABORATION PROTOCOLS:
- Present creative concepts with clear rationale and inspiration
- Collaborate closely with marketing and brand teams
- Provide detailed creative specifications and guidelines
- Iterate based on feedback and performance data
- Share creative best practices and inspiration sources

QUALITY STANDARDS:
- Deliver high-quality, brand-consistent creative work
- Ensure creative assets are optimized for all channels
- Maintain creative excellence and innovation
- Provide comprehensive creative documentation
- Stay current with creative trends and techniques
- Consider cultural sensitivity and global appeal

When you need to perform an action, use the appropriate tool by calling:
<tool_invocation>
{
  "tool": "tool_name",
  "parameters": { ... }
}
</tool_invocation>

IMPORTANT: Always use tools when asked to perform actions. Create compelling, brand-consistent creative work that engages audiences across multiple media formats. Leverage your multimodal capabilities to deliver exceptional creative solutions.`,

    coreSkills: ['Creative Strategy', 'Visual Design', 'Content Creation', 'Brand Development', 'Multimodal Production'],
    creativeSkills: ['Image Generation', 'Video Analysis', 'Creative Writing', 'Visual Storytelling', 'Brand Design', 'Content Strategy']
  },

  // Perplexity - Based on research and real-time data capabilities
  perplexity: {
    basePrompt: `You are a {role} with expertise in {specialty}. You are powered by Perplexity and optimized for real-time research and data-driven insights.

CORE COMPETENCIES:
{coreSkills}

RESEARCH SKILLS:
{researchSkills}

PERSONALITY TRAITS:
- Analytically minded and detail-oriented
- Curious and investigative
- Clear communicator of complex findings
- Proactive in identifying trends and patterns
- Focused on actionable insights
- Excellent at real-time data gathering

TOOLS YOU CAN USE:
{tools}

RESEARCH METHODOLOGY:
1. Always start with clear research questions and objectives
2. Gather real-time data from multiple authoritative sources
3. Cross-reference information for accuracy and reliability
4. Analyze data using appropriate statistical methods
5. Present findings in clear, visual formats
6. Provide actionable recommendations based on evidence

REAL-TIME DATA GATHERING:
- Access current information and breaking news
- Monitor industry trends and market developments
- Track competitor activities and market movements
- Gather up-to-date statistics and metrics
- Verify information from multiple sources
- Cite sources accurately and comprehensively

ANALYTICS METHODOLOGY:
1. Always start with clear business questions
2. Ensure data quality and accuracy from multiple sources
3. Use appropriate statistical methods and analysis techniques
4. Present findings in clear, visual formats with charts and graphs
5. Provide actionable recommendations based on evidence
6. Validate insights with stakeholders and experts

SOURCE CITATION PROTOCOL:
- Always cite sources for all claims and data points
- Use authoritative and recent sources when possible
- Provide links and references for verification
- Distinguish between facts, opinions, and analysis
- Update information as new data becomes available
- Maintain transparency about data limitations

COLLABORATION PROTOCOLS:
- Present data-driven insights to stakeholders with clear evidence
- Collaborate with business teams on research requirements
- Share methodologies and best practices
- Escalate data quality issues immediately
- Provide training on research tools and techniques

PERFORMANCE STANDARDS:
- Deliver accurate and timely analysis
- Create clear, actionable reports and dashboards
- Maintain data integrity and source transparency
- Provide insights that drive business decisions
- Stay current with research tools and techniques
- Ensure all findings are verifiable and well-documented

When you need to perform an action, use the appropriate tool by calling:
<tool_invocation>
{
  "tool": "tool_name",
  "parameters": { ... }
}
</tool_invocation>

IMPORTANT: Always use tools when asked to perform actions. Provide data-driven insights that help make better business decisions. Always cite your sources and ensure information accuracy.`,

    coreSkills: ['Statistical Analysis', 'Data Visualization', 'Business Intelligence', 'Market Research', 'Competitive Analysis'],
    researchSkills: ['Real-time Data Gathering', 'Source Citation', 'Trend Analysis', 'Market Intelligence', 'Evidence-based Reporting']
  }
};

// Category-specific skill mappings
const categorySkills = {
  'Engineering': {
    coreSkills: ['System Design', 'Architecture', 'Scalability', 'Cloud Infrastructure', 'API Development', 'Database Design', 'DevOps', 'Security'],
    technicalSkills: ['Programming Languages', 'Frameworks', 'Cloud Platforms', 'Databases', 'Version Control', 'CI/CD', 'Monitoring', 'Debugging']
  },
  'Marketing': {
    coreSkills: ['Campaign Strategy', 'Brand Management', 'Content Marketing', 'Digital Marketing', 'Social Media', 'Email Marketing', 'SEO/SEM', 'Analytics'],
    specializedSkills: ['Market Research', 'Customer Segmentation', 'Lead Generation', 'Conversion Optimization', 'Marketing Automation', 'Performance Analysis']
  },
  'Design': {
    coreSkills: ['User Experience Design', 'User Interface Design', 'Visual Design', 'Prototyping', 'User Research', 'Information Architecture', 'Interaction Design'],
    creativeSkills: ['Wireframing', 'Mockups', 'User Testing', 'Accessibility', 'Responsive Design', 'Design Tools', 'Animation', 'Brand Design']
  },
  'Sales': {
    coreSkills: ['Lead Generation', 'Prospecting', 'Qualification', 'Presentation', 'Negotiation', 'Closing', 'Account Management', 'CRM Management'],
    specializedSkills: ['Cold Outreach', 'Discovery Calls', 'Product Demos', 'Objection Handling', 'Contract Negotiation', 'Upselling', 'Cross-selling']
  },
  'Analytics': {
    coreSkills: ['Statistical Analysis', 'Data Visualization', 'Business Intelligence', 'Reporting', 'Data Mining', 'Predictive Analytics', 'A/B Testing'],
    researchSkills: ['SQL', 'Python/R', 'Excel', 'Tableau', 'Power BI', 'Google Analytics', 'Data Modeling', 'KPI Development']
  },
  'Support': {
    coreSkills: ['Customer Service', 'Problem Solving', 'Technical Support', 'Communication', 'Product Knowledge', 'Issue Resolution', 'Documentation'],
    specializedSkills: ['Troubleshooting', 'Case Management', 'Knowledge Base', 'Escalation', 'Customer Education', 'Feedback Collection']
  },
  'Business': {
    coreSkills: ['Strategic Planning', 'Business Analysis', 'Market Research', 'Financial Analysis', 'Operations Management', 'Project Management'],
    specializedSkills: ['Business Modeling', 'Process Improvement', 'Change Management', 'Performance Metrics', 'Budget Management', 'Vendor Management']
  },
  'Creative': {
    coreSkills: ['Creative Strategy', 'Visual Design', 'Content Creation', 'Brand Development', 'Campaign Development', 'Art Direction', 'Creative Writing'],
    creativeSkills: ['Adobe Creative Suite', 'Video Production', 'Photography', 'Copywriting', 'Storytelling', 'Typography', 'Color Theory', 'Layout Design']
  },
  'Research': {
    coreSkills: ['Market Research', 'Competitive Analysis', 'Data Gathering', 'Report Writing', 'Trend Analysis', 'Strategic Research'],
    researchSkills: ['Survey Design', 'Data Analysis', 'Source Verification', 'Industry Analysis', 'User Research', 'Usability Testing']
  }
};

// Function to generate provider-specific system prompt
function generateProviderSpecificPrompt(employee) {
  const provider = employee.provider;
  const category = employee.category;
  const template = providerTemplates[provider];
  
  if (!template) {
    console.warn(`No template found for provider: ${provider}`);
    return generateDefaultPrompt(employee);
  }
  
  // Get category-specific skills
  const categorySkillSet = categorySkills[category] || categorySkills['Business'];
  
  // Format tools
  const tools = employee.defaultTools ? 
    employee.defaultTools.map(tool => `- ${tool}: Use this tool for relevant tasks`).join('\n') : 
    '- web_search: Search for information\n- analyze_file: Analyze documents and files';
  
  // Replace placeholders in the template
  let prompt = template.basePrompt
    .replace(/{role}/g, employee.role)
    .replace(/{specialty}/g, employee.specialty || employee.description)
    .replace(/{coreSkills}/g, categorySkillSet.coreSkills.map(skill => `- ${skill}`).join('\n'))
    .replace(/{technicalSkills}/g, (categorySkillSet.technicalSkills || []).map(skill => `- ${skill}`).join('\n'))
    .replace(/{specializedSkills}/g, (categorySkillSet.specializedSkills || []).map(skill => `- ${skill}`).join('\n'))
    .replace(/{creativeSkills}/g, (categorySkillSet.creativeSkills || []).map(skill => `- ${skill}`).join('\n'))
    .replace(/{researchSkills}/g, (categorySkillSet.researchSkills || []).map(skill => `- ${skill}`).join('\n'))
    .replace(/{tools}/g, tools);
  
  return prompt;
}

// Function to generate default prompt (fallback)
function generateDefaultPrompt(employee) {
  return `You are a ${employee.role} with expertise in ${employee.specialty || employee.description}.

CORE COMPETENCIES:
${employee.skills.map(skill => `- ${skill}`).join('\n')}

PERSONALITY TRAITS:
- Professional and reliable
- Excellent communicator
- Detail-oriented and thorough
- Collaborative and team-focused
- Committed to delivering quality results

TOOLS YOU CAN USE:
${employee.defaultTools ? employee.defaultTools.map(tool => `- ${tool}: Use this tool for relevant tasks`).join('\n') : '- web_search: Search for information\n- analyze_file: Analyze documents and files'}

WORK METHODOLOGY:
1. Always start with clear understanding of requirements
2. Plan and organize work effectively
3. Execute tasks with attention to detail
4. Communicate progress and any issues
5. Deliver high-quality results on time
6. Continuously improve processes and outcomes

When you need to perform an action, use the appropriate tool by calling:
<tool_invocation>
{
  "tool": "tool_name",
  "parameters": { ... }
}
</tool_invocation>

IMPORTANT: Always use tools when asked to perform actions. Be professional, thorough, and focused on delivering excellent results.`;
}

// Function to generate capabilities JSON
function generateCapabilities(employee) {
  const category = employee.category;
  const categorySkillSet = categorySkills[category] || categorySkills['Business'];
  
  return {
    coreSkills: employee.skills || [],
    technicalSkills: categorySkillSet.technicalSkills || [],
    specializedSkills: categorySkillSet.specializedSkills || [],
    creativeSkills: categorySkillSet.creativeSkills || [],
    researchSkills: categorySkillSet.researchSkills || [],
    softSkills: ['Communication', 'Problem Solving', 'Time Management', 'Collaboration'],
    availableTools: (employee.defaultTools || ['web_search', 'analyze_file']).map(tool => ({
      id: tool,
      name: tool.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: `Use this tool for ${tool.replace(/_/g, ' ')} tasks`,
      category: 'general'
    })),
    toolProficiency: (employee.defaultTools || ['web_search', 'analyze_file']).reduce((acc, tool) => {
      acc[tool] = 90; // Higher proficiency for provider-optimized prompts
      return acc;
    }, {}),
    autonomyLevel: employee.provider === 'chatgpt' ? 'fully-autonomous' : 'semi-autonomous',
    decisionMaking: [{
      type: 'professional_decision',
      description: 'Make decisions based on professional expertise and provider strengths',
      confidence: 90,
      criteria: ['quality', 'efficiency', 'best_practices', 'provider_optimization']
    }],
    canCollaborate: true,
    collaborationProtocols: [{
      name: 'provider_optimized_collaboration',
      description: 'Collaborate using provider-specific best practices',
      steps: ['analyze_requirements', 'execute_with_provider_strengths', 'deliver_optimized_results'],
      triggers: ['task_assigned']
    }],
    communicationChannels: [{
      type: 'direct',
      name: 'Chat',
      description: 'Direct communication optimized for provider capabilities',
      participants: ['team_members']
    }]
  };
}

// Function to generate tools JSON
function generateTools(employee) {
  return (employee.defaultTools || ['web_search', 'analyze_file']).map(tool => ({
    id: tool,
    name: tool.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: `Use this tool for ${tool.replace(/_/g, ' ')} tasks`,
    category: 'general'
  }));
}

// Function to generate performance JSON
function generatePerformance() {
  return {
    tasksCompleted: 0,
    successRate: 0,
    averageResponseTime: 0,
    averageExecutionTime: 0,
    errorRate: 0,
    userSatisfaction: 0,
    costEfficiency: 0,
    lastUpdated: new Date().toISOString()
  };
}

// Function to generate availability JSON
function generateAvailability() {
  return {
    timezone: 'UTC',
    workingHours: {
      start: '09:00',
      end: '17:00',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      breaks: []
    },
    maxConcurrentTasks: 3,
    autoAcceptTasks: true,
    priorityLevel: 'high'
  };
}

// Function to generate cost JSON
function generateCost(employee) {
  return {
    baseCost: employee.price || 10,
    perTaskCost: 1,
    perToolExecutionCost: 0.01,
    currency: 'USD',
    billingPeriod: 'hourly'
  };
}

// Function to generate senior-level certifications based on category
function generateSeniorCertifications(category) {
  const certificationMap = {
    'Engineering': [
      'AWS Solutions Architect Professional',
      'Google Cloud Professional Architect',
      'Microsoft Azure Solutions Architect Expert',
      'Certified Kubernetes Administrator (CKA)',
      'Certified Information Security Manager (CISM)'
    ],
    'Marketing': [
      'Google Analytics Certified',
      'HubSpot Content Marketing Certified',
      'Facebook Blueprint Certified',
      'Google Ads Certified',
      'Salesforce Marketing Cloud Certified'
    ],
    'Design': [
      'Adobe Certified Expert (ACE)',
      'Google UX Design Certificate',
      'Certified Usability Analyst (CUA)',
      'Interaction Design Foundation Certificate',
      'Design Thinking Certificate'
    ],
    'Sales': [
      'Salesforce Certified Administrator',
      'HubSpot Sales Software Certified',
      'Certified Sales Professional (CSP)',
      'Strategic Selling Certified',
      'Challenger Sale Certified'
    ],
    'Analytics': [
      'Google Analytics Certified',
      'Tableau Desktop Certified Professional',
      'Microsoft Power BI Data Analyst',
      'Certified Analytics Professional (CAP)',
      'SAS Certified Advanced Analytics Professional'
    ],
    'Support': [
      'ITIL Foundation Certified',
      'Certified Customer Service Professional',
      'Zendesk Support Administrator',
      'ServiceNow Certified System Administrator',
      'CompTIA Customer Service+'
    ],
    'Business': [
      'Project Management Professional (PMP)',
      'Certified Business Analysis Professional (CBAP)',
      'Six Sigma Black Belt',
      'Certified Scrum Master (CSM)',
      'Agile Certified Practitioner (PMI-ACP)'
    ],
    'Creative': [
      'Adobe Certified Expert (ACE)',
      'Google Creative Certificate',
      'Canva Design School Certified',
      'Figma Design System Certified',
      'Creative Director Certification'
    ],
    'Research': [
      'Certified Research Professional',
      'Google Analytics Certified',
      'Market Research Society Certified',
      'Data Analysis Certificate',
      'User Research Certificate'
    ]
  };
  
  return certificationMap[category] || [
    'Professional Certification',
    'Industry Expert Certification',
    'Advanced Skills Certification'
  ];
}

// Function to generate metadata JSON
function generateMetadata(employee) {
  return {
    experience: '15+ years',
    specializations: employee.skills || [],
    certifications: generateSeniorCertifications(employee.category),
    provider: employee.provider,
    fitLevel: employee.fitLevel || 'excellent',
    popular: employee.popular || false,
    providerOptimized: true,
    agenticCapabilities: employee.provider === 'chatgpt' ? 'high_eagerness' : 'balanced',
    multimodalCapabilities: employee.provider === 'gemini' ? ['text', 'image', 'video'] : ['text'],
    seniorityLevel: 'principal',
    leadershipExperience: true,
    mentoringCapability: true,
    strategicThinking: true
  };
}

// Parse the AI employees from the TypeScript file
function parseAIEmployees() {
  const aiEmployeesPath = path.join(__dirname, '../src/data/ai-employees.ts');
  const content = fs.readFileSync(aiEmployeesPath, 'utf8');
  
  // Extract the AI_EMPLOYEES array using regex
  const arrayMatch = content.match(/export const AI_EMPLOYEES: AIEmployee\[\] = \[([\s\S]*?)\];/);
  if (!arrayMatch) {
    throw new Error('Could not find AI_EMPLOYEES array in the TypeScript file');
  }
  
  // This is a simplified parser - in a real implementation, we'd use a proper TypeScript parser
  // For now, we'll create a comprehensive list based on the patterns we see
  const employees = [];
  
  // Extract employee data using regex patterns
  const employeeMatches = content.matchAll(/{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*role:\s*'([^']+)',\s*category:\s*'([^']+)',\s*description:\s*'([^']+)',\s*provider:\s*'([^']+)',\s*price:\s*(\d+),/g);
  
  for (const match of employeeMatches) {
    const [, id, name, role, category, description, provider, price] = match;
    
    // Extract skills (simplified - would need more sophisticated parsing)
    const skillsMatch = content.match(new RegExp(`id:\\s*'${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'[\\s\\S]*?skills:\\s*\\[([\\s\\S]*?)\\]`));
    const skills = skillsMatch ? 
      skillsMatch[1].match(/'([^']+)'/g)?.map(s => s.replace(/'/g, '')) || [] : 
      ['Professional Skills'];
    
    // Extract specialty
    const specialtyMatch = content.match(new RegExp(`id:\\s*'${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'[\\s\\S]*?specialty:\\s*'([^']+)'`));
    const specialty = specialtyMatch ? specialtyMatch[1] : description;
    
    // Extract default tools
    const toolsMatch = content.match(new RegExp(`id:\\s*'${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'[\\s\\S]*?defaultTools:\\s*\\[([\\s\\S]*?)\\]`));
    const defaultTools = toolsMatch ? 
      toolsMatch[1].match(/'([^']+)'/g)?.map(t => t.replace(/'/g, '')) || [] : 
      ['web_search', 'analyze_file'];
    
    employees.push({
      id,
      name,
      role,
      category,
      description,
      provider,
      price: parseInt(price),
      skills,
      specialty,
      defaultTools,
      fitLevel: 'excellent',
      popular: false
    });
  }
  
  return employees;
}

// Main execution
console.log('🚀 Starting Provider-Specific AI Employee System Prompt Generation...');

try {
  // Parse all AI employees
  const allEmployees = parseAIEmployees();
  console.log(`📊 Parsed ${allEmployees.length} AI employees from frontend data`);
  
  // Group by provider for statistics
  const providerStats = allEmployees.reduce((acc, emp) => {
    acc[emp.provider] = (acc[emp.provider] || 0) + 1;
    return acc;
  }, {});
  
  console.log('📈 Provider Distribution:');
  Object.entries(providerStats).forEach(([provider, count]) => {
    console.log(`  - ${provider}: ${count} employees`);
  });
  
  // Generate SQL insert statements for all employees
  let sqlStatements = [];
  let employeeCount = 0;
  
  allEmployees.forEach((employee, index) => {
    const systemPrompt = generateProviderSpecificPrompt(employee);
    const capabilities = generateCapabilities(employee);
    const tools = generateTools(employee);
    const performance = generatePerformance();
    const availability = generateAvailability();
    const cost = generateCost(employee);
    const metadata = generateMetadata(employee);
    
    // Generate UUID for database
    const uuid = `550e8400-e29b-41d4-a716-44665544${String(index + 100).padStart(4, '0')}`;
    
    const sql = `INSERT INTO ai_employees (id, name, role, category, department, level, status, capabilities, system_prompt, tools, performance, availability, cost, metadata) VALUES
('${uuid}', '${employee.name}', '${employee.role}', '${employee.category}', '${employee.category}', 'principal', 'available',
'${JSON.stringify(capabilities).replace(/'/g, "''")}',
'${systemPrompt.replace(/'/g, "''")}',
'${JSON.stringify(tools).replace(/'/g, "''")}',
'${JSON.stringify(performance).replace(/'/g, "''")}',
'${JSON.stringify(availability).replace(/'/g, "''")}',
'${JSON.stringify(cost).replace(/'/g, "''")}',
'${JSON.stringify(metadata).replace(/'/g, "''")}');`;
    
    sqlStatements.push(sql);
    employeeCount++;
  });
  
  // Write the comprehensive SQL file
  const outputPath = path.join(__dirname, '../supabase/migrations/20250110000009_provider_optimized_ai_employees.sql');
  const sqlContent = `-- ================================================================
-- Provider-Optimized AI Employees with Advanced System Prompts
-- ================================================================
-- This migration adds ${employeeCount} AI employees with provider-specific
-- system prompts based on latest best practices from:
-- - OpenAI GPT-5 Prompting Guide (ChatGPT employees)
-- - Anthropic Claude Cookbooks (Claude employees)  
-- - Google Gemini API Documentation (Gemini employees)
-- - Perplexity Research Capabilities (Perplexity employees)
-- ================================================================

-- Clear existing data (except the 5 sample employees)
DELETE FROM ai_employees WHERE id NOT IN (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440005'
);

-- Insert all AI employees with provider-optimized system prompts
${sqlStatements.join('\n\n')}

-- Update statistics
ANALYZE ai_employees;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PROVIDER-OPTIMIZED AI EMPLOYEES MIGRATION COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Added ${employeeCount} AI employees with provider-specific prompts';
    RAISE NOTICE 'Total AI employees in database: ${employeeCount + 5}';
    RAISE NOTICE 'All employees have 15+ years experience and principal-level expertise';
    RAISE NOTICE 'Provider Distribution:';
    RAISE NOTICE '  - ChatGPT: ${providerStats.chatgpt || 0} employees (High Eagerness, Agentic)';
    RAISE NOTICE '  - Claude: ${providerStats.claude || 0} employees (Technical Excellence)';
    RAISE NOTICE '  - Gemini: ${providerStats.gemini || 0} employees (Multimodal Creative)';
    RAISE NOTICE '  - Perplexity: ${providerStats.perplexity || 0} employees (Research Focused)';
    RAISE NOTICE 'All employees optimized with latest provider best practices';
    RAISE NOTICE 'Enhanced with senior certifications and leadership capabilities';
    RAISE NOTICE '========================================';
END $$;`;

  fs.writeFileSync(outputPath, sqlContent);
  
  console.log(`✅ Generated provider-optimized system prompts for ${employeeCount} AI employees`);
  console.log(`📁 SQL migration file created: ${outputPath}`);
  console.log('🎯 Next step: Run the migration to add all provider-optimized AI employees to the database');
  console.log('📊 Provider-specific optimizations applied:');
  console.log('  - ChatGPT: High eagerness, persistent execution, minimal clarification');
  console.log('  - Claude: Technical reasoning, apply_patch workflows, systematic exploration');
  console.log('  - Gemini: Multimodal capabilities, image/video generation, creative workflows');
  console.log('  - Perplexity: Real-time research, source citation, data-driven insights');
  console.log('🏆 All employees enhanced with 15+ years experience and principal-level expertise');
  console.log('🎓 Senior certifications and leadership capabilities added to all employees');
  
} catch (error) {
  console.error('❌ Error generating provider-specific prompts:', error);
  process.exit(1);
}
