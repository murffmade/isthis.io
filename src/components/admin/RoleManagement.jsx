import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Plus, Edit2, Trash2, Check, X, ChevronDown, ChevronUp, ArrowUpRight, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { PERMISSION_MODULES } from '@/components/hooks/useRBAC';

const HIERARCHY_LEVELS = {
  admin: 100,
  manager: 50,
  moderator: 30,
  contributor: 10,
  viewer: 0
};

function PermissionCheckbox({ module, permission, checked, onChange, disabled }) {
  const permissionLabels = {
    view: 'View',
    view_all: 'View All',
    view_own: 'View Own',
    view_basic: 'View Basic',
    view_detailed: 'View Detailed',
    view_financial: 'View Financial',
    view_logs: 'View Logs',
    view_feedback: 'View Feedback',
    create: 'Create',
    edit: 'Edit',
    edit_own: 'Edit Own',
    edit_app: 'Edit App',
    edit_features: 'Edit Features',
    edit_billing: 'Edit Billing',
    delete: 'Delete',
    approve: 'Approve',
    reject: 'Reject',
    process: 'Process',
    export: 'Export',
    export_logs: 'Export Logs',
    manage_tiers: 'Manage Tiers',
    manage_roles: 'Manage Roles',
    manage_payouts: 'Manage Payouts',
    publish: 'Publish',
    assign: 'Assign',
    invite: 'Invite',
    grant: 'Grant',
    cancel: 'Cancel',
    flag: 'Flag',
    label_content: 'Label Content',
    review_feedback: 'Review Feedback',
    assign_tasks: 'Assign Tasks'
  };

  return (
    <label className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(module, permission, e.target.checked)}
        disabled={disabled}
        className="w-4 h-4 rounded border-slate-300"
      />
      <span className="text-sm text-slate-700">{permissionLabels[permission]}</span>
    </label>
  );
}

