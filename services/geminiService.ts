
import { GoogleGenAI } from "@google/genai";
import { AiTask, AiTaskType } from "../types";

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    // In development/browser, this might be undefined if not provided via Vite define
    console.warn("GEMINI_API_KEY not set. AI features will not work.");
}

const genAI = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const getSystemInstruction = (task: AiTaskType): string => {
    switch (task) {
        case AiTask.GenerateCode:
            return "You are an expert code generator. Only output the raw code based on the user's request. Do not include any markdown formatting, explanations, or comments unless requested.";
        case AiTask.ExplainCode:
            return "You are an expert code explainer. Explain the provided code clearly and concisely. Use markdown for formatting.";
        case AiTask.RefactorCode:
            return "You are an expert code refactorer. Rewrite the provided code to be more efficient, readable, and modern. Only output the raw, refactored code. Do not include any markdown formatting or explanations.";
        case AiTask.GenerateTests:
             return "You are an expert test writer. Generate unit tests for the provided code. Only output the raw test code. Do not include any markdown formatting or explanations.";
        case AiTask.Chat:
            return "You are a helpful AI assistant for developers. Answer the following question.";
        case AiTask.FormatPython:
            return "You are an expert Python formatter. Rewrite the provided Python code using PEP 8 standards. Only output the raw, formatted code. Do not include markdown blocks or explanations.";
        case AiTask.DebugAnalyze:
            return "You are an expert debugger. Analyze the provided code and simulate a debug session. Provide a JSON object with 'variables' (key-value pairs of interesting state), 'callStack' (array of function call names), and 'issues' (array of potential bugs or notes).";
        default:
            return "You are a helpful AI assistant.";
    }
};

const getPrompt = (task: AiTaskType, userPrompt: string, code: string): string => {
    switch (task) {
        case AiTask.GenerateCode:
            return `Generate code based on the following prompt: ${userPrompt}`;
        case AiTask.ExplainCode:
            return `Explain the following code:\n\n\`\`\`\n${code}\n\`\`\``;
        case AiTask.RefactorCode:
            return `Refactor and improve the following code:\n\n\`\`\`\n${code}\n\`\`\``;
        case AiTask.GenerateTests:
            return `Generate unit tests for the following code:\n\n\`\`\`\n${code}\n\`\`\``;
        case AiTask.Chat:
            return userPrompt;
        case AiTask.FormatPython:
            return `Format the following Python code:\n\n${code}`;
        case AiTask.DebugAnalyze:
            return `Analyze this code for debugging:\n\n${code}`;
        default:
            return userPrompt;
    }
};

const cleanCodeResponse = (text: string): string => {
    const codeBlockRegex = /```(?:\w+\n)?([\s\S]*?)```/;
    const match = text.match(codeBlockRegex);
    if (match && match[1]) {
        return match[1].trim();
    }
    return text.trim();
};

export const runAiTask = async (task: AiTaskType, prompt: string, code: string): Promise<string> => {
    if (!genAI) {
        throw new Error("Gemini API Key is missing. Please add GEMINI_API_KEY to your .env file.");
    }

    const fullPrompt = getPrompt(task, prompt, code);
    const systemInstruction = getSystemInstruction(task);
    
    try {
        const result = await genAI.models.generateContent({
            model: "gemini-1.5-flash",
            contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
            config: {
                systemInstruction: { role: "system", parts: [{ text: systemInstruction }] },
            }
        });
        
        const responseText = result.text || "";

        if (task === AiTask.GenerateCode || task === AiTask.RefactorCode || task === AiTask.GenerateTests) {
            return cleanCodeResponse(responseText);
        }

        return responseText;
    } catch (error) {
        console.error("Gemini API call failed:", error);
        throw new Error("Failed to get response from AI. Check the console for more details.");
    }
};

export const completeCode = async (codeBefore: string, codeAfter: string, fileName: string): Promise<string> => {
    if (!genAI) return "";

    const systemInstruction = "You are an expert code completion assistant. Given the code before and after the cursor, provide the most likely next few lines of code to complete the current thought. Only output the raw code to be inserted at the cursor. Do not include any markdown formatting, explanations, or comments unless they are part of the code.";
    const prompt = `File: ${fileName}\n\nCode before cursor:\n\`\`\`\n${codeBefore}\n\`\`\`\n\nCode after cursor:\n\`\`\`\n${codeAfter}\n\`\`\``;

    try {
        const result = await genAI.models.generateContent({
            model: "gemini-1.5-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                systemInstruction: { role: "system", parts: [{ text: systemInstruction }] },
            }
        });
        
        return cleanCodeResponse(result.text || "");
    } catch (error) {
        console.error("Gemini AI completion failed:", error);
        return "";
    }
};
