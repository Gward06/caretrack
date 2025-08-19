import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Visit, Client } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";

export function useClock() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get current visit
  const { data: currentVisit, isLoading } = useQuery<Visit | null>({
    queryKey: ["/api/visits/current", user?.id],
    enabled: !!user?.id,
  });

  // Get current client info
  const { data: currentClient } = useQuery<Client | null>({
    queryKey: ["/api/clients", currentVisit?.clientId],
    enabled: !!currentVisit?.clientId,
  });

  // Clock in mutation
  const clockInMutation = useMutation({
    mutationFn: async (data: { clientId: string; location?: string }) => {
      const response = await apiRequest("POST", "/api/visits", {
        caregiverId: user?.id,
        clientId: data.clientId,
        startTime: new Date().toISOString(),
        status: "in_progress",
        location: data.location,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visits/current"] });
      toast({
        title: "Clocked In",
        description: "Your visit has started successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Clock In Failed",
        description: "Unable to start your visit. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Clock out mutation
  const clockOutMutation = useMutation({
    mutationFn: async (data: { notes?: string }) => {
      if (!currentVisit) throw new Error("No active visit");
      
      const response = await apiRequest("PATCH", `/api/visits/${currentVisit.id}`, {
        endTime: new Date().toISOString(),
        status: "completed",
        notes: data.notes,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visits/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/visits"] });
      toast({
        title: "Clocked Out",
        description: "Your visit has been completed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Clock Out Failed",
        description: "Unable to end your visit. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Calculate visit duration
  const getVisitDuration = () => {
    if (!currentVisit?.startTime) return "00:00:00";
    
    const start = new Date(currentVisit.startTime);
    const diff = currentTime.getTime() - start.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const clockIn = (clientId: string, location?: string) => {
    clockInMutation.mutate({ clientId, location });
  };

  const clockOut = (notes?: string) => {
    clockOutMutation.mutate({ notes });
  };

  return {
    currentVisit,
    currentClient,
    isClocked: !!currentVisit,
    visitDuration: getVisitDuration(),
    clockIn,
    clockOut,
    isLoading,
    isClockingIn: clockInMutation.isPending,
    isClockingOut: clockOutMutation.isPending,
  };
}
