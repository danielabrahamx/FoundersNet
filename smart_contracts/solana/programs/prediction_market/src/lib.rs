use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod prediction_market {
    use super::*;

    /// Initialize the program state with admin
    pub fn initialize(ctx: Context<Initialize>, admin: Pubkey) -> Result<()> {
        msg!("Prediction Market Program Initialized");
        let state = &mut ctx.accounts.program_state;
        state.admin = admin;
        state.event_counter = 0;
        state.bet_counter = 0;
        state.bump = ctx.bumps.program_state;
        Ok(())
    }

    /// Create a new prediction event (admin only)
    pub fn create_event(
        ctx: Context<CreateEvent>,
        name: String,
        end_time: i64,
    ) -> Result<()> {
        let state = &mut ctx.accounts.program_state;
        let clock = Clock::get()?;
        
        // Only admin can create events
        require!(
            ctx.accounts.admin.key() == state.admin,
            ErrorCode::Unauthorized
        );
        
        // Validate end time is in the future
        require!(
            end_time > clock.unix_timestamp,
            ErrorCode::EndTimeMustBeInFuture
        );
        
        // Increment event counter
        state.event_counter = state.event_counter.checked_add(1).unwrap();
        let event_id = state.event_counter;
        
        msg!("Creating event: {} with ID: {}", name, event_id);
        
        let event = &mut ctx.accounts.event;
        event.event_id = event_id;
        event.name = name;
        event.end_time = end_time;
        event.resolved = false;
        event.outcome = false;
        event.total_yes_bets = 0;
        event.total_no_bets = 0;
        event.total_yes_amount = 0;
        event.total_no_amount = 0;
        event.creator = ctx.accounts.admin.key();
        event.bump = ctx.bumps.event;
        
        Ok(())
    }

    /// Place a bet on an event
    pub fn place_bet(
        ctx: Context<PlaceBet>,
        event_id: u64,
        outcome: bool,
        amount: u64,
    ) -> Result<()> {
        let state = &mut ctx.accounts.program_state;
        let clock = Clock::get()?;
        let event = &mut ctx.accounts.event;
        
        // Validate event exists
        require!(
            event_id <= state.event_counter,
            ErrorCode::EventDoesNotExist
        );
        
        // Validate event is not resolved
        require!(
            !event.resolved,
            ErrorCode::EventAlreadyResolved
        );
        
        // Validate betting period hasn't ended
        require!(
            clock.unix_timestamp < event.end_time,
            ErrorCode::BettingPeriodEnded
        );
        
        // Validate amount is greater than 0
        require!(
            amount > 0,
            ErrorCode::BetAmountMustBeGreaterThanZero
        );
        
        // Increment bet counter
        state.bet_counter = state.bet_counter.checked_add(1).unwrap();
        let bet_id = state.bet_counter;
        
        msg!("Placing bet: {} on event: {} for {} lamports", bet_id, event_id, amount);
        
        // Create bet record
        let bet = &mut ctx.accounts.bet;
        bet.bet_id = bet_id;
        bet.event_id = event_id;
        bet.bettor = ctx.accounts.bettor.key();
        bet.outcome = outcome;
        bet.amount = amount;
        bet.claimed = false;
        bet.bump = ctx.bumps.bet;
        
        // Update event totals
        if outcome {
            event.total_yes_bets = event.total_yes_bets.checked_add(1).unwrap();
            event.total_yes_amount = event.total_yes_amount.checked_add(amount).unwrap();
        } else {
            event.total_no_bets = event.total_no_bets.checked_add(1).unwrap();
            event.total_no_amount = event.total_no_amount.checked_add(amount).unwrap();
        }

        // Transfer SOL from bettor to event escrow
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.bettor.to_account_info(),
                to: ctx.accounts.event_escrow.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, amount)?;

        Ok(())
    }

    /// Resolve an event with final outcome (admin only)
    pub fn resolve_event(
        ctx: Context<ResolveEvent>,
        _event_id: u64,
        outcome: bool,
    ) -> Result<()> {
        let state = &ctx.accounts.program_state;
        let event = &mut ctx.accounts.event;
        
        // Only admin can resolve events
        require!(
            ctx.accounts.admin.key() == state.admin,
            ErrorCode::Unauthorized
        );
        
        // Validate event is not already resolved
        require!(
            !event.resolved,
            ErrorCode::EventAlreadyResolved
        );
        
        msg!("Resolving event: {} with outcome: {}", event.event_id, outcome);
        
        event.resolved = true;
        event.outcome = outcome;

        Ok(())
    }

    /// Claim winnings from a resolved event
    pub fn claim_winnings(ctx: Context<ClaimWinnings>, _event_id: u64, _bet_id: u64) -> Result<()> {
        let bet = &mut ctx.accounts.bet;
        let event = &ctx.accounts.event;
        
        msg!("Claiming winnings for bet: {}", bet.bet_id);
        
        // Validate event is resolved
        require!(
            event.resolved,
            ErrorCode::EventNotResolved
        );
        
        // Validate not already claimed
        require!(
            !bet.claimed,
            ErrorCode::AlreadyClaimed
        );
        
        // Validate caller is the bettor
        require!(
            bet.bettor == ctx.accounts.bettor.key(),
            ErrorCode::Unauthorized
        );
        
        // Validate bet won
        require!(
            bet.outcome == event.outcome,
            ErrorCode::LosingBet
        );

        // Calculate payout
        let total_pool = event.total_yes_amount.checked_add(event.total_no_amount).unwrap();
        let winning_pool = if event.outcome {
            event.total_yes_amount
        } else {
            event.total_no_amount
        };

        let payout = if winning_pool > 0 {
            (bet.amount as u128)
                .checked_mul(total_pool as u128)
                .unwrap()
                .checked_div(winning_pool as u128)
                .unwrap() as u64
        } else {
            bet.amount
        };
        
        msg!("Payout calculated: {} lamports", payout);

        // Transfer winnings from escrow to bettor
        **ctx.accounts.event_escrow.to_account_info().try_borrow_mut_lamports()? = ctx
            .accounts
            .event_escrow
            .to_account_info()
            .lamports()
            .checked_sub(payout)
            .unwrap();
        
        **ctx.accounts.bettor.to_account_info().try_borrow_mut_lamports()? = ctx
            .accounts
            .bettor
            .to_account_info()
            .lamports()
            .checked_add(payout)
            .unwrap();

        bet.claimed = true;

        Ok(())
    }
    
    /// Emergency withdraw for admin
    pub fn emergency_withdraw(ctx: Context<EmergencyWithdraw>, event_id: u64) -> Result<()> {
        let state = &ctx.accounts.program_state;
        
        // Only admin can emergency withdraw
        require!(
            ctx.accounts.admin.key() == state.admin,
            ErrorCode::Unauthorized
        );
        
        msg!("Emergency withdraw for event: {}", event_id);
        
        let escrow_balance = ctx.accounts.event_escrow.to_account_info().lamports();
        
        require!(
            escrow_balance > 0,
            ErrorCode::NoBalanceToWithdraw
        );
        
        // Transfer entire escrow balance to admin
        **ctx.accounts.event_escrow.to_account_info().try_borrow_mut_lamports()? = 0;
        **ctx.accounts.admin.to_account_info().try_borrow_mut_lamports()? = ctx
            .accounts
            .admin
            .to_account_info()
            .lamports()
            .checked_add(escrow_balance)
            .unwrap();
        
        Ok(())
    }
}

