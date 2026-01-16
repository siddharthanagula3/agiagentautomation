/**
 * Agent Selection Hook
 * Manages intelligent agent routing and selection in VIBE interface
 */

import { useState, useCallback, useEffect } from 'react';
import { useVibeAgentStore } from '../stores/vibe-agent-store';
import { useVibeChatStore } from '../stores/vibe-chat-store';
import type { AIEmployee } from '@core/types/ai-employee';
import type { RoutingResult, AgentMatch, TaskComplexity } from '../types';

// Updated: Jan 15th 2026 - Fixed any type
export interface AgentSelectionOptions {
  employees: AIEmployee[];
  enableComplexityAnalysis?: boolean;
  preferredAgent?: string;
  conversationHistory?: unknown[];
}

export interface UseAgentSelectionReturn {
  // State
  selectedAgent: AIEmployee | null;
  routingResult: RoutingResult | null;
  isAnalyzing: boolean;
  error: string | null;

  // Actions
  selectAgent: (
    userMessage: string,
    options?: AgentSelectionOptions
  ) => Promise<AIEmployee | null>;
  selectAgentManually: (agentName: string) => void;
  clearSelection: () => void;

  // Utilities
  getAgentByName: (name: string) => AIEmployee | undefined;
  getTopMatches: (userMessage: string, limit?: number) => Promise<AgentMatch[]>;
  analyzeComplexity: (userMessage: string) => Promise<TaskComplexity>;
}

/**
 * Hook for intelligent agent selection and routing
 *
 * Features:
 * - Keyword-based matching (fast path)
 * - Semantic analysis for ambiguous cases
 * - Complexity evaluation (single vs multi-agent)
 * - Manual agent override support
 * - Conversation context awareness
 *
 * @example
 * ```tsx
 * const { selectAgent, selectedAgent, isAnalyzing } = useAgentSelection();
 *
 * const handleSendMessage = async (message: string) => {
 *   const agent = await selectAgent(message, { employees: hiredEmployees });
 *   if (agent) {
 *     // Send message to selected agent
 *   }
 * };
 * ```
 */
