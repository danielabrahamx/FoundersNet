import CountdownTimer from '../CountdownTimer';

export default function CountdownTimerExample() {
  const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000);

  return (
    <div className="p-4 bg-background">
      <CountdownTimer 
        endTime={futureDate}
        onExpire={() => console.log('Timer expired')}
      />
    </div>
  );
}
