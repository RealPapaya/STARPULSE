
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = "AIzaSyDYoFtHAAgzItSNqemrxB0sqefOOlpCHJQ";
const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        // Note: The client SDK might not expose listModels directly on the main class
        // in all versions, or it might require a specific manager.
        // However, for the purpose of this debug, we might need to rely on the error message
        // OR try to hit the REST API directly if the SDK doesn't support listing easily in this version.

        // Actually, looking at the docs, standard SDK usually has a way. 
        // If not, I will fetch via REST to be 100% sure.

        console.log("Fetching models via REST API...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name} (Supports generateContent)`);
                } else {
                    console.log(`- ${m.name}`);
                }
            });
        } else {
            console.error("No models found or error:", data);
        }
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
