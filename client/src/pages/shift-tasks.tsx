import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Sparkles, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const CATEGORY_COLORS: Record<string, string> = {
  personal_care: "text-blue-400 border-blue-500/30",
  exercise: "text-green-400 border-green-500/30",
  medication: "text-red-400 border-red-500/30",
  meal: "text-amber-400 border-amber-500/30",
  cognitive: "text-purple-400 border-purple-500/30",
  social: "text-pink-400 border-pink-500/30",
  safety: "text-orange-400 border-orange-500/30",
  housekeeping: "text-slate-400 border-slate-500/30",
};

export default function ShiftTasks() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: currentVisit } = useQuery<any>({
    queryKey: ["current-visit", user?.id],
    queryFn: () => fetch(`/api/visits/current/${user!.id}`).then(r => r.json()),
    enabled: !!user?.id,
  });

  const visitId = currentVisit?.id;

  const { data: tasks = [], isLoading } = useQuery<any[]>({
    queryKey: ["visit-tasks", visitId],
    queryFn: () => fetch(`/api/visits/${visitId}/tasks`).then(r => r.json()),
    enabled: !!visitId,
  });

  const generateTasks = useMutation({
    mutationFn: () =>
      fetch(`/api/visits/${visitId}/tasks/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shiftDurationMinutes: 240 }),
      }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visit-tasks", visitId] }),
  });

  const toggleTask = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      fetch(`/api/visit-tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visit-tasks", visitId] }),
  });

  const completed = tasks.filter(t => t.completed).length;
  const total = tasks.length;
  const pct = total ? Math.round((completed / total) * 100) : 0;

  if (!currentVisit) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-6">
        <Clock className="text-slate-500 mb-3" size={40} />
        <h2 className="font-semibold text-lg mb-1">No active visit</h2>
        <p className="text-sm text-slate-400">Clock in to a visit first to see your shift tasks.</p>
      </div>
    );
  }

  return (
    <div className="pb-24 px-4 pt-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold">Shift Tasks</h2>
          <p className="text-xs text-slate-400">Active visit • {total} tasks</p>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 border-purple-500/40 text-purple-400 hover:bg-purple-500/10"
          onClick={() => generateTasks.mutate()} disabled={generateTasks.isPending}>
          <Sparkles size={13} />
          {generateTasks.isPending ? "Generating…" : "AI Generate"}
        </Button>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <Card className="mb-4 border-slate-700/50">
          <CardContent className="pt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-300">{completed} of {total} complete</span>
              <span className="font-semibold text-emerald-400">{pct}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full">
              <div className="h-2 bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }} />
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-800/50 rounded-lg animate-pulse" />)}
        </div>
      )}

      {!isLoading && tasks.length === 0 && (
        <div className="text-center py-10">
          <Sparkles className="mx-auto text-slate-600 mb-3" size={32} />
          <p className="text-sm text-slate-400 mb-3">No tasks yet for this shift.</p>
          <Button onClick={() => generateTasks.mutate()} disabled={generateTasks.isPending}
            className="bg-purple-600 hover:bg-purple-500 gap-2">
            <Sparkles size={14} />
            {generateTasks.isPending ? "Generating AI tasks…" : "Generate tasks with AI"}
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {tasks.map((task: any) => (
          <button key={task.id} className="w-full text-left"
            onClick={() => toggleTask.mutate({ id: task.id, completed: !task.completed })}>
            <Card className={`border transition-all ${task.completed ? "border-emerald-500/30 bg-emerald-500/5" : "border-slate-700/50 hover:border-slate-600"}`}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-start gap-3">
                  {task.completed
                    ? <CheckCircle size={18} className="text-emerald-400 mt-0.5 shrink-0" />
                    : <Circle size={18} className="text-slate-600 mt-0.5 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${task.completed ? "line-through text-slate-500" : "text-slate-100"}`}>
                      {task.title}
                    </div>
                    {task.notes && (
                      <div className="text-xs text-slate-500 mt-0.5 truncate">{task.notes}</div>
                    )}
                  </div>
                  <Badge variant="outline"
                    className={`text-xs capitalize shrink-0 ${CATEGORY_COLORS[task.category] || "text-slate-400 border-slate-600"}`}>
                    {task.category.replace("_", " ")}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
