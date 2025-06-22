/**
 * @title Transaction Queue Manager
 * @author Don Aborah
 * @notice This module manages a queue of transactions to be sent by the backend's
 * worker wallet. It handles nonce management, asynchronous processing, and error logging.
 * For a hackathon, it uses an in-memory queue. A production system would use a
 * persistent queue like Redis with BullMQ.
 */

const { ethers } = require('ethers');
const { getContract } = require('./utils/polygon');

// --- Wallet & Provider Setup ---
// This wallet is the "worker" that will send transactions on behalf of the backend.
// It must be funded with MATIC to pay for gas.
const provider = new ethers.JsonRpcProvider(process.env.POLYGON_AMOY_RPC_URL);
let workerWallet;
if (process.env.BACKEND_WORKER_PRIVATE_KEY) {
    workerWallet = new ethers.Wallet(process.env.BACKEND_WORKER_PRIVATE_KEY, provider);
    console.log(`✅ Transaction Queue: Worker wallet loaded successfully. Address: ${workerWallet.address}`);
} else {
    console.error("❌ Transaction Queue: WORKER_PRIVATE_KEY not found in .env. The queue will not be able to process transactions.");
}


// --- Queue State ---
const transactionQueue = []; // Our in-memory job queue
let isProcessing = false;    // A lock to prevent multiple concurrent processing loops
let currentNonce;            // The nonce manager for our worker wallet

/**
 * @notice Initializes the nonce manager by fetching the current transaction count.
 */
const initializeNonce = async () => {
    if (!workerWallet) return;
    try {
        currentNonce = await workerWallet.getNonce();
        console.log(`🔷 Transaction Queue: Initial nonce set to ${currentNonce}`);
    } catch (error) {
        console.error("❌ Transaction Queue: Failed to initialize nonce.", error);
    }
};

/**
 * @notice A class to represent a single transaction job in the queue.
 */
class TransactionJob {
    constructor(description, transaction) {
        this.id = `job_${Date.now()}`;
        this.description = description;
        this.transaction = transaction; // { to, data, value }
        this.status = 'queued';
        this.attempts = 0;
        this.error = null;
    }
}

/**
 * @notice Adds a new transaction job to the queue.
 * @param description A human-readable description of the job.
 * @param transaction The transaction object ({ to, data, value }).
 */
const addTransactionToQueue = (description, transaction) => {
    const job = new TransactionJob(description, transaction);
    transactionQueue.push(job);
    console.log(`📥 [${job.id}] Queued: ${description}`);
};

/**
 * @notice The main worker function that processes jobs from the queue.
 */
const processQueue = async () => {
    if (isProcessing || transactionQueue.length === 0 || !workerWallet) {
        return; // Don't run if already running, queue is empty, or wallet isn't set up
    }
    isProcessing = true;

    const job = transactionQueue.shift(); // Get the next job from the front of the queue

    try {
        console.log(`⚙️ [${job.id}] Processing: ${job.description}`);
        job.status = 'processing';
        job.attempts++;

        const txRequest = {
            to: job.transaction.to,
            data: job.transaction.data,
            value: job.transaction.value || 0,
            nonce: currentNonce,
            gasLimit: 500000, // Set a generous gas limit
        };

        const tx = await workerWallet.sendTransaction(txRequest);
        console.log(`➡️ [${job.id}] Sent: Transaction hash ${tx.hash}`);
        
        await tx.wait(); // Wait for the transaction to be mined
        
        job.status = 'completed';
        console.log(`✅ [${job.id}] Success: Transaction confirmed in block ${tx.blockNumber}`);
        
        currentNonce++; // IMPORTANT: Increment nonce only after successful confirmation

    } catch (error) {
        job.status = 'failed';
        job.error = error.message;
        console.error(`❌ [${job.id}] Failed: ${error.message}`);
        
        // In a real system, you might add retry logic here.
        // For now, we will reset the nonce to be safe if a transaction fails.
        await initializeNonce(); 
    }

    isProcessing = false;
};

// --- Start the Queue ---
// Initialize the nonce and start the processing loop.
initializeNonce();
setInterval(processQueue, 5000); // Check the queue every 5 seconds

module.exports = {
    addTransactionToQueue,
    getQueueLog: () => transactionQueue // A simple function to inspect the queue state
};
