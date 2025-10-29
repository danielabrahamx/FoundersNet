import BetModal from '../BetModal';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function BetModalExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-4 bg-background">
      <Button onClick={() => setOpen(true)}>Open Bet Modal</Button>
      <BetModal
        open={open}
        onClose={() => setOpen(false)}
        eventId={1}
        eventName="TechFlow AI"
        yesBets={45}
        noBets={23}
      />
    </div>
  );
}
