import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, TrendingUp, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function StudentDashboard() {
  const [stats, setStats] = useState({
    totalClassesThisMonth: 0,
    avgAttendancePercent: 0,
  });
  const [attendanceTrend, setAttendanceTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const mockSchedule = [
    { day: 'Monday', slot: '9:00-10:30', subject: 'Data Structures', room: 'AU6 101', teacher: 'Dr. Kumar' },
    { day: 'Monday', slot: '10:30-12:00', subject: 'Algorithms', room: 'AU5 201', teacher: 'Prof. Sharma' },
    { day: 'Tuesday', slot: '9:00-10:30', subject: 'DBMS', room: 'AU7 102', teacher: 'Dr. Verma' },
    { day: 'Wednesday', slot: '14:00-15:30', subject: 'Web Development', room: 'AU6 201', teacher: 'Prof. Singh' },
    { day: 'Thursday', slot: '10:30-12:00', subject: 'OS Concepts', room: 'AU5 103', teacher: 'Dr. Patel' },
  ];

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthStart = firstDayOfMonth.toISOString().split('T')[0];

      // Fetch aggregate attendance for this month
      const { data: attendance } = await supabase
        .from('attendance')
        .select('*')
        .gte('date', monthStart);

      const totalClasses = attendance?.length || 0;
      const totalPresent = attendance?.reduce((sum, record) => sum + record.present, 0) || 0;
      const totalStudents = attendance?.reduce((sum, record) => sum + record.total, 0) || 0;
      const avgPercent = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0;

      setStats({
        totalClassesThisMonth: totalClasses,
        avgAttendancePercent: avgPercent,
      });

      // Group by week for trend
      const weeklyData: any = {};
      attendance?.forEach((record) => {
        const date = new Date(record.date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];

        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { totalPresent: 0, totalStudents: 0, date: weekStart };
        }
        weeklyData[weekKey].totalPresent += record.present;
        weeklyData[weekKey].totalStudents += record.total;
      });

      const trend = Object.values(weeklyData).map((week: any) => ({
        week: week.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        percent: week.totalStudents > 0 ? Math.round((week.totalPresent / week.totalStudents) * 100) : 0,
      }));

      setAttendanceTrend(trend);
    } catch (error) {
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold">Student Dashboard</h2>
          <p className="text-muted-foreground">Your class schedule and attendance overview</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="card-sketch">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle>Classes This Month</CardTitle>
              </div>
              <CardDescription>Total classes conducted</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <div className="text-4xl font-bold text-primary">{stats.totalClassesThisMonth}</div>
              )}
            </CardContent>
          </Card>

          <Card className="card-sketch">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle>Average Attendance</CardTitle>
              </div>
              <CardDescription>Department-wide percentage</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <div className="text-4xl font-bold text-primary">{stats.avgAttendancePercent}%</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Attendance Trend Chart */}
        <Card className="card-sketch">
          <CardHeader>
            <CardTitle>Attendance Trend</CardTitle>
            <CardDescription>Weekly attendance percentage</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : attendanceTrend.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No attendance data available
              </p>
            ) : (
              <div className="space-y-3">
                {attendanceTrend.map((week, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-20">{week.week}</span>
                    <div className="flex-1 h-8 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary flex items-center justify-end pr-2 transition-all"
                        style={{ width: `${week.percent}%` }}
                      >
                        {week.percent > 20 && (
                          <span className="text-xs font-bold text-primary-foreground">
                            {week.percent}%
                          </span>
                        )}
                      </div>
                    </div>
                    {week.percent <= 20 && (
                      <span className="text-xs font-medium w-12 text-right">{week.percent}%</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Schedule */}
        <Card className="card-sketch">
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
            <CardDescription>Your class timetable</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockSchedule.map((item, index) => (
                <div key={index} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.subject}</span>
                      <span className="text-xs text-muted-foreground">• {item.teacher}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{item.day}</span>
                      <Clock className="h-3 w-3 ml-2" />
                      <span>{item.slot}</span>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-primary">{item.room}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
