import { Client } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Visit } from "@shared/schema";
import { format } from "date-fns";

interface ClientCardProps {
  client: Client;
}

export default function ClientCard({ client }: ClientCardProps) {
  const { data: visits = [] } = useQuery<Visit[]>({
    queryKey: ["/api/visits", "clientId", client.id],
  });

  const lastVisit = visits.find(visit => visit.status === "completed");
  const currentVisit = visits.find(visit => visit.status === "in_progress");

  const getLastVisitText = () => {
    if (currentVisit) return "Currently in progress";
    if (lastVisit) return format(new Date(lastVisit.startTime), "MMM d, h:mm a");
    return "No visits yet";
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
            <i className="fas fa-user text-gray-500"></i>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-medium">{client.name}</h3>
              {currentVisit && (
                <Badge variant="secondary" className="bg-secondary/10 text-secondary">
                  Active
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">
              Age {client.age} • {client.medicalConditions?.join(", ")}
            </p>
            <p className="text-xs text-gray-500">{client.address}</p>
          </div>
          <button className="text-primary">
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Last visit:</span>
            <span className={currentVisit ? "text-secondary font-medium" : ""}>
              {getLastVisitText()}
            </span>
          </div>
          
          {client.medicalConditions && client.medicalConditions.length > 0 && (
            <div className="mt-2">
              <div className="flex flex-wrap gap-1">
                {client.medicalConditions.slice(0, 3).map((condition, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {condition}
                  </Badge>
                ))}
                {client.medicalConditions.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{client.medicalConditions.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
