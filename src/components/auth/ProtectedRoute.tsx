import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type AppRole = 'admin' | 'driver' | 'passenger' | 'storekeeper' | 'mechanic' | 'staff' | 'accounts';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: AppRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { role, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!role) {
    return <Navigate to="/auth" replace />;
  }

  if (!allowedRoles.includes(role)) {
    toast.error('Access denied. You do not have permission to view this page.');
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
