import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle, Clock, AlertCircle, BookOpen, ClipboardList, FileText, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    completed: 0,
    issues: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    setLoading(true);
    const [bookings, attendance, issues] = await Promise.all([
      supabase.from('bookings').select('*', { count: 'exact' }).eq('teacher_id', user?.id),
      supabase.from('attendance').select('*', { count: 'exact' }).eq('teacher_id', user?.id),
      supabase.from('issue_reports').select('*', { count: 'exact' }).eq('teacher_id', user?.id),
    ]);

    const pending = bookings.data?.filter((b) => b.status === 'PENDING').length || 0;
    const approved = bookings.data?.filter((b) => b.status === 'APPROVED').length || 0;

    setStats({
      pending,
      approved,
      completed: attendance.count || 0,
      issues: issues.count || 0,
    });
    setLoading(false);
  };

  const statCards = [
    { title: 'Pending Bookings', value: stats.pending, description: 'Awaiting approval', icon: Clock, color: 'text-warning' },
    { title: 'Approved Bookings', value: stats.approved, description: 'Ready for class', icon: CheckCircle, color: 'text-success' },
    { title: 'Classes Completed', value: stats.completed, description: 'Attendance marked', icon: Calendar, color: 'text-primary' },
    { title: 'Issues Reported', value: stats.issues, description: 'Total issues filed', icon: AlertCircle, color: 'text-destructive' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold">Teacher Dashboard</h2>
          <p className="text-muted-foreground mt-1">Welcome back! Here's your overview.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className="card-sketch btn-hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-3xl font-bold">{stat.value}</div>}
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="card-sketch">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you can perform</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Button 
              variant="outline" 
              className="justify-start h-auto py-3 btn-hover-lift"
              onClick={() => navigate('/teacher/book')}
            >
              <BookOpen className="h-4 w-4 mr-2 text-primary" />
              <span className="text-left">Book a classroom for your next session</span>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-auto py-3 btn-hover-lift"
              onClick={() => navigate('/teacher/attendance')}
            >
              <ClipboardList className="h-4 w-4 mr-2 text-success" />
              <span className="text-left">Mark attendance for ongoing classes</span>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-auto py-3 btn-hover-lift"
              onClick={() => navigate('/teacher/history')}
            >
              <FileText className="h-4 w-4 mr-2 text-accent" />
              <span className="text-left">View your booking history</span>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-auto py-3 btn-hover-lift"
              onClick={() => navigate('/teacher/issues')}
            >
              <AlertTriangle className="h-4 w-4 mr-2 text-destructive" />
              <span className="text-left">Report any classroom issues</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