export function useAgentSelection(): UseAgentSelectionReturn {
  const selectedAgentId = useVibeChatStore((state) => state.selectedAgent);
  const messages = useVibeChatStore((state) => state.messages);
  const setPrimaryAgent = useVibeAgentStore((state) => state.setPrimaryAgent);

  const [selectedAgent, setSelectedAgent] = useState<AIEmployee | null>(null);
  const [routingResult, setRoutingResult] = useState<RoutingResult | null>(
    null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Keyword-based matching (Stage 1)
   * Fast pattern matching against employee descriptions
   */
  const keywordMatch = useCallback(
    (userMessage: string, employees: AIEmployee[]): AgentMatch | null => {
      const lowerMessage = userMessage.toLowerCase();
      const matches: Array<{ employee: AIEmployee; score: number }> = [];

      for (const employee of employees) {
        const nameLower = employee.name.toLowerCase();
        const descLower = employee.description.toLowerCase();
        let score = 0;
        const matchedKeywords: string[] = [];

        // Check if employee name is mentioned
        if (lowerMessage.includes(nameLower)) {
          score += 50;
          matchedKeywords.push(employee.name);
        }

        // Extract keywords from description
        const keywords = descLower
          .split(/[,.\s]+/)
          .filter((word) => word.length > 3);

        for (const keyword of keywords) {
          if (lowerMessage.includes(keyword)) {
            score += 10;
            matchedKeywords.push(keyword);
          }
        }

        // Check tool requirements
        for (const tool of employee.tools) {
          const toolLower = tool.toLowerCase();
          if (lowerMessage.includes(toolLower)) {
            score += 15;
            matchedKeywords.push(tool);
          }
        }

        if (score > 0) {
          matches.push({ employee, score });
        }
      }

      if (matches.length === 0) return null;

      // Get best match
      matches.sort((a, b) => b.score - a.score);
      const bestMatch = matches[0];
      const confidence = Math.min(bestMatch.score / 100, 1);

      return {
        employee: bestMatch.employee,
        confidence,
        reasoning: `Keyword match based on: ${bestMatch.employee.description}`,
      };
    },
    []
  );

  /**
   * Semantic analysis (Stage 2)
   * Use LLM for ambiguous cases - simplified version
   */
  const semanticMatch = useCallback(
    async (
      userMessage: string,
      employees: AIEmployee[]
    ): Promise<AgentMatch | null> => {
      // Simplified semantic matching based on description similarity
      // In production, this would call an LLM for true semantic understanding

      const matches: Array<{ employee: AIEmployee; score: number }> = [];

      // Simple word overlap scoring
      const messageWords = userMessage
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3);

      for (const employee of employees) {
        const descWords = employee.description
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w.length > 3);

        const overlap = messageWords.filter((word) =>
          descWords.some((dw) => dw.includes(word) || word.includes(dw))
        ).length;

        const score = overlap / Math.max(messageWords.length, 1);

        if (score > 0) {
          matches.push({ employee, score });
        }
      }

      if (matches.length === 0) return null;

      matches.sort((a, b) => b.score - a.score);
      const bestMatch = matches[0];

      return {
        employee: bestMatch.employee,
        confidence: bestMatch.score,
        reasoning: `Semantic match based on description similarity`,
      };
    },
    []
  );

  /**
   * Analyze task complexity
   */
  const analyzeComplexity = useCallback(
    async (userMessage: string): Promise<TaskComplexity> => {
      // Simple heuristics for complexity analysis
      const complexityIndicators = {
        simple: ['review', 'check', 'explain', 'what', 'how', 'why', 'show me'],
        complex: [
          'build',
          'create',
          'implement',
          'refactor',
          'design',
          'architecture',
          'multiple',
          'integrate',
        ],
      };

      const lowerMessage = userMessage.toLowerCase();

      const simpleCount = complexityIndicators.simple.filter((word) =>
        lowerMessage.includes(word)
      ).length;

      const complexCount = complexityIndicators.complex.filter((word) =>
        lowerMessage.includes(word)
      ).length;

      // Also consider message length and punctuation
      const wordCount = userMessage.split(/\s+/).length;
      const hasMultipleSentences = userMessage.split(/[.!?]+/).length > 2;

      if (
        complexCount > simpleCount ||
        wordCount > 50 ||
        hasMultipleSentences
      ) {
        return 'COMPLEX';
      }

      return 'SIMPLE';
    },
    []
  );

  /**
   * Get top agent matches for a message
   */
  const getTopMatches = useCallback(
    async (userMessage: string, limit: number = 5): Promise<AgentMatch[]> => {
      const employees = useVibeAgentStore.getState().activeAgents;
      const employeeList = Array.from(employees.values()).map(
        (ae) => ae.employee
      );

      // Get keyword matches
      const keywordMatches: AgentMatch[] = [];
      for (const employee of employeeList) {
        const match = keywordMatch(userMessage, [employee]);
        if (match && match.confidence > 0.1) {
          keywordMatches.push(match);
        }
      }

      // Sort and limit
      return keywordMatches
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, limit);
    },
    [keywordMatch]
  );

  /**
   * Select agent based on user message
   */
  const selectAgent = useCallback(
    async (
      userMessage: string,
      options?: AgentSelectionOptions
    ): Promise<AIEmployee | null> => {
      setIsAnalyzing(true);
      setError(null);

      try {
        const employees = options?.employees || [];

        if (employees.length === 0) {
          throw new Error('No employees available for selection');
        }

        // Check for manual override
        if (options?.preferredAgent) {
          const preferred = employees.find(
            (e) => e.name === options.preferredAgent
          );
          if (preferred) {
            setSelectedAgent(preferred);
            setPrimaryAgent(preferred);
            setRoutingResult({
              mode: 'single',
              primaryAgent: preferred,
              confidence: 1.0,
              reasoning: 'Manual agent selection',
            });
            return preferred;
          }
        }

        // Stage 1: Keyword matching
        const keywordResult = keywordMatch(userMessage, employees);

        if (keywordResult && keywordResult.confidence >= 0.7) {
          // High confidence keyword match
          setSelectedAgent(keywordResult.employee);
          setPrimaryAgent(keywordResult.employee);
          setRoutingResult({
            mode: 'single',
            primaryAgent: keywordResult.employee,
            confidence: keywordResult.confidence,
            reasoning: keywordResult.reasoning,
          });
          return keywordResult.employee;
        }

        // Stage 2: Semantic analysis
        const semanticResult = await semanticMatch(userMessage, employees);

        if (semanticResult && semanticResult.confidence >= 0.5) {
          setSelectedAgent(semanticResult.employee);
          setPrimaryAgent(semanticResult.employee);
          setRoutingResult({
            mode: 'single',
            primaryAgent: semanticResult.employee,
            confidence: semanticResult.confidence,
            reasoning: semanticResult.reasoning,
          });
          return semanticResult.employee;
        }

        // Stage 3: Complexity analysis (if enabled)
        if (options?.enableComplexityAnalysis) {
          const complexity = await analyzeComplexity(userMessage);

          if (complexity === 'COMPLEX') {
            // For complex tasks, use supervisor mode
            // Find a coordinator/manager type employee
            const supervisor = employees.find(
              (e) =>
                e.description.toLowerCase().includes('coordinator') ||
                e.description.toLowerCase().includes('manager') ||
                e.description.toLowerCase().includes('supervisor')
            );

            if (supervisor) {
              setSelectedAgent(supervisor);
              setPrimaryAgent(supervisor);
              setRoutingResult({
                mode: 'supervisor',
                confidence: 0.6,
                reasoning: 'Complex task detected, using supervisor mode',
              });
              return supervisor;
            }
          }
        }

        // Fallback: Use first available employee or best keyword match
        const fallbackAgent = keywordResult?.employee || employees[0];
        setSelectedAgent(fallbackAgent);
        setPrimaryAgent(fallbackAgent);
        setRoutingResult({
          mode: 'single',
          primaryAgent: fallbackAgent,
          confidence: 0.5,
          reasoning: 'Fallback to default agent',
        });

        return fallbackAgent;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Agent selection failed';
        setError(errorMessage);
        return null;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [keywordMatch, semanticMatch, analyzeComplexity, setPrimaryAgent]
  );

  /**
   * Manually select an agent by name
   */
  const selectAgentManually = useCallback(
    (agentName: string) => {
      const employees = useVibeAgentStore.getState().activeAgents;
      const agent = Array.from(employees.values()).find(
        (ae) => ae.employee.name === agentName
      );

      if (agent) {
        setSelectedAgent(agent.employee);
        setPrimaryAgent(agent.employee);
        setRoutingResult({
          mode: 'single',
          primaryAgent: agent.employee,
          confidence: 1.0,
          reasoning: 'Manual selection via # syntax',
        });
      }
    },
    [setPrimaryAgent]
  );

  /**
   * Clear agent selection
   */
  const clearSelection = useCallback(() => {
    setSelectedAgent(null);
    setRoutingResult(null);
    setError(null);
  }, []);

  /**
   * Get agent by name
   */
  const getAgentByName = useCallback((name: string): AIEmployee | undefined => {
    const employees = useVibeAgentStore.getState().activeAgents;
    const agent = Array.from(employees.values()).find(
      (ae) => ae.employee.name === name
    );
    return agent?.employee;
  }, []);

  // Updated: Jan 15th 2026 - Fixed infinite loop from unstable function dependency
  // Update selected agent when chat store changes
  useEffect(() => {
    if (selectedAgentId) {
      selectAgentManually(selectedAgentId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgentId]);

  return {
    // State
    selectedAgent,
    routingResult,
    isAnalyzing,
    error,

    // Actions
    selectAgent,
    selectAgentManually,
    clearSelection,

    // Utilities
    getAgentByName,
    getTopMatches,
    analyzeComplexity,
  };
}
