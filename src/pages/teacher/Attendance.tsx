import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function Attendance() {
  const { user } = useAuth();
  const [approvedBookings, setApprovedBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [total, setTotal] = useState('');
  const [present, setPresent] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchApprovedBookings();
    }
  }, [user]);

  const fetchApprovedBookings = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, rooms(*)')
      .eq('teacher_id', user?.id)
      .eq('status', 'APPROVED')
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) {
      toast.error('Failed to load bookings');
      return;
    }

    // Filter out bookings that already have attendance
    const bookingsWithoutAttendance = [];
    for (const booking of data || []) {
      const { data: attendance } = await supabase
        .from('attendance')
        .select('id')
        .eq('booking_id', booking.id)
        .single();
      
      if (!attendance) {
        bookingsWithoutAttendance.push(booking);
      }
    }

    setApprovedBookings(bookingsWithoutAttendance);
  };

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('attendance').insert({
        booking_id: selectedBooking.id,
        teacher_id: user?.id,
        room_id: selectedBooking.room_id,
        date: selectedBooking.date,
        slot: selectedBooking.slot,
        total: parseInt(total),
        present: parseInt(present),
        remarks,
      });

      if (error) throw error;

      toast.success('Attendance marked successfully');
      setSelectedBooking(null);
      setTotal('');
      setPresent('');
      setRemarks('');
      fetchApprovedBookings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Mark Attendance</h2>
          <p className="text-muted-foreground">Record attendance for your approved classes</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Approved Classes</CardTitle>
              <CardDescription>Select a class to mark attendance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {approvedBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No approved classes available</p>
              ) : (
                approvedBookings.map((booking) => (
                  <Button
                    key={booking.id}
                    variant={selectedBooking?.id === booking.id ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <div className="flex flex-col items-start gap-1">
                      <div className="font-semibold">
                        {booking.rooms.building} {booking.rooms.room_no}
                      </div>
                      <div className="text-xs">
                        {new Date(booking.date).toLocaleDateString()} • {booking.slot}
                      </div>
                    </div>
                  </Button>
                ))
              )}
            </CardContent>
          </Card>

          {selectedBooking && (
            <Card>
              <CardHeader>
                <CardTitle>Attendance Form</CardTitle>
                <CardDescription>
                  {selectedBooking.rooms.building} {selectedBooking.rooms.room_no}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleMarkAttendance} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="total">Total Students</Label>
                    <Input
                      id="total"
                      type="number"
                      min="1"
                      max={selectedBooking.rooms.capacity}
                      value={total}
                      onChange={(e) => setTotal(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="present">Present</Label>
                    <Input
                      id="present"
                      type="number"
                      min="0"
                      max={total || selectedBooking.rooms.capacity}
                      value={present}
                      onChange={(e) => setPresent(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="remarks">Remarks (Optional)</Label>
                    <Textarea
                      id="remarks"
                      placeholder="Any notes..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Attendance'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
