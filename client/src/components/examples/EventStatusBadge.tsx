import EventStatusBadge from '../EventStatusBadge';

export default function EventStatusBadgeExample() {
  return (
    <div className="p-4 bg-background flex gap-3">
      <EventStatusBadge status="OPEN" />
      <EventStatusBadge status="CLOSED" />
      <EventStatusBadge status="RESOLVED" />
    </div>
  );
}
