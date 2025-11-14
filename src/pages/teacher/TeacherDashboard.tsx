import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    completed: 0,
    issues: 0,
  });

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
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
  };

  const statCards = [
    {
      title: 'Pending Bookings',
      value: stats.pending,
      description: 'Awaiting approval',
      icon: Clock,
      color: 'text-warning',
    },
    {
      title: 'Approved Bookings',
      value: stats.approved,
      description: 'Ready for class',
      icon: CheckCircle,
      color: 'text-success',
    },
    {
      title: 'Classes Completed',
      value: stats.completed,
      description: 'Attendance marked',
      icon: Calendar,
      color: 'text-primary',
    },
    {
      title: 'Issues Reported',
      value: stats.issues,
      description: 'Total issues filed',
      icon: AlertCircle,
      color: 'text-destructive',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Teacher Dashboard</h2>
          <p className="text-muted-foreground">Welcome back! Here's your overview.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you can perform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">• Book a classroom for your next session</p>
            <p className="text-sm text-muted-foreground">• Mark attendance for ongoing classes</p>
            <p className="text-sm text-muted-foreground">• View your booking history</p>
            <p className="text-sm text-muted-foreground">• Report any classroom issues</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
