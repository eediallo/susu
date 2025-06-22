/**
 * @title AI Agent for Susu dApp
 * @author Don Aborah
 * @notice This module connects to the Google Gemini AI to provide intelligent
 * fund-splitting recommendations for group vaults.
 */

const axios = require('axios');

// Load the Gemini API Key from environment variables
const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

/**
 * @notice Generates a detailed prompt for the AI to ensure a structured response.
 * @param members An array of member addresses.
 * @param totalAmount The total amount of funds to be split.
 * @returns A string containing the full prompt for the AI.
 */
const createPrompt = (members, totalAmount) => {
    const memberList = members.join(', ');
    
    // This is the most critical part: instructing the AI precisely.
    return `
      You are a financial advisor for a community savings group (a "susu" or "ROSCA").
      Your task is to suggest a fair and logical way to split a payout.

      Rules:
      1. Your entire response MUST be a single, minified JSON object. Do not include any text before or after the JSON.
      2. The JSON object must have two keys: "recipients" (an array of addresses) and "amounts" (an array of corresponding numeric amounts).
      3. The sum of all "amounts" must exactly equal the totalAmount provided.
      4. For this version, provide a simple, equal split among all members.

      Group Details:
      - Members: [${memberList}]
      - Total Amount to Split: ${totalAmount}

      Now, provide the JSON object for the split.
    `;
};

/**
 * @notice Calls the Gemini AI to get an optimal fund split suggestion.
 * @param members An array of member addresses from the smart contract.
 * @param totalAmount The total amount of funds to be split.
 * @returns A parsed JSON object with the suggested split, or an error object.
 */
const getOptimalSplit = async (members, totalAmount) => {
    if (!GEMINI_API_KEY) {
        console.error("❌ Google Gemini API Key is not configured in .env");
        return { error: "AI service is not configured." };
    }
    if (!members || members.length === 0) {
        return { error: "No members to split funds among." };
    }

    console.log("🤖 AI Agent: Calling Gemini for a split suggestion...");
    
    const prompt = createPrompt(members, totalAmount);
    
    const requestBody = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }]
    };

    try {
        const response = await axios.post(GEMINI_API_URL, requestBody);
        
        // Extract the raw text from the AI's response
        const aiResponseText = response.data.candidates[0].content.parts[0].text;
        
        console.log("🤖 AI Agent: Received raw response:", aiResponseText);

        // Parse the text to get the JSON object
        // This is in a try-catch because the AI might not return perfect JSON
        try {
            const parsedJson = JSON.parse(aiResponseText);
            console.log("🤖 AI Agent: Successfully parsed suggestion.");
            return parsedJson;
        } catch (parseError) {
            console.error("❌ AI Agent: Failed to parse JSON from AI response.", parseError);
            return { error: "AI returned an invalid response format." };
        }

    } catch (apiError) {
        console.error("❌ AI Agent: Error calling Gemini API.", apiError.response ? apiError.response.data : apiError.message);
        return { error: "Could not get a suggestion from the AI service." };
    }
};

module.exports = { getOptimalSplit };
