/**
 * Agent Communication Component
 * Shows inter-agent messages and delegations
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Bot, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Users,
  Workflow,
  Zap,
  Send,
  Reply,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { interAgentService, type AgentMessage, type AgentDelegation } from '@/services/inter-agent-service';

interface AgentCommunicationProps {
  agentId: string;
  className?: string;
}

export const AgentCommunication: React.FC<AgentCommunicationProps> = ({
  agentId,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<'messages' | 'delegations'>('messages');
  const [newMessage, setNewMessage] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  
  const queryClient = useQueryClient();

  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery<AgentMessage[]>({
    queryKey: ['agent-messages', agentId],
    queryFn: () => interAgentService.getMessagesForAgent(agentId),
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Fetch delegations
  const { data: delegations = [], isLoading: delegationsLoading } = useQuery<AgentDelegation[]>({
    queryKey: ['agent-delegations', agentId],
    queryFn: () => interAgentService.getDelegationsForAgent(agentId),
    refetchInterval: 5000,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: { content: string; toAgentId: string }) => {
      return interAgentService.sendMessage({
        fromAgentId: agentId,
        toAgentId: message.toAgentId,
        messageType: 'request',
        content: message.content,
        priority: 'medium',
        status: 'pending',
        context: {},
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-messages', agentId] });
      setNewMessage('');
    },
  });

  // Respond to delegation mutation
  const respondToDelegationMutation = useMutation({
    mutationFn: async ({ delegationId, response }: { delegationId: string; response: 'accepted' | 'rejected' }) => {
      return interAgentService.respondToDelegation(delegationId, response, agentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-delegations', agentId] });
    },
  });

  const getMessageIcon = (messageType: AgentMessage['messageType']) => {
    switch (messageType) {
      case 'delegation':
        return <Workflow className="h-4 w-4 text-blue-600" />;
      case 'request':
        return <MessageSquare className="h-4 w-4 text-green-600" />;
      case 'response':
        return <Reply className="h-4 w-4 text-purple-600" />;
      case 'update':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'completion':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusIcon = (status: AgentMessage['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'in_progress':
        return <Zap className="h-4 w-4 text-blue-600 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: AgentMessage['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedAgent) return;
    
    sendMessageMutation.mutate({
      content: newMessage,
      toAgentId: selectedAgent,
    });
  };

  const handleRespondToDelegation = (delegationId: string, response: 'accepted' | 'rejected') => {
    respondToDelegationMutation.mutate({ delegationId, response });
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Agent Communication</h2>
          <p className="text-muted-foreground">
            Inter-agent messages and task delegations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            <Bot className="h-3 w-3 mr-1" />
            Agent ID: {agentId}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        <Button
          variant={activeTab === 'messages' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('messages')}
          className="flex-1"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Messages ({messages.length})
        </Button>
        <Button
          variant={activeTab === 'delegations' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('delegations')}
          className="flex-1"
        >
          <Workflow className="h-4 w-4 mr-2" />
          Delegations ({delegations.length})
        </Button>
      </div>

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div className="space-y-4">
          {/* Send Message */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Send Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">To Agent</label>
                  <select
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  >
                    <option value="">Select an agent</option>
                    <option value="agent-1">Alex Developer</option>
                    <option value="agent-2">Sarah Designer</option>
                    <option value="agent-3">Mike Writer</option>
                    <option value="agent-4">Emma Analyst</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <select className="w-full mt-1 px-3 py-2 border rounded-md">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full mt-1 px-3 py-2 border rounded-md min-h-[100px]"
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || !selectedAgent || sendMessageMutation.isPending}
                className="w-full"
              >
                {sendMessageMutation.isPending ? (
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send Message
              </Button>
            </CardContent>
          </Card>

          {/* Messages List */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Messages</CardTitle>
            </CardHeader>
            <CardContent>
              {messagesLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Messages</h3>
                  <p className="text-muted-foreground">
                    No messages received yet.
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex-shrink-0 mt-1">
                          {getMessageIcon(message.messageType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">
                                From: {message.fromAgentId}
                              </span>
                              <Badge className={cn('text-xs', getPriorityColor(message.priority))}>
                                {message.priority}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {message.messageType}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(message.status)}
                              <span className="text-xs text-muted-foreground">
                                {formatTimestamp(message.createdAt)}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-foreground mb-2">{message.content}</p>
                          {message.taskId && (
                            <div className="text-xs text-muted-foreground">
                              Task ID: {message.taskId}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delegations Tab */}
      {activeTab === 'delegations' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Delegations</CardTitle>
            </CardHeader>
            <CardContent>
              {delegationsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : delegations.length === 0 ? (
                <div className="text-center py-8">
                  <Workflow className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Delegations</h3>
                  <p className="text-muted-foreground">
                    No task delegations received yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {delegations.map((delegation) => (
                    <div
                      key={delegation.id}
                      className="p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold">{delegation.task.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            From: {delegation.delegatorId}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={cn('text-xs', getPriorityColor(delegation.task.priority))}>
                            {delegation.task.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {delegation.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-foreground mb-4">{delegation.task.description}</p>
                      
                      <div className="space-y-2 mb-4">
                        <div>
                          <span className="text-sm font-medium">Requirements:</span>
                          <ul className="text-sm text-muted-foreground ml-4">
                            {delegation.task.requirements.map((req, index) => (
                              <li key={index}>• {req}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Expected Output:</span>
                          <p className="text-sm text-muted-foreground ml-4">
                            {delegation.task.expectedOutput}
                          </p>
                        </div>
                        {delegation.task.deadline && (
                          <div>
                            <span className="text-sm font-medium">Deadline:</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              {delegation.task.deadline.toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {delegation.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleRespondToDelegation(delegation.id, 'accepted')}
                            disabled={respondToDelegationMutation.isPending}
                          >
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRespondToDelegation(delegation.id, 'rejected')}
                            disabled={respondToDelegationMutation.isPending}
                          >
                            <ThumbsDown className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                      
                      {delegation.result && (
                        <div className="mt-4 p-3 bg-muted rounded">
                          <h5 className="text-sm font-medium mb-2">Result:</h5>
                          <p className="text-sm text-foreground">{delegation.result.output}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
