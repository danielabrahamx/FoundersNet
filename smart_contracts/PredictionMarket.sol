// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PredictionMarket
 * @dev Decentralized prediction market for startup outcomes
 */
contract PredictionMarket {
    
    // Structs
    struct Event {
        uint256 id;
        string name;
        uint256 endTime;
        bool resolved;
        bool outcome;
        uint256 totalYesBets;
        uint256 totalNoBets;
        uint256 totalYesAmount;
        uint256 totalNoAmount;
    }
    
    struct Bet {
        uint256 betId;
        uint256 eventId;
        address bettor;
        bool outcome;
        uint256 amount;
        bool claimed;
    }
    
    // State variables
    address public admin;
    uint256 public eventCounter;
    uint256 public betCounter;
    
    mapping(uint256 => Event) public events;
    mapping(uint256 => Bet) public bets;
    mapping(address => uint256[]) public userBets;
    mapping(uint256 => uint256[]) public eventBets;
    
    // Events
    event EventCreated(uint256 indexed eventId, string name, uint256 endTime);
    event BetPlaced(uint256 indexed betId, uint256 indexed eventId, address indexed bettor, bool outcome, uint256 amount);
    event EventResolved(uint256 indexed eventId, bool outcome);
    event WinningsClaimed(uint256 indexed betId, address indexed winner, uint256 amount);
    
    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    modifier eventExists(uint256 eventId) {
        require(eventId > 0 && eventId <= eventCounter, "Event does not exist");
        _;
    }
    
    modifier eventOpen(uint256 eventId) {
        require(!events[eventId].resolved, "Event is already resolved");
        require(block.timestamp < events[eventId].endTime, "Event betting period has ended");
        _;
    }
    
    constructor() {
        admin = msg.sender;
    }
    
    /**
     * @dev Create a new prediction event
     * @param name Name of the event
     * @param endTime Unix timestamp when betting ends
     */
    function createEvent(string memory name, uint256 endTime) external onlyAdmin returns (uint256) {
        require(endTime > block.timestamp, "End time must be in the future");
        
        eventCounter++;
        
        events[eventCounter] = Event({
            id: eventCounter,
            name: name,
            endTime: endTime,
            resolved: false,
            outcome: false,
            totalYesBets: 0,
            totalNoBets: 0,
            totalYesAmount: 0,
            totalNoAmount: 0
        });
        
        emit EventCreated(eventCounter, name, endTime);
        
        return eventCounter;
    }
    
    /**
     * @dev Place a bet on an event
     * @param eventId ID of the event to bet on
     * @param outcome true for YES, false for NO
     */
    function placeBet(uint256 eventId, bool outcome) 
        external 
        payable 
        eventExists(eventId) 
        eventOpen(eventId) 
    {
        require(msg.value > 0, "Bet amount must be greater than 0");
        
        betCounter++;
        
        bets[betCounter] = Bet({
            betId: betCounter,
            eventId: eventId,
            bettor: msg.sender,
            outcome: outcome,
            amount: msg.value,
            claimed: false
        });
        
        userBets[msg.sender].push(betCounter);
        eventBets[eventId].push(betCounter);
        
        if (outcome) {
            events[eventId].totalYesBets++;
            events[eventId].totalYesAmount += msg.value;
        } else {
            events[eventId].totalNoBets++;
            events[eventId].totalNoAmount += msg.value;
        }
        
        emit BetPlaced(betCounter, eventId, msg.sender, outcome, msg.value);
    }
    
    /**
     * @dev Resolve an event with the final outcome (admin can resolve early if needed)
     * @param eventId ID of the event to resolve
     * @param outcome true for YES, false for NO
     */
    function resolveEvent(uint256 eventId, bool outcome) 
        external 
        onlyAdmin 
        eventExists(eventId) 
    {
        require(!events[eventId].resolved, "Event already resolved");
        // Removed endTime check - admin can resolve early if needed
        
        events[eventId].resolved = true;
        events[eventId].outcome = outcome;
        
        emit EventResolved(eventId, outcome);
    }
    
    /**
     * @dev Claim winnings for a winning bet
     * @param betId ID of the bet to claim
     */
    function claimWinnings(uint256 betId) external {
        require(betId > 0 && betId <= betCounter, "Bet does not exist");
        
        Bet storage bet = bets[betId];
        require(bet.bettor == msg.sender, "Not the bet owner");
        require(!bet.claimed, "Winnings already claimed");
        
        Event storage betEvent = events[bet.eventId];
        require(betEvent.resolved, "Event not resolved yet");
        require(bet.outcome == betEvent.outcome, "Bet did not win");
        
        bet.claimed = true;
        
        // Calculate payout
        uint256 totalPool = betEvent.totalYesAmount + betEvent.totalNoAmount;
        uint256 winningPool = bet.outcome ? betEvent.totalYesAmount : betEvent.totalNoAmount;
        uint256 payout = (bet.amount * totalPool) / winningPool;
        
        // Transfer winnings
        (bool success, ) = payable(msg.sender).call{value: payout}("");
        require(success, "Transfer failed");
        
        emit WinningsClaimed(betId, msg.sender, payout);
    }
    
    /**
     * @dev Get all bets for a user
     * @param user Address of the user
     * @return Array of Bet structs
     */
    function getUserBets(address user) external view returns (Bet[] memory) {
        uint256[] memory betIds = userBets[user];
        Bet[] memory userBetsList = new Bet[](betIds.length);
        
        for (uint256 i = 0; i < betIds.length; i++) {
            userBetsList[i] = bets[betIds[i]];
        }
        
        return userBetsList;
    }
    
    /**
     * @dev Get total bet counts for an event
     * @param eventId ID of the event
     * @return yesBets Number of YES bets
     * @return noBets Number of NO bets
     */
    function getTotalBets(uint256 eventId) 
        external 
        view 
        eventExists(eventId) 
        returns (uint256 yesBets, uint256 noBets) 
    {
        return (events[eventId].totalYesBets, events[eventId].totalNoBets);
    }
    
    /**
     * @dev Get event details
     * @param eventId ID of the event
     * @return Event struct
     */
    function getEvent(uint256 eventId) 
        external 
        view 
        eventExists(eventId) 
        returns (Event memory) 
    {
        return events[eventId];
    }
    
    /**
     * @dev Get all events (for admin/frontend)
     * @return Array of all events
     */
    function getAllEvents() external view returns (Event[] memory) {
        Event[] memory allEvents = new Event[](eventCounter);
        
        for (uint256 i = 1; i <= eventCounter; i++) {
            allEvents[i - 1] = events[i];
        }
        
        return allEvents;
    }
    
    /**
     * @dev Emergency withdraw function for admin
     */
    function emergencyWithdraw() external onlyAdmin {
        (bool success, ) = payable(admin).call{value: address(this).balance}("");
        require(success, "Transfer failed");
    }
    
    /**
     * @dev Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
