import { GoogleGenAI } from '@google/genai';
import { autofixContent } from './autofix';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function sendLLMText({ prompt, system, temperature = 0.5, model }) {
  if (!process.env.API_KEY) {
    const content = `DEV MODE (no API_KEY). System: ${system}\nYou asked: ${prompt}`;
    console.warn(content);
    return { content: autofixContent(content), raw: content, model: model || 'dev-null' };
  }
  
  try {
    const response = await ai.models.generateContent({
      model: model || 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: system,
        temperature: temperature,
      },
    });

    const raw = response.text;
    const content = autofixContent(raw);
    return { content, raw, model };

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    const content = `Error calling Gemini API. System: ${system}\nYou asked: ${prompt}`;
    return { content: autofixContent(content), raw: content, model: model || 'dev-null' };
  }
}
