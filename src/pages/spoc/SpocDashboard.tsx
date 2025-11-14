import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

export default function SpocDashboard() {
  const [stats, setStats] = useState({
    totalRooms: 0,
    activeRooms: 0,
    pendingBookings: 0,
    openIssues: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    const [rooms, activeRooms, bookings, issues] = await Promise.all([
      supabase.from('rooms').select('*', { count: 'exact', head: true }),
      supabase.from('rooms').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
      supabase.from('issue_reports').select('*', { count: 'exact', head: true }).in('status', ['OPEN', 'IN_PROGRESS']),
    ]);
    setStats({
      totalRooms: rooms.count || 0,
      activeRooms: activeRooms.count || 0,
      pendingBookings: bookings.count || 0,
      openIssues: issues.count || 0,
    });
    setLoading(false);
  };

  const statCards = [
    { title: 'Total Rooms', value: stats.totalRooms, icon: Building2, color: 'text-primary' },
    { title: 'Active Rooms', value: stats.activeRooms, icon: CheckCircle2, color: 'text-success' },
    { title: 'Pending Bookings', value: stats.pendingBookings, icon: Clock, color: 'text-warning' },
    { title: 'Open Issues', value: stats.openIssues, icon: AlertCircle, color: 'text-destructive' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold">SPOC Dashboard</h2>
          <p className="text-muted-foreground mt-1">Room and booking management overview</p>
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
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
