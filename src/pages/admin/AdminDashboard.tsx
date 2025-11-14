import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, Building2 } from 'lucide-react';

export default function AdminDashboard() {
  const mockStats = [
    { title: 'Total Users', value: 248, change: '+12%', icon: Users },
    { title: 'Classrooms', value: 25, change: '100%', icon: Building2 },
    { title: 'Avg. Utilization', value: '76%', change: '+5%', icon: BarChart3 },
    { title: 'Attendance Rate', value: '88%', change: '+3%', icon: TrendingUp },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Admin Dashboard</h2>
          <p className="text-muted-foreground">System overview and analytics</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {mockStats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-success">{stat.change} from last month</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Most Utilized Rooms</CardTitle>
              <CardDescription>Based on booking frequency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {['AU7 101', 'AU6 101', 'AU5 101', 'AU7 102', 'AU6 102'].map((room, i) => (
                <div key={room} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{room}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${100 - i * 15}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{100 - i * 15}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Peak Usage Hours</CardTitle>
              <CardDescription>Classroom demand by time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { slot: '9:00-10:30', usage: 92 },
                { slot: '10:30-12:00', usage: 88 },
                { slot: '12:00-13:30', usage: 45 },
                { slot: '14:00-15:30', usage: 85 },
                { slot: '15:30-17:00', usage: 72 },
              ].map((data) => (
                <div key={data.slot} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{data.slot}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-accent"
                        style={{ width: `${data.usage}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{data.usage}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
