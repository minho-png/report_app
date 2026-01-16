import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "YOUR_GEMINI_API_KEY";
const genAI = new GoogleGenerativeAI(API_KEY);

// 1. 일반 대화 및 매핑용 (ChatMessage 형식 대응)
export async function callLLM(messages: any[]) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = messages.map(m => m.content).join("\n");
    const result = await model.generateContent(prompt);
    return { content: result.response.text() };
}

// 2. 보고서 인사이트 전용
export async function generateInsight(dataJson: string) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const prompt = `다음 광고 데이터를 분석해서 인사이트를 작성해줘:\n${dataJson}`;
    const result = await model.generateContent(prompt);
    return result.response.text();
}