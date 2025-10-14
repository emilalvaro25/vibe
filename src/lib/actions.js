/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import useStore from './store';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const systemInstruction = `You are an expert web developer specializing in Tailwind CSS. 
You will be given a prompt, which could be text or a combination of text and an image. 
Your task is to generate a complete, self-contained HTML file that implements the described UI component or webpage.
The generated file must include a <script> tag to load Tailwind CSS from the CDN ('https://cdn.tailwindcss.com').
The HTML should be well-structured, and all styling must be done using Tailwind CSS classes.
The entire response must be a single block of HTML code. Do not include any explanations, comments, or markdown formatting like \`\`\`html. Just return the raw HTML code.
Ensure the design is modern, responsive, and aesthetically pleasing. If an image is provided, use it as a visual reference for the design.`;

function buildMessageParts(prompt, image) {
  const parts = [];
  if (prompt) {
    parts.push({ text: prompt });
  }
  if (image) {
    // image is a base64 string: "data:image/jpeg;base64,..."
    const [mimeTypePart, base64Data] = image.split(',');
    const mimeType = mimeTypePart.split(':')[1].split(';')[0];
    parts.push({
      inlineData: {
        mimeType,
        data: base64Data
      }
    });
  }
  return parts;
}


export async function startChat(prompt, image) {
  const { setChat, addMessage, updateLastMessage, setIsGenerating } = useStore.getState();
  
  setIsGenerating(true);
  addMessage('user', prompt, image);

  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction,
    },
  });
  setChat(chat);
  
  addMessage('model', '');

  try {
    const messageParts = buildMessageParts(prompt, image);
    const responseStream = await chat.sendMessageStream({ message: messageParts });
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

export async function continueChat(prompt, image) {
    const { chat, addMessage, updateLastMessage, setIsGenerating } = useStore.getState();

    if (!chat) {
        console.error("Chat not initialized. Starting a new chat.");
        await startChat(prompt, image);
        return;
    }

    setIsGenerating(true);
    addMessage('user', prompt, image);
    addMessage('model', '');

    try {
        const messageParts = buildMessageParts(prompt, image);
        const responseStream = await chat.sendMessageStream({ message: messageParts });
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