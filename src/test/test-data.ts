import { User } from '../lib/auth';

// Mock user data for testing
export const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  company: 'Test Company',
  roles: ['user'],
  permissions: ['chat.send', 'marketplace.browse', 'workforce.view'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

export const adminUser: User = {
  ...mockUser,
  id: 'admin-user-id',
  email: 'admin@example.com',
  roles: ['admin'],
  permissions: [
    'chat.send',
    'chat.delete',
    'chat.moderate',
    'marketplace.browse',
    'marketplace.purchase',
    'marketplace.sell',
    'marketplace.manage',
    'workforce.view',
    'workforce.create',
    'workforce.manage',
    'admin.users',
    'admin.audit'
  ]
};