function RoleEditor({ role, onSave, onCancel, allRoles }) {
  const [name, setName] = useState(role?.name || '');
  const [description, setDescription] = useState(role?.description || '');
  const [permissions, setPermissions] = useState(role?.permissions || {});
  const [hierarchyLevel, setHierarchyLevel] = useState(role?.hierarchy_level || 0);
  const [parentRoleId, setParentRoleId] = useState(role?.parent_role_id || '');
  const [inheritsPermissions, setInheritsPermissions] = useState(role?.inherits_permissions !== false);
  const [expandedModules, setExpandedModules] = useState({});

  const togglePermission = (module, permission, value) => {
    setPermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [permission]: value
      }
    }));
  };

  const toggleModuleExpanded = (module) => {
    setExpandedModules(prev => ({
      ...prev,
      [module]: !prev[module]
    }));
  };

  const selectAllInModule = (module, value) => {
    const modulePerms = PERMISSION_MODULES[module].permissions;
    const newPerms = {};
    modulePerms.forEach(perm => {
      newPerms[perm] = value;
    });
    setPermissions(prev => ({
      ...prev,
      [module]: newPerms
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Role name is required');
      return;
    }
    onSave({ 
      name, 
      description, 
      permissions,
      hierarchy_level: hierarchyLevel,
      parent_role_id: parentRoleId || null,
      inherits_permissions: inheritsPermissions
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-slate-200 p-6"
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <Label htmlFor="role-name">Role Name *</Label>
          <Input
            id="role-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Content Moderator"
            className="mt-2"
            disabled={role?.is_system_role}
          />
        </div>

        <div className="mb-6">
          <Label htmlFor="role-description">Description</Label>
          <Textarea
            id="role-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe this role's responsibilities..."
            className="mt-2"
            rows={3}
          />
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="hierarchy-level">Hierarchy Level</Label>
            <select
              id="hierarchy-level"
              value={hierarchyLevel}
              onChange={(e) => setHierarchyLevel(parseInt(e.target.value))}
              className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-md"
            >
              <option value={0}>Viewer (0) - Lowest</option>
              <option value={10}>Contributor (10)</option>
              <option value={30}>Moderator (30)</option>
              <option value={50}>Manager (50)</option>
              <option value={100}>Admin (100) - Highest</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">Higher levels inherit lower level permissions</p>
          </div>

          <div>
            <Label htmlFor="parent-role">Parent Role (Optional)</Label>
            <select
              id="parent-role"
              value={parentRoleId}
              onChange={(e) => setParentRoleId(e.target.value)}
              className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-md"
            >
              <option value="">No parent</option>
              {allRoles?.filter(r => r.id !== role?.id).map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            {parentRoleId && (
              <label className="flex items-center gap-2 mt-2 text-sm">
                <input
                  type="checkbox"
                  checked={inheritsPermissions}
                  onChange={(e) => setInheritsPermissions(e.target.checked)}
                  className="rounded"
                />
                <span className="text-slate-600">Inherit parent permissions</span>
              </label>
            )}
          </div>
        </div>

        <div className="mb-6">
          <Label className="mb-3 block">Permissions</Label>
          <div className="space-y-2">
            {Object.entries(PERMISSION_MODULES).map(([moduleKey, module]) => {
              const modulePerms = permissions[moduleKey] || {};
              const hasAnyPermission = Object.values(modulePerms).some(v => v);
              const isExpanded = expandedModules[moduleKey];

              return (
                <div key={moduleKey} className="border border-slate-200 rounded-lg overflow-hidden">
                  <div
                    onClick={() => toggleModuleExpanded(moduleKey)}
                    className="flex items-center justify-between p-4 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{module.icon}</span>
                      <div>
                        <div className="font-semibold text-slate-900">{module.label}</div>
                        {hasAnyPermission && (
                          <div className="text-xs text-emerald-600 font-medium">
                            {Object.values(modulePerms).filter(v => v).length} permission(s) granted
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectAllInModule(moduleKey, !hasAnyPermission);
                        }}
                        className="text-xs px-3 py-1 rounded bg-white border border-slate-300 hover:bg-slate-50"
                      >
                        {hasAnyPermission ? 'Deselect All' : 'Select All'}
                      </button>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 bg-white grid grid-cols-2 gap-2">
                      {module.permissions.map(permission => (
                        <PermissionCheckbox
                          key={permission}
                          module={moduleKey}
                          permission={permission}
                          checked={modulePerms[permission] || false}
                          onChange={togglePermission}
                          disabled={role?.is_system_role}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" className="flex-1" disabled={role?.is_system_role}>
            <Check className="w-4 h-4 mr-2" />
            {role ? 'Update Role' : 'Create Role'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </form>
    </motion.div>
  );
}

export default function RoleManagement() {
  const [editingRole, setEditingRole] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const queryClient = useQueryClient();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => base44.entities.Role.list()
  });

  // Get role hierarchy map
  const getRoleHierarchy = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    if (!role || !role.parent_role_id) return [];
    return [role.parent_role_id, ...getRoleHierarchy(role.parent_role_id)];
  };

  const createRoleMutation = useMutation({
    mutationFn: (roleData) => base44.entities.Role.create(roleData),
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      toast.success('Role created successfully');
      setShowEditor(false);
      setEditingRole(null);
    },
    onError: () => toast.error('Failed to create role')
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Role.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      toast.success('Role updated successfully');
      setShowEditor(false);
      setEditingRole(null);
    },
    onError: () => toast.error('Failed to update role')
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id) => base44.entities.Role.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      toast.success('Role deleted successfully');
    },
    onError: () => toast.error('Failed to delete role')
  });

  const handleSaveRole = (roleData) => {
    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.id, data: roleData });
    } else {
      createRoleMutation.mutate(roleData);
    }
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setShowEditor(true);
  };

  const handleDeleteRole = (role) => {
    if (role.is_system_role) {
      toast.error('Cannot delete system roles');
      return;
    }
    if (window.confirm(`Are you sure you want to delete the "${role.name}" role?`)) {
      deleteRoleMutation.mutate(role.id);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Role Management
          </h2>
          <p className="text-slate-600 mt-1">Create custom roles with granular permissions</p>
        </div>
        {!showEditor && (
          <Button onClick={() => setShowEditor(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Role
          </Button>
        )}
      </div>

      <AnimatePresence>
        {showEditor && (
          <div className="mb-6">
            <RoleEditor
              role={editingRole}
              allRoles={roles}
              onSave={handleSaveRole}
              onCancel={() => {
                setShowEditor(false);
                setEditingRole(null);
              }}
            />
          </div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Loading roles...</div>
      ) : roles.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
          <Shield className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 mb-4">No custom roles yet</p>
          <Button onClick={() => setShowEditor(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Role
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {roles.map((role) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-slate-200 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 text-lg">{role.name}</h3>
                    {role.is_system_role && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                        System
                      </span>
                    )}
                    {!role.is_active && (
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs font-semibold rounded">
                        Inactive
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                      Level {role.hierarchy_level || 0}
                    </span>
                  </div>
                  {role.description && (
                    <p className="text-sm text-slate-600 mb-2">{role.description}</p>
                  )}
                  {role.parent_role_id && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <GitBranch className="w-3 h-3" />
                      <span>Inherits from: {roles.find(r => r.id === role.parent_role_id)?.name || 'Unknown'}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditRole(role)}
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  {!role.is_system_role && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteRole(role)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(role.permissions || {}).map(([moduleKey, modulePerms]) => {
                  const module = PERMISSION_MODULES[moduleKey];
                  if (!module) return null;
                  
                  const grantedPerms = Object.entries(modulePerms)
                    .filter(([_, value]) => value)
                    .map(([key]) => key);
                  
                  if (grantedPerms.length === 0) return null;

                  return (
                    <div key={moduleKey} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{module.icon}</span>
                        <span className="text-sm font-semibold text-slate-900">{module.label}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {grantedPerms.map(perm => (
                          <span key={perm} className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded">
                            {perm}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}