// ============================================================================
// Account Contexts
// ============================================================================

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + ProgramState::INIT_SPACE,
        seeds = [b"program_state"],
        bump
    )]
    pub program_state: Account<'info, ProgramState>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateEvent<'info> {
    #[account(
        mut,
        seeds = [b"program_state"],
        bump = program_state.bump
    )]
    pub program_state: Account<'info, ProgramState>,
    
    #[account(
        init,
        payer = admin,
        space = 8 + Event::INIT_SPACE,
        seeds = [b"event", (program_state.event_counter + 1).to_le_bytes().as_ref()],
        bump
    )]
    pub event: Account<'info, Event>,
    
    /// CHECK: This is the escrow account for holding bets
    #[account(
        seeds = [b"escrow", (program_state.event_counter + 1).to_le_bytes().as_ref()],
        bump
    )]
    pub event_escrow: AccountInfo<'info>,
    
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(event_id: u64, outcome: bool, amount: u64)]
pub struct PlaceBet<'info> {
    #[account(
        mut,
        seeds = [b"program_state"],
        bump = program_state.bump
    )]
    pub program_state: Account<'info, ProgramState>,
    
    #[account(
        mut,
        seeds = [b"event", event_id.to_le_bytes().as_ref()],
        bump = event.bump
    )]
    pub event: Account<'info, Event>,
    
    #[account(
        init,
        payer = bettor,
        space = 8 + Bet::INIT_SPACE,
        seeds = [b"bet", (program_state.bet_counter + 1).to_le_bytes().as_ref()],
        bump
    )]
    pub bet: Account<'info, Bet>,
    
    /// CHECK: This is the escrow account for holding bets
    #[account(
        mut,
        seeds = [b"escrow", event_id.to_le_bytes().as_ref()],
        bump
    )]
    pub event_escrow: AccountInfo<'info>,
    
    #[account(mut)]
    pub bettor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(event_id: u64)]
