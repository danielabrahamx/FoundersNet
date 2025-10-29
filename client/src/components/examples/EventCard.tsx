import EventCard from '../EventCard';

export default function EventCardExample() {
  const futureTimestamp = Math.floor((Date.now() + 3 * 24 * 60 * 60 * 1000) / 1000);

  return (
    <div className="p-4 bg-background max-w-md">
      <EventCard
        id={1}
        emoji="🚀"
        name="TechFlow AI"
        description="AI-powered workflow automation platform targeting SMBs with advanced no-code capabilities"
        endTime={futureTimestamp}
        status="OPEN"
        yesBets={45}
        noBets={23}
        totalYesPool={450}
        totalNoPool={230}
        onPlaceBet={() => console.log('Place bet clicked')}
      />
    </div>
  );
}
