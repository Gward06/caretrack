import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock, MapPin, Lightbulb, Heart, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

function tipCard(tip: string) {
  return (
    <Card className="border-purple-500/30 bg-purple-500/5 mb-4">
      <CardContent className="pt-4 flex gap-3">
        <Lightbulb className="text-purple-400 mt-0.5 shrink-0" size={18} />
        <p className="text-sm text-purple-200">{tip}</p>
      </CardContent>
    </Card>
  );
}

function VisitCard({ visit }: { visit: any }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);

  const approve = useMutation({
    mutationFn: (approved: boolean) =>
      fetch(`/api/family/visits/${visit.id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["family-visits"] }),
  });

  const completedTasks = visit.tasks?.filter((t: any) => t.completed).length || 0;
  const totalTasks = visit.tasks?.length || 0;
  const completionPct = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <Card className="mb-3 border-slate-700/50">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-medium text-sm">{format(new Date(visit.startTime), "EEE MMM d, h:mm a")}</div>
            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <Clock size={11} /> {visit.duration ? `${visit.duration} min` : "In progress"}
              {visit.gpsLat && <><MapPin size={11} className="ml-1" /> GPS verified</>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {visit.familyApproved === true && <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Approved</Badge>}
            {visit.familyApproved === false && <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Disputed</Badge>}
            {visit.familyApproved === null && visit.status === "completed" && (
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="h-7 text-xs border-green-500/40 text-green-400 hover:bg-green-500/10"
                  onClick={() => approve.mutate(true)}>
                  <CheckCircle size={12} className="mr-1" /> Approve
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs border-red-500/40 text-red-400 hover:bg-red-500/10"
                  onClick={() => approve.mutate(false)}>
                  <XCircle size={12} className="mr-1" /> Dispute
                </Button>
              </div>
            )}
          </div>
        </div>

        {totalTasks > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400">Tasks completed</span>
              <span className="text-slate-300">{completedTasks}/{totalTasks}</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full">
              <div className="h-1.5 bg-emerald-500 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
            </div>
          </div>
        )}

        <button onClick={() => setExpanded(!expanded)}
          className="mt-3 text-xs text-slate-400 flex items-center gap-1 hover:text-slate-200 transition-colors">
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? "Hide" : "Show"} details
        </button>

        {expanded && visit.tasks?.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {visit.tasks.map((task: any) => (
              <div key={task.id} className="flex items-start gap-2 text-xs">
                {task.completed
                  ? <CheckCircle size={13} className="text-emerald-400 mt-0.5 shrink-0" />
                  : <div className="w-3 h-3 rounded-full border border-slate-600 mt-0.5 shrink-0" />}
                <div>
                  <span className={task.completed ? "text-slate-400 line-through" : "text-slate-200"}>{task.title}</span>
                  {task.notes && <div className="text-slate-500 mt-0.5">{task.notes}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function FamilyPortal() {
  const { data: myClients = [] } = useQuery<any[]>({
    queryKey: ["family-clients"],
    queryFn: () => fetch("/api/family/clients").then(r => r.json()),
  });

  const [selectedClient, setSelectedClient] = useState<any>(null);
  const client = selectedClient || myClients[0];

  const { data: visits = [] } = useQuery<any[]>({
    queryKey: ["family-visits", client?.id],
    queryFn: () => fetch(`/api/family/clients/${client.id}/visits`).then(r => r.json()),
    enabled: !!client?.id,
  });

  const { data: notes = [] } = useQuery<any[]>({
    queryKey: ["family-notes", client?.id],
    queryFn: () => fetch(`/api/family/clients/${client.id}/notes`).then(r => r.json()),
    enabled: !!client?.id,
  });

  const { data: carePlan } = useQuery<any>({
    queryKey: ["care-plan", client?.id],
    queryFn: () => fetch(`/api/clients/${client.id}/care-plan`).then(r => r.json()),
    enabled: !!client?.id,
  });

  const { data: tipData } = useQuery<{ tip: string }>({
    queryKey: ["daily-tip", client?.id],
    queryFn: () => fetch(`/api/clients/${client.id}/daily-tip`).then(r => r.json()),
    enabled: !!client?.id,
    staleTime: 24 * 60 * 60 * 1000,
  });

  if (!myClients.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-6">
        <Heart className="text-purple-400 mb-3" size={40} />
        <h2 className="font-semibold text-lg mb-1">No clients linked yet</h2>
        <p className="text-sm text-slate-400">Ask your agency or caregiver to link your account to a client profile.</p>
      </div>
    );
  }

  return (
    <div className="pb-24 px-4 pt-4">
      {/* Client selector */}
      {myClients.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {myClients.map((c: any) => (
            <button key={c.id} onClick={() => setSelectedClient(c)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                (selectedClient?.id || myClients[0]?.id) === c.id
                  ? "bg-purple-500 border-purple-500 text-white"
                  : "border-slate-700 text-slate-400 hover:border-slate-500"
              }`}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Daily tip */}
      {tipData?.tip && tipCard(tipData.tip)}

      {/* Client info */}
      {client && (
        <Card className="mb-4 border-slate-700/50">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold">{client.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">{client.age ? `Age ${client.age}` : ""}</div>
              </div>
            </div>
            {client.medicalConditions?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {client.medicalConditions.map((c: string) => (
                  <Badge key={c} variant="outline" className="text-xs border-slate-600 text-slate-300">{c}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="visits">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="visits" className="flex-1">Visits</TabsTrigger>
          <TabsTrigger value="notes" className="flex-1">Notes</TabsTrigger>
          <TabsTrigger value="care-plan" className="flex-1">Care Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="visits">
          {visits.length === 0
            ? <p className="text-sm text-slate-400 text-center py-8">No visits recorded yet.</p>
            : visits.map((v: any) => <VisitCard key={v.id} visit={v} />)
          }
        </TabsContent>

        <TabsContent value="notes">
          {notes.length === 0
            ? <p className="text-sm text-slate-400 text-center py-8">No notes recorded yet.</p>
            : notes.map((n: any) => (
              <Card key={n.id} className="mb-3 border-slate-700/50">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{n.title}</span>
                    <Badge variant="outline" className="text-xs capitalize border-slate-600 text-slate-400">{n.category}</Badge>
                  </div>
                  <p className="text-sm text-slate-300">{n.content}</p>
                  <p className="text-xs text-slate-500 mt-2">{format(new Date(n.timestamp), "MMM d, h:mm a")}</p>
                </CardContent>
              </Card>
            ))
          }
        </TabsContent>

        <TabsContent value="care-plan">
          {!carePlan
            ? <p className="text-sm text-slate-400 text-center py-8">Generating care plan…</p>
            : (
              <div className="space-y-4">
                <Card className="border-slate-700/50">
                  <CardHeader><CardTitle className="text-base">Overview</CardTitle></CardHeader>
                  <CardContent><p className="text-sm text-slate-300">{carePlan.summary}</p></CardContent>
                </Card>
                {carePlan.goals?.length > 0 && (
                  <Card className="border-slate-700/50">
                    <CardHeader><CardTitle className="text-base">Care Goals</CardTitle></CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {carePlan.goals.map((g: string, i: number) => (
                          <li key={i} className="flex gap-2 text-sm text-slate-300">
                            <CheckCircle size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                            {g}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
                {carePlan.resources?.length > 0 && (
                  <Card className="border-slate-700/50">
                    <CardHeader><CardTitle className="text-base">Resources</CardTitle></CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {carePlan.resources.map((r: string, i: number) => (
                          <li key={i} className="text-sm text-slate-300 flex gap-2">
                            <span className="text-purple-400">→</span> {r}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )
          }
        </TabsContent>
      </Tabs>
    </div>
  );
}
