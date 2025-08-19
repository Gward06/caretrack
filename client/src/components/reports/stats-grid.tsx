import { Card, CardContent } from "@/components/ui/card";

interface StatsGridProps {
  totalHours: number;
  totalVisits: number;
  clientsServed: number;
  avgVisitTime: number;
}

export default function StatsGrid({ totalHours, totalVisits, clientsServed, avgVisitTime }: StatsGridProps) {
  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <h2 className="font-semibold text-lg mb-3">Summary</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-primary">{totalHours.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Total Hours</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-secondary">{totalVisits}</div>
            <div className="text-sm text-gray-600">Total Visits</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-accent">{formatHours(avgVisitTime)}</div>
            <div className="text-sm text-gray-600">Avg Visit</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{clientsServed}</div>
            <div className="text-sm text-gray-600">Clients Served</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
