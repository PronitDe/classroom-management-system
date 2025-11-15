import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Booking {
  id: string;
  date: string;
  slot: string;
  status: string;
  rooms: {
    building: string;
    room_no: string;
  };
  profiles?: {
    name: string;
  };
}

export function BookingCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedBookings, setSelectedBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, [currentMonth]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('bookings')
        .select('*, rooms(*), profiles(*)')
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking =>
      isSameDay(new Date(booking.date), date)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-primary';
      case 'PENDING': return 'bg-warning';
      case 'REJECTED': return 'bg-destructive';
      case 'COMPLETED': return 'bg-muted';
      default: return 'bg-secondary';
    }
  };

  const handleDateClick = (date: Date) => {
    const dayBookings = getBookingsForDate(date);
    if (dayBookings.length > 0) {
      setSelectedDate(date);
      setSelectedBookings(dayBookings);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Booking Calendar
              </CardTitle>
              <CardDescription>View bookings by date</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium min-w-[140px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
                {day}
              </div>
            ))}

            {/* Empty cells for days before month starts */}
            {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square p-2" />
            ))}

            {days.map(day => {
              const dayBookings = getBookingsForDate(day);
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDateClick(day)}
                  disabled={dayBookings.length === 0}
                  className={`
                    aspect-square p-2 rounded-lg border transition-all
                    ${!isSameMonth(day, currentMonth) ? 'opacity-50' : ''}
                    ${isToday ? 'border-primary bg-primary/10' : 'border-border'}
                    ${dayBookings.length > 0 ? 'hover:bg-muted cursor-pointer' : 'cursor-default'}
                  `}
                >
                  <div className="text-sm font-medium">{format(day, 'd')}</div>
                  {dayBookings.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mt-1">
                      {dayBookings.slice(0, 3).map((booking, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${getStatusColor(booking.status)}`}
                        />
                      ))}
                      {dayBookings.length > 3 && (
                        <div className="text-[10px] text-muted-foreground">+{dayBookings.length - 3}</div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span>Approved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-warning" />
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span>Rejected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-muted" />
              <span>Completed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Bookings for {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {selectedBookings.map((booking) => (
              <div key={booking.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {booking.rooms.building} {booking.rooms.room_no}
                  </div>
                  <Badge variant={booking.status === 'APPROVED' ? 'default' : 'secondary'}>
                    {booking.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {booking.slot}
                </div>
                {booking.profiles && (
                  <div className="text-sm">
                    Teacher: {booking.profiles.name}
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
