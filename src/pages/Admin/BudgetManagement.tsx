import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Lock, Archive, Copy, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function BudgetManagement() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const { data: versions, isLoading } = useQuery({
    queryKey: ['budget-versions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_version')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-500/10 text-gray-500 border-gray-500',
      submitted: 'bg-blue-500/10 text-blue-500 border-blue-500',
      approved: 'bg-success/10 text-success border-success',
      locked: 'bg-purple-500/10 text-purple-500 border-purple-500',
      archived: 'bg-muted text-muted-foreground border-muted',
    };
    return colors[status as keyof typeof colors] || colors.draft;
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Budget Versions</h2>
            <p className="text-muted-foreground">Manage budget versions and approvals</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => toast.info('Excel import coming soon')}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Import Excel
            </Button>
            <Button onClick={() => toast.info('Create version coming soon')}>
              <Plus className="w-4 h-4 mr-2" />
              New Version
            </Button>
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Loading budget versions...</p>
            </CardContent>
          </Card>
        ) : !versions || versions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No budget versions yet</p>
              <Button onClick={() => toast.info('Create version coming soon')}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Version
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {versions.map((version) => (
              <Card key={version.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {version.version_name}
                        <Badge variant="outline" className={getStatusColor(version.status)}>
                          {version.status}
                        </Badge>
                        {version.is_baseline && (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
                            Baseline
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        FY {version.fiscal_year} • {version.version_code}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {version.status === 'draft' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => toast.info('Edit coming soon')}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => toast.info('Clone coming soon')}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {version.status === 'approved' && (
                        <Button size="sm" variant="outline" onClick={() => toast.info('Lock coming soon')}>
                          <Lock className="w-4 h-4" />
                        </Button>
                      )}
                      {version.status === 'locked' && (
                        <Button size="sm" variant="outline" onClick={() => toast.info('Archive coming soon')}>
                          <Archive className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Effective Period</p>
                      <p className="font-medium">
                        {new Date(version.effective_start).toLocaleDateString()} - {new Date(version.effective_end).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p className="font-medium">{new Date(version.created_at).toLocaleDateString()}</p>
                    </div>
                    {version.approved_at && (
                      <div>
                        <p className="text-muted-foreground">Approved</p>
                        <p className="font-medium">{new Date(version.approved_at).toLocaleDateString()}</p>
                      </div>
                    )}
                    {version.frozen_at && (
                      <div>
                        <p className="text-muted-foreground">Locked</p>
                        <p className="font-medium">{new Date(version.frozen_at).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                  {version.approval_notes && (
                    <div className="mt-4 p-3 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">Notes:</p>
                      <p className="text-sm">{version.approval_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
