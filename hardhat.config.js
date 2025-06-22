// This is the central configuration file for your Hardhat project.
// It uses the industry-standard 'dotenv' package to securely manage your secret keys.

// Import Hardhat plugins. The "toolbox" includes most of what you need.
require("@nomicfoundation/hardhat-toolbox");

// Import and configure 'dotenv' to load your environment variables from the .env file.
require("dotenv").config();

// --- Retrieve your secret variables from the .env file ---
// This is the SECURE way to manage your keys and RPC URLs. If a variable is not
// found in .env, it will default to an empty string, preventing errors.
const AMOY_RPC_URL = process.env.POLYGON_AMOY_RPC_URL || "";
const PRIVATE_KEY = process.env.METAMASK_PRIVATE_KEY;
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20", // The Solidity version your contracts are written in.
  networks: {
    // This is the default network for running tests locally. No special config needed.
    hardhat: {},
    
    // This is the configuration for the Polygon Amoy Testnet.
    // It's the network you'll use to deploy for the hackathon.
    polygon_amoy: {
      url: AMOY_RPC_URL,
      // The `accounts` property requires a private key. The `?` and `:` (ternary operator)
      // ensures the project doesn't crash if the private key is missing from the .env file.
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    // Your API key for PolygonScan. This is used for automatic contract verification
    // after deployment. It's highly recommended for public testnets.
    apiKey: {
      polygonAmoy: POLYGONSCAN_API_KEY,
    }
  },
  sourcify: {
    // Optional: Enable Sourcify verification for another method of source code validation.
    enabled: true
  }
};
