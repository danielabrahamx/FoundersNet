import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useCreateEvent } from "@/hooks/useSolanaPredictionMarket";

interface AdminEventFormProps {
  onSuccess?: () => void;
}

export default function AdminEventForm({ onSuccess }: AdminEventFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    emoji: "🚀",
    endTime: "",
  });
  
  const { execute: createEvent, isLoading } = useCreateEvent();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Convert datetime-local to Unix timestamp
      const endTimeUnix = Math.floor(new Date(formData.endTime).getTime() / 1000);
      
      // Validate end time is in the future
      const now = Math.floor(Date.now() / 1000);
      if (endTimeUnix <= now) {
        toast({
          title: "Invalid End Time",
          description: "End time must be in the future.",
          variant: "destructive",
        });
        return;
      }
      
      // Create event name with emoji
      const eventName = `${formData.emoji} ${formData.name}`;
      
      const signature = await createEvent(eventName, endTimeUnix);
      
      if (signature) {
        // Reset form
        setFormData({ name: "", description: "", emoji: "🚀", endTime: "" });
        
        // Call success callback
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create event",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">Create New Event</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emoji">Emoji</Label>
            <Input
              id="emoji"
              value={formData.emoji}
              onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
              placeholder="🚀"
              maxLength={2}
              data-testid="input-emoji"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Startup Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., TechFlow AI"
              required
              data-testid="input-name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of the startup..."
            rows={3}
            required
            data-testid="input-description"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endTime">Betting End Time *</Label>
          <Input
            id="endTime"
            type="datetime-local"
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            required
            data-testid="input-end-time"
          />
        </div>

        <Button type="submit" className="w-full" data-testid="button-create-event" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Event"}
        </Button>
      </form>
    </Card>
  );
}
