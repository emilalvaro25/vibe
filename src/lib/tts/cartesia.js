const API_KEY = process.env.VITE_CARTESIA_API_KEY;
const API_URL = process.env.VITE_CARTESIA_TTS_URL || 'https://api.cartesia.ai/tts';

export async function speakStatus(text, opts = {}) {
  if (!text || !API_KEY) return;
  try {
    const audioUrl = await cartesiaSpeak(text, opts);
    await playAudioUrl(audioUrl);
  } catch (e) {
    console.warn('Cartesia TTS failed', e);
  }
}

async function cartesiaSpeak(text, { voice = 'alloy', format = 'audio/mpeg' } = {}) {
  const res = await fetch(API_URL, { method: 'POST', headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ text, voice, format }) });
  if (!res.ok) throw new Error(`Cartesia TTS error: ${res.status}`);
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) { const j = await res.json(); if (j.audio) return base64ToBlobUrl(j.audio, j.format || 'audio/mpeg'); throw new Error('No audio in JSON response'); }
  const blob = await res.blob(); return URL.createObjectURL(blob);
}
function base64ToBlobUrl(b64, mime='audio/mpeg') { const byteChars = atob(b64); const arr = new Uint8Array(byteChars.length); for (let i=0;i<byteChars.length;i++) arr[i]=byteChars.charCodeAt(i); return URL.createObjectURL(new Blob([arr], { type: mime })); }
function playAudioUrl(url) { return new Promise((res, rej) => { const a = new Audio(url); a.onended = res; a.onerror = rej; a.play().catch(rej); }); }
