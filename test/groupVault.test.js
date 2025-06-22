const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SusuGroupVault", function () {
    let groupVault, mockToken, admin, member1, member2, nonMember;
    const NATIVE_TOKEN_ADDRESS = ethers.ZeroAddress;

    // This hook runs before each test, deploying fresh contracts
    beforeEach(async function () {
        [admin, member1, member2, nonMember] = await ethers.getSigners();

        // Deploy the MockToken for ERC-20 tests
        const MockTokenFactory = await ethers.getContractFactory("MockToken");
        mockToken = await MockTokenFactory.deploy();

        // Deploy the SusuGroupVault with 'admin' as the initial administrator
        const SusuGroupVaultFactory = await ethers.getContractFactory("SusuGroupVault");
        groupVault = await SusuGroupVaultFactory.deploy(admin.address);
    });

    describe("Deployment", function () {
        it("Should set the right admin with both ADMIN and DEFAULT_ADMIN roles", async function () {
            const ADMIN_ROLE = await groupVault.ADMIN_ROLE();
            const DEFAULT_ADMIN_ROLE = await groupVault.DEFAULT_ADMIN_ROLE();
            expect(await groupVault.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
            expect(await groupVault.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
        });

        it("Should start with no members", async function () {
            expect(await groupVault.getMembers()).to.be.an('array').that.is.empty;
        });

        it("Should return 'group' for the vaultType", async function() {
            expect(await groupVault.vaultType()).to.equal("group");
        });
    });

    describe("Member Management", function () {
        it("Should allow an admin to add and remove a member", async function () {
            // Add member
            await expect(groupVault.connect(admin).addMember(member1.address))
                .to.emit(groupVault, "JoinedGroup").withArgs(member1.address);
            
            expect(await groupVault.hasRole(await groupVault.MEMBER_ROLE(), member1.address)).to.be.true;
            expect(await groupVault.getMembers()).to.include(member1.address);

            // Remove member
            await expect(groupVault.connect(admin).removeMember(member1.address))
                .to.emit(groupVault, "LeftGroup").withArgs(member1.address);
            
            expect(await groupVault.hasRole(await groupVault.MEMBER_ROLE(), member1.address)).to.be.false;
            expect(await groupVault.getMembers()).to.not.include(member1.address);
        });

        it("Should revert if a non-admin tries to add a member", async function () {
            await expect(groupVault.connect(nonMember).addMember(member1.address))
                .to.be.revertedWithCustomError(groupVault, 'AccessControlUnauthorizedAccount')
                .withArgs(nonMember.address, await groupVault.ADMIN_ROLE());
        });

        it("Should revert when adding an existing member", async function () {
            await groupVault.connect(admin).addMember(member1.address);
            await expect(groupVault.connect(admin).addMember(member1.address))
                .to.be.revertedWith("SusuGroupVault: Member already exists");
        });
    });

    describe("Deposit Functionality", function () {
        const depositAmount = ethers.parseEther("1.0");

        beforeEach(async function () {
            // Make member1 an official member of the group before they can deposit
            await groupVault.connect(admin).addMember(member1.address);
        });

        it("Should allow a member to deposit native assets", async function () {
            await expect(groupVault.connect(member1).deposit(NATIVE_TOKEN_ADDRESS, depositAmount, "group deposit", { value: depositAmount }))
                .to.emit(groupVault, "Deposited");
            expect(await groupVault.getBalance(NATIVE_TOKEN_ADDRESS, member1.address)).to.equal(depositAmount);
        });

        it("Should revert if a non-member tries to deposit", async function () {
            await expect(groupVault.connect(nonMember).deposit(NATIVE_TOKEN_ADDRESS, depositAmount, "fail deposit", { value: depositAmount }))
                .to.be.revertedWith("SusuGroupVault: Caller is not a member");
        });
    });

    describe("Distribution Functionality", function () {
        const nativeDeposit = ethers.parseEther("10.0");
        const erc20Deposit = ethers.parseUnits("500", 18);

        beforeEach(async function () {
            // Add admin and members to the group
            await groupVault.connect(admin).addMember(admin.address);
            await groupVault.connect(admin).addMember(member1.address);

            // Admin deposits native assets into the vault for distribution
            await groupVault.connect(admin).deposit(NATIVE_TOKEN_ADDRESS, nativeDeposit, "seed funds", { value: nativeDeposit });

            // Admin deposits ERC-20 tokens into the vault
            await mockToken.mint(admin.address, erc20Deposit);
            await mockToken.connect(admin).approve(groupVault.target, erc20Deposit);
            await groupVault.connect(admin).deposit(mockToken.target, erc20Deposit, "seed erc20");
        });

        it("Should allow an admin to distribute native funds to a member", async function () {
            const amount = ethers.parseEther("1.0");
            await expect(() => groupVault.connect(admin).distributeFunds(member1.address, amount))
                .to.changeEtherBalances([groupVault, member1], [-amount, amount]);
        });
        
        it("Should revert if a non-admin tries to distribute funds", async function () {
            const amount = ethers.parseEther("1.0");
            await expect(groupVault.connect(nonMember).distributeFunds(member1.address, amount))
                .to.be.revertedWithCustomError(groupVault, 'AccessControlUnauthorizedAccount');
        });

        it("Should revert when distributing funds to a non-member", async function () {
            const amount = ethers.parseEther("1.0");
            await expect(groupVault.connect(admin).distributeFunds(nonMember.address, amount))
                .to.be.revertedWith("SusuGroupVault: Recipient is not a member");
        });

        // This would require modifying the contract to handle multi-token distribution
        // For now, this test assumes a contract modification to accept a token address
        it("Should allow an admin to distribute ERC-20 funds if contract is modified", async function () {
            // This test is a placeholder for if you extend distributeFunds to handle ERC-20s
            // For example: distributeFunds(address token, address recipient, uint256 amount)
            // As the current contract only distributes native assets, this test is conceptual.
            const amount = ethers.parseUnits("50", 18);
            
            // To make this test pass, you would need to modify the `distributeFunds` function
            // in your SusuGroupVault.sol to accept a token address and transfer that token.
            // For now, we expect it to fail if called on the current contract.
            // This is left as an example for future extension.
        });
    });
});