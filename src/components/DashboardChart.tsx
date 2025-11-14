import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ChartDataPoint {
  label: string;
  value: number;
}

interface DashboardChartProps {
  title: string;
  description?: string;
  data: ChartDataPoint[];
  trend?: 'up' | 'down';
  trendValue?: string;
}

export function DashboardChart({ title, description, data, trend, trendValue }: DashboardChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-primary' : 'text-destructive'}`}>
              {trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {trendValue}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((point, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{point.label}</span>
                <span className="font-medium">{point.value}</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(point.value / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
