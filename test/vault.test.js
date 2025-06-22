const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

// Comprehensive test suite for the SusuVault contract
describe("SusuVault", function () {
    let vault, mockToken, owner, user1, user2;
    const NATIVE_TOKEN_ADDRESS = ethers.ZeroAddress;

    // Hook that runs before each test, deploying fresh contracts
    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        const MockTokenFactory = await ethers.getContractFactory("MockToken");
        mockToken = await MockTokenFactory.deploy();

        const SusuVaultFactory = await ethers.getContractFactory("SusuVault");
        vault = await SusuVaultFactory.deploy(owner.address);
    });

    // Test suite for contract deployment and initial state
    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await vault.owner()).to.equal(owner.address);
        });

        it("Should start in an unpaused state", async function () {
            expect(await vault.paused()).to.be.false;
        });

        it("Should have the correct vaultType", async function () {
            expect(await vault.vaultType()).to.equal("individual");
        });
    });

    // Test suite for native asset (MATIC/POL) transactions
    describe("Native Asset Transactions", function () {
        const depositAmount = ethers.parseEther("1.0"); // 1 MATIC

        it("Should allow a user to deposit MATIC", async function () {
            await expect(vault.connect(user1).deposit(NATIVE_TOKEN_ADDRESS, depositAmount, "memo", { value: depositAmount }))
                .to.emit(vault, "Deposited")
                .withArgs(user1.address, NATIVE_TOKEN_ADDRESS, depositAmount, "memo");

            expect(await vault.getBalance(NATIVE_TOKEN_ADDRESS, user1.address)).to.equal(depositAmount);
        });

        it("Should allow a user to withdraw MATIC", async function () {
            await vault.connect(user1).deposit(NATIVE_TOKEN_ADDRESS, depositAmount, "memo", { value: depositAmount });

            await expect(vault.connect(user1).withdraw(NATIVE_TOKEN_ADDRESS, depositAmount))
                .to.changeEtherBalances([user1, vault], [depositAmount, -depositAmount]);
        });

        it("Should revert deposit if msg.value mismatches amount", async function () {
            const wrongValue = ethers.parseEther("0.5");
            await expect(vault.connect(user1).deposit(NATIVE_TOKEN_ADDRESS, depositAmount, "memo", { value: wrongValue }))
                .to.be.revertedWithCustomError(vault, "NativeValueMismatch");
        });

        it("Should revert withdrawal for insufficient balance", async function () {
            await expect(vault.connect(user1).withdraw(NATIVE_TOKEN_ADDRESS, depositAmount))
                .to.be.revertedWithCustomError(vault, "InsufficientBalance");
        });
    });

    // Test suite for ERC-20 token transactions
    describe("ERC-20 Token Transactions", function () {
        const depositAmount = ethers.parseUnits("100", 18); // 100 MTK

        beforeEach(async function () {
            // Give user1 some mock tokens and approve the vault to spend them
            await mockToken.mint(user1.address, depositAmount);
            await mockToken.connect(user1).approve(vault.target, depositAmount);
        });

        it("Should allow a user to deposit ERC-20 tokens", async function () {
            await expect(vault.connect(user1).deposit(mockToken.target, depositAmount, "erc20 memo"))
                .to.emit(vault, "Deposited")
                .withArgs(user1.address, mockToken.target, depositAmount, "erc20 memo");

            expect(await vault.getBalance(mockToken.target, user1.address)).to.equal(depositAmount);
            expect(await mockToken.balanceOf(vault.target)).to.equal(depositAmount);
        });

        it("Should allow a user to withdraw ERC-20 tokens", async function () {
            await vault.connect(user1).deposit(mockToken.target, depositAmount, "erc20 memo");

            await expect(vault.connect(user1).withdraw(mockToken.target, depositAmount))
                .to.emit(vault, "Withdrawn");

            expect(await mockToken.balanceOf(user1.address)).to.equal(depositAmount);
        });

        it("Should revert deposit if contract is not approved", async function () {
            // user2 has tokens but has not approved the vault
            await mockToken.mint(user2.address, depositAmount);
            await expect(vault.connect(user2).deposit(mockToken.target, depositAmount, "fail memo"))
                 .to.be.revertedWithCustomError(vault, "ERC20TransferFailed");
        });
    });

    // Test suite for administrative controls (Ownable & Pausable)
    describe("Admin Controls", function () {
        it("Should only allow the owner to pause and unpause", async function () {
            await expect(vault.connect(user1).pause()).to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount")
                .withArgs(user1.address);
            
            await expect(vault.pause()).to.emit(vault, "Paused");
            expect(await vault.paused()).to.be.true;
            
            await expect(vault.unpause()).to.emit(vault, "Unpaused");
            expect(await vault.paused()).to.be.false;
        });

        it("Should prevent deposits and withdrawals when paused", async function () {
            await vault.pause();
            const amount = ethers.parseEther("1.0");

            await expect(vault.connect(user1).deposit(NATIVE_TOKEN_ADDRESS, amount, "memo", { value: amount }))
                .to.be.revertedWithCustomError(vault, "EnforcedPause");
                
            await expect(vault.connect(user1).withdraw(NATIVE_TOKEN_ADDRESS, amount))
                .to.be.revertedWithCustomError(vault, "EnforcedPause");
        });

        it("Should only allow the owner to set a timelock", async function () {
            const releaseTime = (await time.latest()) + 3600; // 1 hour from now
            await expect(vault.connect(user1).setTimelock(user1.address, releaseTime))
                .to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount")
                .withArgs(user1.address);
            
            await expect(vault.setTimelock(user1.address, releaseTime))
                .to.emit(vault, "TimelockSet")
                .withArgs(user1.address, releaseTime);
        });
    });

    // Test suite for the timelock functionality
    describe("Timelock Functionality", function () {
        const depositAmount = ethers.parseEther("1.0");

        it("Should revert withdrawal if funds are time-locked", async function () {
            await vault.connect(user1).deposit(NATIVE_TOKEN_ADDRESS, depositAmount, "memo", { value: depositAmount });
            
            const releaseTime = (await time.latest()) + 3600; // Lock for 1 hour
            await vault.setTimelock(user1.address, releaseTime);

            await expect(vault.connect(user1).withdraw(NATIVE_TOKEN_ADDRESS, depositAmount))
                .to.be.revertedWithCustomError(vault, "FundsAreTimelocked");
        });

        it("Should allow withdrawal after the timelock period has passed", async function () {
            await vault.connect(user1).deposit(NATIVE_TOKEN_ADDRESS, depositAmount, "memo", { value: depositAmount });

            const releaseTime = (await time.latest()) + 3600;
            await vault.setTimelock(user1.address, releaseTime);

            // Advance time on the blockchain to after the release time
            await time.increaseTo(releaseTime + 1);

            await expect(vault.connect(user1).withdraw(NATIVE_TOKEN_ADDRESS, depositAmount))
                .to.changeEtherBalances([user1, vault], [depositAmount, -depositAmount]);
        });
    });
});
