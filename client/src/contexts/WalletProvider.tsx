import { WalletProvider as UseWalletProvider, NetworkId, WalletId, WalletManager } from '@txnlab/use-wallet-react';
import { ReactNode, useMemo } from 'react';

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const isLocalNet = import.meta.env.VITE_ALGOD_SERVER?.includes('localhost') || 
                     import.meta.env.VITE_ALGOD_SERVER?.includes('127.0.0.1');
  
  // Determine default network based on environment
  const getDefaultNetwork = (): string => {
    if (isLocalNet) {
      return NetworkId.LOCALNET;
    }
    return NetworkId.TESTNET;
  };

  const getAlgodConfig = () => {
    const server = import.meta.env.VITE_ALGOD_SERVER || 'http://localhost';
    const port = import.meta.env.VITE_ALGOD_PORT || '4001';
    const token = import.meta.env.VITE_ALGOD_TOKEN || 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    
    return {
      token,
      baseServer: server,
      port: port,
    };
  };

  const algodConfig = getAlgodConfig();
  const defaultNetwork = getDefaultNetwork();

  // Initialize WalletManager
  const walletManager = useMemo(() => {
    const manager = new WalletManager({
      wallets: isLocalNet 
        ? [
            {
              id: WalletId.KMD,
              options: {
                token: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                baseServer: 'http://localhost',
                port: '4002',
                wallet: 'unencrypted-default-wallet',
              }
            }
          ]
        : [
            WalletId.PERA,
            WalletId.DEFLY,
            WalletId.EXODUS,
          ],
      networks: {
        [NetworkId.LOCALNET]: {
          algod: {
            token: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            baseServer: 'http://localhost',
            port: '4001',
          }
        },
        [NetworkId.TESTNET]: {
          algod: {
            token: '',
            baseServer: 'https://testnet-api.algonode.cloud',
            port: '',
          }
        }
      },
      defaultNetwork: defaultNetwork,
    });

    return manager;
  }, [isLocalNet, defaultNetwork]);

  return (
    <UseWalletProvider manager={walletManager}>
      {children}
    </UseWalletProvider>
  );
}


