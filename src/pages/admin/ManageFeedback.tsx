import { getStatusBadgeVariant } from '@/lib/badgeHelpers';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/EmptyState';
import { SearchFilter } from '@/components/SearchFilter';
import { format } from 'date-fns';

export default function ManageFeedback() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [response, setResponse] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const { data, error } = await supabase
        .from('student_feedback')
        .select('*, profiles!student_feedback_student_id_fkey(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedbacks(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching feedback",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async () => {
    if (!selectedFeedback || !response.trim()) {
      toast({
        title: "Response required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('student_feedback')
        .update({
          response_message: response.trim(),
          status: newStatus || selectedFeedback.status,
          responded_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedFeedback.id);

      if (error) throw error;

      toast({
        title: "Response sent",
        description: "The student will be notified",
      });

      setSelectedFeedback(null);
      setResponse('');
      setNewStatus('');
      fetchFeedbacks();
    } catch (error: any) {
      toast({
        title: "Error sending response",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredFeedbacks = feedbacks.filter(fb => {
    const matchesSearch = 
      fb.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fb.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fb.profiles?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'ALL' || fb.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Student Feedback Management</h1>
          <p className="text-muted-foreground mt-2">Review and respond to student feedback and complaints</p>
        </div>

        <Card className="card-sketch">
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle>All Feedback</CardTitle>
                <CardDescription>View and respond to student submissions</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_REVIEW">In Review</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                <SearchFilter
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search feedback..."
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
              </div>
            ) : filteredFeedbacks.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No feedback found"
                description="Student feedback will appear here"
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="hidden md:table-cell">Message</TableHead>
                      <TableHead className="hidden sm:table-cell">Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFeedbacks.map((feedback) => (
                      <TableRow key={feedback.id}>
                        <TableCell className="font-medium">
                          {feedback.profiles?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>{feedback.category}</TableCell>
                        <TableCell className="hidden md:table-cell max-w-xs truncate">
                          {feedback.message}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {format(new Date(feedback.created_at), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>{getStatusBadgeVariant(feedback.status) && (
                          <Badge variant={getStatusBadgeVariant(feedback.status)}>
                            {feedback.status}
                          </Badge>
                        )}</TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedFeedback(feedback);
                                  setResponse(feedback.response_message || '');
                                  setNewStatus(feedback.status);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Feedback Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">Student</label>
                                  <p className="text-sm">{feedback.profiles?.name}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Category</label>
                                  <p className="text-sm">{feedback.category}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Message</label>
                                  <p className="text-sm bg-muted/20 p-3 rounded">{feedback.message}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Update Status</label>
                                  <Select value={newStatus} onValueChange={setNewStatus}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="OPEN">Open</SelectItem>
                                      <SelectItem value="IN_REVIEW">In Review</SelectItem>
                                      <SelectItem value="RESOLVED">Resolved</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Your Response</label>
                                  <Textarea
                                    value={response}
                                    onChange={(e) => setResponse(e.target.value)}
                                    placeholder="Type your response..."
                                    rows={4}
                                  />
                                </div>
                                <Button onClick={handleRespond} className="w-full">
                                  Send Response
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
