// This utility is the bridge to your smart contracts. It reads the deployment
// data, connects to the Polygon network, and creates a contract instance
// that your API can use to call functions like `getMembers()` or `getBalance()`.
const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

// Load the deployment data created by your Hardhat deployment script
// The path goes up one level from `src/utils` to the project root, then to `deployments`.
const deploymentDataPath = path.join(__dirname, '..', '..', '..', 'deployments', 'contract-data.json');

let contractInstance;
let provider;

try {
    // Check if the deployment file exists
    if (fs.existsSync(deploymentDataPath)) {
        const deploymentData = JSON.parse(fs.readFileSync(deploymentDataPath, 'utf8'));
        const contractAddress = deploymentData.SusuGroupVault.address;
        const contractABI = deploymentData.SusuGroupVault.abi;

        // Set up the provider to connect to the Polygon Amoy network
        provider = new ethers.JsonRpcProvider(process.env.POLYGON_AMOY_RPC_URL);

        // Create a contract instance (read-only)
        contractInstance = new ethers.Contract(contractAddress, contractABI, provider);
        
        console.log("✅ Successfully connected to SusuGroupVault contract at:", contractAddress);

    } else {
        console.error("❌ Deployment data not found. Please deploy the contracts first.");
        console.error("Checked path:", deploymentDataPath);
    }
} catch (error) {
    console.error("❌ Failed to initialize contract connection:", error);
}

// Export a function to get the contract instance so other files can use it
const getContract = () => {
    if (!contractInstance) {
        throw new Error("Contract not initialized. Deploy contracts and ensure contract-data.json exists.");
    }
    return contractInstance;
};

module.exports = { getContract };