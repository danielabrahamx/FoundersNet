# Prediction Market - Solana Smart Contract

## Overview

This is the Solana implementation of the Prediction Market smart contract, built using the Anchor framework. It enables users to create prediction events, place bets on outcomes (YES/NO), and claim winnings proportionally when events are resolved.

## Architecture

### Program Accounts

#### ProgramState
- **Purpose**: Global state storing admin, counters
- **PDA Seeds**: `["program_state"]`
- **Fields**:
  - `admin`: Pubkey - Admin address
  - `event_counter`: u64 - Total events created
  - `bet_counter`: u64 - Total bets placed
  - `bump`: u8 - PDA bump seed

#### Event
- **Purpose**: Stores event details
- **PDA Seeds**: `["event", event_id]`
- **Fields**:
  - `event_id`: u64 - Unique event identifier
  - `name`: String (max 200 chars) - Event description
  - `end_time`: i64 - Unix timestamp when betting ends
  - `resolved`: bool - Whether event is resolved
  - `outcome`: bool - Final outcome (true=YES, false=NO)
  - `total_yes_bets`: u64 - Count of YES bets
  - `total_no_bets`: u64 - Count of NO bets
  - `total_yes_amount`: u64 - Total lamports bet on YES
  - `total_no_amount`: u64 - Total lamports bet on NO
  - `creator`: Pubkey - Event creator address
  - `bump`: u8 - PDA bump seed

#### Bet
- **Purpose**: Stores individual bet details
- **PDA Seeds**: `["bet", bet_id]`
- **Fields**:
  - `bet_id`: u64 - Unique bet identifier
  - `event_id`: u64 - Associated event ID
  - `bettor`: Pubkey - Bettor's address
  - `outcome`: bool - Bet prediction (true=YES, false=NO)
  - `amount`: u64 - Bet amount in lamports
  - `claimed`: bool - Whether winnings claimed
  - `bump`: u8 - PDA bump seed

#### Event Escrow
- **Purpose**: Holds all bet funds for an event
- **PDA Seeds**: `["escrow", event_id]`
- **Type**: AccountInfo (not an account struct)

## Instructions

### 1. Initialize
```rust
pub fn initialize(ctx: Context<Initialize>, admin: Pubkey) -> Result<()>
```
- **Description**: Initialize program state with admin
- **Access**: Anyone (one-time only)
- **Accounts**:
  - `program_state`: PDA (init)
  - `payer`: Signer (pays for account)
  - `system_program`: System program

### 2. Create Event
```rust
pub fn create_event(ctx: Context<CreateEvent>, name: String, end_time: i64) -> Result<()>
```
- **Description**: Create a new prediction event
- **Access**: Admin only
- **Validations**:
  - Caller must be admin
  - `end_time` must be in the future
- **Accounts**:
  - `program_state`: PDA (mut) - Updates event counter
  - `event`: PDA (init) - New event account
  - `event_escrow`: PDA - Escrow account for this event
  - `admin`: Signer
  - `system_program`: System program

### 3. Place Bet
```rust
pub fn place_bet(ctx: Context<PlaceBet>, event_id: u64, outcome: bool, amount: u64) -> Result<()>
```
- **Description**: Place a bet on an event outcome
- **Access**: Anyone
- **Validations**:
  - Event must exist
  - Event must not be resolved
  - Current time < event `end_time`
  - `amount` > 0
- **Accounts**:
  - `program_state`: PDA (mut) - Updates bet counter
  - `event`: PDA (mut) - Updates bet totals
  - `bet`: PDA (init) - New bet account
  - `event_escrow`: PDA (mut) - Receives bet funds
  - `bettor`: Signer (mut) - Sends bet funds
  - `system_program`: System program

### 4. Resolve Event
```rust
pub fn resolve_event(ctx: Context<ResolveEvent>, event_id: u64, outcome: bool) -> Result<()>
```
- **Description**: Resolve event with final outcome
- **Access**: Admin only
- **Validations**:
  - Caller must be admin
  - Event must not be already resolved
- **Accounts**:
  - `program_state`: PDA - Validates admin
  - `event`: PDA (mut) - Marks as resolved
  - `admin`: Signer

### 5. Claim Winnings
```rust
pub fn claim_winnings(ctx: Context<ClaimWinnings>, event_id: u64, bet_id: u64) -> Result<()>
```
- **Description**: Claim winnings for a winning bet
- **Access**: Bet owner only
- **Validations**:
  - Event must be resolved
  - Bet must not be already claimed
  - Caller must be the bettor
  - Bet outcome must match event outcome
