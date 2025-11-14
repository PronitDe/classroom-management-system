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

      <div className="bg-card border rounded-lg overflow-hidden h-[600px]">
        <AttendanceRollCall attendance={attendance} onToggle={toggleAttendance} />
      </div>
    </div>
  );
}
