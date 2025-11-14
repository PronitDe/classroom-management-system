import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/EmptyState';
import { SearchFilter } from '@/components/SearchFilter';
import { format } from 'date-fns';
import { noticeSchema } from '@/lib/validations';

export default function ManageNotices() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotices(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching notices",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    const validation = noticeSchema.safeParse({
      title,
      description,
      attachmentUrl,
    });

    if (!validation.success) {
      const errors = validation.error.errors.map(e => e.message).join(', ');
      toast({
        title: "Validation Error",
        description: errors,
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from('notices').insert({
        title: title.trim(),
        description: description.trim(),
        attachment_url: attachmentUrl.trim() || null,
      });

      if (error) throw error;

      toast({
        title: "Notice created",
        description: "The notice has been published successfully",
      });

      setTitle('');
      setDescription('');
      setAttachmentUrl('');
      fetchNotices();
    } catch (error: any) {
      toast({
        title: "Error creating notice",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return;

    try {
      const { error } = await supabase.from('notices').delete().eq('id', id);
      if (error) throw error;

      toast({
        title: "Notice deleted",
        description: "The notice has been removed",
      });
      fetchNotices();
    } catch (error: any) {
      toast({
        title: "Error deleting notice",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredNotices = notices.filter(notice =>
    notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notice.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Manage Notices & Announcements</h1>
          <p className="text-muted-foreground mt-2">Create and manage notices visible to all users</p>
        </div>

        <Card className="card-sketch">
          <CardHeader>
            <CardTitle>Create New Notice</CardTitle>
            <CardDescription>Publish announcements for students and staff</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Notice title..."
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notice content..."
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Attachment URL (optional)</label>
                <Input
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  placeholder="https://example.com/document.pdf"
                  type="url"
                />
              </div>
              <Button type="submit" className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Publish Notice
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="card-sketch">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Published Notices</CardTitle>
                <CardDescription>View and manage all notices</CardDescription>
              </div>
              <SearchFilter
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search notices..."
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : filteredNotices.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No notices found"
                description="Create your first notice to get started"
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead className="hidden md:table-cell">Description</TableHead>
                      <TableHead className="hidden sm:table-cell">Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNotices.map((notice) => (
                      <TableRow key={notice.id}>
                        <TableCell className="font-medium">{notice.title}</TableCell>
                        <TableCell className="hidden md:table-cell max-w-md truncate">
                          {notice.description}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {format(new Date(notice.created_at), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(notice.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
