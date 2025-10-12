/**
 * Workforce store using Zustand
 * Handles AI workforce jobs, task delegation, and worker management
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { WorkforceJob } from '@/components/WorkforceDashboard';
import { jobsService } from '../services/jobsService';
import { agentsService } from '../services/agentsService';
import { realtimeService } from '../services/realtimeService';
import type { Database } from '../integrations/supabase/types';

type Job = Database['public']['Tables']['jobs']['Row'];
type AIAgent = Database['public']['Tables']['ai_agents']['Row'];

export interface WorkforceWorker {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  avatar?: string;
  status: 'idle' | 'working' | 'completed' | 'failed' | 'offline';
  capabilities: string[];
  performance: {
    successRate: number;
    averageResponseTime: number;
    totalJobsCompleted: number;
    rating: number;
  };
  currentJobId?: string;
  lastActiveAt: Date;
  hourlyRate: number;
  availability: {
    timezone: string;
    workingHours: {
      start: string;
      end: string;
    };
    daysOfWeek: number[];
  };
}

export interface JobTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  estimatedDuration: number;
  requiredSkills: string[];
  defaultInstructions: string;
  parameters: {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'select';
    required: boolean;
    options?: string[];
    defaultValue?: unknown;
  }[];
}

export interface WorkforceState {
  // Jobs
  jobs: Record<string, WorkforceJob>;
  activeJobs: string[];
  completedJobs: string[];
  failedJobs: string[];

  // Workers
  workers: Record<string, WorkforceWorker>;
  availableWorkers: string[];
  busyWorkers: string[];

  // Job templates
  templates: Record<string, JobTemplate>;

  // UI state
  isLoading: boolean;
  error: string | null;
  selectedJobId: string | null;

  // Filtering and search
  searchQuery: string;
  statusFilter:
    | 'all'
    | 'queued'
    | 'running'
    | 'completed'
    | 'failed'
    | 'paused';
  priorityFilter: 'all' | 'low' | 'medium' | 'high';
  workerFilter: string[];

  // Real-time updates
  liveUpdates: boolean;
  lastUpdateAt: Date | null;

  // Statistics
  stats: {
    totalJobsToday: number;
    completedJobsToday: number;
    totalCostToday: number;
    averageCompletionTime: number;
    workerUtilization: number;
  };
}

export interface WorkforceActions {
  // Job management
  createJob: (job: Omit<WorkforceJob, 'id' | 'createdAt'>) => Promise<string>;
  updateJob: (id: string, updates: Partial<WorkforceJob>) => void;
  deleteJob: (id: string) => void;
  assignWorkers: (jobId: string, workerIds: string[]) => void;
  startJob: (jobId: string) => Promise<void>;
  pauseJob: (jobId: string) => Promise<void>;
  resumeJob: (jobId: string) => Promise<void>;
  cancelJob: (jobId: string) => Promise<void>;
  retryJob: (jobId: string) => Promise<void>;

  // Real-time initialization
  initializeRealtime: (userId: string) => Promise<void>;
  cleanupRealtime: () => Promise<void>;

  // Worker management
  addWorker: (worker: Omit<WorkforceWorker, 'id'>) => string;
  updateWorker: (id: string, updates: Partial<WorkforceWorker>) => void;
  removeWorker: (id: string) => void;
  setWorkerStatus: (id: string, status: WorkforceWorker['status']) => void;

  // Template management
  createTemplate: (template: Omit<JobTemplate, 'id'>) => string;
  updateTemplate: (id: string, updates: Partial<JobTemplate>) => void;
  deleteTemplate: (id: string) => void;
  createJobFromTemplate: (
    templateId: string,
    parameters: Record<string, unknown>
  ) => string;

  // Search and filtering
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: WorkforceState['statusFilter']) => void;
  setPriorityFilter: (priority: WorkforceState['priorityFilter']) => void;
  setWorkerFilter: (workerIds: string[]) => void;
  clearFilters: () => void;

  // Real-time updates
  setLiveUpdates: (enabled: boolean) => void;
  refreshData: () => Promise<void>;

  // Utility actions
  getJobsByStatus: (status: WorkforceJob['status']) => WorkforceJob[];
  getWorkersByStatus: (status: WorkforceWorker['status']) => WorkforceWorker[];
  calculateJobCost: (jobId: string) => number;
  estimateJobDuration: (jobId: string) => number;
  optimizeWorkerAssignment: (jobId: string) => string[];
  exportJobs: (format: 'csv' | 'json') => string;
  setError: (error: string | null) => void;
}

export interface WorkforceStore extends WorkforceState, WorkforceActions {}

const MOCK_TEMPLATES: JobTemplate[] = [
  {
    id: 'template-1',
    name: 'Data Analysis',
    description: 'Analyze dataset and provide insights',
    category: 'Analytics',
    estimatedDuration: 3600,
    requiredSkills: ['data-analysis', 'statistics', 'python'],
    defaultInstructions:
      'Analyze the provided dataset and generate a comprehensive report with insights and recommendations.',
    parameters: [
      {
        name: 'dataset_url',
        type: 'string',
        required: true,
      },
      {
        name: 'analysis_type',
        type: 'select',
        required: true,
        options: ['descriptive', 'predictive', 'prescriptive'],
        defaultValue: 'descriptive',
      },
      {
        name: 'output_format',
        type: 'select',
        required: false,
        options: ['pdf', 'html', 'markdown'],
        defaultValue: 'html',
      },
    ],
  },
  {
    id: 'template-2',
    name: 'Content Creation',
    description: 'Create marketing content',
    category: 'Marketing',
    estimatedDuration: 1800,
    requiredSkills: ['writing', 'marketing', 'seo'],
    defaultInstructions:
      'Create engaging marketing content based on the provided brief and target audience.',
    parameters: [
      {
        name: 'content_type',
        type: 'select',
        required: true,
        options: ['blog-post', 'social-media', 'email', 'landing-page'],
      },
      {
        name: 'word_count',
        type: 'number',
        required: false,
        defaultValue: 500,
      },
      {
        name: 'tone',
        type: 'select',
        required: false,
        options: ['professional', 'casual', 'friendly', 'authoritative'],
        defaultValue: 'professional',
      },
    ],
  },
];

const INITIAL_STATE: WorkforceState = {
  jobs: {},
  activeJobs: [],
  completedJobs: [],
  failedJobs: [],
  workers: {},
  availableWorkers: [],
  busyWorkers: [],
  templates: MOCK_TEMPLATES.reduce(
    (acc, template) => {
      acc[template.id] = template;
      return acc;
    },
    {} as Record<string, JobTemplate>
  ),
  isLoading: false,
  error: null,
  selectedJobId: null,
  searchQuery: '',
  statusFilter: 'all',
  priorityFilter: 'all',
  workerFilter: [],
  liveUpdates: true,
  lastUpdateAt: null,
  stats: {
    totalJobsToday: 0,
    completedJobsToday: 0,
    totalCostToday: 0,
    averageCompletionTime: 0,
    workerUtilization: 0,
  },
};

export const useWorkforceStore = create<WorkforceStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...INITIAL_STATE,

        // Job management
        createJob: async (jobData: Omit<WorkforceJob, 'id' | 'createdAt'>) => {
          set(state => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            // Get current user ID (you'll need to implement this)
            const userId = 'current-user-id'; // TODO: Get from auth context

            const { data: job, error } = await jobsService.createJob(userId, {
              title: jobData.title,
              description: jobData.description,
              priority: jobData.priority as unknown,
              assigned_agent_id: jobData.assignedWorkers[0]?.id,
              estimated_duration: jobData.estimatedCompletion
                ? Math.floor(
                    (new Date(jobData.estimatedCompletion).getTime() -
                      Date.now()) /
                      1000 /
                      60
                  )
                : undefined,
              files: [],
              tags: [],
              metadata: {},
            });

            if (error) {
              set(state => {
                state.error = error;
                state.isLoading = false;
              });
              return '';
            }

            if (job) {
              const workforceJob: WorkforceJob = {
                id: job.id,
                title: job.title,
                description: job.description || '',
                status: job.status as unknown,
                priority: job.priority as unknown,
                progress: job.progress || 0,
                assignedWorkers: job.assigned_agent_id
                  ? [
                      {
                        id: job.assigned_agent_id,
                        name: 'AI Agent',
                        role: 'AI Assistant',
                        status: 'idle',
                      },
                    ]
                  : [],
                estimatedCompletion: job.estimated_duration
                  ? new Date(
                      Date.now() + job.estimated_duration * 60 * 1000
                    ).toISOString()
                  : undefined,
                tokensUsed: 0,
                cost: job.cost || 0,
                subtasks: [],
                createdAt: job.created_at,
              };

              set(state => {
                state.jobs[job.id] = workforceJob;
                state.isLoading = false;

                // Update job lists based on status
                switch (workforceJob.status) {
                  case 'running':
                    state.activeJobs.push(job.id);
                    break;
                  case 'completed':
                    state.completedJobs.push(job.id);
                    break;
                  case 'failed':
                    state.failedJobs.push(job.id);
                    break;
                }
              });

              return job.id;
            }

            return '';
          } catch (error) {
            set(state => {
              state.error = 'Failed to create job';
              state.isLoading = false;
            });
            return '';
          }
        },

        updateJob: (id: string, updates: Partial<WorkforceJob>) =>
          set(state => {
            if (state.jobs[id]) {
              const oldStatus = state.jobs[id].status;
              const newJob = { ...state.jobs[id], ...updates };
              state.jobs[id] = newJob;

              // Update job lists if status changed
              if (updates.status && updates.status !== oldStatus) {
                // Remove from old list
                switch (oldStatus) {
                  case 'running':
                    state.activeJobs = state.activeJobs.filter(
                      jobId => jobId !== id
                    );
                    break;
                  case 'completed':
                    state.completedJobs = state.completedJobs.filter(
                      jobId => jobId !== id
                    );
                    break;
                  case 'failed':
                    state.failedJobs = state.failedJobs.filter(
                      jobId => jobId !== id
                    );
                    break;
                }

                // Add to new list
                switch (updates.status) {
                  case 'running':
                    state.activeJobs.push(id);
                    break;
                  case 'completed':
                    state.completedJobs.push(id);
                    break;
                  case 'failed':
                    state.failedJobs.push(id);
                    break;
                }
              }

              state.lastUpdateAt = new Date();
            }
          }),

        deleteJob: (id: string) =>
          set(state => {
            const job = state.jobs[id];
            if (job) {
              delete state.jobs[id];

              // Remove from all lists
              state.activeJobs = state.activeJobs.filter(jobId => jobId !== id);
              state.completedJobs = state.completedJobs.filter(
                jobId => jobId !== id
              );
              state.failedJobs = state.failedJobs.filter(jobId => jobId !== id);

              if (state.selectedJobId === id) {
                state.selectedJobId = null;
              }
            }
          }),

        assignWorkers: (jobId: string, workerIds: string[]) =>
          set(state => {
            const job = state.jobs[jobId];
            if (job) {
              // Update job with assigned workers
              job.assignedWorkers = workerIds.map(workerId => {
                const worker = state.workers[workerId];
                return {
                  id: workerId,
                  name: worker?.name || 'Unknown Worker',
                  role: worker?.role || 'AI Assistant',
                  avatar: worker?.avatar,
                  status: worker?.status || 'idle',
                };
              });

              // Update worker statuses
              workerIds.forEach(workerId => {
                if (state.workers[workerId]) {
                  state.workers[workerId].status = 'working';
                  state.workers[workerId].currentJobId = jobId;
                }
              });

              state.lastUpdateAt = new Date();
            }
          }),

        startJob: async (jobId: string) => {
          set(state => {
            const job = state.jobs[jobId];
            if (job) {
              job.status = 'running';
              job.progress = 0;
            }
          });

          // Simulate job progress
          const job = get().jobs[jobId];
          if (job) {
            for (let progress = 0; progress <= 100; progress += 10) {
              await new Promise(resolve => setTimeout(resolve, 500));
              get().updateJob(jobId, { progress });
            }
            get().updateJob(jobId, { status: 'completed', progress: 100 });
          }
        },

        pauseJob: async (jobId: string) => {
          set(state => {
            const job = state.jobs[jobId];
            if (job && job.status === 'running') {
              job.status = 'paused';
            }
          });
        },

        resumeJob: async (jobId: string) => {
          set(state => {
            const job = state.jobs[jobId];
            if (job && job.status === 'paused') {
              job.status = 'running';
            }
          });
        },

        cancelJob: async (jobId: string) => {
          set(state => {
            const job = state.jobs[jobId];
            if (job) {
              job.status = 'failed';
              // Free up assigned workers
              job.assignedWorkers.forEach(worker => {
                if (state.workers[worker.id]) {
                  state.workers[worker.id].status = 'idle';
                  state.workers[worker.id].currentJobId = undefined;
                }
              });
            }
          });
        },

        retryJob: async (jobId: string) => {
          set(state => {
            const job = state.jobs[jobId];
            if (job && job.status === 'failed') {
              job.status = 'queued';
              job.progress = 0;
            }
          });
        },

        // Worker management
        addWorker: (workerData: Omit<WorkforceWorker, 'id'>) => {
          const id = crypto.randomUUID();

          set(state => {
            const worker: WorkforceWorker = {
              ...workerData,
              id,
            };

            state.workers[id] = worker;

            if (worker.status === 'idle') {
              state.availableWorkers.push(id);
            } else if (worker.status === 'working') {
              state.busyWorkers.push(id);
            }
          });

          return id;
        },

        updateWorker: (id: string, updates: Partial<WorkforceWorker>) =>
          set(state => {
            if (state.workers[id]) {
              const oldStatus = state.workers[id].status;
              state.workers[id] = { ...state.workers[id], ...updates };

              // Update worker lists if status changed
              if (updates.status && updates.status !== oldStatus) {
                // Remove from old list
                if (oldStatus === 'idle') {
                  state.availableWorkers = state.availableWorkers.filter(
                    wId => wId !== id
                  );
                } else if (oldStatus === 'working') {
                  state.busyWorkers = state.busyWorkers.filter(
                    wId => wId !== id
                  );
                }

                // Add to new list
                if (updates.status === 'idle') {
                  state.availableWorkers.push(id);
                } else if (updates.status === 'working') {
                  state.busyWorkers.push(id);
                }
              }
            }
          }),

        removeWorker: (id: string) =>
          set(state => {
            delete state.workers[id];
            state.availableWorkers = state.availableWorkers.filter(
              wId => wId !== id
            );
            state.busyWorkers = state.busyWorkers.filter(wId => wId !== id);
          }),

        setWorkerStatus: (id: string, status: WorkforceWorker['status']) => {
          get().updateWorker(id, { status, lastActiveAt: new Date() });
        },

        // Template management
        createTemplate: (templateData: Omit<JobTemplate, 'id'>) => {
          const id = crypto.randomUUID();

          set(state => {
            state.templates[id] = {
              ...templateData,
              id,
            };
          });

          return id;
        },

        updateTemplate: (id: string, updates: Partial<JobTemplate>) =>
          set(state => {
            if (state.templates[id]) {
              state.templates[id] = { ...state.templates[id], ...updates };
            }
          }),

        deleteTemplate: (id: string) =>
          set(state => {
            delete state.templates[id];
          }),

        createJobFromTemplate: (
          templateId: string,
          parameters: Record<string, unknown>
        ) => {
          const { templates, createJob } = get();
          const template = templates[templateId];

          if (!template) return '';

          const jobData: Omit<WorkforceJob, 'id' | 'createdAt'> = {
            title: template.name,
            description: template.description,
            status: 'queued',
            priority: 'medium',
            progress: 0,
            assignedWorkers: [],
            estimatedCompletion: new Date(
              Date.now() + template.estimatedDuration * 1000
            ).toLocaleTimeString(),
            tokensUsed: 0,
            cost: 0,
            subtasks: [],
          };

          return createJob(jobData);
        },

        // Search and filtering
        setSearchQuery: (query: string) =>
          set(state => {
            state.searchQuery = query;
          }),

        setStatusFilter: (status: WorkforceState['statusFilter']) =>
          set(state => {
            state.statusFilter = status;
          }),

        setPriorityFilter: (priority: WorkforceState['priorityFilter']) =>
          set(state => {
            state.priorityFilter = priority;
          }),

        setWorkerFilter: (workerIds: string[]) =>
          set(state => {
            state.workerFilter = workerIds;
          }),

        clearFilters: () =>
          set(state => {
            state.searchQuery = '';
            state.statusFilter = 'all';
            state.priorityFilter = 'all';
            state.workerFilter = [];
          }),

        // Real-time updates
        setLiveUpdates: (enabled: boolean) =>
          set(state => {
            state.liveUpdates = enabled;
          }),

        refreshData: async () => {
          set(state => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const userId = 'current-user-id'; // TODO: Get from auth context

            // Load jobs
            const { data: jobs, error: jobsError } =
              await jobsService.getJobs(userId);
            if (jobsError) {
              throw new Error(jobsError);
            }

            // Load agents
            const { data: agents, error: agentsError } =
              await agentsService.getAgents();
            if (agentsError) {
              throw new Error(agentsError);
            }

            // Convert jobs to workforce format
            const workforceJobs: Record<string, WorkforceJob> = {};
            const activeJobs: string[] = [];
            const completedJobs: string[] = [];
            const failedJobs: string[] = [];

            jobs.forEach(job => {
              const workforceJob: WorkforceJob = {
                id: job.id,
                title: job.title,
                description: job.description || '',
                status: job.status as unknown,
                priority: job.priority as unknown,
                progress: job.progress || 0,
                assignedWorkers: job.assigned_agent_id
                  ? [
                      {
                        id: job.assigned_agent_id,
                        name: 'AI Agent',
                        role: 'AI Assistant',
                        status: 'idle',
                      },
                    ]
                  : [],
                estimatedCompletion: job.estimated_duration
                  ? new Date(
                      Date.now() + job.estimated_duration * 60 * 1000
                    ).toISOString()
                  : undefined,
                tokensUsed: 0,
                cost: job.cost || 0,
                subtasks: [],
                createdAt: job.created_at,
              };

              workforceJobs[job.id] = workforceJob;

              // Update job lists
              switch (workforceJob.status) {
                case 'running':
                  activeJobs.push(job.id);
                  break;
                case 'completed':
                  completedJobs.push(job.id);
                  break;
                case 'failed':
                  failedJobs.push(job.id);
                  break;
              }
            });

            // Convert agents to workers
            const workers: Record<string, WorkforceWorker> = {};
            const availableWorkers: string[] = [];
            const busyWorkers: string[] = [];

            agents.forEach(agent => {
              const worker: WorkforceWorker = {
                id: agent.id,
                employeeId: agent.id,
                name: agent.name,
                role: agent.role,
                status: agent.status === 'available' ? 'idle' : 'working',
                capabilities: agent.skills || [],
                performance: {
                  successRate: 95,
                  averageResponseTime: 30,
                  totalJobsCompleted: agent.tasks_completed || 0,
                  rating: agent.rating || 0,
                },
                hourlyRate: agent.hourly_rate || 0,
                lastActiveAt: new Date(),
                availability: {
                  timezone: 'UTC',
                  workingHours: { start: '09:00', end: '17:00' },
                  daysOfWeek: [1, 2, 3, 4, 5],
                },
              };

              workers[agent.id] = worker;

              if (worker.status === 'idle') {
                availableWorkers.push(agent.id);
              } else if (worker.status === 'working') {
                busyWorkers.push(agent.id);
              }
            });

            set(state => {
              state.jobs = workforceJobs;
              state.activeJobs = activeJobs;
              state.completedJobs = completedJobs;
              state.failedJobs = failedJobs;
              state.workers = workers;
              state.availableWorkers = availableWorkers;
              state.busyWorkers = busyWorkers;
              state.lastUpdateAt = new Date();
              state.isLoading = false;
            });
          } catch (error) {
            set(state => {
              state.isLoading = false;
              state.error =
                error instanceof Error
                  ? error.message
                  : 'Failed to refresh data';
            });
          }
        },

        // Utility actions
        getJobsByStatus: (status: WorkforceJob['status']) => {
          const { jobs } = get();
          return Object.values(jobs).filter(job => job.status === status);
        },

        getWorkersByStatus: (status: WorkforceWorker['status']) => {
          const { workers } = get();
          return Object.values(workers).filter(
            worker => worker.status === status
          );
        },

        calculateJobCost: (jobId: string) => {
          const { jobs, workers } = get();
          const job = jobs[jobId];
          if (!job) return 0;

          return job.assignedWorkers.reduce((total, assignedWorker) => {
            const worker = workers[assignedWorker.id];
            if (!worker) return total;

            const duration = job.progress / 100; // Simplified calculation
            return total + worker.hourlyRate * duration;
          }, 0);
        },

        estimateJobDuration: (jobId: string) => {
          const { jobs } = get();
          const job = jobs[jobId];
          if (!job) return 0;

          // Simplified estimation based on job complexity
          return Math.max(300, job.assignedWorkers.length * 600); // Base 5 minutes + 10 minutes per worker
        },

        optimizeWorkerAssignment: (jobId: string) => {
          const { jobs, workers } = get();
          const job = jobs[jobId];
          if (!job) return [];

          // Simple optimization: assign available workers with highest success rate
          const availableWorkers = Object.values(workers)
            .filter(worker => worker.status === 'idle')
            .sort(
              (a, b) => b.performance.successRate - a.performance.successRate
            )
            .slice(0, 3); // Limit to 3 workers

          return availableWorkers.map(worker => worker.id);
        },

        exportJobs: (format: 'csv' | 'json') => {
          const { jobs } = get();

          if (format === 'json') {
            return JSON.stringify(Object.values(jobs), null, 2);
          }

          // CSV export
          const headers = [
            'ID',
            'Title',
            'Status',
            'Priority',
            'Progress',
            'Created At',
          ];
          const rows = Object.values(jobs).map(job => [
            job.id,
            job.title,
            job.status,
            job.priority,
            `${job.progress}%`,
            job.createdAt,
          ]);

          return [headers, ...rows].map(row => row.join(',')).join('\n');
        },

        setError: (error: string | null) =>
          set(state => {
            state.error = error;
          }),

        // Real-time initialization
        initializeRealtime: async (userId: string) => {
          try {
            await realtimeService.initializeRealtime(userId, {
              onJobCreated: job => {
                const workforceJob: WorkforceJob = {
                  id: job.id,
                  title: job.title,
                  description: job.description || '',
                  status: job.status as unknown,
                  priority: job.priority as unknown,
                  progress: job.progress || 0,
                  assignedWorkers: job.assigned_agent_id
                    ? [
                        {
                          id: job.assigned_agent_id,
                          name: 'AI Agent',
                          role: 'AI Assistant',
                          status: 'idle',
                        },
                      ]
                    : [],
                  estimatedCompletion: job.estimated_duration
                    ? new Date(
                        Date.now() + job.estimated_duration * 60 * 1000
                      ).toISOString()
                    : undefined,
                  tokensUsed: 0,
                  cost: job.cost || 0,
                  subtasks: [],
                  createdAt: job.created_at,
                };

                set(state => {
                  state.jobs[job.id] = workforceJob;
                  state.lastUpdateAt = new Date();
                });
              },
              onJobUpdate: job => {
                set(state => {
                  if (state.jobs[job.id]) {
                    const oldStatus = state.jobs[job.id].status;
                    state.jobs[job.id] = {
                      ...state.jobs[job.id],
                      status: job.status as unknown,
                      progress: job.progress || 0,
                      cost: job.cost || 0,
                    };

                    // Update job lists if status changed
                    if (job.status !== oldStatus) {
                      // Remove from old list
                      switch (oldStatus) {
                        case 'running':
                          state.activeJobs = state.activeJobs.filter(
                            id => id !== job.id
                          );
                          break;
                        case 'completed':
                          state.completedJobs = state.completedJobs.filter(
                            id => id !== job.id
                          );
                          break;
                        case 'failed':
                          state.failedJobs = state.failedJobs.filter(
                            id => id !== job.id
                          );
                          break;
                      }

                      // Add to new list
                      switch (job.status) {
                        case 'running':
                          state.activeJobs.push(job.id);
                          break;
                        case 'completed':
                          state.completedJobs.push(job.id);
                          break;
                        case 'failed':
                          state.failedJobs.push(job.id);
                          break;
                      }
                    }

                    state.lastUpdateAt = new Date();
                  }
                });
              },
              onJobDeleted: jobId => {
                set(state => {
                  delete state.jobs[jobId];
                  state.activeJobs = state.activeJobs.filter(
                    id => id !== jobId
                  );
                  state.completedJobs = state.completedJobs.filter(
                    id => id !== jobId
                  );
                  state.failedJobs = state.failedJobs.filter(
                    id => id !== jobId
                  );
                  state.lastUpdateAt = new Date();
                });
              },
              onAgentUpdate: agent => {
                set(state => {
                  if (state.workers[agent.id]) {
                    state.workers[agent.id] = {
                      ...state.workers[agent.id],
                      status: agent.status === 'available' ? 'idle' : 'working',
                      performance: {
                        ...state.workers[agent.id].performance,
                        totalJobsCompleted: agent.tasks_completed || 0,
                        rating: agent.rating || 0,
                      },
                    };
                    state.lastUpdateAt = new Date();
                  }
                });
              },
              onError: error => {
                set(state => {
                  state.error = error;
                });
              },
            });
          } catch (error) {
            set(state => {
              state.error = 'Failed to initialize real-time updates';
            });
          }
        },

        cleanupRealtime: async () => {
          try {
            await realtimeService.cleanup();
          } catch (error) {
            console.error('Error cleaning up real-time subscriptions:', error);
          }
        },
      })),
      {
        name: 'agi-workforce-store',
        version: 1,
        partialize: state => ({
          jobs: state.jobs,
          workers: state.workers,
          templates: state.templates,
          liveUpdates: state.liveUpdates,
        }),
      }
    ),
    {
      name: 'Workforce Store',
    }
  )
);

// Selectors for optimized re-renders
export const useWorkforceJobs = () => useWorkforceStore(state => state.jobs);
export const useWorkforceWorkers = () =>
  useWorkforceStore(state => state.workers);
export const useWorkforceStats = () => useWorkforceStore(state => state.stats);
export const useWorkforceLoading = () =>
  useWorkforceStore(state => state.isLoading);
export const useWorkforceError = () => useWorkforceStore(state => state.error);
