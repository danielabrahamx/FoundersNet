import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { PREDICTION_MARKET_ABI, PREDICTION_MARKET_ADDRESS } from '@shared/contracts';
import { parseEther } from 'viem';

/**
 * Hook to get total bets for a specific event
 * @param eventId - The ID of the event
 * @returns Object with yesBets, noBets counts and query state
 */
export function useTotalBets(eventId: number) {
  return useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'getTotalBets',
    args: [BigInt(eventId)],
  });
}

/**
 * Hook to get all bets for a specific user
 * @param userAddress - The wallet address of the user
 * @returns Object with user's bets array and query state
 */
export function useGetUserBets(userAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'getUserBets',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });
}

/**
 * Hook to get event details
 * @param eventId - The ID of the event
 * @returns Object with event details and query state
 */
export function useGetEvent(eventId: number) {
  return useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'getEvent',
    args: [BigInt(eventId)],
  });
}

/**
 * Hook to place a bet on an event
 * @returns writeContract function and transaction state
 * 
 * Usage:
 * const { writeContract, isPending } = usePlaceBet();
 * writeContract({
 *   address: PREDICTION_MARKET_ADDRESS,
 *   abi: PREDICTION_MARKET_ABI,
 *   functionName: 'placeBet',
 *   args: [BigInt(eventId), outcome],
 *   value: parseEther('10'), // 10 ALGO
 * });
 */
export function usePlaceBet() {
  return useWriteContract();
}

/**
 * Hook to create a new event (admin only)
 * @returns writeContract function and transaction state
 * 
 * Usage:
 * const { writeContract, isPending } = useCreateEvent();
 * writeContract({
 *   address: PREDICTION_MARKET_ADDRESS,
 *   abi: PREDICTION_MARKET_ABI,
 *   functionName: 'createEvent',
 *   args: [name, endTime],
 * });
 */
export function useCreateEvent() {
  return useWriteContract();
}

/**
 * Hook to resolve an event (admin only)
 * @returns writeContract function and transaction state
 * 
 * Usage:
 * const { writeContract, isPending } = useResolveEvent();
 * writeContract({
 *   address: PREDICTION_MARKET_ADDRESS,
 *   abi: PREDICTION_MARKET_ABI,
 *   functionName: 'resolveEvent',
 *   args: [BigInt(eventId), outcome],
 * });
 */
export function useResolveEvent() {
  return useWriteContract();
}

/**
 * Hook to claim winnings for a bet
 * @returns writeContract function and transaction state
 * 
 * Usage:
 * const { writeContract, isPending } = useClaimWinnings();
 * writeContract({
 *   address: PREDICTION_MARKET_ADDRESS,
 *   abi: PREDICTION_MARKET_ABI,
 *   functionName: 'claimWinnings',
 *   args: [BigInt(betId)],
 * });
 */
export function useClaimWinnings() {
  return useWriteContract();
}

/**
 * Hook to get all bets for a specific event
 * @param eventId - The ID of the event
 * @returns Object with array of bet IDs and query state
 */
export function useGetEventBets(eventId: number | undefined) {
  return useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'eventBets',
    args: eventId !== undefined ? [BigInt(eventId)] : undefined,
    query: {
      enabled: eventId !== undefined,
    },
  });
}

/**
 * Hook to get a specific bet details
 * @param betId - The ID of the bet
 * @returns Object with bet details and query state
 */
export function useGetBet(betId: bigint | undefined) {
  return useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'bets',
    args: betId !== undefined ? [betId] : undefined,
    query: {
      enabled: betId !== undefined,
    },
  });
}

/**
 * Hook to wait for a transaction receipt
 * @param hash - Transaction hash
 * @returns Transaction receipt and loading state
 */
export function useTransactionReceipt(hash: `0x${string}` | undefined) {
  return useWaitForTransactionReceipt({
    hash,
  });
}
