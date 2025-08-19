import { useClock } from "@/hooks/use-clock";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function CurrentVisitCard() {
  const { currentVisit, currentClient, visitDuration, isClocked } = useClock();

  if (!isClocked || !currentVisit || !currentClient) {
    return (
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <i className="fas fa-clock text-4xl text-gray-300 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-600 mb-2">No Active Visit</h3>
            <p className="text-sm text-gray-500">Tap the clock button to start a visit</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4 border-secondary/20">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Current Visit</h2>
          <span className="text-xs text-white bg-secondary px-2 py-1 rounded-full">Active</span>
        </div>
        
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
            <i className="fas fa-user text-gray-500"></i>
          </div>
          <div>
            <h3 className="font-medium">{currentClient.name}</h3>
            <p className="text-sm text-gray-600">{currentClient.address}</p>
            <p className="text-xs text-gray-500">
              Started: {format(new Date(currentVisit.startTime), "h:mm a")}
            </p>
          </div>
        </div>
        
        {/* Time Display */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-primary">{visitDuration}</div>
            <div className="text-xs text-gray-600">Time on this visit</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="border-red-200 text-red-700 hover:bg-red-50"
          >
            <i className="fas fa-stop-circle mr-2"></i>Clock Out
          </Button>
          <Button 
            variant="outline" 
            className="border-blue-200 text-primary hover:bg-blue-50"
          >
            <i className="fas fa-edit mr-2"></i>Add Note
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
