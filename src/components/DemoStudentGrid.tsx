import { useState } from 'react';
import { DEMO_STUDENTS } from '@/data/demoStudents';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';

interface DemoStudentGridProps {
  onAttendanceChange: (total: number, present: number) => void;
}

export function DemoStudentGrid({ onAttendanceChange }: DemoStudentGridProps) {
  const [attendance, setAttendance] = useState<Record<string, boolean>>(
    DEMO_STUDENTS.reduce((acc, student) => ({ ...acc, [student.id]: true }), {})
  );

  const toggleAttendance = (studentId: string) => {
    const newAttendance = { ...attendance, [studentId]: !attendance[studentId] };
    setAttendance(newAttendance);
    
    const present = Object.values(newAttendance).filter(Boolean).length;
    onAttendanceChange(DEMO_STUDENTS.length, present);
  };

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const absentCount = DEMO_STUDENTS.length - presentCount;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg border border-border">
        <Info className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Demo grid view for one class. Click seats to toggle attendance. Can be extended to all classes in Phase 3.
        </p>
      </div>

      <div className="flex items-center gap-4 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded" />
          <span>Present ({presentCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded" />
          <span>Absent ({absentCount})</span>
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 p-4 bg-muted/10 rounded-lg">
        {DEMO_STUDENTS.map((student) => (
          <button
            key={student.id}
            onClick={() => toggleAttendance(student.id)}
            className={`
              relative aspect-square rounded-lg border-2 transition-all hover:scale-105
              flex flex-col items-center justify-center p-2
              ${attendance[student.id] 
                ? 'bg-green-500/20 border-green-500 hover:bg-green-500/30' 
                : 'bg-red-500/20 border-red-500 hover:bg-red-500/30'}
            `}
            title={`${student.name}\n${student.roll}\nClick to toggle`}
          >
            <span className="text-xs font-bold">{student.initials}</span>
            <span className="text-[10px] text-muted-foreground mt-1">{student.id}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
        <span className="text-sm font-medium">Total Students: {DEMO_STUDENTS.length}</span>
        <Badge variant={presentCount === DEMO_STUDENTS.length ? "default" : "secondary"}>
          {presentCount} Present
        </Badge>
      </div>
    </div>
  );
}
