// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SafeMath (for Modern Solidity)
 * @author Don Aborah
 * @notice This file is intentionally left mostly empty to serve as an educational placeholder.
 *
 * WHY THIS FILE IS NOT NEEDED:
 *
 * In older versions of Solidity (before 0.8.0), developers had to manually check for
 * integer overflows and underflows (e.g., when a number gets too large and wraps
 * around to zero). The SafeMath library from OpenZeppelin was the industry standard
 * solution to prevent these critical bugs.
 *
 * However, starting from Solidity version 0.8.0, the compiler automatically includes
 * these checks on all standard arithmetic operations (+, -, *, /). If an overflow or
 * underflow occurs, the transaction will automatically revert.
 *
 * Since your project uses `pragma solidity ^0.8.20;`, your contracts are already
 * protected against these issues by default. Including a SafeMath library would be
 * redundant and is no longer considered a best practice.
 *
 * RECOMMENDATION:
 * You can safely delete this `SafeMath.sol` file from your `/contracts/utils/` directory.
 * Your existing contracts are already secure in this regard.
 */
library SafeMath {
    // This library is intentionally left empty.
    // The built-in compiler checks in Solidity v0.8.0+ have made it obsolete.
}
