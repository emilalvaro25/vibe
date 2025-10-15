import { sendLLMText } from './llmText';
import { generateImage } from './llmImage';
import { detectIntent } from './intent';

export async function coderModel(prompt, opts = {}) {
  const sys = opts.system || "You are Eburon agent created by Emilio AI whose task is to write complete, runnable code with exact paths.";
  const temperature = opts.temperature ?? 0.2;
  const model = opts.model || process.env.VITE_DEFAULT_TEXT_MODEL;
  return await sendLLMText({ prompt, system: sys, temperature, model });
}
export async function generalModel(prompt, opts = {}) {
  const sys = opts.system || "You are Eburon agent created by Emilio AI whose task is to assist concisely and precisely.";
  const temperature = opts.temperature ?? 0.5;
  const model = opts.model || process.env.VITE_DEFAULT_TEXT_MODEL;
  return await sendLLMText({ prompt, system: sys, temperature, model });
}
export async function imageModel(prompt, opts = {}) {
  const intent = opts.kind || detectIntent(prompt);
  return await generateImage({ prompt, kind: intent === 'logo' ? 'logo' : 'generic', brand: opts.brand, palette: opts.palette });
}