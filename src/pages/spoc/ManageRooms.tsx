import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function ManageRooms() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .order('building')
      .order('room_no');
    setRooms(data || []);
  };

  const toggleRoomStatus = async (roomId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('rooms')
      .update({ is_active: !currentStatus })
      .eq('id', roomId);

    if (error) {
      toast.error('Failed to update room status');
      return;
    }

    toast.success('Room status updated');
    fetchRooms();
  };

  const handleSaveRemarks = async () => {
    if (!editingRoom) return;

    const { error } = await supabase
      .from('rooms')
      .update({ remarks })
      .eq('id', editingRoom.id);

    if (error) {
      toast.error('Failed to save remarks');
      return;
    }

    toast.success('Remarks saved');
    setEditingRoom(null);
    fetchRooms();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Manage Rooms</h2>
          <p className="text-muted-foreground">Control room availability and maintenance</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Classrooms</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Building</TableHead>
                  <TableHead>Room No</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.building}</TableCell>
                    <TableCell>{room.room_no}</TableCell>
                    <TableCell className="capitalize">{room.type.replace('_', ' ').toLowerCase()}</TableCell>
                    <TableCell>{room.capacity}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={room.is_active}
                          onCheckedChange={() => toggleRoomStatus(room.id, room.is_active)}
                        />
                        <Badge variant={room.is_active ? 'default' : 'destructive'}>
                          {room.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{room.remarks || '-'}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingRoom(room);
                          setRemarks(room.remarks || '');
                        }}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={!!editingRoom} onOpenChange={(open) => !open && setEditingRoom(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Edit Room {editingRoom?.building} {editingRoom?.room_no}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Remarks / Maintenance Notes</Label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter maintenance notes or remarks..."
                  rows={4}
                />
              </div>
              <Button onClick={handleSaveRemarks} className="w-full">
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
