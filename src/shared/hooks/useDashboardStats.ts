import { useState, useEffect } from 'react';
import { supabase } from '@shared/lib/supabase-client';
import { useAuthStore } from '@shared/stores/authentication-store';

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  totalEmployees: number;
  activeEmployees: number;
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalEmployees: 0,
    activeEmployees: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch jobs stats
        const { data: jobs, error: jobsError } = await supabase
          .from('jobs')
          .select('status, created_at')
          .eq('user_id', user.id);

        if (jobsError) throw jobsError;

        // Fetch employees stats
        const { data: employees, error: employeesError } = await supabase
          .from('ai_agents')
          .select('status, created_at')
          .eq('user_id', user.id);

        if (employeesError) throw employeesError;

        // Fetch revenue data
        const { data: revenue, error: revenueError } = await supabase
          .from('billing')
          .select('amount, created_at')
          .eq('user_id', user.id)
          .eq('status', 'paid');

        if (revenueError) throw revenueError;

        // Calculate stats
        const totalJobs = jobs?.length || 0;
        const activeJobs =
          jobs?.filter((job) => job.status === 'in_progress').length || 0;
        const completedJobs =
          jobs?.filter((job) => job.status === 'completed').length || 0;

        const totalEmployees = employees?.length || 0;
        const activeEmployees =
          employees?.filter((emp) => emp.status === 'active').length || 0;

        const totalRevenue =
          revenue?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

        // Calculate monthly revenue
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyRevenue =
          revenue
            ?.filter((item) => {
              const itemDate = new Date(item.created_at);
              return (
                itemDate.getMonth() === currentMonth &&
                itemDate.getFullYear() === currentYear
              );
            })
            .reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

        // Calculate revenue growth (simplified)
        const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        const previousMonthRevenue =
          revenue
            ?.filter((item) => {
              const itemDate = new Date(item.created_at);
              return (
                itemDate.getMonth() === previousMonth &&
                itemDate.getFullYear() === previousYear
              );
            })
            .reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

        const revenueGrowth =
          previousMonthRevenue > 0
            ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) *
              100
            : 0;

        setStats({
          totalJobs,
          activeJobs,
          completedJobs,
          totalEmployees,
          activeEmployees,
          totalRevenue,
          monthlyRevenue,
          revenueGrowth,
        });
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  return { stats, isLoading, error };
};
