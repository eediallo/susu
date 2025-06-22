// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockToken
 * @notice A simple ERC20 token for testing purposes. It includes a public
 * mint function to easily distribute tokens to test accounts.
 */
contract MockToken is ERC20 {
    constructor() ERC20("Mock Token", "MTK") {}

    /**
     * @notice Creates `amount` tokens and assigns them to `to`, increasing
     * the total supply.
     * @param to The address that will receive the minted tokens.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}