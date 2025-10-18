import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface CountdownTimerProps {
  endTime: number; // UNIX timestamp in seconds
  onExpire?: () => void;
}

export default function CountdownTimer({ endTime, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Math.floor(Date.now() / 1000); // Current time in seconds
      const difference = endTime - now;

      if (difference <= 0) {
        setTimeLeft("Closed");
        onExpire?.();
        return;
      }

      const days = Math.floor(difference / (60 * 60 * 24));
      const hours = Math.floor((difference % (60 * 60 * 24)) / (60 * 60));
      const minutes = Math.floor((difference % (60 * 60)) / 60);
      const seconds = Math.floor(difference % 60);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [endTime, onExpire]);

  return (
    <div className="flex items-center gap-2 text-primary" data-testid="countdown-timer">
      <Clock className="w-4 h-4" />
      <span className="font-mono text-sm font-semibold">{timeLeft}</span>
    </div>
  );
}
