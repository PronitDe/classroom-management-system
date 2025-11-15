import { getStatusBadgeVariant } from '@/lib/badgeHelpers';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

export default function ManageIssues() {
  const [issues, setIssues] = useState<any[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [status, setStatus] = useState<'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'>('OPEN');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('issue_reports')
      .select('*, rooms(*), profiles!issue_reports_teacher_id_fkey(*)')
      .order('created_at', { ascending: false });
    setIssues(data || []);
    setLoading(false);
  };

  const handleUpdateIssue = async () => {
    if (!selectedIssue) return;

    const { error } = await supabase
      .from('issue_reports')
      .update({ status, response })
      .eq('id', selectedIssue.id);

    if (error) {
      toast.error('Failed to update issue');
      return;
    }

    toast.success('Issue updated successfully');
    setSelectedIssue(null);
    fetchIssues();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold">Manage Issues</h2>
          <p className="text-muted-foreground">Track and resolve classroom issues</p>
        </div>

        <Card className="card-sketch">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              <CardTitle>All Issue Reports</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading issues...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reported By</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No issues reported
                    </TableCell>
                  </TableRow>
                ) : (
                  issues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell>{issue.profiles?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        {issue.rooms?.building} {issue.rooms?.room_no}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{issue.message}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(issue.status)}>
                          {issue.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(issue.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedIssue(issue);
                            setStatus(issue.status);
                            setResponse(issue.response || '');
                          }}
                        >
                          Update
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!selectedIssue} onOpenChange={(open) => !open && setSelectedIssue(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Issue</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Issue Description:</p>
                <p className="text-sm text-muted-foreground">{selectedIssue?.message}</p>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Response</Label>
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Enter your response..."
                  rows={4}
                />
              </div>
            <Button onClick={handleUpdateIssue} className="w-full btn-hover-lift">
              Update Issue
            </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
