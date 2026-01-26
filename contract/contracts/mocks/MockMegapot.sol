// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IMegapot.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MockMegapot
 * @notice Full simulation mock of Megapot lottery protocol for testing
 * @dev Implements ticket purchase, winner selection, and prize claims
 */
contract MockMegapot is IMegapot {

    // ============ Structs ============

    struct Ticket {
        address owner;
        uint256 purchaseTime;
        bool claimed;
        uint256 drawId;
        uint256 prizeAmount; // Set by admin/test for winners
    }

    // ============ State Variables ============

    // Ticket tracking
    mapping(uint256 => Ticket) public tickets;
    uint256 public ticketIdCounter;

    // Draw management
    uint256 public currentDrawId = 1;
    uint256 public jackpotAmount;
    uint256 public ticketPrice = 1e6; // 1 USDC (6 decimals)

    // User ticket ownership
    mapping(address => uint256[]) private userTicketIds;

    // Referral tracking
    mapping(address => uint256) public referralEarnings;
    uint256 public referralBps = 500; // 5% referral fee

    // Payment token (USDC)
    address public immutable paymentToken;

    // Minimum tickets per purchase
    uint256 public minTickets = 1;

    // Constants
    uint256 public constant BASIS_POINTS = 10000;

    // ============ Events ============

    event TicketsPurchased(
        address indexed buyer,
        uint256[] ticketIds,
        uint256 amount,
        address indexed referrer,
        uint256 drawId
    );

    event PrizesClaimed(
        address indexed winner,
        uint256[] ticketIds,
        uint256 totalPrize
    );

    event DrawAdvanced(
        uint256 oldDrawId,
        uint256 newDrawId,
        uint256 jackpot
    );

    event WinnerSet(
        uint256 indexed ticketId,
        uint256 prizeAmount
    );

    // ============ Constructor ============

    constructor(address _paymentToken) {
        require(_paymentToken != address(0), "Invalid payment token");
        paymentToken = _paymentToken;
    }

    // ============ IMegapot Implementation ============

    function buyTickets(
        uint256 amount,
        address referrer
    ) external override returns (uint256[] memory ticketIds) {
        require(amount >= ticketPrice * minTickets, "Below minimum purchase");
        require(amount % ticketPrice == 0, "Amount must be multiple of ticket price");

        uint256 numTickets = amount / ticketPrice;
        ticketIds = new uint256[](numTickets);

        // Transfer USDC from buyer
        IERC20(paymentToken).transferFrom(msg.sender, address(this), amount);

        // Calculate referral fee
        uint256 referralFee = 0;
        if (referrer != address(0) && referrer != msg.sender) {
            referralFee = (amount * referralBps) / BASIS_POINTS;
            referralEarnings[referrer] += referralFee;
        }

        // Add to jackpot (minus referral fee)
        jackpotAmount += (amount - referralFee);

        // Mint tickets
        for (uint256 i = 0; i < numTickets; i++) {
            ticketIdCounter++;
            uint256 ticketId = ticketIdCounter;

            tickets[ticketId] = Ticket({
                owner: msg.sender,
                purchaseTime: block.timestamp,
                claimed: false,
                drawId: currentDrawId,
                prizeAmount: 0 // Set to 0, will be updated if winner
            });

            userTicketIds[msg.sender].push(ticketId);
            ticketIds[i] = ticketId;
        }

        emit TicketsPurchased(msg.sender, ticketIds, amount, referrer, currentDrawId);
        return ticketIds;
    }

    function claimPrizes(
        uint256[] calldata ticketIds
    ) external override returns (uint256 totalPrize) {
        totalPrize = 0;

        for (uint256 i = 0; i < ticketIds.length; i++) {
            uint256 ticketId = ticketIds[i];
            Ticket storage ticket = tickets[ticketId];

            require(ticket.owner == msg.sender, "Not ticket owner");
            require(!ticket.claimed, "Already claimed");
            require(ticket.prizeAmount > 0, "Not a winning ticket");

            // Mark as claimed
            ticket.claimed = true;
            totalPrize += ticket.prizeAmount;
        }

        require(totalPrize > 0, "No prizes to claim");
        require(totalPrize <= jackpotAmount, "Insufficient jackpot");

        // Deduct from jackpot
        jackpotAmount -= totalPrize;

        // Transfer prize
        IERC20(paymentToken).transfer(msg.sender, totalPrize);

        emit PrizesClaimed(msg.sender, ticketIds, totalPrize);
        return totalPrize;
    }

    function checkWinners(
        uint256[] calldata ticketIds
    ) external view override returns (bool[] memory winningTickets, uint256[] memory prizes) {
        winningTickets = new bool[](ticketIds.length);
        prizes = new uint256[](ticketIds.length);

        for (uint256 i = 0; i < ticketIds.length; i++) {
            Ticket memory ticket = tickets[ticketIds[i]];
            winningTickets[i] = ticket.prizeAmount > 0 && !ticket.claimed;
            prizes[i] = ticket.prizeAmount;
        }

        return (winningTickets, prizes);
    }

    function getTicket(
        uint256 ticketId
    ) external view override returns (
        address owner,
        uint256 purchaseTime,
        bool claimed,
        uint256 drawId
    ) {
        Ticket memory ticket = tickets[ticketId];
        return (ticket.owner, ticket.purchaseTime, ticket.claimed, ticket.drawId);
    }

    function getCurrentJackpot() external view override returns (uint256) {
        return jackpotAmount;
    }

    function getCurrentDrawId() external view override returns (uint256) {
        return currentDrawId;
    }

    function getTicketPrice() external view override returns (uint256) {
        return ticketPrice;
    }

    function getTicketsByOwner(
        address owner
    ) external view override returns (uint256[] memory ticketIds) {
        return userTicketIds[owner];
    }

    function getUnclaimedWinnings(
        address owner
    ) external view override returns (uint256 totalWinnings) {
        uint256[] memory ownerTickets = userTicketIds[owner];
        totalWinnings = 0;

        for (uint256 i = 0; i < ownerTickets.length; i++) {
            Ticket memory ticket = tickets[ownerTickets[i]];
            if (!ticket.claimed && ticket.prizeAmount > 0) {
                totalWinnings += ticket.prizeAmount;
            }
        }

        return totalWinnings;
    }

    // ============ Test Helper Functions ============

    /**
     * @notice Manually set a ticket as winner (for testing)
     * @param ticketId Ticket ID to mark as winner
     * @param prizeAmount Prize amount for this ticket
     */
    function setWinningTicket(uint256 ticketId, uint256 prizeAmount) external {
        require(tickets[ticketId].owner != address(0), "Ticket does not exist");
        require(!tickets[ticketId].claimed, "Already claimed");

        tickets[ticketId].prizeAmount = prizeAmount;

        emit WinnerSet(ticketId, prizeAmount);
    }

    /**
     * @notice Set multiple tickets as winners in batch
     */
    function setWinningTickets(
        uint256[] calldata ticketIds,
        uint256[] calldata prizeAmounts
    ) external {
        require(ticketIds.length == prizeAmounts.length, "Length mismatch");

        for (uint256 i = 0; i < ticketIds.length; i++) {
            require(tickets[ticketIds[i]].owner != address(0), "Ticket does not exist");
            require(!tickets[ticketIds[i]].claimed, "Already claimed");

            tickets[ticketIds[i]].prizeAmount = prizeAmounts[i];
            emit WinnerSet(ticketIds[i], prizeAmounts[i]);
        }
    }

    /**
     * @notice Advance to next draw
     */
    function advanceDraw() external {
        uint256 oldDrawId = currentDrawId;
        currentDrawId++;

        emit DrawAdvanced(oldDrawId, currentDrawId, jackpotAmount);
    }

    /**
     * @notice Set ticket price
     */
    function setTicketPrice(uint256 _ticketPrice) external {
        ticketPrice = _ticketPrice;
    }

    /**
     * @notice Set referral fee percentage
     */
    function setReferralBps(uint256 _referralBps) external {
        require(_referralBps <= 1000, "Max 10%"); // Max 10% referral
        referralBps = _referralBps;
    }

    /**
     * @notice Add funds to jackpot (for testing)
     */
    function addToJackpot(uint256 amount) external {
        IERC20(paymentToken).transferFrom(msg.sender, address(this), amount);
        jackpotAmount += amount;
    }

    /**
     * @notice Get ticket details including prize amount
     */
    function getTicketDetails(uint256 ticketId) external view returns (Ticket memory) {
        return tickets[ticketId];
    }

    /**
     * @notice Claim referral earnings
     */
    function claimReferralEarnings() external {
        uint256 earnings = referralEarnings[msg.sender];
        require(earnings > 0, "No earnings to claim");

        referralEarnings[msg.sender] = 0;
        IERC20(paymentToken).transfer(msg.sender, earnings);
    }
}
