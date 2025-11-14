import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ConflictWarning } from '@/components/ConflictWarning';

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
  const [date, setDate] = useState('');
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

    const { data } = await supabase
      .from('bookings')
      .select('*, rooms(*), profiles!bookings_teacher_id_fkey(name)')
      .eq('room_id', roomId)
      .eq('date', date)
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
    setLoading(true);

    try {
      const { error } = await supabase.from('bookings').insert({
        teacher_id: user?.id,
        room_id: roomId,
        date,
        slot,
        remarks,
        status: 'PENDING',
      });

      if (error) throw error;

      toast.success('Booking request submitted successfully');
      // Reset form
      setDate('');
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
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="transition-all"
                  />
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
