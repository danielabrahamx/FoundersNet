"""
PredictionMarket - Algorand Smart Contract
Decentralized prediction market for startup outcomes

Migrated from Solidity/Polygon to Algorand Python
"""

from algopy import (
    ARC4Contract,
    Account,
    Asset,
    BoxMap,
    Global,
    Txn,
    UInt64,
    arc4,
    gtxn,
    itxn,
    log,
    urange,
)


class EventStruct(arc4.Struct):
    """Event structure for prediction events"""
    event_id: arc4.UInt64
    name: arc4.String
    end_time: arc4.UInt64
    resolved: arc4.Bool
    outcome: arc4.Bool
    total_yes_bets: arc4.UInt64
    total_no_bets: arc4.UInt64
    total_yes_amount: arc4.UInt64
    total_no_amount: arc4.UInt64


class BetStruct(arc4.Struct):
    """Bet structure for individual bets"""
    bet_id: arc4.UInt64
    event_id: arc4.UInt64
    bettor: arc4.Address
    outcome: arc4.Bool
    amount: arc4.UInt64
    claimed: arc4.Bool


class PredictionMarket(ARC4Contract):
    """
    Algorand-based prediction market smart contract
    
    Features:
    - Admin can create prediction events
    - Users can place bets (YES/NO) with ALGO
    - Admin can resolve events (with early resolution support)
    - Winners can claim proportional payouts
    """
    
    def __init__(self) -> None:
        """Initialize contract state variables"""
        # Global state variables
        self.admin = Account()
        self.event_counter = UInt64(0)
        self.bet_counter = UInt64(0)
        
        # Box storage for mappings
        self.events = BoxMap(arc4.UInt64, EventStruct)
        self.bets = BoxMap(arc4.UInt64, BetStruct)
        self.user_bets = BoxMap(arc4.Address, arc4.DynamicArray[arc4.UInt64])
        self.event_bets = BoxMap(arc4.UInt64, arc4.DynamicArray[arc4.UInt64])

    @arc4.abimethod(allow_actions=["NoOp"], create="require")
    def create_application(self, admin: Account) -> None:
        """
        Initialize the application
        Sets the admin address and initializes counters
        
        Args:
            admin: The account that will have admin privileges
        """
        self.admin = admin
        self.event_counter = UInt64(0)
        self.bet_counter = UInt64(0)

    @arc4.abimethod
    def create_event(self, name: arc4.String, end_time: arc4.UInt64) -> arc4.UInt64:
        """
        Create a new prediction event (admin only)
        
        Args:
            name: Name/description of the event
            end_time: Unix timestamp when betting ends
            
        Returns:
            The event ID of the newly created event
            
        Raises:
            Error if caller is not admin
            Error if end_time is not in the future
        """
        # Only admin can create events
        assert Txn.sender == self.admin, "Only admin can create events"
        
        # Validate end time is in the future
        assert end_time.native > Global.latest_timestamp, "End time must be in the future"
        
        # Increment event counter
        self.event_counter += UInt64(1)
        current_event_id = self.event_counter
        
        # Create new event struct
        new_event = EventStruct(
            event_id=arc4.UInt64(current_event_id),
            name=name,
            end_time=end_time,
            resolved=arc4.Bool(False),
            outcome=arc4.Bool(False),
            total_yes_bets=arc4.UInt64(0),
            total_no_bets=arc4.UInt64(0),
            total_yes_amount=arc4.UInt64(0),
            total_no_amount=arc4.UInt64(0),
        )
        
        # Store event in box storage
        self.events[arc4.UInt64(current_event_id)] = new_event.copy()
        
        # Initialize empty bet array for this event
        self.event_bets[arc4.UInt64(current_event_id)] = arc4.DynamicArray[arc4.UInt64]()
        
        # Log event creation (via transaction note)
        log(arc4.String("EventCreated").bytes + arc4.UInt64(current_event_id).bytes)
        
        return arc4.UInt64(current_event_id)

    @arc4.abimethod
    def place_bet(
        self,
        event_id: arc4.UInt64,
        outcome: arc4.Bool,
        payment: gtxn.PaymentTransaction,
    ) -> None:
        """
        Place a bet on an event
        
        This method expects to be called as part of an atomic transaction group
        where the first transaction is a payment to the application account.
        
        Args:
            event_id: ID of the event to bet on
            outcome: True for YES, False for NO
            payment: Payment transaction with the bet amount
            
        Raises:
            Error if event doesn't exist
            Error if event is already resolved
            Error if betting period has ended
            Error if payment amount is 0
            Error if payment receiver is not the application account
        """
        # Validate event exists
        assert event_id.native <= self.event_counter, "Event does not exist"
        
        # Get event from storage
        event = self.events[event_id].copy()
        
        # Validate event is not resolved
        assert not event.resolved.native, "Event is already resolved"
        
        # Validate betting period hasn't ended
        assert Global.latest_timestamp < event.end_time.native, "Event betting period has ended"
        
        # Validate payment
        assert payment.amount > 0, "Bet amount must be greater than 0"
        assert payment.receiver == Global.current_application_address, "Payment must be to app account"
        
        # Increment bet counter
        self.bet_counter += UInt64(1)
        current_bet_id = self.bet_counter
        
        # Create new bet struct
        new_bet = BetStruct(
            bet_id=arc4.UInt64(current_bet_id),
            event_id=event_id,
            bettor=arc4.Address(Txn.sender),
            outcome=outcome,
            amount=arc4.UInt64(payment.amount),
            claimed=arc4.Bool(False),
        )
        
        # Store bet in box storage
        self.bets[arc4.UInt64(current_bet_id)] = new_bet.copy()
        
        # Update user bets array
        bettor_address = arc4.Address(Txn.sender)
        if bettor_address in self.user_bets:
            user_bet_list = self.user_bets[bettor_address].copy()
            user_bet_list.append(arc4.UInt64(current_bet_id))
            self.user_bets[bettor_address] = user_bet_list.copy()
        else:
            new_list = arc4.DynamicArray[arc4.UInt64](arc4.UInt64(current_bet_id))
            self.user_bets[bettor_address] = new_list.copy()
        
        # Update event bets array
        event_bet_list = self.event_bets[event_id].copy()
        event_bet_list.append(arc4.UInt64(current_bet_id))
        self.event_bets[event_id] = event_bet_list.copy()
        
        # Update event totals
        if outcome.native:
            event.total_yes_bets = arc4.UInt64(event.total_yes_bets.native + 1)
            event.total_yes_amount = arc4.UInt64(event.total_yes_amount.native + payment.amount)
        else:
            event.total_no_bets = arc4.UInt64(event.total_no_bets.native + 1)
            event.total_no_amount = arc4.UInt64(event.total_no_amount.native + payment.amount)
        
        # Update event in storage
        self.events[event_id] = event.copy()
        
        # Log bet placement
        log(arc4.String("BetPlaced").bytes + arc4.UInt64(current_bet_id).bytes)

    @arc4.abimethod
    def resolve_event(self, event_id: arc4.UInt64, outcome: arc4.Bool) -> None:
        """
        Resolve an event with the final outcome (admin only)
        Admin can resolve early if needed (no endTime check)
        
        Args:
            event_id: ID of the event to resolve
            outcome: True for YES, False for NO
            
        Raises:
            Error if caller is not admin
            Error if event doesn't exist
            Error if event is already resolved
        """
        # Only admin can resolve events
        assert Txn.sender == self.admin, "Only admin can resolve events"
        
        # Validate event exists
        assert event_id.native <= self.event_counter, "Event does not exist"
        
        # Get event from storage
        event = self.events[event_id].copy()
        
        # Validate event is not already resolved
        assert not event.resolved.native, "Event already resolved"
        
        # Update event resolution
        event.resolved = arc4.Bool(True)
        event.outcome = outcome
        
        # Update event in storage
        self.events[event_id] = event.copy()
        
        # Log event resolution
        log(arc4.String("EventResolved").bytes + event_id.bytes)

    @arc4.abimethod
    def claim_winnings(self, bet_id: arc4.UInt64) -> None:
        """
        Claim winnings for a winning bet
        Sends payout from app account to the bettor via inner transaction
        
        Args:
            bet_id: ID of the bet to claim
            
        Raises:
            Error if bet doesn't exist
            Error if caller is not the bettor
            Error if winnings already claimed
            Error if event not resolved
            Error if bet did not win
        """
        # Validate bet exists
        assert bet_id.native <= self.bet_counter, "Bet does not exist"
        
        # Get bet from storage
        bet = self.bets[bet_id].copy()
        
        # Validate caller is the bettor
        assert Txn.sender == bet.bettor.native, "Not the bet owner"
        
        # Validate not already claimed
        assert not bet.claimed.native, "Winnings already claimed"
        
        # Get event from storage
        event = self.events[bet.event_id].copy()
        
        # Validate event is resolved
        assert event.resolved.native, "Event not resolved yet"
        
        # Validate bet won
        assert bet.outcome.native == event.outcome.native, "Bet did not win"
        
        # Calculate payout
        total_pool = event.total_yes_amount.native + event.total_no_amount.native
        winning_pool = event.total_yes_amount.native if bet.outcome.native else event.total_no_amount.native
        
        # Proportional payout: (bet_amount * total_pool) / winning_pool
        payout = (bet.amount.native * total_pool) // winning_pool
        
        # Mark bet as claimed
        bet.claimed = arc4.Bool(True)
        self.bets[bet_id] = bet.copy()
        
        # Send payout via inner transaction
        itxn.Payment(
            receiver=bet.bettor.native,
            amount=payout,
            fee=0,  # Use fee pooling from group
        ).submit()
        
        # Log winnings claimed
        log(arc4.String("WinningsClaimed").bytes + bet_id.bytes)

    @arc4.abimethod(readonly=True)
    def get_user_bets(self, user: arc4.Address) -> arc4.DynamicArray[BetStruct]:
        """
        Get all bets for a user
        
        Args:
            user: Address of the user
            
        Returns:
            Array of Bet structs for the user
        """
        result = arc4.DynamicArray[BetStruct]()
        
        if user in self.user_bets:
            bet_ids = self.user_bets[user].copy()
            for i in urange(bet_ids.length):
                bet_id = bet_ids[i]
                if bet_id.native <= self.bet_counter:
                    bet = self.bets[bet_id].copy()
                    result.append(bet.copy())
        
        return result

    @arc4.abimethod(readonly=True)
    def get_total_bets(self, event_id: arc4.UInt64) -> arc4.Tuple[arc4.UInt64, arc4.UInt64]:
        """
        Get total bet counts for an event
        
        Args:
            event_id: ID of the event
            
        Returns:
            Tuple of (yes_bets, no_bets)
            
        Raises:
            Error if event doesn't exist
        """
        assert event_id.native <= self.event_counter, "Event does not exist"
        
        event = self.events[event_id].copy()
        return arc4.Tuple((event.total_yes_bets, event.total_no_bets))

    @arc4.abimethod(readonly=True)
    def get_event(self, event_id: arc4.UInt64) -> EventStruct:
        """
        Get event details
        
        Args:
            event_id: ID of the event
            
        Returns:
            Event struct with all event data
            
        Raises:
            Error if event doesn't exist
        """
        assert event_id.native <= self.event_counter, "Event does not exist"
        return self.events[event_id].copy()

    @arc4.abimethod(readonly=True)
    def get_all_events(self) -> arc4.DynamicArray[EventStruct]:
        """
        Get all events
        
        Returns:
            Array of all Event structs
        """
        result = arc4.DynamicArray[EventStruct]()
        
        for i in urange(1, self.event_counter + 1):
            event_id = arc4.UInt64(i)
            event = self.events[event_id].copy()
            result.append(event.copy())
        
        return result

    @arc4.abimethod(readonly=True)
    def get_contract_balance(self) -> arc4.UInt64:
        """
        Get contract/app account balance
        
        Returns:
            Current balance of the application account in microAlgos
        """
        return arc4.UInt64(Global.current_application_address.balance)

    @arc4.abimethod
    def emergency_withdraw(self) -> None:
        """
        Emergency withdraw function for admin
        Transfers entire app balance to admin account
        
        Raises:
            Error if caller is not admin
        """
        # Only admin can emergency withdraw
        assert Txn.sender == self.admin, "Only admin can emergency withdraw"
        
        # Get current balance (minus minimum balance requirement)
        current_balance = Global.current_application_address.balance
        min_balance = Global.min_balance
        withdrawal_amount = current_balance - min_balance
        
        assert withdrawal_amount > 0, "No balance to withdraw"
        
        # Send funds via inner transaction
        itxn.Payment(
            receiver=self.admin,
            amount=withdrawal_amount,
            fee=0,  # Use fee pooling from group
        ).submit()
        
        # Log emergency withdrawal
        log(arc4.String("EmergencyWithdraw").bytes)

    @arc4.abimethod(readonly=True)
    def get_admin(self) -> arc4.Address:
        """
        Get the admin address
        
        Returns:
            Address of the admin account
        """
        return arc4.Address(self.admin)

    @arc4.abimethod(readonly=True)
    def get_event_counter(self) -> arc4.UInt64:
        """
        Get the current event counter
        
        Returns:
            Number of events created
        """
        return arc4.UInt64(self.event_counter)

    @arc4.abimethod(readonly=True)
    def get_bet_counter(self) -> arc4.UInt64:
        """
        Get the current bet counter
        
        Returns:
            Number of bets placed
        """
        return arc4.UInt64(self.bet_counter)
