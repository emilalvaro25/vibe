/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import useStore from './store';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const systemInstruction = `You are an expert web developer specializing in Tailwind CSS. Given a prompt describing a UI component or a webpage, you must generate a complete, self-contained HTML file.
This file must include a <script> tag to load Tailwind CSS from the CDN ('https://cdn.tailwindcss.com').
The HTML should be well-structured, and all styling must be done using Tailwind CSS classes.
The entire response should be a single block of HTML code. Do not include any explanations or markdown formatting like \`\`\`html. Just return the raw HTML code.
Ensure the design is modern, responsive, and aesthetically pleasing.`;

export async function startChat(prompt) {
  const { setChat, addMessage, updateLastMessage, setIsGenerating } = useStore.getState();
  
  setIsGenerating(true);
  addMessage('user', prompt);

  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction,
    },
  });
  setChat(chat);
  
  addMessage('model', '');

  try {
    const responseStream = await chat.sendMessageStream({ message: prompt });
    let fullResponse = '';
    for await (const chunk of responseStream) {
      fullResponse += chunk.text;
      updateLastMessage(fullResponse);
    }
  } catch (error) {
    console.error(error);
    updateLastMessage('Sorry, something went wrong while generating the UI.');
  } finally {
    setIsGenerating(false);
  }
}

export async function continueChat(prompt) {
    const { chat, addMessage, updateLastMessage, setIsGenerating } = useStore.getState();

    if (!chat) {
        console.error("Chat not initialized. Starting a new chat.");
        await startChat(prompt);
        return;
    }

    setIsGenerating(true);
    addMessage('user', prompt);
    addMessage('model', '');

    try {
        const responseStream = await chat.sendMessageStream({ message: prompt });
        let fullResponse = '';
        for await (const chunk of responseStream) {
            fullResponse += chunk.text;
            updateLastMessage(fullResponse);
        }
    } catch (error) {
        console.error(error);
        updateLastMessage('Sorry, something went wrong while updating the UI.');
    } finally {
        setIsGenerating(false);
    }
}

export const resetChat = () => {
  useStore.getState().reset();
};
