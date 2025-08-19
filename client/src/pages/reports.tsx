import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import StatsGrid from "@/components/reports/stats-grid";
import { format, subDays, subMonths } from "date-fns";

type ReportPeriod = "week" | "month" | "custom";

export default function Reports() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>("week");

  const getDateRange = () => {
    const endDate = new Date();
    let startDate: Date;

    switch (selectedPeriod) {
      case "week":
        startDate = subDays(endDate, 7);
        break;
      case "month":
        startDate = subMonths(endDate, 1);
        break;
      default:
        startDate = subDays(endDate, 7);
    }

    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();

  const { data: reportData, isLoading } = useQuery({
    queryKey: ["/api/reports/summary", user?.id, selectedPeriod],
    queryParams: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    enabled: !!user?.id,
  });

  const handleExportPDF = () => {
    // In a real app, this would generate and download a PDF
    alert("PDF export functionality would be implemented here");
  };

  const handleExportCSV = () => {
    // In a real app, this would generate and download a CSV
    alert("CSV export functionality would be implemented here");
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Date Range Selector */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <h2 className="font-semibold text-lg mb-3">Time Period</h2>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={selectedPeriod === "week" ? "default" : "outline"}
              onClick={() => setSelectedPeriod("week")}
              size="sm"
            >
              This Week
            </Button>
            <Button
              variant={selectedPeriod === "month" ? "default" : "outline"}
              onClick={() => setSelectedPeriod("month")}
              size="sm"
            >
              This Month
            </Button>
            <Button
              variant={selectedPeriod === "custom" ? "default" : "outline"}
              onClick={() => setSelectedPeriod("custom")}
              size="sm"
            >
              Custom
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {reportData && (
        <StatsGrid
          totalHours={reportData.totalHours}
          totalVisits={reportData.totalVisits}
          clientsServed={reportData.clientsServed}
          avgVisitTime={reportData.avgVisitTime}
        />
      )}

      {/* Daily Breakdown */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <h2 className="font-semibold text-lg mb-3">Daily Breakdown</h2>
          
          {reportData?.dailyBreakdown && Object.keys(reportData.dailyBreakdown).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(reportData.dailyBreakdown).map(([date, data]) => (
                <div key={date} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div>
                    <div className="font-medium">
                      {format(new Date(date), "EEEE, MMM d")}
                    </div>
                    <div className="text-sm text-gray-600">{data.visits} visits</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{data.hours.toFixed(1)}h</div>
                    <div className="text-xs text-gray-500">
                      ${(data.hours * 30).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <i className="fas fa-chart-line text-3xl text-gray-300 mb-3"></i>
              <p className="text-gray-600">No data for this period</p>
              <p className="text-sm text-gray-500">Complete some visits to see your breakdown</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold text-lg mb-3">Export Report</h2>
          <div className="space-y-2">
            <Button
              onClick={handleExportPDF}
              className="w-full bg-primary hover:bg-blue-700"
            >
              <i className="fas fa-file-pdf mr-2"></i>
              Export as PDF
            </Button>
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="w-full"
            >
              <i className="fas fa-file-csv mr-2"></i>
              Export as CSV
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
