import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ConflictWarning } from '@/components/ConflictWarning';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { bookingSchema } from '@/lib/validations';

const TIME_SLOTS = [
  '9:00-10:30',
  '10:30-12:00',
  '12:00-13:30',
  '14:00-15:30',
  '15:30-17:00',
];

export default function BookRoom() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<any[]>([]);
  const [date, setDate] = useState<Date>();
  const [slot, setSlot] = useState('');
  const [roomId, setRoomId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [conflicts, setConflicts] = useState<any[]>([]);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('is_active', true)
      .order('building', { ascending: true })
      .order('room_no', { ascending: true });

    if (error) {
      toast.error('Failed to load rooms');
      return;
    }
    setRooms(data || []);
  };

  const checkConflicts = async () => {
    if (!date || !slot || !roomId) {
      setConflicts([]);
      return;
    }

    const formattedDate = format(date, 'yyyy-MM-dd');

    const { data } = await supabase
      .from('bookings')
      .select('*, rooms(*), profiles!bookings_teacher_id_fkey(name)')
      .eq('room_id', roomId)
      .eq('date', formattedDate)
      .eq('slot', slot);

    const conflictList = (data || []).map(b => ({
      room: `${b.rooms.building} ${b.rooms.room_no}`,
      slot: b.slot,
      teacher: b.profiles?.name || 'Unknown'
    }));

    setConflicts(conflictList);
  };

  useEffect(() => {
    if (date && slot && roomId) {
      checkConflicts();
    }
  }, [date, slot, roomId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date) {
      toast.error('Please select a date');
      return;
    }

    const formattedDate = format(date, 'yyyy-MM-dd');

    // Validate input
    const validation = bookingSchema.safeParse({
      roomId,
      date: formattedDate,
      slot,
      remarks,
    });

    if (!validation.success) {
      const errors = validation.error.errors.map(e => e.message).join(', ');
      toast.error(errors);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('bookings').insert({
        teacher_id: user?.id,
        room_id: roomId,
        date: formattedDate,
        slot,
        remarks,
        status: 'PENDING',
      });

      if (error) throw error;

      toast.success('Booking request submitted successfully');
      // Reset form
      setDate(undefined);
      setSlot('');
      setRoomId('');
      setRemarks('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold">Book a Room</h2>
          <p className="text-muted-foreground">Request a classroom for your session</p>
        </div>

        <Card className="max-w-2xl card-sketch">
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
            <CardDescription>Fill in the details for your classroom booking</CardDescription>
          </CardHeader>
          <CardContent>
            <ConflictWarning conflicts={conflicts} />
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="room">Select Room</Label>
                <Select value={roomId} onValueChange={setRoomId} required>
                  <SelectTrigger className="transition-all">
                    <SelectValue placeholder="Choose a room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.building} {room.room_no} - {room.type.replace('_', ' ')} (Cap: {room.capacity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slot">Time Slot</Label>
                  <Select value={slot} onValueChange={setSlot} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks (Optional)</Label>
                <Textarea
                  id="remarks"
                  placeholder="Any special requirements..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  className="transition-all resize-none"
                />
              </div>

              <Button type="submit" className="w-full btn-hover-lift" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Booking Request'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
