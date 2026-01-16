import { GoogleGenerativeAI } from "@google/generative-ai";
import { ANALYSIS_PROMPT } from "./prompts";

// [기존 설정 유지] 환경변수에서 API 키를 로드합니다.
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "YOUR_GEMINI_API_KEY";
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * 1. 일반 대화 및 매핑용 (기존 설정: gemini-1.5-flash)
 */
export async function callLLM(messages: any[]) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = messages.map(m => m.content).join("\n");
    const result = await model.generateContent(prompt);
    return { content: result.response.text() };
}

/**
 * 2. 보고서 인사이트 전용 (기존 설정: gemini-1.5-pro)
 * 육문 이내의 간결한 분석을 위해 maxOutputTokens를 조정합니다.
 */
export async function generateInsight(dataJson: string) {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { maxOutputTokens: 600, temperature: 0.2 } 
    });
    
    // ANALYSIS_PROMPT와 데이터를 결합하여 전달
    const prompt = `${ANALYSIS_PROMPT}\n\n[분석 데이터 JSON]\n${dataJson}`;
    const result = await model.generateContent(prompt);
    return result.response.text();
}