import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface ConflictWarningProps {
  conflicts: Array<{
    room: string;
    slot: string;
    teacher: string;
  }>;
}

export function ConflictWarning({ conflicts }: ConflictWarningProps) {
  if (conflicts.length === 0) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="font-medium mb-2">Booking Conflict Detected</div>
        <div className="text-sm space-y-1">
          {conflicts.map((conflict, i) => (
            <div key={i}>
              {conflict.room} - {conflict.slot} is already booked by {conflict.teacher}
            </div>
          ))}
        </div>
        <div className="text-xs mt-2 opacity-80">
          Your booking will be submitted for SPOC approval.
        </div>
      </AlertDescription>
    </Alert>
  );
}
