import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface AdminEventFormProps {
  onSubmit: (data: {
    name: string;
    description: string;
    emoji: string;
    endTime: string;
  }) => void;
}

export default function AdminEventForm({ onSubmit }: AdminEventFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    emoji: "🚀",
    endTime: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ name: "", description: "", emoji: "🚀", endTime: "" });
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

        <Button type="submit" className="w-full" data-testid="button-create-event">
          Create Event
        </Button>
      </form>
    </Card>
  );
}