- **Payout Formula**:
  ```
  payout = (bet_amount × total_pool) ÷ winning_pool
  ```
- **Accounts**:
  - `event`: PDA - Check resolution status
  - `bet`: PDA (mut) - Mark as claimed
  - `event_escrow`: PDA (mut) - Sends winnings
  - `bettor`: Signer (mut) - Receives winnings
  - `system_program`: System program

### 6. Emergency Withdraw
```rust
pub fn emergency_withdraw(ctx: Context<EmergencyWithdraw>, event_id: u64) -> Result<()>
```
- **Description**: Admin emergency withdrawal from event escrow
- **Access**: Admin only
- **Accounts**:
  - `program_state`: PDA - Validates admin
  - `event_escrow`: PDA (mut) - Drained
  - `admin`: Signer (mut) - Receives funds

## Error Codes

| Code | Message |
|------|---------|
| `Unauthorized` | Only admin can perform this action |
| `EventAlreadyResolved` | Event has already been resolved |
| `EventNotResolved` | Event has not been resolved yet |
| `AlreadyClaimed` | Winnings have already been claimed |
| `LosingBet` | This bet is on the losing outcome |
| `EventDoesNotExist` | Event does not exist |
| `BettingPeriodEnded` | Betting period has ended |
| `BetAmountMustBeGreaterThanZero` | Bet amount must be greater than zero |
| `EndTimeMustBeInFuture` | End time must be in the future |
| `NoBalanceToWithdraw` | No balance to withdraw |

## Development

### Prerequisites
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

### Build
```bash
anchor build
```

### Test
```bash
anchor test
```

### Deploy

#### Localnet
```bash
# Start local validator
solana-test-validator

# Deploy
anchor deploy
```

#### Devnet
```bash
# Configure for devnet
solana config set --url devnet

# Airdrop SOL (if needed)
solana airdrop 2

# Deploy
anchor deploy --provider.cluster devnet
```

#### Testnet
```bash
# Configure for testnet
solana config set --url testnet

# Deploy
anchor deploy --provider.cluster testnet
```

## Usage Example

### TypeScript Client
```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PredictionMarket } from "./target/types/prediction_market";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.PredictionMarket as Program<PredictionMarket>;

// Initialize
const [programState] = PublicKey.findProgramAddressSync(
  [Buffer.from("program_state")],
  program.programId
);

await program.methods
  .initialize(provider.wallet.publicKey)
  .accounts({
    programState,
    payer: provider.wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

// Create event
const eventName = "Will Startup X reach $1M ARR?";
const endTime = new anchor.BN(Date.now() / 1000 + 86400); // 24 hours

await program.methods
  .createEvent(eventName, endTime)
  .accounts({
    programState,
    event: eventPDA,
    eventEscrow: escrowPDA,
    admin: provider.wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

// Place bet
await program.methods
  .placeBet(new anchor.BN(1), true, new anchor.BN(0.1 * LAMPORTS_PER_SOL))
  .accounts({
    programState,
    event: eventPDA,
    bet: betPDA,
    eventEscrow: escrowPDA,
    bettor: provider.wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

## Migration from Algorand

This Solana implementation is a complete port of the Algorand Python smart contract with the following key differences:

### Architectural Changes
1. **State Storage**: 
   - Algorand: Box storage for mappings
   - Solana: Individual PDA accounts for each entity

2. **Account Model**:
   - Algorand: Global state + boxes
   - Solana: Separate accounts for state, events, bets

3. **Transaction Model**:
   - Algorand: Atomic transaction groups
   - Solana: Single transactions with multiple accounts

### Feature Parity
✅ Admin-controlled event creation  
✅ User betting with SOL (vs ALGO)  
✅ Event resolution by admin  
✅ Proportional winnings distribution  
✅ Emergency withdrawal  
✅ Comprehensive validation  
✅ Event and bet counters  

### Key Improvements
- More efficient PDA-based architecture
- Better separation of concerns
- Comprehensive error handling
- Full test coverage
- TypeScript client integration

## Security Considerations

1. **Admin Key Management**: Store admin private key securely
2. **PDA Derivation**: Always verify PDA derivations client-side
3. **Amount Validation**: All amounts validated on-chain
4. **Time Checks**: Uses Solana Clock for timestamp validation
5. **Overflow Protection**: All arithmetic uses checked operations
6. **Reentrancy**: Anchor framework provides built-in protection

## License

MIT

## Contributors

Migrated from Algorand to Solana as part of Phase 2 of the multi-chain migration plan.
