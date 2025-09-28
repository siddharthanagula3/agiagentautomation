import { supabase } from '../integrations/supabase/client';
import type { Database } from '../integrations/supabase/types';

type TeamMember = Database['public']['Tables']['team_members']['Row'];

export interface TeamMemberData {
  id: string;
  user_id: string;
  team_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: string[];
  joined_at: string;
  last_active?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamData {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  pendingInvites: number;
  byRole: {
    owner: number;
    admin: number;
    member: number;
    viewer: number;
  };
}

export interface TeamInvite {
  id: string;
  team_id: string;
  email: string;
  role: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at: string;
  created_at: string;
}

class TeamService {
  async getTeamMembers(userId: string): Promise<{ data: TeamMemberData[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', userId)
        .order('joined_at', { ascending: false });

      if (error) {
        console.error('TeamService: Error fetching team members:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('TeamService: Unexpected error:', error);
      return { data: [], error: 'Failed to fetch team members' };
    }
  }

  async getTeamStats(userId: string): Promise<{ data: TeamStats; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('role, is_active')
        .eq('user_id', userId);

      if (error) {
        console.error('TeamService: Error fetching stats:', error);
        return { 
          data: { totalMembers: 0, activeMembers: 0, pendingInvites: 0, byRole: { owner: 0, admin: 0, member: 0, viewer: 0 } }, 
          error: error.message 
        };
      }

      const stats: TeamStats = {
        totalMembers: data?.length || 0,
        activeMembers: data?.filter(m => m.is_active).length || 0,
        pendingInvites: 0, // This would need to be calculated from invites table
        byRole: {
          owner: data?.filter(m => m.role === 'owner').length || 0,
          admin: data?.filter(m => m.role === 'admin').length || 0,
          member: data?.filter(m => m.role === 'member').length || 0,
          viewer: data?.filter(m => m.role === 'viewer').length || 0,
        }
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('TeamService: Unexpected error:', error);
      return { 
        data: { totalMembers: 0, activeMembers: 0, pendingInvites: 0, byRole: { owner: 0, admin: 0, member: 0, viewer: 0 } }, 
        error: 'Failed to fetch team stats' 
      };
    }
  }

  async createTeam(userId: string, team: Omit<TeamData, 'id' | 'created_at' | 'updated_at' | 'owner_id'>): Promise<{ data: TeamData | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: team.name,
          description: team.description,
          owner_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('TeamService: Error creating team:', error);
        return { data: null, error: error.message };
      }

      // Add the creator as the owner
      await this.addTeamMember(data.id, userId, 'owner', ['all']);

      return { data: data as TeamData, error: null };
    } catch (error) {
      console.error('TeamService: Unexpected error:', error);
      return { data: null, error: 'Failed to create team' };
    }
  }

  async addTeamMember(teamId: string, userId: string, role: string, permissions: string[]): Promise<{ data: TeamMemberData | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
          role,
          permissions,
          joined_at: new Date().toISOString(),
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('TeamService: Error adding team member:', error);
        return { data: null, error: error.message };
      }

      return { data: data as TeamMemberData, error: null };
    } catch (error) {
      console.error('TeamService: Unexpected error:', error);
      return { data: null, error: 'Failed to add team member' };
    }
  }

  async updateTeamMember(memberId: string, updates: Partial<Pick<TeamMemberData, 'role' | 'permissions' | 'is_active'>>): Promise<{ data: TeamMemberData | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId)
        .select()
        .single();

      if (error) {
        console.error('TeamService: Error updating team member:', error);
        return { data: null, error: error.message };
      }

      return { data: data as TeamMemberData, error: null };
    } catch (error) {
      console.error('TeamService: Unexpected error:', error);
      return { data: null, error: 'Failed to update team member' };
    }
  }

  async removeTeamMember(memberId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) {
        console.error('TeamService: Error removing team member:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('TeamService: Unexpected error:', error);
      return { success: false, error: 'Failed to remove team member' };
    }
  }

  async inviteTeamMember(teamId: string, email: string, role: string, invitedBy: string): Promise<{ data: TeamInvite | null; error: string | null }> {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      const { data, error } = await supabase
        .from('team_invites')
        .insert({
          team_id: teamId,
          email,
          role,
          invited_by: invitedBy,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('TeamService: Error inviting team member:', error);
        return { data: null, error: error.message };
      }

      return { data: data as TeamInvite, error: null };
    } catch (error) {
      console.error('TeamService: Unexpected error:', error);
      return { data: null, error: 'Failed to invite team member' };
    }
  }

  async getTeamInvites(userId: string): Promise<{ data: TeamInvite[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('team_invites')
        .select('*')
        .eq('email', userId) // This should match user's email
        .order('created_at', { ascending: false });

      if (error) {
        console.error('TeamService: Error fetching team invites:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('TeamService: Unexpected error:', error);
      return { data: [], error: 'Failed to fetch team invites' };
    }
  }

  async acceptTeamInvite(inviteId: string, userId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      // Get the invite details
      const { data: invite, error: fetchError } = await supabase
        .from('team_invites')
        .select('*')
        .eq('id', inviteId)
        .single();

      if (fetchError || !invite) {
        return { success: false, error: 'Invite not found' };
      }

      if (invite.status !== 'pending') {
        return { success: false, error: 'Invite is no longer pending' };
      }

      if (new Date(invite.expires_at) < new Date()) {
        return { success: false, error: 'Invite has expired' };
      }

      // Add user to team
      const { error: addError } = await this.addTeamMember(invite.team_id, userId, invite.role, ['read']);

      if (addError) {
        return { success: false, error: addError };
      }

      // Update invite status
      const { error: updateError } = await supabase
        .from('team_invites')
        .update({ status: 'accepted' })
        .eq('id', inviteId);

      if (updateError) {
        console.error('TeamService: Error updating invite status:', updateError);
        return { success: false, error: 'Failed to update invite status' };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('TeamService: Unexpected error:', error);
      return { success: false, error: 'Failed to accept team invite' };
    }
  }

  async getAvailableRoles(): Promise<{ data: string[]; error: string | null }> {
    try {
      const roles = ['owner', 'admin', 'member', 'viewer'];
      return { data: roles, error: null };
    } catch (error) {
      console.error('TeamService: Unexpected error:', error);
      return { data: [], error: 'Failed to fetch available roles' };
    }
  }

  async getAvailablePermissions(): Promise<{ data: string[]; error: string | null }> {
    try {
      const permissions = [
        'read',
        'write',
        'delete',
        'admin',
        'billing',
        'settings',
        'all'
      ];
      return { data: permissions, error: null };
    } catch (error) {
      console.error('TeamService: Unexpected error:', error);
      return { data: [], error: 'Failed to fetch available permissions' };
    }
  }
}

export const teamService = new TeamService();
