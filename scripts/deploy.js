/**
 * @notice This is the main deployment script for the Susu project.
 * @dev It deploys the final, most encompassing contract (`SusuGroupVault`) and then
 * saves the contract's address and ABI to a JSON file in the `/deployments` directory.
 * This file is then used by the frontend to interact with the deployed contract.
 */

// Import necessary libraries from Hardhat and Node.js
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    // 1. Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("🚀 Deploying contracts with the account:", deployer.address);

    // 2. Deploy the SusuGroupVault contract
    // The deployer's address is passed to the constructor to become the initial admin.
    const SusuGroupVault = await ethers.getContractFactory("SusuGroupVault");
    const groupVault = await SusuGroupVault.deploy(deployer.address);
    await groupVault.waitForDeployment(); // Wait for the transaction to be mined

    console.log("✅ SusuGroupVault deployed successfully to address:", groupVault.target);

    // 3. Save the deployment data for frontend integration
    saveDeploymentData(groupVault);
}

/**
 * @notice Saves the contract's address and ABI to a JSON file.
 * @param groupVault The deployed SusuGroupVault contract instance.
 */
function saveDeploymentData(groupVault) {
    const deploymentData = {
        SusuGroupVault: {
            address: groupVault.target,
            abi: JSON.parse(groupVault.interface.formatJson())
        }
    };

    // Define the path and create the directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    // Write the file
    fs.writeFileSync(
        path.join(deploymentsDir, "contract-data.json"),
        JSON.stringify(deploymentData, null, 2) // Using null, 2 for pretty-printing JSON
    );

    console.log("📦 Deployment data saved to /deployments/contract-data.json");
}

// Standard Hardhat script execution pattern
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
