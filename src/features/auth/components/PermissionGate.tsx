import React from 'react';
import { useAuthStore } from '@shared/stores/unified-auth-store';

interface PermissionGateProps {
  permissions?: string[];
  roles?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

const PermissionGate: React.FC<PermissionGateProps> = ({
  permissions = [],
  roles = [],
  requireAll = true,
  fallback = null,
  children,
}) => {
  const { checkPermission, hasRole, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  let hasPermissions = true;
  let hasRoles = true;

  if (permissions.length > 0) {
    if (requireAll) {
      hasPermissions = permissions.every(permission =>
        checkPermission(permission)
      );
    } else {
      hasPermissions = permissions.some(permission =>
        checkPermission(permission)
      );
    }
  }

  if (roles.length > 0) {
    if (requireAll) {
      hasRoles = roles.every(role => hasRole(role));
    } else {
      hasRoles = roles.some(role => hasRole(role));
    }
  }

  if (!hasPermissions || !hasRoles) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default PermissionGate;
