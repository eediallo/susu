// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IVault
 * @author SikaChain Team
 * @notice A universal interface for individual and group savings vaults.
 * It is designed to be token-agnostic, support fiat-to-crypto workflows,
 * and provide a consistent API for a seamless dApp experience.
 */
interface IVault {
    // --- Events for Off-Chain Indexing and Frontend Updates ---

    /**
     * @notice Emitted when a user deposits assets into the vault.
     * @param user The address of the depositor.
     * @param token The address of the token being deposited (address(0) for native POL/MATIC).
     * @param amount The amount of the token deposited.
     * @param memo An optional memo, useful for fiat transaction IDs or user notes.
     */
    event Deposited(address indexed user, address indexed token, uint256 amount, string memo);

    /**
     * @notice Emitted when a user withdraws assets from the vault.
     * @param user The address of the user withdrawing funds.
     * @param token The address of the token being withdrawn.
     * @param amount The amount of the token withdrawn.
     */
    event Withdrawn(address indexed user, address indexed token, uint256 amount);

    /**
     * @notice Emitted when a timelock is set or updated for a specific user.
     * @param user The user affected by the timelock.
     * @param releaseTime The new Unix timestamp when funds become available.
     */
    event TimelockSet(address indexed user, uint256 releaseTime);

    /**
     * @notice Emitted when a new member joins a group vault.
     * @param user The address of the new member.
     */
    event JoinedGroup(address indexed user);

    /**
     * @notice Emitted when a group vault advances to a new savings cycle (e.g., in a ROSCA).
     * @param newCycle The index of the new cycle.
     */
    event CycleAdvanced(uint256 newCycle);

    // --- Vault Metadata and Type Information ---

    /**
     * @notice Returns the type of vault, e.g., "individual" or "group".
     * @return A string memory identifying the vault's core logic.
     */
    function vaultType() external view returns (string memory);

    /**
     * @notice Returns UI/UX metadata as a JSON string for frontend use.
     * @dev Example: '{"localCurrency":"GHS","mappedAsset":"USDC"}'
     * @return A string memory containing helpful metadata for the frontend.
     */
    function metadata() external view returns (string memory);


    // --- Core Vault Mechanics ---

    /**
     * @notice Deposits a specified amount of an ERC-20 token or native asset.
     * @dev For native POL/MATIC deposits, `msg.value` must match `amount` and the token
     * address must be address(0). For ERC-20s, the contract must be pre-approved.
     * @param token The address of the ERC-20 token, or address(0) for the native asset.
     * @param amount The amount of tokens to deposit.
     * @param memo A string for attaching references like fiat transaction IDs.
     */
    function deposit(address token, uint256 amount, string memory memo) external payable;

    /**
     * @notice Withdraws a specified amount of a token from the user's balance.
     * @param token The address of the ERC-20 token, or address(0) for the native asset.
     * @param amount The amount of tokens to withdraw.
     */
    function withdraw(address token, uint256 amount) external;

    /**
     * @notice Retrieves the balance of a specific token for a given user.
     * @param token The address of the token to query.
     * @param user The address of the user whose balance is being checked.
     * @return The user's balance of the specified token.
     */
    function getBalance(address token, address user) external view returns (uint256);

    /**
     * @notice Retrieves the release time for a user's locked funds.
     * @param user The address of the user.
     * @return The Unix timestamp when the user's funds are unlocked.
     */
    function getReleaseTime(address user) external view returns (uint256);


    // --- Group Logic ---

    /**
     * @notice Returns an array of member addresses in a group vault.
     * @dev Individual vaults should return an empty array.
     * @return An array of member addresses.
     */
    function getMembers() external view returns (address[] memory);

    /**
     * @notice Returns the current savings cycle number for a group vault.
     * @dev Individual vaults should return 0.
     * @return The current cycle number.
     */
    function getCurrentCycle() external view returns (uint256);
}