// Elegant transparent PNG logo generator via Canvas
export async function generateElegantLogoPNG({
  brand = 'Eburon',
  initials = '',
  width = 1024,
  height = 1024,
  palette = ['#9aa6ff', '#6dd3ff', '#a1ffd6'],
  styleHints = 'elegant minimal glossy'
} = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,width,height);
  const safeBrand = String(brand || '').trim();
  const init = (initials || safeBrand.split(/\s+/).map(w => w[0]).join('').slice(0,3) || 'E').toUpperCase();
  const cx = width/2, cy = height/2;
  const rOuter = Math.min(width,height)*0.36;
  const rInner = rOuter*0.70;

  // Soft shadow
  ctx.save(); ctx.translate(0,16);
  ctx.beginPath(); ctx.arc(cx,cy,rOuter,0,Math.PI*2); ctx.closePath();
  ctx.shadowColor='rgba(0,0,0,0.30)'; ctx.shadowBlur=50; ctx.shadowOffsetY=24;
  ctx.fillStyle='rgba(0,0,0,0.12)'; ctx.fill(); ctx.restore();

  // Glossy ring
  const ringGrad = ctx.createRadialGradient(cx-rOuter*0.25, cy-rOuter*0.25, rInner*0.3, cx, cy, rOuter);
  ringGrad.addColorStop(0, palette[0]); ringGrad.addColorStop(0.6, palette[1]); ringGrad.addColorStop(1, palette[2]);
  ctx.beginPath(); ctx.arc(cx,cy,rOuter,0,Math.PI*2); ctx.arc(cx,cy,rInner,0,Math.PI*2,true); ctx.closePath();
  ctx.save(); ctx.globalCompositeOperation='source-over'; ctx.fillStyle=ringGrad; ctx.fill(); ctx.restore();

  // Highlight sweep
  const sweep = ctx.createLinearGradient(cx-rOuter, cy-rOuter, cx+rOuter, cy+rOuter);
  sweep.addColorStop(0.0,'rgba(255,255,255,0.25)'); sweep.addColorStop(0.35,'rgba(255,255,255,0.08)');
  sweep.addColorStop(0.60,'rgba(255,255,255,0.02)'); sweep.addColorStop(1.0,'rgba(0,0,0,0.10)');
  ctx.save(); ctx.globalCompositeOperation='overlay'; ctx.fillStyle=sweep;
  ctx.beginPath(); ctx.arc(cx,cy,rOuter,0,Math.PI*2); ctx.arc(cx,cy,rInner,0,Math.PI*2,true); ctx.closePath(); ctx.fill(); ctx.restore();

  // Monogram (depth + fg)
  const fontSize = Math.round(rInner*0.9);
  ctx.font = `900 ${fontSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto`;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.save(); ctx.translate(0, Math.max(2, width*0.004)); ctx.fillStyle='rgba(0,0,0,0.35)';
  ctx.shadowColor='rgba(0,0,0,0.25)'; ctx.shadowBlur=20; ctx.shadowOffsetY=14; ctx.fillText(init, cx, cy); ctx.restore();
  const fg = ctx.createLinearGradient(cx, cy-rInner, cx, cy+rInner);
  fg.addColorStop(0,'#ffffff'); fg.addColorStop(0.5,'#eef2ff'); fg.addColorStop(1,'#e6ecff');
  ctx.save(); ctx.fillStyle=fg; ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=Math.max(2,width*0.004);
  ctx.fillText(init, cx, cy); ctx.strokeText(init, cx, cy); ctx.restore();

  // Fine highlight
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, (rOuter+rInner)/2, Math.PI*1.1, Math.PI*1.6);
  ctx.strokeStyle='rgba(255,255,255,0.65)'; ctx.lineWidth=Math.max(1.5, width*0.003); ctx.stroke(); ctx.restore();

  const base64 = canvas.toDataURL('image/png').split(',')[1];
  return { mime:'image/png', base64, meta:{ brand: safeBrand, initials: init, styleHints } };
}
