import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  role: AppRole | null;
}

export function useUsers() {
  return useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (profilesError) throw profilesError;

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: UserWithRole[] = profiles.map(profile => {
        const userRole = roles.find(r => r.user_id === profile.user_id);
        return {
          id: profile.id,
          user_id: profile.user_id,
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
          created_at: profile.created_at,
          role: userRole?.role || null,
        };
      });

      return usersWithRoles;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      data 
    }: { 
      userId: string; 
      data: { full_name?: string; email?: string; phone?: string | null } 
    }) => {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Profile updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update profile: ' + error.message);
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      role 
    }: { 
      userId: string; 
      role: AppRole 
    }) => {
      // First check if user already has a role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success('User role updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update role: ' + error.message);
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      email, 
      password, 
      fullName, 
      phone,
      role,
      driverDetails
    }: { 
      email: string; 
      password: string; 
      fullName: string; 
      phone?: string;
      role: AppRole;
      driverDetails?: {
        license_number: string;
        license_expiry: string;
        date_of_birth?: string;
        address?: string;
        emergency_contact?: string;
        emergency_phone?: string;
      };
    }) => {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Update the role (the trigger creates passenger by default)
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', authData.user.id);

      if (roleError) throw roleError;

      // Update phone if provided
      if (phone) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ phone })
          .eq('user_id', authData.user.id);

        if (profileError) throw profileError;
      }

      // If role is driver, create a driver record
      if (role === 'driver' && driverDetails) {
        const { error: driverError } = await supabase
          .from('drivers')
          .insert({
            user_id: authData.user.id,
            license_number: driverDetails.license_number,
            license_expiry: driverDetails.license_expiry,
            date_of_birth: driverDetails.date_of_birth || null,
            address: driverDetails.address || null,
            emergency_contact: driverDetails.emergency_contact || null,
            emergency_phone: driverDetails.emergency_phone || null,
            status: 'active',
          });

        if (driverError) throw driverError;
      }

      return authData.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('User created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create user: ' + error.message);
    },
  });
}
