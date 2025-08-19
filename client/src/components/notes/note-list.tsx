import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CareNote } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CARE_NOTE_CATEGORIES } from "@/lib/constants";
import { format } from "date-fns";
import NoteForm from "./note-form";

export default function NoteList() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showNoteForm, setShowNoteForm] = useState(false);

  const { data: notes = [], isLoading } = useQuery<CareNote[]>({
    queryKey: ["/api/care-notes"],
    queryParams: { caregiverId: user?.id },
    enabled: !!user?.id,
  });

  const filteredNotes = notes.filter(note =>
    selectedCategory === "all" || note.category === selectedCategory
  );

  const getCategoryInfo = (category: string) => {
    return CARE_NOTE_CATEGORIES.find(cat => cat.value === category) || 
           { label: category, color: "bg-gray-100 text-gray-800" };
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
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
      {/* Add Note Button */}
      <Button 
        onClick={() => setShowNoteForm(true)}
        className="w-full mb-4 bg-primary hover:bg-blue-700"
      >
        <i className="fas fa-plus mr-2"></i>
        Add New Note
      </Button>

      {/* Category Filters */}
      <div className="flex space-x-2 mb-4 overflow-x-auto">
        <Button
          variant={selectedCategory === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory("all")}
          className="whitespace-nowrap"
        >
          All
        </Button>
        {CARE_NOTE_CATEGORIES.map((category) => (
          <Button
            key={category.value}
            variant={selectedCategory === category.value ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.value)}
            className="whitespace-nowrap"
          >
            {category.label}
          </Button>
        ))}
      </div>

      {/* Notes List */}
      <div className="space-y-3">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-sticky-note text-4xl text-gray-300 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {selectedCategory === "all" ? "No notes yet" : "No notes in this category"}
            </h3>
            <p className="text-sm text-gray-500">
              Notes you create will appear here
            </p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const categoryInfo = getCategoryInfo(note.category);
            return (
              <Card key={note.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{note.title}</h3>
                      <Badge className={categoryInfo.color}>
                        {categoryInfo.label}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      {format(new Date(note.timestamp), "h:mm a")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{note.content}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {format(new Date(note.timestamp), "MMM d, yyyy")}
                    </span>
                    <Button variant="ghost" size="sm" className="text-primary">
                      <i className="fas fa-edit mr-1"></i>Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Note Form Modal */}
      <NoteForm 
        open={showNoteForm} 
        onClose={() => setShowNoteForm(false)} 
      />
    </div>
  );
}
