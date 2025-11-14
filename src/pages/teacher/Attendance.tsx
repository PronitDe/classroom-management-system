import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { SeatGrid } from '@/components/SeatGrid';
import { DemoStudentGrid } from '@/components/DemoStudentGrid';

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

  const handleMarkAttendance = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold">Mark Attendance</h2>
          <p className="text-muted-foreground">Record attendance for your approved classes</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="card-sketch">
            <CardHeader>
              <CardTitle>Approved Classes</CardTitle>
              <CardDescription>Select a class to mark attendance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
              {approvedBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No approved classes available</p>
              ) : (
                approvedBookings.map((booking) => (
                  <Button
                    key={booking.id}
                    variant={selectedBooking?.id === booking.id ? 'default' : 'outline'}
                    className="w-full justify-between h-auto py-3 px-4"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <div className="text-left">
                      <div className="font-medium">
                        {booking.rooms.building} {booking.rooms.room_no}
                      </div>
                      <div className="text-xs opacity-80 mt-1">
                        {new Date(booking.date).toLocaleDateString()} • {booking.slot}
                      </div>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {booking.rooms.capacity} seats
                    </Badge>
                  </Button>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="card-sketch">
            <CardHeader>
              <CardTitle>Attendance Form</CardTitle>
              <CardDescription>Enter attendance details</CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedBooking ? (
                <p className="text-sm text-muted-foreground py-4">Select a class from the list</p>
              ) : (
                <div>
                  <Tabs defaultValue="manual" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                      <TabsTrigger value="demo">Demo Grid View</TabsTrigger>
                    </TabsList>

                    <TabsContent value="manual" className="space-y-4">
                      <form onSubmit={handleMarkAttendance} className="space-y-4">
                        <div className="p-3 rounded-lg bg-muted/30 border">
                          <div className="text-sm font-medium">{selectedBooking.rooms.building} {selectedBooking.rooms.room_no}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(selectedBooking.date).toLocaleDateString()} • {selectedBooking.slot}
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="total">Total Students</Label>
                            <Input
                              id="total"
                              type="number"
                              min="1"
                              placeholder="e.g. 45"
                              value={total}
                              onChange={(e) => setTotal(e.target.value)}
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="present">Students Present</Label>
                            <Input
                              id="present"
                              type="number"
                              min="0"
                              placeholder="e.g. 42"
                              value={present}
                              onChange={(e) => setPresent(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="remarks">Remarks (Optional)</Label>
                          <Textarea
                            id="remarks"
                            placeholder="Any notes about the class..."
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            rows={3}
                          />
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? 'Saving...' : 'Mark Attendance'}
                        </Button>
                      </form>

                      {total && present && (
                        <div className="mt-6 pt-6 border-t">
                          <h3 className="text-sm font-medium mb-4">Seat Map Visualization</h3>
                          <SeatGrid
                            capacity={selectedBooking.rooms.capacity}
                            totalStudents={parseInt(total)}
                            presentStudents={parseInt(present)}
                          />
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="demo" className="space-y-4">
                      <div className="p-3 rounded-lg bg-muted/30 border">
                        <div className="text-sm font-medium">{selectedBooking.rooms.building} {selectedBooking.rooms.room_no}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(selectedBooking.date).toLocaleDateString()} • {selectedBooking.slot}
                        </div>
                      </div>

                      <DemoStudentGrid
                        onAttendanceChange={(totalStudents, presentStudents) => {
                          setTotal(totalStudents.toString());
                          setPresent(presentStudents.toString());
                        }}
                      />
                      
                      <div className="space-y-2">
                        <Label htmlFor="remarks-demo">Remarks (Optional)</Label>
                        <Textarea
                          id="remarks-demo"
                          placeholder="Any notes about the class..."
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <Button 
                        onClick={() => handleMarkAttendance()} 
                        className="w-full" 
                        disabled={loading || !total || !present}
                      >
                        {loading ? 'Saving...' : 'Mark Attendance'}
                      </Button>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
