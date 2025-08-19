import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useClock } from "@/hooks/use-clock";
import { Client } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CARE_NOTE_CATEGORIES, CARE_NOTE_TEMPLATES } from "@/lib/constants";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface NoteFormProps {
  open: boolean;
  onClose: () => void;
}

export default function NoteForm({ open, onClose }: NoteFormProps) {
  const { user } = useAuth();
  const { currentVisit, currentClient } = useClock();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    clientId: currentClient?.id || "",
    category: "",
    title: "",
    content: "",
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryParams: { caregiverId: user?.id },
    enabled: !!user?.id && !currentClient,
  });

  const createNoteMutation = useMutation({
    mutationFn: async (noteData: any) => {
      const response = await apiRequest("POST", "/api/care-notes", {
        ...noteData,
        caregiverId: user?.id,
        visitId: currentVisit?.id,
        timestamp: new Date().toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/care-notes"] });
      toast({
        title: "Note Created",
        description: "Your care note has been saved successfully.",
      });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create note. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setFormData({
      clientId: currentClient?.id || "",
      category: "",
      title: "",
      content: "",
    });
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || !formData.category || !formData.title || !formData.content) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createNoteMutation.mutate(formData);
  };

  const handleTemplateSelect = (template: string) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content ? `${prev.content}\n${template}` : template
    }));
  };

  const getCategoryTemplates = () => {
    if (!formData.category) return [];
    return CARE_NOTE_TEMPLATES[formData.category as keyof typeof CARE_NOTE_TEMPLATES] || [];
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95%] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Care Note</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Selection */}
          {!currentClient && (
            <div>
              <Label>Client *</Label>
              <Select 
                value={formData.clientId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client..." />
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
          )}

          {/* Category Selection */}
          <div>
            <Label>Category *</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category..." />
              </SelectTrigger>
              <SelectContent>
                {CARE_NOTE_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div>
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Brief title for this note..."
            />
          </div>

          {/* Templates */}
          {getCategoryTemplates().length > 0 && (
            <div>
              <Label>Quick Templates</Label>
              <div className="grid grid-cols-1 gap-1 mt-1">
                {getCategoryTemplates().map((template, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleTemplateSelect(template)}
                    className="text-left justify-start h-auto py-2 px-3 whitespace-normal"
                  >
                    {template}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          <div>
            <Label>Notes *</Label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Detailed notes about the care provided..."
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createNoteMutation.isPending}
              className="flex-1"
            >
              {createNoteMutation.isPending ? "Saving..." : "Save Note"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
