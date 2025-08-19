import { useQuery } from "@tanstack/react-query";
import { Visit, Client, Schedule } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useClock } from "@/hooks/use-clock";
import CurrentVisitCard from "@/components/clock/current-visit-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, isToday, isTomorrow } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  const { visitDuration } = useClock();

  const { data: visits = [] } = useQuery<Visit[]>({
    queryKey: ["/api/visits", "caregiverId", user?.id],
    enabled: !!user?.id,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients", "caregiverId", user?.id],
    enabled: !!user?.id,
  });

  const { data: schedules = [] } = useQuery<Schedule[]>({
    queryKey: ["/api/schedules", "caregiverId", user?.id],
    enabled: !!user?.id,
  });

  // Calculate week stats
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const thisWeekVisits = visits.filter(visit => {
    const visitDate = new Date(visit.startTime);
    return visitDate >= weekStart && visit.status === "completed";
  });

  const weekStats = {
    hoursWorked: thisWeekVisits.reduce((sum, visit) => sum + (visit.duration || 0), 0) / 60,
    visitsCompleted: thisWeekVisits.length,
    clientsServed: new Set(thisWeekVisits.map(visit => visit.clientId)).size,
  };

  // Get today's and upcoming schedules
  const todaySchedules = schedules.filter(schedule => 
    isToday(new Date(schedule.scheduledDate))
  ).slice(0, 3);

  const getClientName = (clientId: string) => {
    return clients.find(client => client.id === clientId)?.name || "Unknown Client";
  };

  const getScheduleStatus = (schedule: Schedule) => {
    const now = new Date();
    const startTime = new Date(schedule.startTime);
    const endTime = new Date(schedule.endTime);
    
    if (now < startTime) return { label: "Upcoming", color: "bg-gray-400 text-white" };
    if (now >= startTime && now <= endTime) return { label: "In Progress", color: "bg-secondary text-white" };
    return { label: "Completed", color: "bg-blue-500 text-white" };
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
  };

  return (
    <div className="p-4">
      {/* Current Visit Card */}
      <CurrentVisitCard />

      {/* Today's Schedule */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <h2 className="font-semibold text-lg mb-3">Today's Schedule</h2>
          
          {todaySchedules.length === 0 ? (
            <div className="text-center py-6">
              <i className="fas fa-calendar text-3xl text-gray-300 mb-3"></i>
              <p className="text-gray-600">No scheduled visits today</p>
              <p className="text-sm text-gray-500">Enjoy your day off!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaySchedules.map((schedule) => {
                const status = getScheduleStatus(schedule);
                return (
                  <div 
                    key={schedule.id} 
                    className={`flex items-center p-3 rounded-lg border-l-4 ${
                      status.label === "In Progress" 
                        ? "bg-secondary/5 border-secondary" 
                        : "bg-gray-50 border-gray-300"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{getClientName(schedule.clientId)}</h3>
                        <Badge className={status.color}>
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {format(new Date(schedule.startTime), "h:mm a")} - {format(new Date(schedule.endTime), "h:mm a")}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {schedule.serviceType.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold text-lg mb-3">This Week</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-primary">{weekStats.hoursWorked.toFixed(1)}</div>
              <div className="text-xs text-gray-600">Hours</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-secondary">{weekStats.visitsCompleted}</div>
              <div className="text-xs text-gray-600">Visits</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-accent">{weekStats.clientsServed}</div>
              <div className="text-xs text-gray-600">Clients</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
