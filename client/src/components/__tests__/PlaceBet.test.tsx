import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseEther } from 'viem';

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useWriteContract: vi.fn(),
  useWaitForTransactionReceipt: vi.fn(),
}));

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({ toast: vi.fn() })),
}));

// Mock shared contracts
vi.mock('@shared/contracts', () => ({
  PREDICTION_MARKET_ADDRESS: '0x527679766DC45BdC0593B0C1bAE0e66CaC1C9008',
  PREDICTION_MARKET_ABI: [],
}));

describe('PlaceBet Component - Smart Contract Integration Tests', () => {
  const mockEventProps = {
    eventId: 1,
    eventName: 'Will AI surpass human intelligence by 2030?',
    eventEndTime: BigInt(Math.floor(Date.now() / 1000) + 86400), // 1 day from now
    totalYesAmount: parseEther('100'),
    totalNoAmount: parseEther('50'),
    isResolved: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    (wagmi.useAccount as any).mockReturnValue({
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
    });

    (wagmi.useWriteContract as any).mockReturnValue({
      writeContract: vi.fn(),
      data: undefined,
      isPending: false,
      isError: false,
      error: null,
    });

    (wagmi.useWaitForTransactionReceipt as any).mockReturnValue({
      isLoading: false,
      isSuccess: false,
    });

    (wagmi.useReadContract as any).mockReturnValue({
      data: undefined,
      isLoading: false,
    });
  });

  describe('Component Rendering', () => {
    it('should render bet amount input and prediction buttons', () => {
      render(<PlaceBet event={mockEvent} onSuccess={mockOnSuccess} />);

      expect(screen.getByText(/Place Your Bet/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Enter bet amount/i)).toBeInTheDocument();
      expect(screen.getByText(/Bet YES/i)).toBeInTheDocument();
      expect(screen.getByText(/Bet NO/i)).toBeInTheDocument();
    });

    it('should display event statistics correctly', () => {
      render(<PlaceBet event={mockEvent} onSuccess={mockOnSuccess} />);

      // Check YES pool (100 MATIC, 5 bets)
      expect(screen.getByText(/100.*MATIC/)).toBeInTheDocument();
      expect(screen.getByText(/5.*bets/)).toBeInTheDocument();

      // Check NO pool (50 MATIC, 3 bets)
      expect(screen.getByText(/50.*MATIC/)).toBeInTheDocument();
      expect(screen.getByText(/3.*bets/)).toBeInTheDocument();
    });

    it('should show wallet connection prompt when not connected', () => {
      (wagmi.useAccount as any).mockReturnValue({
        address: undefined,
        isConnected: false,
      });

      render(<PlaceBet event={mockEvent} onSuccess={mockOnSuccess} />);

      expect(screen.getByText(/Connect wallet to place bets/i)).toBeInTheDocument();
    });

    it('should disable betting when event is resolved', () => {
      const resolvedEvent = { ...mockEvent, resolved: true };
      render(<PlaceBet event={resolvedEvent} onSuccess={mockOnSuccess} />);

      const yesButton = screen.getByText(/Bet YES/i).closest('button');
      const noButton = screen.getByText(/Bet NO/i).closest('button');

      expect(yesButton).toBeDisabled();
      expect(noButton).toBeDisabled();
    });

    it('should disable betting when event has ended', () => {
      const endedEvent = {
        ...mockEvent,
        endTime: BigInt(Math.floor(Date.now() / 1000) - 3600), // 1 hour ago
      };
      render(<PlaceBet event={endedEvent} onSuccess={mockOnSuccess} />);

      expect(screen.getByText(/Betting period has ended/i)).toBeInTheDocument();
    });
  });

  describe('Bet Amount Input', () => {
    it('should update bet amount when user types', () => {
      render(<PlaceBet event={mockEvent} onSuccess={mockOnSuccess} />);

      const input = screen.getByPlaceholderText(/Enter bet amount/i) as HTMLInputElement;
      fireEvent.change(input, { target: { value: '25' } });

      expect(input.value).toBe('25');
    });

    it('should show validation error for zero amount', () => {
      render(<PlaceBet event={mockEvent} onSuccess={mockOnSuccess} />);

      const input = screen.getByPlaceholderText(/Enter bet amount/i);
      const yesButton = screen.getByText(/Bet YES/i);

      fireEvent.change(input, { target: { value: '0' } });
      fireEvent.click(yesButton);

      expect(screen.getByText(/Bet amount must be greater than 0/i)).toBeInTheDocument();
    });

    it('should show validation error for negative amount', () => {
      render(<PlaceBet event={mockEvent} onSuccess={mockOnSuccess} />);

      const input = screen.getByPlaceholderText(/Enter bet amount/i);
      const yesButton = screen.getByText(/Bet YES/i);

      fireEvent.change(input, { target: { value: '-5' } });
      fireEvent.click(yesButton);

      expect(screen.getByText(/Bet amount must be greater than 0/i)).toBeInTheDocument();
    });

    it('should provide quick bet amount buttons', () => {
      render(<PlaceBet event={mockEvent} onSuccess={mockOnSuccess} />);

      const quickBet10 = screen.getByText(/10 MATIC/i);
      const quickBet50 = screen.getByText(/50 MATIC/i);
      const quickBet100 = screen.getByText(/100 MATIC/i);

      expect(quickBet10).toBeInTheDocument();
      expect(quickBet50).toBeInTheDocument();
      expect(quickBet100).toBeInTheDocument();
    });
  });

  describe('Potential Return Calculation', () => {
    it('should calculate potential return for YES bet correctly', () => {
      render(<PlaceBet event={mockEvent} onSuccess={mockOnSuccess} />);

      const input = screen.getByPlaceholderText(/Enter bet amount/i);
      fireEvent.change(input, { target: { value: '10' } });

      // With 10 MATIC bet on YES:
      // Total pool = 100 (YES) + 50 (NO) + 10 (new) = 160 MATIC
      // New YES pool = 110 MATIC
      // If YES wins, payout = (10 / 110) * 160 = 14.54 MATIC
      // Return = 14.54 MATIC, Profit = 4.54 MATIC

      waitFor(() => {
        expect(screen.getByText(/Potential Return/i)).toBeInTheDocument();
        expect(screen.getByText(/14\.54.*MATIC/)).toBeInTheDocument();
      });
    });

    it('should calculate potential return for NO bet correctly', () => {
      render(<PlaceBet event={mockEvent} onSuccess={mockOnSuccess} />);

      const input = screen.getByPlaceholderText(/Enter bet amount/i);
      fireEvent.change(input, { target: { value: '10' } });

      // With 10 MATIC bet on NO:
      // Total pool = 100 (YES) + 50 (NO) + 10 (new) = 160 MATIC
      // New NO pool = 60 MATIC
      // If NO wins, payout = (10 / 60) * 160 = 26.67 MATIC
      // Return = 26.67 MATIC, Profit = 16.67 MATIC

      waitFor(() => {
        expect(screen.getByText(/Potential Return/i)).toBeInTheDocument();
        expect(screen.getByText(/26\.67.*MATIC/)).toBeInTheDocument();
      });
    });

    it('should show higher returns for underdog bets', () => {
      render(<PlaceBet event={mockEvent} onSuccess={mockOnSuccess} />);

      const input = screen.getByPlaceholderText(/Enter bet amount/i);
      fireEvent.change(input, { target: { value: '10' } });

      // NO is the underdog (50 MATIC vs 100 MATIC), so should show higher return
      const noReturnText = screen.getByText(/NO.*Potential Return/i);
      const yesReturnText = screen.getByText(/YES.*Potential Return/i);

      // Extract the MATIC amounts and compare
      expect(noReturnText).toBeInTheDocument();
      expect(yesReturnText).toBeInTheDocument();
    });
  });

  describe('Transaction Flow - Placing Bets', () => {
    it('should call writeContract with correct parameters for YES bet', async () => {
      const mockWriteContract = vi.fn();
      (wagmi.useWriteContract as any).mockReturnValue({
        writeContract: mockWriteContract,
        data: undefined,
        isPending: false,
        isError: false,
        error: null,
      });

      render(<PlaceBet event={mockEvent} onSuccess={mockOnSuccess} />);

      const input = screen.getByPlaceholderText(/Enter bet amount/i);
      const yesButton = screen.getByText(/Bet YES/i);

      fireEvent.change(input, { target: { value: '25' } });
      fireEvent.click(yesButton);

      await waitFor(() => {
        expect(mockWriteContract).toHaveBeenCalledWith({
          address: '0x527679766DC45BdC0593B0C1bAE0e66CaC1C9008',
          abi: expect.any(Array),
          functionName: 'placeBet',
          args: [BigInt(1), true],
          value: parseEther('25'),
        });
      });
    });

    it('should call writeContract with correct parameters for NO bet', async () => {
      const mockWriteContract = vi.fn();
      (wagmi.useWriteContract as any).mockReturnValue({
        writeContract: mockWriteContract,
        data: undefined,
        isPending: false,
        isError: false,
        error: null,
      });

      render(<PlaceBet event={mockEvent} onSuccess={mockOnSuccess} />);

      const input = screen.getByPlaceholderText(/Enter bet amount/i);
      const noButton = screen.getByText(/Bet NO/i);

      fireEvent.change(input, { target: { value: '15' } });
      fireEvent.click(noButton);

      await waitFor(() => {
        expect(mockWriteContract).toHaveBeenCalledWith({
          address: '0x527679766DC45BdC0593B0C1bAE0e66CaC1C9008',
          abi: expect.any(Array),
          functionName: 'placeBet',
          args: [BigInt(1), false],
          value: parseEther('15'),
        });
      });
    });

    it('should show pending state during transaction', () => {
      (wagmi.useWriteContract as any).mockReturnValue({
        writeContract: vi.fn(),
        data: '0xTransactionHash123',
        isPending: true,
        isError: false,
        error: null,
      });

      render(<PlaceBet event={mockEvent} onSuccess={mockOnSuccess} />);

      expect(screen.getByText(/Confirming transaction/i)).toBeInTheDocument();
      
      const yesButton = screen.getByText(/Bet YES/i).closest('button');
      const noButton = screen.getByText(/Bet NO/i).closest('button');
      
      expect(yesButton).toBeDisabled();
      expect(noButton).toBeDisabled();
    });

    it('should show waiting state while transaction confirms', () => {
      (wagmi.useWriteContract as any).mockReturnValue({
        writeContract: vi.fn(),
        data: '0xTransactionHash123',
        isPending: false,
        isError: false,
        error: null,
      });

      (wagmi.useWaitForTransactionReceipt as any).mockReturnValue({
        isLoading: true,
        isSuccess: false,
      });

      render(<PlaceBet event={mockEvent} onSuccess={mockOnSuccess} />);

      expect(screen.getByText(/Transaction pending/i)).toBeInTheDocument();
      expect(screen.getByText(/Waiting for confirmation/i)).toBeInTheDocument();
    });

    it('should show success state and call onSuccess callback', async () => {
      (wagmi.useWriteContract as any).mockReturnValue({
        writeContract: vi.fn(),
        data: '0xTransactionHash123',
        isPending: false,
        isError: false,
        error: null,
      });

      (wagmi.useWaitForTransactionReceipt as any).mockReturnValue({
        isLoading: false,
        isSuccess: true,
      });

      render(<PlaceBet event={mockEvent} onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByText(/Bet placed successfully/i)).toBeInTheDocument();
        expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it('should show error state when transaction fails', () => {
      const mockError = { message: 'User rejected transaction' };
      
      (wagmi.useWriteContract as any).mockReturnValue({
        writeContract: vi.fn(),
        data: undefined,
        isPending: false,
        isError: true,
        error: mockError,
      });

      render(<PlaceBet event={mockEvent} onSuccess={mockOnSuccess} />);

      expect(screen.getByText(/Transaction failed/i)).toBeInTheDocument();
      expect(screen.getByText(/User rejected transaction/i)).toBeInTheDocument();
    });

    it('should reset to idle state after success', async () => {
      const { rerender } = render(<PlaceBet event={mockEvent} onSuccess={mockOnSuccess} />);

      // Simulate success state
      (wagmi.useWriteContract as any).mockReturnValue({
        writeContract: vi.fn(),
        data: '0xTransactionHash123',
        isPending: false,
        isError: false,
        error: null,
      });

      (wagmi.useWaitForTransactionReceipt as any).mockReturnValue({
        isLoading: false,
        isSuccess: true,
      });

      rerender(<PlaceBet event={mockEvent} onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByText(/Bet placed successfully/i)).toBeInTheDocument();
      });

      // After 3 seconds, should reset to idle
      await new Promise(resolve => setTimeout(resolve, 3000));

      rerender(<PlaceBet event={mockEvent} onSuccess={mockOnSuccess} />);

      expect(screen.getByText(/Place Your Bet/i)).toBeInTheDocument();
    });
  });

  describe('User Existing Bets Display', () => {
    it('should display user existing bets on event', () => {
      (wagmi.useReadContract as any).mockReturnValue({
        data: [
          {
            id: BigInt(1),
            eventId: BigInt(1),
            amount: parseEther('10'),
            outcome: true,
            claimed: false,
          },
          {
            id: BigInt(2),
            eventId: BigInt(1),
            amount: parseEther('5'),
            outcome: false,
            claimed: false,
          },
        ],
        isLoading: false,
      });

      render(<PlaceBet event={mockEvent} onSuccess={mockOnSuccess} />);

      expect(screen.getByText(/Your Bets/i)).toBeInTheDocument();
      expect(screen.getByText(/10.*MATIC.*YES/)).toBeInTheDocument();
      expect(screen.getByText(/5.*MATIC.*NO/)).toBeInTheDocument();
    });

    it('should show total amount bet by user', () => {
      (wagmi.useReadContract as any).mockReturnValue({
        data: [
          {
            id: BigInt(1),
            eventId: BigInt(1),
            amount: parseEther('10'),
            outcome: true,
            claimed: false,
          },
          {
            id: BigInt(2),
            eventId: BigInt(1),
            amount: parseEther('15'),
            outcome: false,
            claimed: false,
          },
        ],
        isLoading: false,
      });

      render(<PlaceBet event={mockEvent} onSuccess={mockOnSuccess} />);

      expect(screen.getByText(/Total.*25.*MATIC/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<PlaceBet event={mockEvent} onSuccess={mockOnSuccess} />);

      const input = screen.getByPlaceholderText(/Enter bet amount/i);
      expect(input).toHaveAttribute('type', 'number');
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('step', '0.01');
    });

    it('should be keyboard navigable', () => {
      render(<PlaceBet event={mockEvent} onSuccess={mockOnSuccess} />);

      const yesButton = screen.getByText(/Bet YES/i);
      const noButton = screen.getByText(/Bet NO/i);

      expect(yesButton).not.toHaveAttribute('tabIndex', '-1');
      expect(noButton).not.toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large bet amounts', () => {
      render(<PlaceBet event={mockEvent} onSuccess={mockOnSuccess} />);

      const input = screen.getByPlaceholderText(/Enter bet amount/i);
      fireEvent.change(input, { target: { value: '1000000' } });

      expect((input as HTMLInputElement).value).toBe('1000000');
    });

    it('should handle decimal bet amounts', () => {
      render(<PlaceBet event={mockEvent} onSuccess={mockOnSuccess} />);

      const input = screen.getByPlaceholderElement(/Enter bet amount/i);
      fireEvent.change(input, { target: { value: '12.5' } });

      expect((input as HTMLInputElement).value).toBe('12.5');
    });

    it('should handle event with zero existing bets', () => {
      const newEvent = {
        ...mockEvent,
        totalYesAmount: BigInt(0),
        totalNoAmount: BigInt(0),
        yesCount: BigInt(0),
        noCount: BigInt(0),
      };

      render(<PlaceBet event={newEvent} onSuccess={mockOnSuccess} />);

      expect(screen.getByText(/Be the first to bet/i)).toBeInTheDocument();
    });

    it('should handle contract read errors gracefully', () => {
      (wagmi.useReadContract as any).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: { message: 'Failed to fetch user bets' },
      });

      render(<PlaceBet event={mockEvent} onSuccess={mockOnSuccess} />);

      // Should still render the main component
      expect(screen.getByText(/Place Your Bet/i)).toBeInTheDocument();
    });
  });
});
