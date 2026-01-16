import { GoogleGenerativeAI } from "@google/generative-ai";
import { ANALYSIS_PROMPT } from "./prompts";

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export async function callLLM(messages: any[]) {
    console.log("[LLM] Mapping 요청 전송:", messages);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = messages.map(m => m.content).join("\n");
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log("[LLM] Mapping 응답 결과:", text);
    return { content: text };
}

export async function generateInsight(dataJson: string) {
    console.log("[LLM] 인사이트 생성 시작 (데이터 크기:", dataJson.length, "자)");
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { maxOutputTokens: 1000, temperature: 0.2 } 
    });
    
    const prompt = `${ANALYSIS_PROMPT}\n\n[데이터 JSON]\n${dataJson}`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log("[LLM] 인사이트 생성 완료");
    return text;
}