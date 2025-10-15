import { generateElegantLogoPNG } from './image/logoGen';
export async function generateImage({ prompt, kind, brand, palette }) {
  const wantsLogo = kind === 'logo' || /\b(logo|logomark|wordmark|brand mark|app icon|favicon)\b/i.test(prompt || '');
  if (wantsLogo) {
    const brandName = brand || inferBrand(prompt) || 'Eburon';
    const res = await generateElegantLogoPNG({ brand: brandName, palette });
    return { mime: res.mime, base64: res.base64, meta: { brand: brandName, kind: 'logo' } };
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='630'>
    <rect width='100%' height='100%' fill='black'/>
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='24' font-family='ui-monospace'>
      ${escapeXml((prompt || 'image').slice(0, 80))}
    </text>
  </svg>`;
  const base64svg = btoa(unescape(encodeURIComponent(svg)));
  return { mime: 'image/svg+xml', base64: base64svg, meta: { kind: 'generic' } };
}
function inferBrand(p) {
  if (!p) return '';
  const m1 = p.match(/logo\s+for\s+([a-z09 \-\_]+)/i);
  if (m1) return m1[1].trim();
  const m2 = p.match(/brand\s+([a-z09 \-\_]+)/i);
  if (m2) return m2[1].trim();
  return '';
}
function escapeXml(s) {
  return s.replace(/[<>&'"]/g, (c) => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
}