pub struct ResolveEvent<'info> {
    #[account(
        seeds = [b"program_state"],
        bump = program_state.bump
    )]
    pub program_state: Account<'info, ProgramState>,
    
    #[account(
        mut,
        seeds = [b"event", event_id.to_le_bytes().as_ref()],
        bump = event.bump
    )]
    pub event: Account<'info, Event>,
    
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(event_id: u64, bet_id: u64)]
pub struct ClaimWinnings<'info> {
    #[account(
        seeds = [b"event", event_id.to_le_bytes().as_ref()],
        bump = event.bump
    )]
    pub event: Account<'info, Event>,
    
    #[account(
        mut,
        seeds = [b"bet", bet_id.to_le_bytes().as_ref()],
        bump = bet.bump
    )]
    pub bet: Account<'info, Bet>,
    
    /// CHECK: This is the escrow account for holding bets
    #[account(
        mut,
        seeds = [b"escrow", event_id.to_le_bytes().as_ref()],
        bump
    )]
    pub event_escrow: AccountInfo<'info>,
    
    #[account(mut)]
    pub bettor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(event_id: u64)]
pub struct EmergencyWithdraw<'info> {
    #[account(
        seeds = [b"program_state"],
        bump = program_state.bump
    )]
    pub program_state: Account<'info, ProgramState>,
    
    /// CHECK: This is the escrow account for holding bets
    #[account(
        mut,
        seeds = [b"escrow", event_id.to_le_bytes().as_ref()],
        bump
    )]
    pub event_escrow: AccountInfo<'info>,
    
    #[account(mut)]
    pub admin: Signer<'info>,
}

// ============================================================================
// Account Structs
// ============================================================================

#[account]
#[derive(InitSpace)]
pub struct ProgramState {
    pub admin: Pubkey,
    pub event_counter: u64,
    pub bet_counter: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Event {
    pub event_id: u64,
    #[max_len(200)]
    pub name: String,
    pub end_time: i64,
    pub resolved: bool,
    pub outcome: bool,  // true = YES, false = NO
    pub total_yes_bets: u64,
    pub total_no_bets: u64,
    pub total_yes_amount: u64,
    pub total_no_amount: u64,
    pub creator: Pubkey,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Bet {
    pub bet_id: u64,
    pub event_id: u64,
    pub bettor: Pubkey,
    pub outcome: bool,  // true = YES, false = NO
    pub amount: u64,
    pub claimed: bool,
    pub bump: u8,
}

// ============================================================================
// Error Codes
// ============================================================================

#[error_code]
pub enum ErrorCode {
    #[msg("Only admin can perform this action")]
    Unauthorized,
    
    #[msg("Event has already been resolved")]
    EventAlreadyResolved,
    
    #[msg("Event has not been resolved yet")]
    EventNotResolved,
    
    #[msg("Winnings have already been claimed")]
    AlreadyClaimed,
    
    #[msg("This bet is on the losing outcome")]
    LosingBet,
    
    #[msg("Event does not exist")]
    EventDoesNotExist,
    
    #[msg("Betting period has ended")]
    BettingPeriodEnded,
    
    #[msg("Bet amount must be greater than zero")]
    BetAmountMustBeGreaterThanZero,
    
    #[msg("End time must be in the future")]
    EndTimeMustBeInFuture,
    
    #[msg("No balance to withdraw")]
    NoBalanceToWithdraw,
}
