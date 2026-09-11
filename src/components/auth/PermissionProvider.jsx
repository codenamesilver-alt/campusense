import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';

const PermissionContext = createContext();

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

export const usePermission = (requiredPermission) => {
  const { hasPermission } = usePermissions();
  return hasPermission(requiredPermission);
};

export const PermissionProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadUserAndPermissions = useCallback(async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Admin gets all permissions by default
      if (currentUser.role === 'admin') {
        setIsAdmin(true);
        setPermissions(['admin:all']);
      } else {
        setIsAdmin(false);
        // Try to load role permissions
        try {
          const rolePermissions = await base44.entities.RolePermission.filter({ role: currentUser.role });
          const userPermissions = rolePermissions.length > 0 ? rolePermissions[0].permissions : [];
          setPermissions(userPermissions);
        } catch (permError) {
          console.error('Error loading role permissions:', permError);
          setPermissions([]);
        }
      }
    } catch (error) {
      console.error('Error loading user permissions:', error);
      setUser(null);
      setPermissions([]);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserAndPermissions();
  }, [loadUserAndPermissions]);

  // Memoize hasPermission to ensure stable reference
  const hasPermission = useCallback((permission) => {
    // Admin has all permissions
    if (isAdmin) return true;
    // Check if permission exists in permissions array
    return permissions.includes(permission) || permissions.includes('admin:all');
  }, [isAdmin, permissions]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    permissions,
    loading,
    isAdmin,
    hasPermission,
    refreshPermissions: loadUserAndPermissions
  }), [user, permissions, loading, isAdmin, hasPermission, loadUserAndPermissions]);

  return (
    <PermissionContext.Provider value={contextValue}>
      {children}
    </PermissionContext.Provider>
  );
};