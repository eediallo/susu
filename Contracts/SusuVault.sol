// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IVault.sol";

/**
 * @title SusuVault
 * @author Don Aborah
 * @notice A comprehensive individual savings vault implementation adhering to the IVault interface.
 * This contract supports deposits and withdrawals of native assets (POL/MATIC) and ERC-20 tokens,
 * and includes features like owner-controlled user-specific timelocks and an emergency pause mechanism.
 */
contract SusuVault is IVault, Ownable, ReentrancyGuard, Pausable {
    // --- Custom Errors ---
    error ZeroAmount();
    error NativeValueMismatch();
    error ERC20TransferFailed();
    error InsufficientBalance(uint256 available, uint256 required);
    error FundsAreTimelocked(uint256 releaseTime, uint256 currentTime);
    error NativeTransferFailed();

    // --- State Variables ---
    mapping(address => mapping(address => uint256)) private _balances;
    mapping(address => uint256) private _releaseTimes;

    // --- Constructor ---
    constructor(address initialOwner) Ownable(initialOwner) {}

    // --- Core Vault Mechanics ---
    function deposit(address token, uint256 amount, string memory memo) public payable virtual override whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        if (token == address(0)) {
            if (msg.value != amount) revert NativeValueMismatch();
        } else {
            if (msg.value != 0) revert NativeValueMismatch();
            try IERC20(token).transferFrom(msg.sender, address(this), amount) {} catch {
                revert ERC20TransferFailed();
            }
        }
        _balances[token][msg.sender] += amount;
        emit Deposited(msg.sender, token, amount, memo);
    }

    function withdraw(address token, uint256 amount) external nonReentrant override whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        uint256 userBalance = _balances[token][msg.sender];
        if (userBalance < amount) revert InsufficientBalance({ available: userBalance, required: amount });
        if (block.timestamp < _releaseTimes[msg.sender]) revert FundsAreTimelocked({ releaseTime: _releaseTimes[msg.sender], currentTime: block.timestamp });

        _balances[token][msg.sender] -= amount;

        if (token == address(0)) {
            (bool success, ) = payable(msg.sender).call{value: amount}("");
            if (!success) revert NativeTransferFailed();
        } else {
            try IERC20(token).transfer(msg.sender, amount) {} catch {
                revert ERC20TransferFailed();
            }
        }
        emit Withdrawn(msg.sender, token, amount);
    }

    // --- Admin Functions ---
    function setTimelock(address user, uint256 releaseTime) public onlyOwner {
        _releaseTimes[user] = releaseTime;
        emit TimelockSet(user, releaseTime);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    // --- View Functions ---
    function getBalance(address token, address user) external view override returns (uint256) {
        return _balances[token][user];
    }

    function getReleaseTime(address user) external view override returns (uint256) {
        return _releaseTimes[user];
    }

    function vaultType() public view virtual override returns (string memory) {
        return "individual";
    }

    function metadata() external pure override returns (string memory) {
        return '{"localCurrency":"USD","mappedAsset":"USDC"}';
    }

    // --- Group Logic (Placeholders) ---
    function getMembers() public view virtual override returns (address[] memory) {
        return new address[](0);
    }

    function getCurrentCycle() external pure override returns (uint256) {
        return 0;
    }
}
