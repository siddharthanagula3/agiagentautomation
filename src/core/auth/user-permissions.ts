import { supabase } from '@shared/lib/supabase-client';

export interface PermissionRule {
  userId: string;
  resource: string;
  actions: ('read' | 'write' | 'execute' | 'delete')[];
  constraints?: Record<string, unknown>;
  expiresAt?: Date;
}

export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
  constraints?: Record<string, unknown>;
}

export class PermissionService {
  private rules: Map<string, PermissionRule[]> = new Map();
  private cache: Map<string, PermissionCheck> = new Map();
  private cacheTimeout: number = 5 * 60 * 1000; // 5 minutes

  async checkPermission(
    userId: string,
    resource: string,
    action: string
  ): Promise<PermissionCheck> {
    const cacheKey = `${userId}:${resource}:${action}`;
    const cached = this.cache.get(cacheKey);

    if (cached && this.isCacheValid(cacheKey)) {
      return cached;
    }

    try {
      // Check database for permissions
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId)
        .eq('resource', resource)
        .gte('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error) {
        throw error;
      }

      let allowed = false;
      let reason = 'Permission denied';
      let constraints: Record<string, unknown> = {};

      if (data) {
        const actions = data.actions || [];
        allowed = actions.includes(action);

        if (allowed) {
          reason = 'Permission granted';
          constraints = data.constraints || {};
        } else {
          reason = `Action '${action}' not allowed. Allowed actions: ${actions.join(', ')}`;
        }
      } else {
        // Check default permissions
        const defaultPermissions = await this.getDefaultPermissions(userId);
        allowed = defaultPermissions.includes(action);

        if (allowed) {
          reason = 'Default permission granted';
        } else {
          reason = 'No permission found';
        }
      }

      const result: PermissionCheck = {
        allowed,
        reason,
        constraints,
      };

      // Cache the result
      this.cache.set(cacheKey, result);
      this.setCacheExpiry(cacheKey);

      return result;
    } catch (error) {
      return {
        allowed: false,
        reason: `Permission check failed: ${error.message}`,
      };
    }
  }

  async grantPermission(rule: PermissionRule): Promise<void> {
    try {
      // Store in database
      const { error } = await supabase.from('user_permissions').upsert({
        user_id: rule.userId,
        resource: rule.resource,
        actions: rule.actions,
        constraints: rule.constraints || {},
        expires_at: rule.expiresAt?.toISOString() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }

      // Update local cache
      const userRules = this.rules.get(rule.userId) || [];
      const existingIndex = userRules.findIndex(
        (r) => r.resource === rule.resource
      );

      if (existingIndex >= 0) {
        userRules[existingIndex] = rule;
      } else {
        userRules.push(rule);
      }

      this.rules.set(rule.userId, userRules);

      // Clear related cache entries
      this.clearUserCache(rule.userId);
    } catch (error) {
      throw new Error(`Failed to grant permission: ${error.message}`);
    }
  }

  async revokePermission(userId: string, resource: string): Promise<void> {
    try {
      // Remove from database
      const { error } = await supabase
        .from('user_permissions')
        .delete()
        .match({ user_id: userId, resource });

      if (error) {
        throw error;
      }

      // Update local cache
      const userRules = this.rules.get(userId) || [];
      const filtered = userRules.filter((r) => r.resource !== resource);
      this.rules.set(userId, filtered);

      // Clear related cache entries
      this.clearUserCache(userId);
    } catch (error) {
      throw new Error(`Failed to revoke permission: ${error.message}`);
    }
  }

  private async getDefaultPermissions(userId: string): Promise<string[]> {
    // Default permissions for authenticated users
    return ['read'];
  }

  private isCacheValid(key: string): boolean {
    const expiry = this.cache.get(`${key}:expiry`);
    return expiry ? Date.now() < expiry : false;
  }

  private setCacheExpiry(key: string): void {
    this.cache.set(`${key}:expiry`, Date.now() + this.cacheTimeout);
  }

  private clearUserCache(userId: string): void {
    for (const [key] of this.cache.entries()) {
      if (key.startsWith(`${userId}:`)) {
        this.cache.delete(key);
      }
    }
  }

  async clearAllCache(): Promise<void> {
    this.cache.clear();
  }
}
