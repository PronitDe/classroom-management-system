import { useState, useMemo } from 'react';
import { DEMO_STUDENTS, DemoStudent } from '@/data/demoStudents';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AttendanceRollCallProps {
  attendance: Record<string, boolean>;
  onToggle: (studentId: string) => void;
}

export function AttendanceRollCall({ attendance, onToggle }: AttendanceRollCallProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return DEMO_STUDENTS;
    
    const query = searchQuery.toLowerCase();
    return DEMO_STUDENTS.filter(student =>
      student.name.toLowerCase().includes(query) ||
      student.roll.toLowerCase().includes(query) ||
      student.id.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const absentCount = DEMO_STUDENTS.length - presentCount;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold mb-3">Roll Call</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name or roll..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredStudents.map((student) => (
            <button
              key={student.id}
              onClick={() => onToggle(student.id)}
              className={`
                w-full p-3 rounded-lg border text-left transition-all
                ${attendance[student.id]
                  ? 'bg-primary/10 border-primary/50 hover:bg-primary/20'
                  : 'bg-destructive/10 border-destructive/50 hover:bg-destructive/20'
                }
              `}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{student.name}</div>
                  <div className="text-xs text-muted-foreground">{student.roll}</div>
                </div>
                <Badge 
                  variant={attendance[student.id] ? "default" : "destructive"}
                  className="shrink-0"
                >
                  {attendance[student.id] ? 'Present' : 'Absent'}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-muted/20">
        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          <div>
            <div className="font-bold text-lg">{DEMO_STUDENTS.length}</div>
            <div className="text-muted-foreground">Total</div>
          </div>
          <div>
            <div className="font-bold text-lg text-primary">{presentCount}</div>
            <div className="text-muted-foreground">Present</div>
          </div>
          <div>
            <div className="font-bold text-lg text-destructive">{absentCount}</div>
            <div className="text-muted-foreground">Absent</div>
          </div>
        </div>
      </div>
    </div>
  );
}
