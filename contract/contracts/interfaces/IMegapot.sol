// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IMegapot
 * @notice Interface for Megapot lottery protocol on Base
 * @dev Based on Megapot V1 interface
 */
interface IMegapot {

    /**
     * @notice Buy lottery tickets
     * @param amount Amount of USDC to spend on tickets
     * @param referrer Referrer address (use DefiCity treasury for referral fees)
     * @return ticketIds Array of purchased ticket IDs
     */
    function buyTickets(
        uint256 amount,
        address referrer
    ) external returns (uint256[] memory ticketIds);

    /**
     * @notice Claim winning tickets
     * @param ticketIds Array of ticket IDs to claim
     * @return totalPrize Total prize amount claimed
     */
    function claimPrizes(
        uint256[] calldata ticketIds
    ) external returns (uint256 totalPrize);

    /**
     * @notice Check if tickets are winners
     * @param ticketIds Array of ticket IDs to check
     * @return winningTickets Array of booleans (true if winning)
     * @return prizes Array of prize amounts for each ticket
     */
    function checkWinners(
        uint256[] calldata ticketIds
    ) external view returns (bool[] memory winningTickets, uint256[] memory prizes);

    /**
     * @notice Get ticket information
     * @param ticketId Ticket ID
     * @return owner Owner of the ticket
     * @return purchaseTime When ticket was purchased
     * @return claimed Whether prize has been claimed
     * @return drawId Draw ID this ticket belongs to
     */
    function getTicket(
        uint256 ticketId
    ) external view returns (
        address owner,
        uint256 purchaseTime,
        bool claimed,
        uint256 drawId
    );

    /**
     * @notice Get current jackpot amount
     * @return Jackpot in USDC
     */
    function getCurrentJackpot() external view returns (uint256);

    /**
     * @notice Get current draw ID
     * @return Current draw number
     */
    function getCurrentDrawId() external view returns (uint256);

    /**
     * @notice Get ticket price
     * @return Price per ticket in USDC
     */
    function getTicketPrice() external view returns (uint256);

    /**
     * @notice Get tickets owned by address
     * @param owner Address to check
     * @return ticketIds Array of ticket IDs owned
     */
    function getTicketsByOwner(
        address owner
    ) external view returns (uint256[] memory ticketIds);

    /**
     * @notice Get unclaimed winnings for address
     * @param owner Address to check
     * @return totalWinnings Total unclaimed prize amount
     */
    function getUnclaimedWinnings(
        address owner
    ) external view returns (uint256 totalWinnings);

    /**
     * @notice Payment token (USDC)
     * @return USDC token address
     */
    function paymentToken() external view returns (address);

    /**
     * @notice Minimum ticket purchase
     * @return Minimum number of tickets per purchase
     */
    function minTickets() external view returns (uint256);
}

/**
 * @title IMegapotReferral
 * @notice Interface for Megapot referral system
 */
interface IMegapotReferral {

    /**
     * @notice Register as a referrer
     * @param referralCode Unique referral code
     */
    function registerReferrer(string calldata referralCode) external;

    /**
     * @notice Get referral earnings
     * @param referrer Referrer address
     * @return Total referral earnings
     */
    function getReferralEarnings(address referrer) external view returns (uint256);

    /**
     * @notice Claim referral earnings
     */
    function claimReferralEarnings() external;

    /**
     * @notice Get referral code for address
     * @param referrer Address to check
     * @return Referral code
     */
    function getReferralCode(address referrer) external view returns (string memory);
}
