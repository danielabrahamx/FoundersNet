import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type EventStatus = "OPEN" | "CLOSED" | "RESOLVED";

interface EventStatusBadgeProps {
  status: EventStatus;
  className?: string;
}

export default function EventStatusBadge({ status, className }: EventStatusBadgeProps) {
  const statusConfig = {
    OPEN: {
      color: "bg-status-open/20 text-status-open border-status-open/30",
      label: "Open",
      showPulse: true,
    },
    CLOSED: {
      color: "bg-status-closed/20 text-status-closed border-status-closed/30",
      label: "Closed",
      showPulse: false,
    },
    RESOLVED: {
      color: "bg-status-resolved/20 text-status-resolved border-status-resolved/30",
      label: "Resolved",
      showPulse: false,
    },
  };

  const config = statusConfig[status];

  return (
    <Badge 
      variant="outline" 
      className={cn("flex items-center gap-1.5", config.color, className)}
      data-testid={`badge-status-${status.toLowerCase()}`}
    >
      <div className={cn(
        "w-1.5 h-1.5 rounded-full",
        config.showPulse && "animate-pulse"
      )} />
      {config.label}
    </Badge>
  );
}
