// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SusuVault.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IVault.sol";

/**
 * @title SusuGroupVault
 * @author Susu 
 Team
 * @notice A group savings vault implementation extending SusuVault with role-based access control.
 * This contract allows for managing group members and distributing funds among them.
 */
contract SusuGroupVault is SusuVault, AccessControl {
    // --- Roles ---
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MEMBER_ROLE = keccak256("MEMBER_ROLE");

    // --- State Variables ---
    address[] private _members;
    mapping(address => bool) private _isMember;

    // --- Events ---
    event LeftGroup(address indexed member);

    // --- Constructor ---
    constructor(address initialAdmin) SusuVault(initialAdmin) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(ADMIN_ROLE, initialAdmin);
    }

    // --- Member Management Functions ---
    function addMember(address newMember) public onlyRole(ADMIN_ROLE) {
        require(!_isMember[newMember], "SusuGroupVault: Member already exists");
        _grantRole(MEMBER_ROLE, newMember);
        _members.push(newMember);
        _isMember[newMember] = true;
        emit JoinedGroup(newMember);
    }

    function removeMember(address member) public onlyRole(ADMIN_ROLE) {
        require(_isMember[member], "SusuGroupVault: Member does not exist");
        _revokeRole(MEMBER_ROLE, member);
        _isMember[member] = false;

        // Simple removal from array (not gas efficient for large arrays, but sufficient for now)
        for (uint i = 0; i < _members.length; i++) {
            if (_members[i] == member) {
                _members[i] = _members[_members.length - 1];
                _members.pop();
                break;
            }
        }
        emit LeftGroup(member);
    }

    // --- Overridden Functions ---
    function deposit(address token, uint256 amount, string memory memo) public payable override {
        require(hasRole(MEMBER_ROLE, msg.sender), "SusuGroupVault: Caller is not a member");
        super.deposit(token, amount, memo);
    }

    function vaultType() public pure override returns (string memory) {
        return "group";
    }

    function getMembers() public view override returns (address[] memory) {
        return _members;
    }

    // --- Batch Transaction Function ---
    function distributeFunds(address payable recipient, uint256 amount) public onlyRole(ADMIN_ROLE) {
        require(hasRole(MEMBER_ROLE, recipient), "SusuGroupVault: Recipient is not a member");
        require(amount > 0, "SusuGroupVault: Amount must be greater than zero");

        // Assuming native asset distribution for simplicity as per plan
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "SusuGroupVault: Native transfer failed");
    }

    // The following functions are inherited from SusuVault and AccessControl
    // and do not need to be explicitly overridden unless their behavior changes.
    // withdraw, setTimelock, pause, unpause, getBalance, getReleaseTime, metadata
}
