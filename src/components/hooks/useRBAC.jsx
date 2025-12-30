import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Role-Based Access Control Hook
 * Provides granular permission checking for the current user
 */
export function useRBAC() {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null)
  });

  const { data: userRole } = useQuery({
    queryKey: ['userRole', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return null;
      
      // Check for custom role assignment
      const assignments = await base44.entities.UserRole.filter({ 
        user_email: currentUser.email 
      });
      
      if (assignments.length > 0) {
        // Get the role details
        const role = await base44.entities.Role.filter({ 
          id: assignments[0].role_id 
        }).then(roles => roles[0]);
        
        return role;
      }
      
      // Fall back to User entity role field
      return null;
    },
    enabled: !!currentUser?.email
  });

  const { data: allRoles = [] } = useQuery({
    queryKey: ['allRoles'],
    queryFn: () => base44.entities.Role.list()
  });

  /**
   * Get effective permissions with hierarchy inheritance
   */
  const getEffectivePermissions = (role) => {
    if (!role) return {};
    
    let permissions = { ...role.permissions };
    
    // Inherit from parent role if enabled
    if (role.inherits_permissions && role.parent_role_id) {
      const parentRole = allRoles.find(r => r.id === role.parent_role_id);
      if (parentRole) {
        const parentPerms = getEffectivePermissions(parentRole);
        // Merge parent permissions (child overrides parent)
        Object.keys(parentPerms).forEach(module => {
          permissions[module] = {
            ...parentPerms[module],
            ...permissions[module]
          };
        });
      }
    }
    
    return permissions;
  };

  /**
   * Check if user has a specific permission
   * @param {string} module - The module name (e.g., 'users', 'analytics')
   * @param {string} permission - The permission name (e.g., 'view', 'edit')
   * @returns {boolean}
   */
  const hasPermission = (module, permission) => {
    // Admins have all permissions
    if (currentUser?.role === 'admin') return true;
    
    if (!userRole) return false;
    
    const effectivePerms = getEffectivePermissions(userRole);
    return effectivePerms[module]?.[permission] === true;
  };

  /**
   * Check if user has ANY of the specified permissions
   */
  const hasAnyPermission = (checks) => {
    return checks.some(([module, permission]) => hasPermission(module, permission));
  };

  /**
   * Check if user has ALL of the specified permissions
   */
  const hasAllPermissions = (checks) => {
    return checks.every(([module, permission]) => hasPermission(module, permission));
  };

  /**
   * Check if user's role is at or above a hierarchy level
   */
  const hasHierarchyLevel = (level) => {
    if (currentUser?.role === 'admin') return true;
    if (!userRole) return false;
    return (userRole.hierarchy_level || 0) >= level;
  };

  /**
   * Get all permissions for current user
   */
  const getAllPermissions = () => {
    if (currentUser?.role === 'admin') {
      // Return all possible permissions for admin
      return Object.keys(PERMISSION_MODULES).reduce((acc, module) => {
        acc[module] = PERMISSION_MODULES[module].permissions.reduce((perms, perm) => {
          perms[perm] = true;
          return perms;
        }, {});
        return acc;
      }, {});
    }
    
    return userRole ? getEffectivePermissions(userRole) : {};
  };

  /**
   * Check role restrictions
   */
  const checkRestrictions = () => {
    if (!userRole?.restrictions) return { allowed: true };
    
    const restrictions = userRole.restrictions;
    const now = new Date();
    
    // Time restrictions
    if (restrictions.time_restrictions) {
      const hour = now.getHours();
      const { start_hour, end_hour } = restrictions.time_restrictions;
      if (start_hour !== undefined && end_hour !== undefined) {
        if (hour < start_hour || hour >= end_hour) {
          return { 
            allowed: false, 
            reason: `Access restricted to ${start_hour}:00 - ${end_hour}:00` 
          };
        }
      }
    }
    
    return { allowed: true };
  };

  return {
    currentUser,
    userRole,
    isAdmin: currentUser?.role === 'admin',
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasHierarchyLevel,
    getAllPermissions,
    checkRestrictions,
    effectivePermissions: getAllPermissions()
  };
}

// Permission module definitions (shared with RoleManagement)
export const PERMISSION_MODULES = {
  users: {
    label: 'User Management',
    icon: '👥',
    permissions: ['view', 'view_own', 'create', 'edit', 'edit_own', 'delete', 'invite', 'manage_roles']
  },
  analyses: {
    label: 'Analyses',
    icon: '🔍',
    permissions: ['view_all', 'view_own', 'create', 'delete', 'export']
  },
  content_moderation: {
    label: 'Content Moderation',
    icon: '🛡️',
    permissions: ['view', 'approve', 'reject', 'delete', 'flag']
  },
  training: {
    label: 'Training & Feedback',
    icon: '🎓',
    permissions: ['view_feedback', 'label_content', 'review_feedback', 'assign_tasks']
  },
  payouts: {
    label: 'Payouts',
    icon: '💰',
    permissions: ['view', 'process', 'approve', 'reject']
  },
  analytics: {
    label: 'Analytics',
    icon: '📊',
    permissions: ['view_basic', 'view_detailed', 'view_financial', 'export']
  },
  subscriptions: {
    label: 'Subscriptions',
    icon: '💳',
    permissions: ['view_all', 'view_own', 'grant', 'cancel']
  },
  influencers: {
    label: 'Influencer Management',
    icon: '🌟',
    permissions: ['view', 'edit', 'manage_tiers', 'approve']
  },
  affiliates: {
    label: 'Affiliate Management',
    icon: '🤝',
    permissions: ['view', 'edit', 'approve', 'manage_payouts']
  },
  blog: {
    label: 'Blog Management',
    icon: '📝',
    permissions: ['view', 'create', 'edit', 'edit_own', 'publish', 'delete']
  },
  learning: {
    label: 'Learning Modules',
    icon: '📚',
    permissions: ['view', 'create', 'edit', 'publish']
  },
  settings: {
    label: 'System Settings',
    icon: '⚙️',
    permissions: ['view', 'edit_app', 'edit_features', 'edit_billing']
  },
  roles: {
    label: 'Role Management',
    icon: '🔐',
    permissions: ['view', 'create', 'edit', 'delete', 'assign']
  },
  audit: {
    label: 'Audit Logs',
    icon: '📋',
    permissions: ['view_logs', 'export_logs']
  }
};