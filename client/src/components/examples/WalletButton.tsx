import WalletButton from '../WalletButton';
import { useState } from 'react';

export default function WalletButtonExample() {
  const [address, setAddress] = useState<string>();

  return (
    <div className="p-4 bg-background">
      <WalletButton
        address={address}
        onConnect={() => {
          setAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
          console.log('Wallet connected');
        }}
        onDisconnect={() => {
          setAddress(undefined);
          console.log('Wallet disconnected');
        }}
      />
    </div>
  );
}
