# Multi-Agent Collaboration Feature

## Overview

The /chat page now supports intelligent multi-agent collaboration with a supervisor pattern. The system automatically detects task complexity and routes requests to either a single AI employee (simple tasks) or a team of AI employees (complex tasks) that collaborate to provide comprehensive answers.

## Architecture

### Components

1. **multi-agent-collaboration-service.ts** (`/src/features/chat/services/`)
   - Core service implementing the supervisor pattern
   - Analyzes task complexity
   - Orchestrates multi-employee collaboration
   - Synthesizes final comprehensive answers

2. **employee-chat-service.ts** (Updated)
   - Routes tasks based on complexity analysis
   - Handles both simple (single-employee) and complex (multi-agent) workflows
   - Manages collaboration message display

3. **use-chat-interface.ts** (Updated)
   - Supports collaboration messages in chat history
   - Displays multi-agent metadata (employees involved, collaboration type)
   - Shows individual employee contributions and supervisor synthesis

4. **MessageBubble.tsx** (Enhanced)
   - Visual badges for collaboration type (Contribution, Discussion, Synthesis)
   - Team composition badges
   - Color-coded messages by employee

## How It Works

### 1. Task Complexity Detection

The system analyzes user messages for complexity indicators:

**Complexity Keywords:**
- Build/create/develop/design/implement/architect
- System/platform/application/complete/full/entire
- Comprehensive/end-to-end/full-stack/production-ready

**Multi-Domain Keywords:**
- "frontend and backend", "ui and api", "design and code"
- "security and performance", "database and api"

**Technical Depth Keywords:**
- Scalable/production/enterprise/distributed
- Microservices/infrastructure/architecture

**Scoring System:**
- Build keywords: +2 points each
- Multi-domain keywords: +3 points each
- Technical depth: +2 points each
- Multiple expertise areas: +2 points per area
- Long detailed requests (>50 words): +2 points

**Threshold:** 5+ points OR 2+ expertise areas = Complex task

### 2. Simple Task Flow

**User:** "Help me debug this Python function"

**System Response:**
1. Analyzes complexity → Simple task
2. Selects single best employee (e.g., code-reviewer)
3. Employee processes and responds
4. User receives direct answer

**UI Display:**
- Single employee badge with selection reason
- Standard message format
- Token usage from one employee

### 3. Complex Task Flow

**User:** "Build a complete e-commerce platform with React frontend, Node.js backend, and payment integration"

**System Response:**
1. Analyzes complexity → Complex task detected
2. Identifies required expertise: Frontend, Backend, Security, Database
3. Selects optimal team (2-4 employees based on requirements)
4. Employees collaborate:
   - Each contributes their expertise (Contribution)
   - Employees may discuss each other's ideas (Discussion)
   - Supervisor synthesizes final comprehensive answer (Synthesis)
5. User receives all collaboration messages + final answer

**UI Display:**
- Team composition badge showing number of employees
- Individual contribution messages with employee avatars
- Discussion messages showing employee-to-employee communication
- Final synthesis message from Supervisor with special badge
- Total token usage across all employees

## Collaboration Flow Example

```
User: "Build a secure login system with React and Express"

🔍 Analyzing task complexity...
🤝 Complex task detected! Initiating multi-agent collaboration...
💡 Requires 3 areas of expertise: Frontend Development, Backend Development, Security.
👥 Team assembled: frontend-engineer, backend-engineer, security-expert

💭 frontend-engineer - Contribution:
"For the React frontend, I'll create a LoginForm component with form validation using Formik..."

💭 backend-engineer - Contribution:
"On the Express backend, I'll implement JWT-based authentication with refresh tokens..."

💭 security-expert - Contribution:
"From a security perspective, we need to implement rate limiting, password hashing with bcrypt..."

💬 frontend-engineer → backend-engineer - Discussion:
"Great approach with JWT! I'll ensure the frontend stores the token securely in httpOnly cookies."

📋 Supervisor - Final Synthesis:
"Here's a comprehensive solution for your secure login system combining all expertise:

## Frontend (React)
[Synthesized frontend implementation combining all insights]

## Backend (Express)
[Synthesized backend implementation with security considerations]

## Security Best Practices
[Consolidated security recommendations]

This collaborative solution addresses authentication, security, and user experience comprehensively."
```

## Visual Indicators

### Badges

1. **Contribution Badge** (💭)
   - Color: Employee's unique color
   - Shows when employee contributes initial expertise

2. **Discussion Badge** (💬)
   - Color: Employee's unique color
   - Shows employee-to-employee communication
   - Includes "→ EmployeeName" to show recipient

