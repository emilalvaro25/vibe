import { emit, on } from './eventBus';
import { speakStatus } from './tts/cartesia';
let generationTimer = null;
export function reportStartGeneration() {
  clearTimeout(generationTimer);
  emit('status', { level: 'info', text: 'Generating…' });
  generationTimer = setTimeout(() => { const text = 'Still working. Want to adjust or continue?'; emit('status', { level: 'warn', text }); speakStatus(text); }, 12000);
}
export function reportEndGeneration(success = true) {
  clearTimeout(generationTimer);
  const text = success ? 'Generation complete.' : 'Generation failed.';
  emit('status', { level: success ? 'success' : 'error', text });
  if (!success) speakStatus('There was an error generating. Please review the output.');
}
export function reportNeedUserAction(message) { const text = message || 'Action needed. Please confirm.'; emit('status', { level: 'warn', text }); speakStatus(text); }
export function subscribeStatus(fn) { return on('status', fn); }
