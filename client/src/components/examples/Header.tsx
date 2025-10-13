import Header from '../Header';

export default function HeaderExample() {
  return (
    <Header
      walletAddress="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
      isAdmin={true}
      onConnectWallet={() => console.log('Connect wallet')}
      onDisconnectWallet={() => console.log('Disconnect wallet')}
    />
  );
}
