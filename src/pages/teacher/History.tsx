import { getStatusBadgeVariant } from '@/lib/badgeHelpers';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function History() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    const [bookingsData, attendanceData] = await Promise.all([
      supabase
        .from('bookings')
        .select('*, rooms(*)')
        .eq('teacher_id', user?.id)
        .order('date', { ascending: false }),
      supabase
        .from('attendance')
        .select('*, rooms(*)')
        .eq('teacher_id', user?.id)
        .order('date', { ascending: false }),
    ]);

    if (bookingsData.error) toast.error('Failed to load bookings');
    if (attendanceData.error) toast.error('Failed to load attendance');

    setBookings(bookingsData.data || []);
    setAttendanceRecords(attendanceData.data || []);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold">History</h2>
          <p className="text-muted-foreground">View your booking and attendance history</p>
        </div>

        <Card className="card-sketch">
          <CardHeader>
            <CardTitle>Booking History</CardTitle>
            <CardDescription>All your classroom booking requests</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table className="responsive-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead className="hidden sm:table-cell">Time Slot</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No booking history
                    </TableCell>
                  </TableRow>
                ) : (
                  bookings.map((booking) => (
                    <TableRow key={booking.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">{new Date(booking.date).toLocaleDateString()}</TableCell>
                      <TableCell>{booking.rooms.building} {booking.rooms.room_no}</TableCell>
                      <TableCell className="hidden sm:table-cell">{booking.slot}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(booking.status)}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{booking.remarks || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="card-sketch">
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
            <CardDescription>Your completed class sessions</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table className="responsive-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead className="hidden sm:table-cell">Time Slot</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead className="hidden md:table-cell">Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No attendance records
                    </TableCell>
                  </TableRow>
                ) : (
                  attendanceRecords.map((record) => (
                    <TableRow key={record.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell>{record.rooms.building} {record.rooms.room_no}</TableCell>
                      <TableCell className="hidden sm:table-cell">{record.slot}</TableCell>
                      <TableCell>
                        <span className="text-success font-medium">{record.present}</span>
                        <span className="text-muted-foreground">/{record.total}</span>
                        <span className="text-xs text-muted-foreground ml-1">
                          ({Math.round((record.present / record.total) * 100)}%)
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{record.remarks || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
