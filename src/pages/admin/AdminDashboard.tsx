import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Calendar, AlertCircle, TrendingUp, Activity, Bell, MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardChart } from '@/components/DashboardChart';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRooms: 0,
    activeRooms: 0,
    maintenanceRooms: 0,
    totalBookings: 0,
    bookingsThisWeek: 0,
    classesThisWeek: 0,
    openIssues: 0,
    resolvedIssues: 0,
  });
  const [roomUtilization, setRoomUtilization] = useState<any[]>([]);
  const [openIssues, setOpenIssues] = useState<any[]>([]);
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<any[]>([]);
  const [monthlyBookings, setMonthlyBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch room stats
      const { data: rooms } = await supabase.from('rooms').select('*');
      const totalRooms = rooms?.length || 0;
      const activeRooms = rooms?.filter((r) => r.is_active).length || 0;
      const maintenanceRooms = totalRooms - activeRooms;

      // Fetch booking stats
      const { data: bookings } = await supabase.from('bookings').select('*');
      const totalBookings = bookings?.length || 0;

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const bookingsThisWeek =
        bookings?.filter((b) => new Date(b.date) >= oneWeekAgo).length || 0;

      // Fetch attendance (classes conducted)
      const { data: attendance } = await supabase
        .from('attendance')
        .select('*')
        .gte('date', oneWeekAgo.toISOString().split('T')[0]);
      const classesThisWeek = attendance?.length || 0;

      // Fetch issue stats
      const { data: issues } = await supabase.from('issue_reports').select('*');
      const openIssues = issues?.filter((i) => i.status === 'OPEN').length || 0;
      const resolvedIssues = issues?.filter((i) => i.status === 'RESOLVED').length || 0;

      setStats({
        totalRooms,
        activeRooms,
        maintenanceRooms,
        totalBookings,
        bookingsThisWeek,
        classesThisWeek,
        openIssues,
        resolvedIssues,
      });

      // Fetch room utilization
      const { data: roomsWithBookings } = await supabase
        .from('rooms')
        .select('*, bookings(count), attendance(count)')
        .order('building')
        .limit(10);

      const utilization = roomsWithBookings?.map((room) => {
        const bookingCount = room.bookings?.[0]?.count || 0;
        const attendanceCount = room.attendance?.[0]?.count || 0;
        const utilizationRate = Math.round((attendanceCount / Math.max(bookingCount, 1)) * 100);
        return {
          ...room,
          bookingCount,
          attendanceCount,
          utilizationRate,
        };
      });

      setRoomUtilization(utilization || []);

      // Fetch latest open issues
      const { data: latestIssues } = await supabase
        .from('issue_reports')
        .select('*, rooms(*), profiles!issue_reports_teacher_id_fkey(*)')
        .eq('status', 'OPEN')
        .order('created_at', { ascending: false })
        .limit(5);

      setOpenIssues(latestIssues || []);

      // Fetch recent notices
      const { data: notices } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      setRecentNotices(notices || []);

      // Fetch recent feedback
      const { data: feedback } = await supabase
        .from('student_feedback')
        .select('*, profiles!student_feedback_student_id_fkey(name)')
        .order('created_at', { ascending: false })
        .limit(5);
      setRecentFeedback(feedback || []);

      // Calculate monthly booking trends (last 6 months)
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const { count } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .gte('date', format(startOfMonth, 'yyyy-MM-dd'))
          .lte('date', format(endOfMonth, 'yyyy-MM-dd'));

        monthlyData.push({
          label: format(startOfMonth, 'MMM'),
          value: count || 0
        });
      }
      setMonthlyBookings(monthlyData);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Rooms', value: stats.totalRooms, icon: Building2, color: 'text-blue-500' },
    { title: 'Active Rooms', value: stats.activeRooms, icon: Activity, color: 'text-green-500' },
    { title: 'Under Maintenance', value: stats.maintenanceRooms, icon: AlertCircle, color: 'text-orange-500' },
    { title: 'Total Bookings', value: stats.totalBookings, icon: Calendar, color: 'text-purple-500' },
    { title: 'Bookings This Week', value: stats.bookingsThisWeek, icon: TrendingUp, color: 'text-teal-500' },
    { title: 'Classes This Week', value: stats.classesThisWeek, icon: Calendar, color: 'text-indigo-500' },
    { title: 'Open Issues', value: stats.openIssues, icon: AlertCircle, color: 'text-red-500' },
    { title: 'Resolved Issues', value: stats.resolvedIssues, icon: Activity, color: 'text-green-500' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold">Admin Dashboard</h2>
          <p className="text-muted-foreground">System overview and analytics</p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className="card-sketch">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{stat.value}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Room Utilization Table */}
          <Card className="card-sketch">
            <CardHeader>
              <CardTitle>Room Utilization</CardTitle>
              <CardDescription>Booking and attendance statistics</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Room</TableHead>
                        <TableHead>Bookings</TableHead>
                        <TableHead>Classes</TableHead>
                        <TableHead>Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roomUtilization.map((room) => (
                        <TableRow key={room.id}>
                          <TableCell className="font-medium">
                            {room.building} {room.room_no}
                          </TableCell>
                          <TableCell>{room.bookingCount}</TableCell>
                          <TableCell>{room.attendanceCount}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full bg-primary"
                                  style={{ width: `${room.utilizationRate}%` }}
                                />
                              </div>
                              <span className="text-xs">{room.utilizationRate}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Open Issues Snapshot */}
          <Card className="card-sketch">
            <CardHeader>
              <CardTitle>Open Issues</CardTitle>
              <CardDescription>Latest unresolved issues</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : openIssues.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No open issues
                </p>
              ) : (
                <div className="space-y-3">
                  {openIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="border rounded-lg p-3 space-y-2 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive" className="text-xs">
                              {issue.rooms.building} {issue.rooms.room_no}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {issue.profiles.name}
                            </span>
                          </div>
                          <p className="text-sm line-clamp-2">{issue.message}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(issue.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Monthly Bookings Chart */}
          <DashboardChart
            title="Monthly Bookings"
            description="Last 6 months"
            data={monthlyBookings}
            trend="up"
            trendValue="+12%"
          />

          {/* Recent Notices */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Notices</CardTitle>
                <CardDescription>Latest announcements</CardDescription>
              </div>
              <Bell className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {recentNotices.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No notices</p>
              ) : (
                <div className="space-y-3">
                  {recentNotices.map((notice) => (
                    <div key={notice.id} className="text-sm space-y-1">
                      <div className="font-medium line-clamp-1">{notice.title}</div>
                      <p className="text-xs text-muted-foreground">{format(new Date(notice.created_at), 'MMM d')}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Feedback */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Feedback</CardTitle>
                <CardDescription>Student submissions</CardDescription>
              </div>
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {recentFeedback.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No feedback</p>
              ) : (
                <div className="space-y-3">
                  {recentFeedback.map((fb) => (
                    <div key={fb.id} className="text-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-xs">{fb.profiles?.name}</span>
                        <Badge variant="secondary" className="text-xs">{fb.category}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{fb.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