3. **Final Synthesis Badge** (📋)
   - Color: Indigo (#4f46e5) - Supervisor color
   - Shows final comprehensive answer

4. **Team Badge** (🤝)
   - Gradient: Purple to Pink
   - Shows "Team of N" where N = number of employees

### Employee Avatars

Each employee has:
- Unique color (8 colors in rotation)
- Initials derived from employee name
- Consistent across all messages

**Supervisor:**
- Special indigo color (#4f46e5)
- "SU" initials

## Implementation Details

### Complexity Analysis Algorithm

```typescript
interface TaskComplexityAnalysis {
  isComplex: boolean;
  reason: string;
  requiredExpertise: string[];
  estimatedEmployeeCount: number;
}

// Example output for complex task:
{
  isComplex: true,
  reason: "Complex task detected: build, frontend, backend. Requires 3 areas of expertise: Frontend Development, Backend Development, Database Design.",
  requiredExpertise: ["Frontend Development", "Backend Development", "Database Design"],
  estimatedEmployeeCount: 3
}
```

### Employee Selection

Employees are scored based on:
1. **Expertise match** (+10 points): Description matches required expertise
2. **Keyword match** (+8 points): Specific domain keywords (frontend, backend, etc.)
3. **Tool availability** (+0.5 per tool): More tools = more capable

Top N employees are selected (2-4 based on complexity).

### Collaboration Process

1. **Initial Contributions**: Each employee analyzes task from their expertise perspective
2. **Cross-Discussion** (optional): For very complex tasks (3+ employees), employees discuss each other's contributions
3. **Supervisor Synthesis**: Supervisor combines all contributions into coherent final answer

### Token Management

- Individual employee contributions: ~500-1000 tokens each
- Discussions: ~300-500 tokens each
- Supervisor synthesis: ~1500-2000 tokens
- Total tracked in metadata.totalTokens

## Configuration

### Complexity Threshold

Adjust in `multi-agent-collaboration-service.ts`:

```typescript
const isComplex = complexityScore >= 5 || requiredExpertise.length >= 2;
```

- Lower threshold (3-4) = More multi-agent collaborations
- Higher threshold (6-7) = Fewer multi-agent collaborations

### Max Employees

```typescript
const estimatedEmployeeCount = Math.min(Math.max(requiredExpertise.length, 2), 4);
```

- Minimum: 2 employees
- Maximum: 4 employees
- Based on number of required expertise areas

### Employee Selection

Edit keyword matching in `selectEmployeesForCollaboration()` to prioritize specific employees.

## Testing

### Simple Task Examples

- "Explain async/await in JavaScript"
- "Review this code for bugs"
- "Help me learn React hooks"
- "Debug this Python error"

**Expected:** Single employee, no collaboration messages

### Complex Task Examples

- "Build a real-time chat application with React and WebSockets"
- "Create a REST API with authentication and database"
- "Design and implement a scalable microservices architecture"
- "Develop a complete e-commerce platform"

**Expected:** Multiple employees, collaboration messages, supervisor synthesis

## Future Enhancements

1. **User Control**: Allow users to manually request multi-agent collaboration
2. **Collaboration Modes**: Sequential, parallel, or hierarchical
3. **Voting System**: Employees vote on best approach
4. **Iterative Refinement**: Multiple rounds of collaboration
5. **Expertise Tags**: Better employee categorization
6. **Performance Metrics**: Track collaboration effectiveness

## API Response Format

### Simple Task Response

```typescript
{
  response: string,
  selectedEmployee: AIEmployee,
  selectionReason: string,
  thinkingSteps: string[],
  metadata: {
    model: string,
    tokensUsed?: number,
    isMultiAgent: false
  }
}
```

### Complex Task Response

```typescript
{
  response: string, // Final synthesized answer
  selectionReason: string,
  thinkingSteps: string[],
  collaborationMessages: EmployeeChatMessage[], // All contributions and discussions
  metadata: {
    model: string,
    tokensUsed: number,
    isMultiAgent: true,
    employeesInvolved: string[]
  }
}
```

## Troubleshooting

### Issue: All tasks routed to single employee

**Solution:** Lower complexity threshold or add more complexity keywords for your domain

### Issue: Too many multi-agent collaborations

**Solution:** Raise complexity threshold to 6-7 points

### Issue: Wrong employees selected

**Solution:** Improve employee descriptions in `.agi/employees/*.md` files to better match expertise areas

### Issue: Collaboration messages not showing

**Solution:** Check that `isCollaboration` metadata is set correctly in `employee-chat-service.ts`

## Performance Considerations

- **Simple tasks:** 1 LLM call (~1-2 seconds)
- **Complex tasks:** 3-6 LLM calls (~5-10 seconds)
  - 2-4 employee contributions
  - 0-2 discussions
  - 1 supervisor synthesis

**Token Usage:**
- Simple: 500-2000 tokens
- Complex: 3000-8000 tokens

## Credits

Inspired by:
- OpenAI's GPT-4 reasoning traces
- AutoGen multi-agent framework
- LangChain agent orchestration patterns
- MGX.dev multi-agent chat interface

---

**Version:** 1.0
**Date:** November 18, 2025
**Status:** Production Ready
