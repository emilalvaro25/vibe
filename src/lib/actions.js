/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import useStore from './store';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const systemInstruction = `You are an expert developer specializing in creating modern, production-ready web applications.
Your primary goal is to generate code that can be previewed instantly.

- **For Web UI Prompts (components, pages, small apps)**:
  - You MUST generate a SINGLE, self-contained \`index.html\` file.
  - This file must contain all necessary HTML, CSS, and JavaScript. No external files.
  - Use Tailwind CSS for styling by including its CDN script in the \`<head>\`: \`<script src="https://cdn.tailwindcss.com"></script>\`.
  - All JavaScript logic must be included within \`<script>\` tags.
  - The entire response MUST be the raw code for this single file, enclosed in a file marker comment. For example:
    <!-- file: index.html -->
    <!DOCTYPE html>
    ...

- **For Complex, Multi-File Projects (ONLY if explicitly asked for, e.g., "build a full Next.js app")**:
  - You may generate multiple files.
  - Structure your response by indicating the file path in a comment before each code block.
    - Example for web: <!-- file: path/to/file.tsx -->
    - Example for Python: # file: path/to/file.py
  - Always include a \`README.md\` with setup instructions.

- **General Rules**:
  - Your response must consist ONLY of raw code for the files, each preceded by its file path comment.
  - Do NOT include any explanations, comments, or markdown formatting like \`\`\`html outside of the file blocks.
  - Ensure any UI is modern, responsive, and aesthetically pleasing.
  - If an image is provided, use it as a visual reference for the design.
`;

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
    model: 'gemini-flash-latest',
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