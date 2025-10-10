import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Shield, User } from 'lucide-react';

type AppRole = 'admin' | 'analyst' | 'field_supervisor' | 'viewer';

export default function UserManagement() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!profiles) return [];

      const usersWithRoles = await Promise.all(
        profiles.map(async (profile) => {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id);

          return {
            ...profile,
            roles: roles?.map(r => r.role) || [],
          };
        })
      );

      return usersWithRoles;
    },
    enabled: isAdmin,
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      // Delete existing roles
      await supabase.from('user_roles').delete().eq('user_id', userId);
      
      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success('Role updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update role: ${error.message}`);
    },
  });

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      admin: 'bg-destructive/10 text-destructive border-destructive',
      analyst: 'bg-primary/10 text-primary border-primary',
      field_supervisor: 'bg-warning/10 text-warning border-warning',
      viewer: 'bg-muted text-muted-foreground border-muted',
    };
    return colors[role as keyof typeof colors] || colors.viewer;
  };

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">You do not have permission to access this page.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
          <CardDescription>Manage user roles and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading users...</p>
          ) : !users || users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No users found</p>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{user.full_name || 'No name'}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                      {user.roles.map((role) => (
                        <Badge
                          key={role}
                          variant="outline"
                          className={getRoleBadgeColor(role)}
                        >
                          {role}
                        </Badge>
                      ))}
                    </div>

                    <Select
                      value={user.roles[0] || 'viewer'}
                      onValueChange={(value) =>
                        updateRoleMutation.mutate({
                          userId: user.id,
                          newRole: value as AppRole,
                        })
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>Viewer</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="field_supervisor">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            <span>Field Supervisor</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="analyst">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            <span>Analyst</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-destructive" />
                            <span>Admin</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
