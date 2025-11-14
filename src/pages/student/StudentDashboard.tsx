import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';

export default function StudentDashboard() {
  const mockSchedule = [
    { day: 'Monday', slot: '9:00-10:30', subject: 'Data Structures', room: 'AU6 101', teacher: 'Dr. Kumar' },
    { day: 'Monday', slot: '10:30-12:00', subject: 'Algorithms', room: 'AU5 201', teacher: 'Prof. Sharma' },
    { day: 'Tuesday', slot: '9:00-10:30', subject: 'DBMS', room: 'AU7 102', teacher: 'Dr. Verma' },
    { day: 'Wednesday', slot: '14:00-15:30', subject: 'Web Development', room: 'AU6 201', teacher: 'Prof. Singh' },
    { day: 'Thursday', slot: '10:30-12:00', subject: 'OS Concepts', room: 'AU5 103', teacher: 'Dr. Patel' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Student Dashboard</h2>
          <p className="text-muted-foreground">Your class schedule and attendance overview</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Overall Attendance</CardTitle>
              <CardDescription>This semester</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">86%</div>
              <p className="text-sm text-muted-foreground mt-2">42 out of 49 classes attended</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next Class</CardTitle>
              <CardDescription>Upcoming session</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Data Structures</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Tomorrow, 9:00-10:30 • AU6 101</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
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
