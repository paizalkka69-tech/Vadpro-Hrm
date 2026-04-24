import { useAppSelector } from '@/store/hooks';

export function usePermissions() {
  const { permissions, user } = useAppSelector((s) => s.auth);

  const isSuperAdmin = user?.role === 'SuperAdmin';

  const can = (permission: string): boolean => {
    if (isSuperAdmin) return true;
    if (permissions.includes('*')) return true;
    return permissions.includes(permission);
  };

  const canAny = (perms: string[]): boolean => {
    if (isSuperAdmin) return true;
    if (permissions.includes('*')) return true;
    return perms.some((p) => permissions.includes(p));
  };

  const canModule = (module: string): boolean => {
    if (isSuperAdmin) return true;
    if (permissions.includes('*')) return true;
    return permissions.some((p) => p.startsWith(`${module}:`));
  };

  return { can, canAny, canModule, isSuperAdmin, permissions };
}
