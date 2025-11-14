import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { issueSchema } from '@/lib/validations';

export default function Issues() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [roomId, setRoomId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRooms();
      fetchIssues();
    }
  }, [user]);

  const fetchRooms = async () => {
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .order('building')
      .order('room_no');
    setRooms(data || []);
  };

  const fetchIssues = async () => {
    const { data } = await supabase
      .from('issue_reports')
      .select('*, rooms(*)')
      .eq('teacher_id', user?.id)
      .order('created_at', { ascending: false });
    setIssues(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    const validation = issueSchema.safeParse({
      roomId,
      message,
    });

    if (!validation.success) {
      const errors = validation.error.errors.map(e => e.message).join(', ');
      toast.error(errors);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('issue_reports').insert({
        teacher_id: user?.id,
        room_id: roomId,
        message,
        status: 'OPEN',
      });

      if (error) throw error;

      toast.success('Issue reported successfully');
      setRoomId('');
      setMessage('');
      fetchIssues();
    } catch (error: any) {
      toast.error(error.message || 'Failed to report issue');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'destructive';
      case 'IN_PROGRESS':
        return 'warning';
      case 'RESOLVED':
        return 'success';
      case 'CLOSED':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold">Report Issues</h2>
          <p className="text-muted-foreground">Report classroom problems and track status</p>
        </div>

        <Card className="max-w-2xl card-sketch">
          <CardHeader>
            <CardTitle>New Issue Report</CardTitle>
            <CardDescription>Describe the problem you encountered</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="room">Room</Label>
                <Select value={roomId} onValueChange={setRoomId} required>
                  <SelectTrigger className="transition-all">
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.building} {room.room_no}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Issue Description</Label>
                <Textarea
                  id="message"
                  placeholder="Describe the issue in detail..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                  className="transition-all resize-none"
                />
              </div>

              <Button type="submit" className="w-full btn-hover-lift" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Issue Report'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="card-sketch">
          <CardHeader>
            <CardTitle>Your Reported Issues</CardTitle>
            <CardDescription>Track the status of your reports</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table className="responsive-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Room</TableHead>
                  <TableHead className="hidden sm:table-cell">Issue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="hidden lg:table-cell">Response</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No issues reported yet
                    </TableCell>
                  </TableRow>
                ) : (
                  issues.map((issue) => (
                    <TableRow key={issue.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">{issue.rooms.building} {issue.rooms.room_no}</TableCell>
                      <TableCell className="hidden sm:table-cell max-w-xs truncate">{issue.message}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(issue.status) as any}>
                          {issue.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {new Date(issue.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell max-w-xs truncate text-sm text-muted-foreground">
                        {issue.response || 'Pending'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
