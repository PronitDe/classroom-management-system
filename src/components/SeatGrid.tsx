interface SeatGridProps {
  capacity: number;
  totalStudents: number;
  presentStudents: number;
}

export function SeatGrid({ capacity, totalStudents, presentStudents }: SeatGridProps) {
  const absentStudents = totalStudents - presentStudents;
  const emptySeats = capacity - totalStudents;

  // Calculate grid layout (approximately square)
  const cols = Math.ceil(Math.sqrt(capacity));
  const rows = Math.ceil(capacity / cols);

  // Generate seat arrangement
  const seats = [];
  for (let i = 0; i < capacity; i++) {
    if (i < presentStudents) {
      seats.push('present');
    } else if (i < totalStudents) {
      seats.push('absent');
    } else {
      seats.push('empty');
    }
  }

  const getSeatColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-500';
      case 'absent':
        return 'bg-red-500';
      case 'empty':
        return 'bg-muted/30';
      default:
        return 'bg-muted/30';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded" />
          <span>Present ({presentStudents})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded" />
          <span>Absent ({absentStudents})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-muted/30 rounded border border-border" />
          <span>Empty ({emptySeats})</span>
        </div>
      </div>

      <div
        className="grid gap-2 p-4 bg-muted/10 rounded-lg overflow-x-auto"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        }}
      >
        {seats.map((status, index) => (
          <div
            key={index}
            className={`w-8 h-8 rounded ${getSeatColor(status)} transition-all hover:scale-110 border border-border/50`}
            title={`Seat ${index + 1}: ${status}`}
          />
        ))}
      </div>
    </div>
  );
}
