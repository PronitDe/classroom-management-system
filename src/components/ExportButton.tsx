import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportButtonProps {
  data: any[];
  filename: string;
  headers: string[];
  format?: 'csv' | 'pdf';
}

export function ExportButton({ data, filename, headers, format = 'csv' }: ExportButtonProps) {
  const { toast } = useToast();

  const exportToCSV = () => {
    if (data.length === 0) {
      toast({
        title: "No data to export",
        variant: "destructive",
      });
      return;
    }

    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header.toLowerCase().replace(/ /g, '_')];
          return typeof value === 'string' ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Export successful",
      description: `Downloaded ${filename}.csv`,
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={exportToCSV}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Export {format.toUpperCase()}
    </Button>
  );
}
