import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, Clock, AlertCircle, BookOpen, ClipboardList, FileText, AlertTriangle, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardChart } from '@/components/DashboardChart';
import { format } from 'date-fns';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    completed: 0,
    issues: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
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

    // Fetch recent bookings
    const { data: recentB } = await supabase
      .from('bookings')
      .select('*, rooms(*)')
      .eq('teacher_id', user?.id)
      .order('date', { ascending: false })
      .limit(5);
    setRecentBookings(recentB || []);

    // Fetch recent attendance
    const { data: recentA } = await supabase
      .from('attendance')
      .select('*, rooms(*)')
      .eq('teacher_id', user?.id)
      .order('date', { ascending: false })
      .limit(5);
    setRecentAttendance(recentA || []);

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

        <div className="grid gap-4 md:grid-cols-2">
          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Bookings</CardTitle>
              <CardDescription>Your latest room reservations</CardDescription>
            </CardHeader>
            <CardContent>
              {recentBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No bookings yet</p>
              ) : (
                <div className="space-y-2">
                  {recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="text-sm">
                        <div className="font-medium">{booking.rooms.building} {booking.rooms.room_no}</div>
                        <div className="text-xs text-muted-foreground">{format(new Date(booking.date), 'MMM d')} • {booking.slot}</div>
                      </div>
                      <Badge variant={booking.status === 'APPROVED' ? 'default' : 'secondary'}>{booking.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Attendance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Attendance</CardTitle>
              <CardDescription>Classes you've completed</CardDescription>
            </CardHeader>
            <CardContent>
              {recentAttendance.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No attendance records</p>
              ) : (
                <div className="space-y-2">
                  {recentAttendance.map((att) => (
                    <div key={att.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="text-sm">
                        <div className="font-medium">{att.rooms.building} {att.rooms.room_no}</div>
                        <div className="text-xs text-muted-foreground">{format(new Date(att.date), 'MMM d')} • {att.slot}</div>
                      </div>
                      <div className="text-sm font-medium text-primary">{att.present}/{att.total}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Use the Demo Grid View for faster attendance marking</li>
              <li>• Book rooms at least 24 hours in advance for better availability</li>
              <li>• Report issues immediately to get them resolved quickly</li>
              <li>• Check your approved bookings before class time</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
