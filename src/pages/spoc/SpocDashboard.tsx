import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function SpocDashboard() {
  const [stats, setStats] = useState({
    totalRooms: 0,
    activeRooms: 0,
    pendingBookings: 0,
    openIssues: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [rooms, bookings, issues] = await Promise.all([
      supabase.from('rooms').select('*', { count: 'exact' }),
      supabase.from('bookings').select('*', { count: 'exact' }).eq('status', 'PENDING'),
      supabase.from('issue_reports').select('*', { count: 'exact' }).eq('status', 'OPEN'),
    ]);

    const activeRooms = rooms.data?.filter((r) => r.is_active).length || 0;

    setStats({
      totalRooms: rooms.count || 0,
      activeRooms,
      pendingBookings: bookings.count || 0,
      openIssues: issues.count || 0,
    });
  };

  const statCards = [
    {
      title: 'Total Rooms',
      value: stats.totalRooms,
      icon: Building2,
      color: 'text-primary',
    },
    {
      title: 'Active Rooms',
      value: stats.activeRooms,
      icon: CheckCircle,
      color: 'text-success',
    },
    {
      title: 'Pending Bookings',
      value: stats.pendingBookings,
      icon: Calendar,
      color: 'text-warning',
    },
    {
      title: 'Open Issues',
      value: stats.openIssues,
      icon: AlertCircle,
      color: 'text-destructive',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">SPOC Dashboard</h2>
          <p className="text-muted-foreground">Manage rooms, bookings, and issues</p>
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
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
