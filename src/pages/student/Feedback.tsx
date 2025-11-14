import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Send } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/EmptyState';
import { format } from 'date-fns';

export default function Feedback() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchFeedbacks();
    }
  }, [user]);

  const fetchFeedbacks = async () => {
    try {
      const { data, error } = await supabase
        .from('student_feedback')
        .select('*')
        .eq('student_id', user?.id)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category || !message.trim()) {
      toast({
        title: "Missing fields",
        description: "Please select a category and enter your message",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from('student_feedback').insert({
        student_id: user?.id,
        category,
        message: message.trim(),
        status: 'OPEN',
      });

      if (error) throw error;

      toast({
        title: "Feedback submitted",
        description: "Your feedback has been sent successfully",
      });

      setCategory('');
      setMessage('');
      fetchFeedbacks();
    } catch (error: any) {
      toast({
        title: "Error submitting feedback",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      OPEN: "destructive",
      IN_REVIEW: "secondary",
      RESOLVED: "default",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Feedback & Complaints</h1>
          <p className="text-muted-foreground mt-2">Share your feedback or report any issues</p>
        </div>

        <Card className="card-sketch">
          <CardHeader>
            <CardTitle>Submit Feedback</CardTitle>
            <CardDescription>Let us know about any issues or suggestions</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technical Issue">Technical Issue</SelectItem>
                    <SelectItem value="Room Facilities">Room Facilities</SelectItem>
                    <SelectItem value="Attendance">Attendance</SelectItem>
                    <SelectItem value="General Feedback">General Feedback</SelectItem>
                    <SelectItem value="Complaint">Complaint</SelectItem>
                    <SelectItem value="Suggestion">Suggestion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your feedback or issue..."
                  rows={5}
                  required
                />
              </div>
              <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                <Send className="h-4 w-4 mr-2" />
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="card-sketch">
          <CardHeader>
            <CardTitle>Your Feedback History</CardTitle>
            <CardDescription>Track the status of your submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
              </div>
            ) : feedbacks.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No feedback yet"
                description="Your submitted feedback will appear here"
              />
            ) : (
              <div className="space-y-4">
                {feedbacks.map((feedback) => (
                  <div key={feedback.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{feedback.category}</h4>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(feedback.created_at), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      {getStatusBadge(feedback.status)}
                    </div>
                    <p className="text-sm bg-muted/20 p-3 rounded">{feedback.message}</p>
                    {feedback.response_message && (
                      <div className="mt-3 bg-primary/10 p-3 rounded border-l-4 border-primary">
                        <p className="text-sm font-medium mb-1">Response from Administration:</p>
                        <p className="text-sm">{feedback.response_message}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
