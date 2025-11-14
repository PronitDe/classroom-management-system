import { useState } from 'react';
import { DEMO_STUDENTS } from '@/data/demoStudents';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { AttendanceRollCall } from './AttendanceRollCall';

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
      <div className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg border">
        <Info className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Click seats or names to toggle attendance. Both views sync in real-time.
        </p>
      </div>

      <div className="grid lg:grid-cols-[350px_1fr] gap-4">
        {/* Left: Roll Call Panel */}
        <div className="bg-card border rounded-lg overflow-hidden h-[600px]">
          <AttendanceRollCall attendance={attendance} onToggle={toggleAttendance} />
        </div>

        {/* Right: Seat Grid */}
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-primary rounded" />
              <span>Present ({presentCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-destructive rounded" />
              <span>Absent ({absentCount})</span>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 p-4 bg-muted/10 rounded-lg border">
            {DEMO_STUDENTS.map((student) => (
              <button
                key={student.id}
                onClick={() => toggleAttendance(student.id)}
                className={`
                  relative aspect-square rounded-lg border-2 transition-all hover:scale-105
                  flex flex-col items-center justify-center p-2
                  ${attendance[student.id] 
                    ? 'bg-primary/20 border-primary hover:bg-primary/30' 
                    : 'bg-destructive/20 border-destructive hover:bg-destructive/30'}
                `}
                title={`${student.name}\n${student.roll}\nClick to toggle`}
              >
                <span className="text-xs font-bold">{student.initials}</span>
                <span className="text-[10px] text-muted-foreground mt-1">{student.id}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
