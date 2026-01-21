"use client";

/**
 * Client-side Permission Hook for XtMate
 *
 * Provides React components with permission checking capabilities.
 * Fetches auth context from API and caches for the session.
 *
 * @example
 * function MyComponent() {
 *   const { hasPermission, loading, role } = usePermissions();
 *
 *   if (loading) return <Spinner />;
 *
 *   return (
 *     <div>
 *       {hasPermission('estimates.approve') && (
 *         <ApproveButton />
 *       )}
 *     </div>
 *   );
 * }
 */

import { useUser } from "@clerk/nextjs";
import {
  useEffect,
  useState,
  useCallback,
  createContext,
  useContext,
  ReactNode,
} from "react";
import type { Permission, Role, AuthContext } from "@/lib/auth/types";
import { ROLE_LEVELS } from "@/lib/auth/types";

// ============================================================================
// TYPES
// ============================================================================

interface PermissionsState {
  loading: boolean;
  error: string | null;
  authContext: AuthContext | null;
  /** Whether the user needs to complete onboarding */
  needsOnboarding: boolean;
}

interface PermissionsContextValue extends PermissionsState {
  /** Check if user has a specific permission */
  hasPermission: (permission: Permission) => boolean;
  /** Check if user has any of the specified permissions */
  hasAnyPermission: (permissions: Permission[]) => boolean;
  /** Check if user has all of the specified permissions */
  hasAllPermissions: (permissions: Permission[]) => boolean;
  /** Check if user has a specific role */
  hasRole: (role: Role) => boolean;
  /** Check if user has minimum role level */
  hasMinimumRole: (minimumRole: Role) => boolean;
  /** Current user's role */
  role: Role | null;
  /** Current user's permissions */
  permissions: Permission[];
  /** Current user's organization ID */
  organizationId: string | null;
  /** Refresh auth context from server */
  refresh: () => Promise<void>;
}

// ============================================================================
// CONTEXT
// ============================================================================

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface PermissionsProviderProps {
  children: ReactNode;
}

export function PermissionsProvider({ children }: PermissionsProviderProps) {
  const { user, isLoaded: clerkLoaded } = useUser();
  const [state, setState] = useState<PermissionsState>({
    loading: true,
    error: null,
    authContext: null,
    needsOnboarding: false,
  });

  const fetchAuthContext = useCallback(async () => {
    if (!clerkLoaded || !user) {
      setState({
        loading: false,
        error: null,
        authContext: null,
        needsOnboarding: false,
      });
      return;
    }

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await fetch("/api/auth/context");

      if (!response.ok) {
        if (response.status === 401) {
          // User is authenticated but not in an organization - needs onboarding
          setState({
            loading: false,
            error: null,
            authContext: null,
            needsOnboarding: true,
          });
          return;
        }
        throw new Error(`Failed to fetch auth context: ${response.status}`);
      }

      const data = await response.json();
      setState({
        loading: false,
        error: null,
        authContext: data,
        needsOnboarding: false,
      });
    } catch (err) {
      console.error("Error fetching auth context:", err);
      setState({
        loading: false,
        error: err instanceof Error ? err.message : "Unknown error",
        authContext: null,
        needsOnboarding: false,
      });
    }
  }, [user, clerkLoaded]);

  useEffect(() => {
    fetchAuthContext();
  }, [fetchAuthContext]);

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      return state.authContext?.permissions.includes(permission) ?? false;
    },
    [state.authContext]
  );

  const hasAnyPermission = useCallback(
    (permissions: Permission[]): boolean => {
      return permissions.some((p) => hasPermission(p));
    },
    [hasPermission]
  );

  const hasAllPermissions = useCallback(
    (permissions: Permission[]): boolean => {
      return permissions.every((p) => hasPermission(p));
    },
    [hasPermission]
  );

  const hasRole = useCallback(
    (role: Role): boolean => {
      return state.authContext?.role === role;
    },
    [state.authContext]
  );

  const hasMinimumRole = useCallback(
    (minimumRole: Role): boolean => {
      if (!state.authContext) return false;
      return ROLE_LEVELS[state.authContext.role] >= ROLE_LEVELS[minimumRole];
    },
    [state.authContext]
  );

  const value: PermissionsContextValue = {
    ...state,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasMinimumRole,
    role: state.authContext?.role ?? null,
    permissions: state.authContext?.permissions ?? [],
    organizationId: state.authContext?.organizationId ?? null,
    refresh: fetchAuthContext,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access permission checking functions
 * Must be used within a PermissionsProvider
 * Returns loading state during SSR/static generation when context is not available
 */
export function usePermissions(): PermissionsContextValue {
  const context = useContext(PermissionsContext);

  // Return a default loading state if no context (during static generation or before provider mounts)
  if (!context) {
    return {
      loading: true,
      error: null,
      authContext: null,
      needsOnboarding: false,
      hasPermission: () => false,
      hasAnyPermission: () => false,
      hasAllPermissions: () => false,
      hasRole: () => false,
      hasMinimumRole: () => false,
      role: null,
      permissions: [],
      organizationId: null,
      refresh: async () => {},
    };
  }

  return context;
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

interface RequirePermissionProps {
  /** Permission required to render children */
  permission: Permission;
  /** Content to render if permission is granted */
  children: ReactNode;
  /** Optional fallback if permission is denied */
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders based on permission
 *
 * @example
 * <RequirePermission permission="estimates.approve">
 *   <ApproveButton />
 * </RequirePermission>
 */
export function RequirePermission({
  permission,
  children,
  fallback = null,
}: RequirePermissionProps) {
  const { hasPermission, loading } = usePermissions();

  if (loading) return null;
  if (!hasPermission(permission)) return <>{fallback}</>;

  return <>{children}</>;
}

interface RequireAnyPermissionProps {
  /** Permissions - user needs at least one */
  permissions: Permission[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that renders if user has any of the specified permissions
 */
export function RequireAnyPermission({
  permissions,
  children,
  fallback = null,
}: RequireAnyPermissionProps) {
  const { hasAnyPermission, loading } = usePermissions();

  if (loading) return null;
  if (!hasAnyPermission(permissions)) return <>{fallback}</>;

  return <>{children}</>;
}

interface RequireRoleProps {
  /** Minimum role level required */
  role: Role;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that renders if user has minimum role level
 *
 * @example
 * <RequireRole role="qa_manager">
 *   <QADashboard />
 * </RequireRole>
 */
export function RequireRole({
  role,
  children,
  fallback = null,
}: RequireRoleProps) {
  const { hasMinimumRole, loading } = usePermissions();

  if (loading) return null;
  if (!hasMinimumRole(role)) return <>{fallback}</>;

  return <>{children}</>;
}
