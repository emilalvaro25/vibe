/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import useStore from './store';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const systemInstruction = `You are an expert developer specializing in creating modern, production-ready web applications and scripts.
You will be given a prompt to build a UI component, a full webpage, a complete Progressive Web App (PWA), or a Python project.
Your task is to generate a complete, self-contained, and runnable project as a collection of files.

- **Project Structure**: You MUST structure your response by indicating the file path in a comment before each code block.
  - For web projects (HTML/JS/CSS/TSX): <!-- file: path/to/file.tsx -->
  - For Python projects: # file: path/to/file.py
  - For SQL or other types: -- file: path/to/file.sql
- **Web Framework**: For web apps, use Next.js with the App Router. All components must be functional React components using hooks. Use TypeScript (.tsx).
- **Styling**: Use Tailwind CSS for all web styling. Provide a complete \`tailwind.config.js\` and a \`app/globals.css\` file with base Tailwind directives.
- **Python Projects**: For Python, include a \`requirements.txt\` file for dependencies. Ensure the code is well-structured and follows modern Python practices.
- **Required Files**: Your response must include all essential files for a runnable project. This includes build configurations (\`package.json\`, \`tsconfig.json\`), styling setups, the root layout, and the main page/script.
- **PWA**: If the prompt asks for a PWA, you must also include \`public/manifest.json\` and a basic \`public/sw.js\`.
- **README**: Always include a \`README.md\` file with clear, simple instructions on how to install dependencies (\`npm install\` or \`pip install -r requirements.txt\`) and run the project (\`npm run dev\` or \`python main.py\`).
- **Response Format**: The entire response must be the raw code for the files. Do not include any explanations, comments, or markdown formatting like \`\`\`tsx outside of the file blocks. Just return the raw code for each file, preceded by its file path comment.
- **Design**: Ensure any UI is modern, responsive, and aesthetically pleasing. If an image is provided, use it as a visual reference. All code must be self-contained and runnable without modification.
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