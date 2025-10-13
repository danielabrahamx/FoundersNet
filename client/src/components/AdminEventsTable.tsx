import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EventStatusBadge from "./EventStatusBadge";
import CountdownTimer from "./CountdownTimer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

type EventStatus = "OPEN" | "CLOSED" | "RESOLVED";

interface AdminEvent {
  id: number;
  name: string;
  emoji: string;
  status: EventStatus;
  yesBets: number;
  noBets: number;
  endTime: Date;
  outcome?: "YES" | "NO";
}

interface AdminEventsTableProps {
  events: AdminEvent[];
  onResolve: (eventId: number, outcome: "YES" | "NO") => void;
}

export default function AdminEventsTable({ events, onResolve }: AdminEventsTableProps) {
  const [resolveModal, setResolveModal] = useState<{ open: boolean; eventId: number | null }>({
    open: false,
    eventId: null,
  });

  const handleResolve = (outcome: "YES" | "NO") => {
    if (resolveModal.eventId) {
      onResolve(resolveModal.eventId, outcome);
      setResolveModal({ open: false, eventId: null });
    }
  };

  return (
    <>
      <div className="space-y-3">
        {events.map((event) => (
          <Card key={event.id} className="p-4 sm:p-6" data-testid={`card-admin-event-${event.id}`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="text-2xl flex-shrink-0">{event.emoji}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold mb-2" data-testid="text-admin-event-name">{event.name}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-bet-yes font-semibold">{event.yesBets}</span>
                      <span className="text-muted-foreground">YES</span>
                    </div>
                    <span className="text-muted-foreground">•</span>
                    <div className="flex items-center gap-2">
                      <span className="text-bet-no font-semibold">{event.noBets}</span>
                      <span className="text-muted-foreground">NO</span>
                    </div>
                    <span className="text-muted-foreground">•</span>
                    <span className="font-mono text-muted-foreground">
                      {(event.yesBets + event.noBets) * 10} MATIC
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {event.status !== "RESOLVED" && <CountdownTimer endTime={event.endTime} />}
                <EventStatusBadge status={event.status} />
                
                {event.status === "CLOSED" && (
                  <Button
                    size="sm"
                    onClick={() => setResolveModal({ open: true, eventId: event.id })}
                    data-testid={`button-resolve-${event.id}`}
                  >
                    Resolve
                  </Button>
                )}

                {event.status === "RESOLVED" && event.outcome && (
                  <div className="px-3 py-1.5 rounded-md bg-primary/10 text-sm font-medium">
                    <span className={event.outcome === "YES" ? "text-bet-yes" : "text-bet-no"}>
                      {event.outcome}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={resolveModal.open} onOpenChange={(open) => setResolveModal({ open, eventId: null })}>
        <DialogContent data-testid="modal-resolve">
          <DialogHeader>
            <DialogTitle>Resolve Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select the outcome for this event. This action cannot be undone.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-20 border-bet-yes hover:bg-bet-yes/10"
                onClick={() => handleResolve("YES")}
                data-testid="button-resolve-yes"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-bet-yes">YES</div>
                  <div className="text-xs text-muted-foreground">Reached $1M ARR</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-20 border-bet-no hover:bg-bet-no/10"
                onClick={() => handleResolve("NO")}
                data-testid="button-resolve-no"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-bet-no">NO</div>
                  <div className="text-xs text-muted-foreground">Did not reach</div>
                </div>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
