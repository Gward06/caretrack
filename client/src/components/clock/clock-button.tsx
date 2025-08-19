import { useState } from "react";
import { useClock } from "@/hooks/use-clock";
import { useQuery } from "@tanstack/react-query";
import { Client } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function ClockButton() {
  const { user } = useAuth();
  const { isClocked, clockIn, clockOut, isClockingIn, isClockingOut } = useClock();
  const [showClockInDialog, setShowClockInDialog] = useState(false);
  const [showClockOutDialog, setShowClockOutDialog] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clockOutNotes, setClockOutNotes] = useState("");

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryParams: { caregiverId: user?.id },
    enabled: !!user?.id,
  });

  const handleClockButtonClick = () => {
    if (isClocked) {
      setShowClockOutDialog(true);
    } else {
      setShowClockInDialog(true);
    }
  };

  const handleClockIn = async () => {
    if (!selectedClientId) return;
    
    // Get current location if available
    let location = undefined;
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        location = `${position.coords.latitude},${position.coords.longitude}`;
      } catch (error) {
        console.warn("Location access denied or unavailable");
      }
    }

    clockIn(selectedClientId, location);
    setShowClockInDialog(false);
    setSelectedClientId("");
  };

  const handleClockOut = () => {
    clockOut(clockOutNotes);
    setShowClockOutDialog(false);
    setClockOutNotes("");
  };

  return (
    <>
      <button
        onClick={handleClockButtonClick}
        disabled={isClockingIn || isClockingOut}
        className={`rounded-full p-4 shadow-lg -mt-6 transition-all duration-200 ${
          isClocked 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-primary hover:bg-blue-700'
        } text-white disabled:opacity-50`}
      >
        <i className={`text-xl ${isClocked ? 'fas fa-stop' : 'fas fa-play'}`}></i>
      </button>

      {/* Clock In Dialog */}
      <Dialog open={showClockInDialog} onOpenChange={setShowClockInDialog}>
        <DialogContent className="w-[95%] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Clock In</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Client</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowClockInDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleClockIn}
                disabled={!selectedClientId || isClockingIn}
                className="flex-1"
              >
                {isClockingIn ? "Starting..." : "Start Visit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clock Out Dialog */}
      <Dialog open={showClockOutDialog} onOpenChange={setShowClockOutDialog}>
        <DialogContent className="w-[95%] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Clock Out</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Visit Summary (Optional)</Label>
              <Textarea
                value={clockOutNotes}
                onChange={(e) => setClockOutNotes(e.target.value)}
                placeholder="Brief summary of the visit..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowClockOutDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleClockOut}
                disabled={isClockingOut}
                className="flex-1 bg-red-500 hover:bg-red-600"
              >
                {isClockingOut ? "Ending..." : "End Visit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
