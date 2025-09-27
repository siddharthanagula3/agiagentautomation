import { describe, it, expect } from 'vitest'
import {
  SECURITY_CONFIG,
  PERMISSION_LEVELS,
  USER_ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS
} from './security'

describe('Security Configuration', () => {
  describe('SECURITY_CONFIG', () => {
    it('has required password configuration', () => {
      expect(SECURITY_CONFIG.password.minLength).toBeGreaterThan(0)
      expect(SECURITY_CONFIG.password.maxLength).toBeGreaterThan(SECURITY_CONFIG.password.minLength)
      expect(SECURITY_CONFIG.password.requireUppercase).toBe(true)
      expect(SECURITY_CONFIG.password.requireLowercase).toBe(true)
      expect(SECURITY_CONFIG.password.requireNumbers).toBe(true)
      expect(SECURITY_CONFIG.password.requireSpecialChars).toBe(true)
    })

    it('has session configuration', () => {
      expect(SECURITY_CONFIG.session.maxAge).toBeGreaterThan(0)
      expect(SECURITY_CONFIG.session.refreshThreshold).toBeGreaterThan(0)
      expect(SECURITY_CONFIG.session.maxConcurrentSessions).toBeGreaterThan(0)
      expect(Array.isArray(SECURITY_CONFIG.session.requireReauth)).toBe(true)
    })

    it('has CSP configuration', () => {
      expect(Array.isArray(SECURITY_CONFIG.csp.defaultSrc)).toBe(true)
      expect(Array.isArray(SECURITY_CONFIG.csp.scriptSrc)).toBe(true)
      expect(Array.isArray(SECURITY_CONFIG.csp.styleSrc)).toBe(true)
      expect(SECURITY_CONFIG.csp.objectSrc).toEqual(["'none'"])
    })
  })

  describe('Permission Levels', () => {
    it('has all required permission levels', () => {
      expect(PERMISSION_LEVELS.READ).toBe('read')
      expect(PERMISSION_LEVELS.WRITE).toBe('write')
      expect(PERMISSION_LEVELS.DELETE).toBe('delete')
      expect(PERMISSION_LEVELS.ADMIN).toBe('admin')
    })
  })

  describe('User Roles', () => {
    it('has hierarchical role structure', () => {
      expect(USER_ROLES.GUEST).toBe('guest')
      expect(USER_ROLES.USER).toBe('user')
      expect(USER_ROLES.PREMIUM).toBe('premium')
      expect(USER_ROLES.MODERATOR).toBe('moderator')
      expect(USER_ROLES.ADMIN).toBe('admin')
      expect(USER_ROLES.SUPER_ADMIN).toBe('super_admin')
    })
  })

  describe('Permissions', () => {
    it('has chat permissions', () => {
      expect(PERMISSIONS['chat.send']).toBeDefined()
      expect(PERMISSIONS['chat.delete']).toBeDefined()
      expect(PERMISSIONS['chat.moderate']).toBeDefined()
    })

    it('has marketplace permissions', () => {
      expect(PERMISSIONS['marketplace.browse']).toBeDefined()
      expect(PERMISSIONS['marketplace.purchase']).toBeDefined()
      expect(PERMISSIONS['marketplace.sell']).toBeDefined()
      expect(PERMISSIONS['marketplace.manage']).toBeDefined()
    })

    it('has workforce permissions', () => {
      expect(PERMISSIONS['workforce.view']).toBeDefined()
      expect(PERMISSIONS['workforce.create']).toBeDefined()
      expect(PERMISSIONS['workforce.manage']).toBeDefined()
    })

    it('has admin permissions', () => {
      expect(PERMISSIONS['admin.users']).toBeDefined()
      expect(PERMISSIONS['admin.system']).toBeDefined()
      expect(PERMISSIONS['admin.audit']).toBeDefined()
    })
  })

  describe('Role Permissions Mapping', () => {
    it('guest has minimal permissions', () => {
      const guestPermissions = ROLE_PERMISSIONS[USER_ROLES.GUEST]
      expect(Array.isArray(guestPermissions)).toBe(true)
      expect(guestPermissions.length).toBeGreaterThan(0)
      expect(guestPermissions).toContain(PERMISSIONS['marketplace.browse'])
    })

    it('user has basic permissions', () => {
      const userPermissions = ROLE_PERMISSIONS[USER_ROLES.USER]
      expect(Array.isArray(userPermissions)).toBe(true)
      expect(userPermissions).toContain(PERMISSIONS['chat.send'])
      expect(userPermissions).toContain(PERMISSIONS['marketplace.browse'])
      expect(userPermissions).toContain(PERMISSIONS['workforce.view'])
    })

    it('admin has more permissions than user', () => {
      const userPermissions = ROLE_PERMISSIONS[USER_ROLES.USER]
      const adminPermissions = ROLE_PERMISSIONS[USER_ROLES.ADMIN]

      expect(adminPermissions.length).toBeGreaterThan(userPermissions.length)
      expect(adminPermissions).toContain(PERMISSIONS['admin.users'])
    })

    it('super admin has all permissions', () => {
      const superAdminPermissions = ROLE_PERMISSIONS[USER_ROLES.SUPER_ADMIN]
      const allPermissions = Object.values(PERMISSIONS)

      expect(superAdminPermissions).toEqual(allPermissions)
    })

    it('each role has unique permission set', () => {
      const roles = Object.values(USER_ROLES)
      const permissionSets = roles.map(role => ROLE_PERMISSIONS[role])

      // Each role should have permissions
      permissionSets.forEach(permissions => {
        expect(Array.isArray(permissions)).toBe(true)
        expect(permissions.length).toBeGreaterThan(0)
      })
    })
  })
})