// Pre-generated wallets for demo (40 voter wallets + 1 admin)
export const ADMIN_WALLET = "0xAdmin123456789012345678901234567890";

export const VOTER_WALLETS = Array.from({ length: 40 }, (_, i) => {
  const num = (i + 1).toString().padStart(2, '0');
  return `0xVoter${num}234567890123456789012345678${num}`;
});

export const ALL_WALLETS = [ADMIN_WALLET, ...VOTER_WALLETS];

// Track which wallet has bet on which event
export const walletBets = new Map<string, Map<number, "YES" | "NO">>();

export function hasWalletBet(wallet: string, eventId: number): boolean {
  return walletBets.get(wallet)?.has(eventId) ?? false;
}

export function getWalletBet(wallet: string, eventId: number): "YES" | "NO" | undefined {
  return walletBets.get(wallet)?.get(eventId);
}

export function recordBet(wallet: string, eventId: number, choice: "YES" | "NO") {
  if (!walletBets.has(wallet)) {
    walletBets.set(wallet, new Map());
  }
  walletBets.get(wallet)!.set(eventId, choice);
}

export function getAllBetsForEvent(eventId: number): Array<{ wallet: string; choice: "YES" | "NO" }> {
  const bets: Array<{ wallet: string; choice: "YES" | "NO" }> = [];
  walletBets.forEach((eventBets, wallet) => {
    const choice = eventBets.get(eventId);
    if (choice) {
      bets.push({ wallet, choice });
    }
  });
  return bets;
}

export function getWalletStats(wallet: string) {
  const bets = walletBets.get(wallet);
  if (!bets) return { totalBets: 0, yesBets: 0, noBets: 0 };
  
  let yesBets = 0;
  let noBets = 0;
  
  bets.forEach(choice => {
    if (choice === "YES") yesBets++;
    else noBets++;
  });
  
  return { totalBets: bets.size, yesBets, noBets };
}
