// ===================================================================================
//  SUSU DAPP BACKEND - MAIN SERVER FILE (index.js)
// ===================================================================================
// This file sets up the Express server, defines API endpoints, and connects to
// the blockchain and AI services.

// --- Imports ---
// Load environment variables from the .env file
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getContract } = require('./utils/polygon'); // Utility for smart contract interaction
const { getOptimalSplit } = require('./aiAgent');   // AI logic handler

// --- Server Initialization ---
const app = express();
const PORT = process.env.PORT || 3001; // Use port from .env or default to 3001

// --- Middleware ---
// Enable Cross-Origin Resource Sharing to allow requests from your frontend
app.use(cors());
// Enable the server to parse incoming JSON request bodies
app.use(express.json());

// A simple logging middleware to see all incoming requests in the console
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ===================================================================================
//  API ROUTES
// ===================================================================================

/**
 * @route   GET /api/health
 * @desc    A simple health check endpoint to confirm the server is running.
 */
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Susu Backend is running!' });
});

/**
 * @route   GET /api/vault/details
 * @desc    Fetches core details about the deployed group vault from the blockchain.
 */
app.get('/api/vault/details', async (req, res) => {
    try {
        const contract = getContract();
        // Fetch multiple pieces of data in parallel for efficiency
        const [vaultType, members, owner] = await Promise.all([
            contract.vaultType(),
            contract.getMembers(),
            contract.owner()
        ]);
        res.status(200).json({ success: true, vaultType, owner, members });
    } catch (error) {
        console.error("API Error at /api/vault/details:", error.message);
        res.status(500).json({ success: false, message: "Failed to fetch vault details." });
    }
});

/**
 * @route   POST /api/ai/suggest-split
 * @desc    Takes a total amount and uses the AI agent to suggest a fund split.
 * @body    { "totalAmount": number }
 */
app.post('/api/ai/suggest-split', async (req, res) => {
    const { totalAmount } = req.body;

    if (!totalAmount || typeof totalAmount !== 'number' || totalAmount <= 0) {
        return res.status(400).json({ success: false, message: 'A valid positive totalAmount is required.' });
    }

    try {
        const contract = getContract();
        const members = await contract.getMembers();
        const suggestion = await getOptimalSplit(members, totalAmount);

        if (suggestion.error) {
            return res.status(500).json({ success: false, message: suggestion.error });
        }

        res.status(200).json({ success: true, suggestion });
    } catch (error) {
        console.error("API Error at /api/ai/suggest-split:", error.message);
        res.status(500).json({ success: false, message: "Failed to get AI suggestion." });
    }
});

/**
 * @route   POST /api/initiate-distribution
 * @desc    Prepares the data for a `distributeFunds` transaction for the frontend to send.
 * @dev     This is a secure pattern. The backend prepares the data, but the user signs
 * and sends the transaction with their private key via MetaMask.
 * @body    { "recipient": "0x...", "amount": "1000000000000000000" }
 */
app.post('/api/initiate-distribution', async (req, res) => {
    const { recipient, amount } = req.body;

    if (!recipient || !amount) {
        return res.status(400).json({ success: false, message: 'Recipient and amount are required.' });
    }

    try {
        const contract = getContract();
        
        // This encodes the function call data without sending a transaction
        const transactionData = contract.interface.encodeFunctionData("distributeFunds", [
            recipient,
            amount
        ]);

        res.status(200).json({
            success: true,
            message: "Transaction data prepared. Please send from frontend.",
            transaction: {
                to: await contract.getAddress(), // The address of the SusuGroupVault contract
                data: transactionData,          // The encoded function call
                value: "0"                      // No native Ether is sent with this specific function call
            }
        });

    } catch (error) {
        console.error("API Error at /api/initiate-distribution:", error.message);
        res.status(500).json({ success: false, message: "Failed to prepare transaction data." });
    }
});

// ===================================================================================
//  Start the Server
// ===================================================================================
app.listen(PORT, () => {
    console.log(`🚀 Susu Backend server is live and listening on http://localhost:${PORT}`);
    // Attempt to initialize the contract connection on startup to check for deployment status
    try {
        getContract();
    } catch (error) {
        console.warn("Could not connect to contract on startup. This is expected if it's not deployed yet.");
    }
});
